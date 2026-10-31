// Renders a two-speaker script into one WAV per caller, with silence while the other person talks.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const RATE = 48000;
const VOICES = { A: 'Samantha', B: 'Daniel' };
const LEAD_SECONDS = 3; // lets the call connect before the first word
const GAP_SECONDS = 0.8;

function speak(text, voice, dir, index) {
  const aiff = path.join(dir, `${index}.aiff`);
  const pcm = path.join(dir, `${index}.pcm`);
  execFileSync('say', ['-v', voice, '-r', '175', '-o', aiff, text]);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', aiff, '-ar', String(RATE), '-ac', '1', '-f', 's16le', pcm]);
  const samples = readFileSync(pcm);
  rmSync(aiff);
  rmSync(pcm);
  return samples;
}

function wav(pcm) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

// lines: [{ speaker: 'A' | 'B', text }]. Returns the WAV paths and when each line is spoken.
export function renderCall(lines, dir) {
  mkdirSync(dir, { recursive: true });
  const spoken = lines.map((line, index) => ({ ...line, samples: speak(line.text, VOICES[line.speaker], dir, index) }));

  let cursor = LEAD_SECONDS * RATE * 2;
  const timeline = spoken.map(({ samples, ...line }) => {
    const start = cursor;
    cursor += samples.length + Math.round(GAP_SECONDS * RATE) * 2;
    return { ...line, offset: start, length: samples.length, start: start / (RATE * 2), end: (start + samples.length) / (RATE * 2) };
  });

  const tracks = {};
  for (const speaker of ['A', 'B']) {
    const pcm = Buffer.alloc(cursor);
    spoken.forEach(({ samples }, index) => {
      if (timeline[index].speaker === speaker) samples.copy(pcm, timeline[index].offset);
    });
    tracks[speaker] = path.join(dir, `${speaker}.wav`);
    writeFileSync(tracks[speaker], wav(pcm));
  }
  return { tracks, timeline, seconds: cursor / (RATE * 2) };
}
