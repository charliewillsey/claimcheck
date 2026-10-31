// Turns transcript lines into checked claims: detect, search, read, decide.
import { hostOf } from './allowlist.js';
import { completeJson } from './llm.js';
import { readPage, searchReputable } from './search.js';

const CONTEXT_LINES = 6;
const PAGES_TO_READ = 4;
const PASSAGES_PER_PAGE = 5;
const PASSAGE_SENTENCES = 3;

const detectPrompt = (recent, line, known) => `You listen to a live call between two friends and flag the factual claims a skeptical friend would want checked.

Recent conversation (speech-to-text, may contain errors):
${recent.map((item) => `${item.speaker}: ${item.text}`).join('\n') || '(start of call)'}

Newest line, from speaker ${line.speaker}:
"${line.text}"

Most lines contain no such claim, so an empty list is the usual answer.

Flag a sentence only if all of these hold:
- The speaker says it outright in the newest line. Never add what the line merely implies or assumes.
- It asserts a specific fact about the world that an encyclopedia, government agency or news outlet could confirm or refute: science, health, history, geography, law, statistics, or what a public body says.
- It is the point the speaker is making, not background nobody would stop to question.

Never flag:
- Opinions or value judgments, even when worded as facts or said with confidence.
- Personal stories, or anything about the speakers, their relatives, their plans, their jobs, what they watched, or what they saw.
- Questions, jokes, reactions to the other person, or vague remarks about how things feel.

A hedge does not make a fact an opinion: "I'm pretty sure the moon is made of rock" is a claim. A claim someone else made counts too: from "my uncle says the moon is made of rock", flag "The moon is made of rock."

How to write a flagged claim:
- One spoken sentence is one claim. Keep all of its details together, including dates, numbers, reasons and qualifiers. Never split a sentence into parts.
- Make it self-contained. Use the conversation to replace words like "he" or "it", and fix obvious speech-to-text errors.
- Keep the speaker's numbers, names, dates and direction exactly, even if you think they are wrong. Never correct the speaker.

Already flagged. Skip anything that restates these, even in other words:
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

Pick the single best passage to show someone in the middle of an argument. They will read only your quote, so it has to settle the claim by itself:
- It states the key fact of the claim, including the detail that decides it, such as the date, number or name.
- It names its subject. Reject any sentence that leans on "it", "they" or "them" unless your quote includes the earlier sentence that says who or what that is.
- It is copied word for word from one passage: one or two complete consecutive sentences, no ellipses, at most 50 words.

"reason" is one short plain sentence.

Reply with JSON only: {"verdict":"supported|disputed|unverified","source":1,"quote":"...","reason":"..."}`;

const plain = (text) => text
  .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/[*_#>`|\\]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const comparable = (text) => plain(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const wordsOf = (text) => new Set(comparable(text).split(' ').filter((word) => word.length > 3));

const sentencesOf = (block) => block.split(/(?<=[.!?])\s+/);

// Whole-sentence windows, so a quote can never be cut off mid-sentence.
function bestPassages(page, focus) {
  const terms = wordsOf(focus);
  const windows = page
    .split(/\n\s*\n/)
    .map(plain)
    .filter((block) => block.length > 40)
    .flatMap((block, blockIndex) => {
      const sentences = sentencesOf(block);
      return sentences.map((_, index) => ({
        blockIndex,
        index,
        text: sentences.slice(index, index + PASSAGE_SENTENCES).join(' '),
      }));
    })
    .map((window) => {
      const words = wordsOf(window.text);
      return { ...window, score: [...terms].filter((term) => words.has(term)).length };
    })
    .sort((a, b) => b.score - a.score);

  const kept = [];
  for (const window of windows) {
    const overlaps = kept.some((other) => other.blockIndex === window.blockIndex
      && Math.abs(other.index - window.index) < PASSAGE_SENTENCES);
    if (!overlaps) kept.push(window);
    if (kept.length === PASSAGES_PER_PAGE) break;
  }
  return kept.map((window) => window.text).join('\n');
}

async function readSources(results, found) {
  const focus = `${found.claim} ${found.search}`;
  const pages = await Promise.all(results.slice(0, PAGES_TO_READ).map(async (result) => {
    const page = await readPage(result.url).catch(() => '');
    return {
      url: result.url,
      title: result.title,
      host: hostOf(result.url),
      passages: bestPassages(page, focus),
    };
  }));
  return pages.filter((page) => page.passages);
}

async function decide(claim, sources) {
  const answer = await completeJson(verdictPrompt(claim, sources));
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

export async function detectClaims(line, lines, known) {
  const recent = lines.slice(Math.max(0, line.id - 1 - CONTEXT_LINES), line.id - 1);
  const { claims } = await completeJson(detectPrompt(recent, line, known));
  return claims;
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
      const sources = await readSources(results, found);
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
    const claims = await detectClaims(line, lines, known);
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
