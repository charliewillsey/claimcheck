// Reads the frozen scenario scripts and labels in docs/scenarios.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'scenarios');

function parse(file) {
  const raw = readFileSync(path.join(DIR, file), 'utf8');
  const [, title] = raw.match(/^# (.+)$/m);
  const [, script, labels] = raw.match(/## Script\n([\s\S]*?)\n## Labels\n([\s\S]*)$/);

  const lines = script.split('\n').filter((line) => line.trim()).map((line) => ({
    speaker: line[0],
    text: line.slice(3).replace(/\[c\d+\]\s*/g, ''),
    tags: [...line.matchAll(/\[(c\d+)\]/g)].map((match) => match[1]),
  }));

  const claims = labels.split(/^### /m).slice(1).map((section) => {
    const field = (name) => section.match(new RegExp(`^- ${name}: (.+)$`, 'm'))[1];
    return { id: section.split('\n')[0].trim(), claim: field('claim'), verdict: field('verdict'), source: field('source') };
  });

  return { id: file.slice(0, 2), name: file.replace(/\.md$/, ''), title, lines, claims };
}

export const loadScenarios = () =>
  readdirSync(DIR).filter((file) => /^\d\d-.+\.md$/.test(file)).sort().map(parse);
