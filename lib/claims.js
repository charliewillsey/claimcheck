// Turns transcript lines into checked claims: detect, search, read, decide.
import { hostOf } from './allowlist.js';
import { completeJson } from './llm.js';
import { readPage, searchReputable } from './search.js';

const CONTEXT_LINES = 6;
const PAGES_TO_READ = 4;
const PASSAGES_PER_PAGE = 5;
const PASSAGE_CHARS = 700;

const detectPrompt = (recent, line, known) => `You listen to a live call between two friends and pick out factual claims worth fact-checking.

Recent conversation (speech-to-text, may contain errors):
${recent.map((item) => `${item.speaker}: ${item.text}`).join('\n') || '(start of call)'}

Newest line, from speaker ${line.speaker}:
"${line.text}"

List every checkable factual claim the newest line makes about the world: things public reputable sources could confirm or refute, such as science, health, history, geography, law, statistics, or what a public body says.

Leave out opinions, preferences, predictions, questions, jokes, plans, personal stories, anything about the speakers' own lives or relatives, and reactions to the other person such as "you're capping".

A reported claim counts: from "my cousin says the earth is flat", list "The earth is flat."

Write each claim as one self-contained sentence. Use the conversation to resolve words like "he" or "it", and fix obvious speech-to-text errors. Keep the speaker's numbers, names, dates and direction exactly, even if you think they are wrong. Never correct the speaker.

Already listed, so do not repeat these:
${known.map((text) => `- ${text}`).join('\n') || '(none)'}

"search" is a short neutral web query that would find the truth either way, without assuming the claim is right.

Reply with JSON only: {"claims":[{"claim":"...","search":"..."}]}`;

const verdictPrompt = (claim, sources) => `Fact-check a claim using only the source passages below. Do not use your own knowledge.

Claim: "${claim}"

${sources.map((source, index) => `[${index + 1}] ${source.host}: ${source.title}\n${source.passages}`).join('\n\n')}

Choose one verdict:
- "supported": a passage directly says the claim is true.
- "disputed": a passage directly contradicts the claim or says something incompatible with it.
- "unverified": the passages do not settle it.

Pick the single best passage. "quote" must be copied word for word from it, at most 40 words, no ellipses. "reason" is one short plain sentence for someone in the middle of a conversation.

Reply with JSON only: {"verdict":"supported|disputed|unverified","source":1,"quote":"...","reason":"..."}`;

const plain = (text) => text
  .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/[*_#>`|\\]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const comparable = (text) => plain(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const wordsOf = (text) => new Set(comparable(text).split(' ').filter((word) => word.length > 3));

function bestPassages(page, description, claim) {
  const terms = wordsOf(claim);
  const blocks = `${description ?? ''}\n\n${page}`
    .split(/\n\s*\n/)
    .map(plain)
    .filter((block) => block.length > 40);
  const scored = blocks.map((block) => {
    const words = wordsOf(block);
    return { block, score: [...terms].filter((term) => words.has(term)).length };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, PASSAGES_PER_PAGE)
    .map(({ block }) => block.slice(0, PASSAGE_CHARS))
    .join('\n');
}

async function readSources(results, claim) {
  const pages = await Promise.all(results.slice(0, PAGES_TO_READ).map(async (result) => {
    const page = await readPage(result.url).catch(() => '');
    return {
      url: result.url,
      title: result.title,
      host: hostOf(result.url),
      passages: bestPassages(page, result.description, claim),
    };
  }));
  return pages.filter((page) => page.passages);
}

async function decide(claim, sources) {
  const answer = await completeJson(verdictPrompt(claim, sources), { tier: 'careful' });
  const source = sources[answer.source - 1];
  const quoted = source && answer.quote && comparable(source.passages).includes(comparable(answer.quote));
  if (answer.verdict === 'unverified' || !quoted) {
    return { verdict: 'unverified', reason: answer.reason ?? 'The sources found do not settle this.' };
  }
  return {
    verdict: answer.verdict,
    reason: answer.reason,
    cited: { url: source.url, host: source.host, title: source.title, quote: answer.quote },
  };
}

export function createClaimChecker(publish) {
  const known = [];
  let nextId = 1;
  let queue = Promise.resolve();

  async function check(found, line) {
    const claim = {
      id: nextId++,
      lineId: line.id,
      speaker: line.speaker,
      text: found.claim,
      search: found.search,
      verdict: null,
      sources: [],
      detectedAt: Date.now(),
    };
    publish(claim);
    try {
      const results = await searchReputable(found.search);
      claim.sources = results.map(({ url, title }) => ({ url, title, host: hostOf(url) }));
      claim.firstSourceAt = Date.now();
      publish(claim);
      const sources = await readSources(results, found.claim);
      Object.assign(claim, sources.length
        ? await decide(found.claim, sources)
        : { verdict: 'unverified', reason: 'No reputable source covers this.' });
    } catch {
      Object.assign(claim, { verdict: 'unverified', reason: 'This check did not finish.' });
    }
    claim.decidedAt = Date.now();
    publish(claim);
  }

  async function detect(line, lines) {
    const recent = lines.slice(Math.max(0, line.id - 1 - CONTEXT_LINES), line.id - 1);
    const { claims } = await completeJson(detectPrompt(recent, line, known), { tier: 'fast' });
    for (const found of claims) {
      known.push(found.claim);
      check(found, line);
    }
  }

  return {
    onLine(line, lines) {
      queue = queue.then(() => detect(line, lines)).catch(() => {});
    },
  };
}
