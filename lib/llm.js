// LLM adapter. Swap this file's internals to move to a paid API key; keep complete and completeJson.
import { spawn } from 'node:child_process';
import os from 'node:os';

const MODELS = { fast: 'haiku', careful: 'sonnet' };
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

function runClaude(prompt, tier, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn('env', [...CLAUDE, '--model', MODELS[tier]], { cwd: os.tmpdir() });
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

export function complete(prompt, { tier = 'careful', timeoutMs = 60_000 } = {}) {
  return withSlot(async () => {
    try {
      return await runClaude(prompt, tier, timeoutMs);
    } catch {
      return runClaude(prompt, tier, timeoutMs);
    }
  });
}

export async function completeJson(prompt, options) {
  const reply = await complete(prompt, options);
  return JSON.parse(reply.slice(reply.indexOf('{'), reply.lastIndexOf('}') + 1));
}
