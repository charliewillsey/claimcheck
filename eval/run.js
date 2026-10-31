// One full eval run: every scenario as a real two-panel call, scored, then appended to EVAL_LOG.md.
//   npm run eval -- --note "what changed"     all five scenarios
//   npm run eval -- --only 03 --note "..."    a partial run, never logged to EVAL_LOG.md
import { spawn } from 'node:child_process';
import { appendFileSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCall } from './audio.js';
import { joinCall, openPanel } from './panels.js';
import { loadScenarios } from './scenarios.js';
import { scoreScenario } from './score.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESULTS = path.join(ROOT, 'eval', 'results');
const PORT = 3199;
const BASE = `http://localhost:${PORT}`;
const GATE = 0.75;

const argument = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? null : process.argv[index + 1];
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const percent = (part, whole) => `${Math.round((part / whole) * 1000) / 10}%`;

async function startServer() {
  const server = spawn('node', ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'inherit' });
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const healthy = await fetch(`${BASE}/health`).then((response) => response.ok).catch(() => false);
    if (healthy) return server;
    await sleep(500);
  }
  throw new Error('The server did not start');
}

const readPanel = (page) => page.evaluate(() => ({
  log: window.claimcheck.log,
  lines: [...document.querySelectorAll('#lyrics .line')].map((item) => ({
    id: Number(item.dataset.lineId),
    speaker: item.dataset.speaker,
    text: item.textContent,
  })),
  cards: [...document.querySelectorAll('.claim')].reverse().map((item) => ({
    id: Number(item.dataset.claimId),
    lineId: Number(item.dataset.lineId),
    speaker: item.dataset.speaker,
    text: item.querySelector('.said').textContent,
    verdict: item.dataset.verdict,
    reason: item.querySelector('.reason').textContent,
    quote: item.querySelector('blockquote').textContent,
    citedUrl: item.querySelector('a.cited')?.href ?? null,
    links: [...item.querySelectorAll('.sources a')].map((link) => link.href),
  })),
}));

async function callScenario(scenario, runId) {
  const { tracks, timeline, seconds } = renderCall(scenario.lines, path.join(ROOT, '.audio', scenario.name));
  const room = `run-${runId}-${scenario.id}-${Date.now()}`;
  const a = await openPanel(BASE, room, tracks.A);
  const b = await openPanel(BASE, room, tracks.B);
  try {
    await joinCall(a, b);
    await a.page.waitForTimeout((seconds + 2) * 1000);
    // Lines and checks finish after the audio does; stop once both have gone quiet.
    let settled = 0;
    for (let waited = 0; waited < 90 && settled < 5; waited += 1) {
      const pending = await a.page.locator('.claim[data-verdict="checking"]').count();
      settled = pending ? 0 : settled + 1;
      await a.page.waitForTimeout(1000);
    }
    const [panelA, panelB] = await Promise.all([readPanel(a.page), readPanel(b.page)]);
    return { panelA, panelB, timeline };
  } finally {
    await a.browser.close();
    await b.browser.close();
  }
}

// Seconds from the end of the spoken claim to its first source rendering in panel A.
function secondsToSource(label, cards, panelA, panelB, timeline) {
  const spoken = timeline.find((line) => line.tags.includes(label.id));
  const panelOf = spoken.speaker === 'A' ? panelA : panelB;
  const micOpen = panelOf.log.find((event) => event.type === 'mic-open')?.t;
  const firsts = cards.map((card) => panelA.log.find((event) => event.type === 'first-source' && event.claimId === card.id)?.t)
    .filter(Boolean);
  if (!micOpen || !firsts.length) return Infinity;
  return (Math.min(...firsts) - micOpen) / 1000 - spoken.end;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function report(runId, note, results) {
  const out = [`# Eval run ${runId}`, '', `Changed: ${note}`, ''];
  for (const { scenario, score, panelA, panelsMatch, timings } of results) {
    out.push(`## ${scenario.title}: ${score.agreed}/${score.total} (${percent(score.agreed, score.total)})`, '');
    out.push(`Panels showed the same claims: ${panelsMatch ? 'yes' : 'NO'}`, '');
    for (const label of score.labels) {
      out.push(`### ${label.id} ${label.status}: ${label.claim}`, `- expected: ${label.verdict}`);
      out.push(`- seconds to first source: ${timings[label.id] === Infinity ? 'none' : timings[label.id].toFixed(1)}`);
      for (const card of label.cards) {
        const heard = panelA.lines.find((line) => line.id === card.lineId)?.text ?? '';
        out.push(`- detected: ${card.text}`, `- transcript: ${heard}`, `- verdict: ${card.verdict}`, `- reason: ${card.reason}`);
        out.push(`- cited: ${card.citedUrl ?? 'none'}`, `- quote: ${card.quote || 'none'}`, `- sources: ${card.links.join(' ') || 'none'}`);
      }
      out.push('');
    }
    if (score.falsePositives.length) {
      out.push('### False positives', ...score.falsePositives.map((card) => `- ${card.text} (${card.verdict})`), '');
    }
    out.push('### Transcript', ...panelA.lines.map((line) => `- ${line.speaker}: ${line.text}`), '');
  }
  return out.join('\n');
}

function logRow(runId, note, results) {
  const agreed = results.reduce((sum, { score }) => sum + score.agreed, 0);
  const total = results.reduce((sum, { score }) => sum + score.total, 0);
  const sourced = results.reduce((sum, { score }) => sum + score.sourced, 0);
  const labels = results.reduce((sum, { score }) => sum + score.labels.length, 0);
  const seconds = median(results.flatMap(({ timings }) => Object.values(timings)));
  const scenarios = results.map(({ scenario, score }) => `${scenario.id} ${score.agreed}/${score.total}`).join(', ');
  const failures = results.flatMap(({ scenario, score }) => [
    ...score.labels.filter((label) => label.status !== 'agree').map((label) => `${scenario.id} ${label.id} ${label.status}`),
    ...score.falsePositives.map(() => `${scenario.id} false positive`),
  ]);
  const passed = agreed / total >= GATE && results.every(({ score }) => score.agreed / score.total >= GATE);
  const date = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const shown = seconds === null || seconds === Infinity ? 'none' : `${seconds.toFixed(1)}s`;
  return `| ${runId} | ${date} | ${scenarios} | ${percent(agreed, total)} ${passed ? 'PASS' : 'FAIL'} | ${sourced}/${labels} | ${shown} | ${note} | ${failures.join('; ') || 'none'} |\n`;
}

async function main() {
  const only = argument('only');
  const note = argument('note') ?? 'no note';
  const scenarios = loadScenarios().filter((scenario) => !only || only.split(',').includes(scenario.id));
  mkdirSync(RESULTS, { recursive: true });
  const runId = readdirSync(RESULTS).filter((file) => /^run-\d+\.md$/.test(file)).length + 1;
  const server = await startServer();
  const results = [];
  try {
    for (const scenario of scenarios) {
      console.log(`Calling ${scenario.title}`);
      const { panelA, panelB, timeline } = await callScenario(scenario, runId);
      const score = await scoreScenario(scenario, panelA.cards);
      const timings = Object.fromEntries(score.labels.map((label) => [label.id, secondsToSource(label, label.cards, panelA, panelB, timeline)]));
      const summary = (panel) => JSON.stringify(panel.cards.map(({ id, text, verdict, citedUrl }) => ({ id, text, verdict, citedUrl })));
      results.push({ scenario, score, panelA, timings, panelsMatch: summary(panelA) === summary(panelB) });
      console.log(`  ${score.agreed}/${score.total} agreed`);
      for (const label of score.labels.filter((item) => item.status !== 'agree')) console.log(`  ${label.id} ${label.status}`);
      for (const card of score.falsePositives) console.log(`  false positive: ${card.text}`);
    }
  } finally {
    server.kill();
  }

  if (only) {
    writeFileSync(path.join(ROOT, '.audio', 'partial-run.md'), report(`partial ${only}`, note, results));
    console.log(logRow('partial', note, results));
    return;
  }
  writeFileSync(path.join(RESULTS, `run-${String(runId).padStart(3, '0')}.md`), report(runId, note, results));
  const row = logRow(runId, note, results);
  appendFileSync(path.join(ROOT, 'EVAL_LOG.md'), row);
  console.log(row);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
