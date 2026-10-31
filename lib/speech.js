// Speech adapter. Swap this file's internals to move to a paid engine; keep start, transcribe and close.
import { spawn } from 'node:child_process';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const WORKER = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'speech', 'whisper_worker.py');

export function createSpeech() {
  const worker = spawn('python3', [WORKER], { stdio: ['pipe', 'pipe', 'inherit'] });
  const waiting = [];
  let markReady;
  const ready = new Promise((resolve) => { markReady = resolve; });

  readline.createInterface({ input: worker.stdout }).on('line', (raw) => {
    const message = JSON.parse(raw);
    if (message.ready) markReady();
    else waiting.shift()?.(message.text);
  });

  return {
    ready,
    // pcm: Buffer of 16 kHz mono signed 16-bit samples. Chunks resolve in the order they were sent.
    transcribe(pcm) {
      return new Promise((resolve) => {
        waiting.push(resolve);
        const header = Buffer.alloc(4);
        header.writeUInt32LE(pcm.length);
        worker.stdin.write(header);
        worker.stdin.write(pcm);
      });
    },
    close() {
      worker.stdin.end();
    },
  };
}
