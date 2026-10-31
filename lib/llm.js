// LLM adapter. Swap this file's internals to move to a paid API key; keep complete and completeJson.
import { spawn } from 'node:child_process';
import os from 'node:os';

const MODEL = 'sonnet';
const MAX_RUNNING = 5;

// Skipping tools, MCP servers and user settings takes a call from about 8s to about 2s.
const CLAUDE = [
  '-u', 'ANTHROPIC_API_KEY', '-u', 'CLAUDECODE',
  'claude', '-p', '--settings', '{"env":{"ANTHROPIC_API_KEY":""}}',
  '--tools', '', '--strict-mcp-config', '--setting-sources', '', '--no-session-persistence',
];

let running = 0;
const waiting = [];

async function withSlot(work) {
  if (running >= MAX_RUNNING) await new Promise((resolve) => waiting.push(resolve));
  running += 1;
  try {
    return await work();
  } finally {
    running -= 1;
    waiting.shift()?.();
  }
}

function runClaude(prompt, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn('env', [...CLAUDE, '--model', MODEL], { cwd: os.tmpdir() });
    const timer = setTimeout(() => child.kill(), timeoutMs);
    let out = '';
    let err = '';
    child.stdout.on('data', (data) => { out += data; });
    child.stderr.on('data', (data) => { err += data; });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out.trim());
      else reject(new Error(`claude exited ${code}: ${(err || out).slice(0, 200)}`));
    });
    child.stdin.end(prompt);
  });
}

export function complete(prompt, { timeoutMs = 60_000 } = {}) {
  return withSlot(async () => {
    try {
      return await runClaude(prompt, timeoutMs);
    } catch {
      return runClaude(prompt, timeoutMs);
    }
  });
}

// Models sometimes add a note after the JSON, so read exactly one balanced object.
function firstObject(text) {
  const start = text.indexOf('{');
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = Math.max(start, 0); start >= 0 && index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === '{') depth += 1;
    else if (char === '}' && --depth === 0) return JSON.parse(text.slice(start, index + 1));
  }
  throw new Error('The reply had no complete JSON object');
}

export async function completeJson(prompt, options) {
  try {
    return firstObject(await complete(prompt, options));
  } catch {
    return firstObject(await complete(prompt, options));
  }
}
