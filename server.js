// Serves the panels, relays WebRTC signaling, and turns heard audio into shared transcript lines.
// Rooms live in memory and vanish when both callers leave (Q10: calls are ephemeral).
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { createClaimChecker } from './lib/claims.js';
import { createSpeech } from './lib/speech.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 3000);
const CLAIMS_ON = process.env.CLAIMS !== 'off';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const speech = createSpeech();
const rooms = new Map();
let speechReady = false;
speech.ready.then(() => { speechReady = true; });

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (pathname === '/health') {
    res.writeHead(speechReady ? 200 : 503).end(speechReady ? 'ok' : 'loading speech model');
    return;
  }
  const file = path.normalize(path.join(PUBLIC, pathname === '/' ? 'index.html' : pathname));
  if (!file.startsWith(PUBLIC)) return void res.writeHead(403).end();
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
});

const otherRole = (role) => (role === 'A' ? 'B' : 'A');
const send = (ws, message) => { if (ws?.readyState === 1) ws.send(JSON.stringify(message)); };
const broadcast = (room, message) => Object.values(room.peers).forEach((ws) => send(ws, message));

function openRoom(id) {
  const room = { id, peers: {}, lines: [], claims: new Map(), queue: Promise.resolve() };
  room.checker = CLAIMS_ON
    ? createClaimChecker((claim) => {
        room.claims.set(claim.id, claim);
        broadcast(room, { type: 'claim', claim });
      })
    : null;
  rooms.set(id, room);
  return room;
}

// Header: chunk start and end in epoch ms. Body: PCM the panel heard from the other caller.
function onHeardAudio(room, role, frame) {
  const startedAt = frame.readDoubleLE(0);
  const endedAt = frame.readDoubleLE(8);
  const pcm = frame.subarray(16);
  const speaker = otherRole(role);
  room.queue = room.queue.then(async () => {
    const text = await speech.transcribe(pcm);
    if (!text) return;
    const line = { id: room.lines.length + 1, speaker, text, startedAt, endedAt, heardAt: Date.now() };
    room.lines.push(line);
    broadcast(room, { type: 'line', line });
    room.checker?.onLine(line, room.lines);
  });
}

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  let room = null;
  let role = null;

  ws.on('message', (data, isBinary) => {
    if (isBinary) {
      if (room) onHeardAudio(room, role, data);
      return;
    }
    const message = JSON.parse(data);
    if (message.type === 'join') {
      room = rooms.get(message.room) || openRoom(message.room);
      role = ['A', 'B'].find((candidate) => !room.peers[candidate]);
      if (!role) {
        room = null;
        return send(ws, { type: 'full' });
      }
      room.peers[role] = ws;
      const peerPresent = Boolean(room.peers[otherRole(role)]);
      send(ws, { type: 'joined', role, peerPresent, lines: room.lines, claims: [...room.claims.values()] });
      return;
    }
    if (message.type === 'signal' && room) {
      send(room.peers[otherRole(role)], { type: 'signal', data: message.data });
    }
  });

  ws.on('close', () => {
    if (!room) return;
    delete room.peers[role];
    const remaining = room.peers[otherRole(role)];
    if (remaining) send(remaining, { type: 'peer-left' });
    else rooms.delete(room.id);
  });
});

server.listen(PORT, () => console.log(`ClaimCheck on http://localhost:${PORT}`));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    speech.close();
    process.exit(0);
  });
}
