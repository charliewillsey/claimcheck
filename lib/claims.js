// Turns transcript lines into checked claims: detect, search, read, decide.
import { hostOf } from './allowlist.js';
import { completeJson } from './llm.js';
import { readPage, searchReputable } from './search.js';

const CONTEXT_LINES = 6;
const PAGES_TO_READ = 6;
const PASSAGES_PER_PAGE = 4;
const PASSAGE_SENTENCES = 3;
const OPENING_BLOCKS = 2;

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
- Opinions or value judgments, including whether something is enough, too much, good, bad, better or worse, even when worded as facts or said with confidence.
- Personal stories, or anything about the speakers, their relatives, their plans, their jobs, what they watched, or what they saw.
- Questions, jokes, reactions to the other person, or vague remarks about how things feel.

A hedge does not make a fact an opinion: "I'm pretty sure the moon is made of rock" is a claim. A claim someone else made counts too: from "my uncle says the moon is made of rock", flag "The moon is made of rock." A judgment about the speaker's own habits is not a claim: from "I only eat twice a day and that's enough for me", flag nothing.

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

Offer up to 3 quotes for someone in the middle of an argument, best first, from different passages when you can. They will read only the quote, so each has to settle the claim by itself:
- It states the key fact of the claim, including the detail that decides it, such as the date, number or name.
- It names its subject. Reject any sentence that leans on "she", "he", "it", "they" or "them" unless your quote includes the earlier sentence that says who or what that is.
- It states the fact head-on, rather than mentioning it in passing while discussing something else.
- If the claim is about what a named organization says or recommends, it comes from that organization's own page or names the organization.
- It is copied word for word from one passage: one or two complete consecutive sentences, no ellipses, at most 50 words.

"reason" is one short plain sentence.

Reply with JSON only: {"verdict":"supported|disputed|unverified","quotes":[{"source":1,"quote":"..."}],"reason":"..."}`;

// A separate check, because the step that picks a quote is too generous grading its own pick.
const proofPrompt = (claim, verdict, quotes) => `You are the skeptical friend in an argument, and you only accept proof that stands on its own.

Claim: "${claim}"

The other person says this claim is ${verdict === 'supported' ? 'true' : 'false'}, and offers these quotes:
${quotes.map((quote, index) => `${index + 1}. From ${quote.host}: "${quote.quote}"`).join('\n')}

A quote counts only if, read alone, it directly proves that. It fails if it needs inference or outside knowledge, if a word like "she", "it" or "them" stands in for its subject, if it omits a key detail of the claim, or if it is only on the same topic. If the claim is about what an organization says, the quote must come from that organization or name it.

Reply with JSON only: {"best":1}, giving the number of the strongest quote that counts, or 0 if none does.`;

const plain = (text) => text
  .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/[*_#>`|\\]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const comparable = (text) => plain(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const wordsOf = (text) => new Set(comparable(text).split(' ').filter((word) => word.length > 3));

const sentencesOf = (block) => block.split(/(?<=[.!?])\s+/);

// Keeps a heading with the paragraph under it, so a question stays attached to its answer.
function blocksOf(page) {
  const blocks = [];
  let heading = '';
  for (const raw of page.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').split(/\n\s*\n/)) {
    const text = plain(raw);
    if (/^\s*#/.test(raw)) heading = `${heading} ${text}`.trim();
    else if (text.length > 40) {
      blocks.push(`${heading} ${text}`.trim());
      heading = '';
    }
  }
  return blocks;
}

// Word overlap finds passages that repeat the claim, which can miss the sentence that answers it,
// so the page's opening always comes along. Whole sentences mean a quote is never cut off.
function bestPassages(page, focus) {
  const terms = wordsOf(focus);
  const blocks = blocksOf(page);
  const windows = blocks
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

  const kept = new Set(blocks.slice(0, OPENING_BLOCKS));
  const taken = [];
  for (const window of windows) {
    if (taken.length === PASSAGES_PER_PAGE) break;
    const repeated = kept.has(window.text);
    const overlaps = taken.some((other) => other.blockIndex === window.blockIndex
      && Math.abs(other.index - window.index) < PASSAGE_SENTENCES);
    if (repeated || overlaps) continue;
    taken.push(window);
    kept.add(window.text);
  }
  return [...kept].join('\n');
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
  const unsettled = { verdict: 'unverified', reason: 'The sources found do not settle this.' };
  if (answer.verdict === 'unverified') return { ...unsettled, reason: answer.reason ?? unsettled.reason };

  const quotes = (answer.quotes ?? []).flatMap(({ source: index, quote }) => {
    const source = sources[index - 1];
    return source && quote && comparable(source.passages).includes(comparable(quote)) ? [{ ...source, quote }] : [];
  });
  if (!quotes.length) return unsettled;

  const { best } = await completeJson(proofPrompt(claim, answer.verdict, quotes));
  const proof = quotes[best - 1];
  if (!proof) return unsettled;
  return {
    verdict: answer.verdict,
    reason: answer.reason,
    cited: { url: proof.url, host: proof.host, title: proof.title, quote: proof.quote },
  };
}

async function weigh(results, found) {
  const sources = await readSources(results, found);
  if (!sources.length) return { verdict: 'unverified', reason: 'No reputable source covers this.' };
  return decide(found.claim, sources);
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
      let outcome = await weigh(results, found);
      if (outcome.verdict === 'unverified') {
        // One more look: searching the claim's own words often reaches pages the neutral query missed.
        const read = new Set(results.slice(0, PAGES_TO_READ).map((result) => result.url));
        const fresh = (await searchReputable(found.claim)).filter((result) => !read.has(result.url));
        if (fresh.length) outcome = await weigh(fresh, found);
      }
      Object.assign(claim, outcome);
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
