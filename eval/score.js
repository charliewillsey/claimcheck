// The scorer. Q2: a claim agrees only if the verdict matches AND a cited source is reputable and supports it.
//
// A label passes only if every card matching it passes all of these:
//   1. the verdict equals the label
//   2. the card cites a source on the allowlist
//   3. the quoted passage is really on that page, checked by opening the page again here
//   4. a separate judge, shown only the label and the passage, says the passage supports the label
//
// Agreement = labels passed / (labels + false positives).
// A false positive is a card matching no label, so flagging small talk costs score.
import { hostOf, isReputable } from '../lib/allowlist.js';
import { comparable } from '../lib/claims.js';
import { completeJson } from '../lib/llm.js';
import { readPage } from '../lib/search.js';

const matchPrompt = (labels, cards) => `A fact-checking app listened to a conversation and produced claim cards. Match each card to the labeled claim it asserts.

Labeled claims:
${labels.map((label) => `${label.id}: ${label.claim}`).join('\n')}

Cards:
${cards.map((card, index) => `${index + 1}: ${card.text}`).join('\n')}

A card matches a label only if it asserts the same factual proposition in the same direction. Paraphrase is fine, and extra detail is fine. A card that changes a number, date or name, or flips the direction, does not match. A card may match no label.

Reply with JSON only: {"matches":[{"card":1,"label":"c1"}]}, using null for "label" when nothing matches. Include every card.`;

const supportPrompt = (label, host, quote) => {
  const truth = label.verdict === 'supported' ? 'true' : 'false';
  return `You are auditing a fact-checker, and you are strict.

Claim: "${label.claim}"

The claim is ${truth}. The fact-checker cited this passage from ${host}:
"${quote}"

Read on its own, is this passage direct evidence that the claim is ${truth}? Answer no if it is merely on the same topic, or needs outside knowledge to reach that conclusion.

Reply with JSON only: {"supports":true,"why":"one sentence"}`;
};

async function openPage(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const page = await readPage(url);
      if (page) return page;
    } catch {
      // try again
    }
  }
  return null;
}

async function checkCard(card, label) {
  if (card.verdict !== label.verdict) return 'wrong_verdict';
  if (!card.citedUrl || !card.quote) return 'no_cited_source';
  if (!isReputable(card.citedUrl)) return 'source_not_reputable';
  const page = await openPage(card.citedUrl);
  if (page === null) return 'source_would_not_open';
  if (!comparable(page).includes(comparable(card.quote))) return 'quote_not_on_page';
  const { supports } = await completeJson(supportPrompt(label, hostOf(card.citedUrl), card.quote), { tier: 'careful' });
  return supports ? 'agree' : 'source_does_not_support';
}

export async function scoreScenario(scenario, cards) {
  const { matches } = cards.length
    ? await completeJson(matchPrompt(scenario.claims, cards), { tier: 'careful' })
    : { matches: [] };
  const labelOf = new Map(matches.map((match) => [match.card - 1, match.label]));
  const known = new Set(scenario.claims.map((label) => label.id));

  const falsePositives = cards.filter((card, index) => !known.has(labelOf.get(index)));

  const labels = await Promise.all(scenario.claims.map(async (label) => {
    const matched = cards.filter((card, index) => labelOf.get(index) === label.id);
    if (!matched.length) return { ...label, status: 'missed', cards: [] };
    const results = await Promise.all(matched.map((card) => checkCard(card, label)));
    const failed = results.find((result) => result !== 'agree');
    return { ...label, status: failed ?? 'agree', cards: matched };
  }));

  const agreed = labels.filter((label) => label.status === 'agree').length;
  const sourced = labels.filter((label) => ['agree', 'wrong_verdict'].includes(label.status) && label.cards.length
    && label.cards.every((card) => card.citedUrl && isReputable(card.citedUrl))).length;
  return { labels, falsePositives, agreed, sourced, total: labels.length + falsePositives.length };
}
