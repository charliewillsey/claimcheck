const $ = (id) => document.getElementById(id);
const log = [];
const note = (type, detail = {}) => log.push({ type, t: Date.now(), ...detail });

let pc = null;
let ws = null;
let mic = null;
let audio = null;
let role = null;
let hearing = null;

// Read by the test and the eval.
window.claimcheck = { log, get pc() { return pc; } };

const room = new URLSearchParams(location.search).get('room') || crypto.randomUUID().slice(0, 8);
history.replaceState(null, '', `/?room=${room}`);
$('invite').textContent = `Send this link to the other person: ${location.href}`;

const setStatus = (text) => { $('status').textContent = text; };
const sendJson = (message) => ws.send(JSON.stringify(message));

$('join-button').addEventListener('click', async () => {
  $('join-button').disabled = true;
  try {
    audio = new AudioContext({ sampleRate: 16000 });
    await audio.audioWorklet.addModule('/hearing-worklet.js');
    mic = await navigator.mediaDevices.getUserMedia({ audio: true });
    note('mic-open');
  } catch {
    $('join-button').disabled = false;
    $('invite').textContent = 'ClaimCheck needs your microphone. Allow it in the browser, then join again.';
    return;
  }
  $('join').hidden = true;
  $('mute').hidden = false;
  connect();
});

$('mute').addEventListener('click', () => {
  const [track] = mic.getAudioTracks();
  track.enabled = !track.enabled;
  $('mute').textContent = track.enabled ? 'Mute' : 'Unmute';
});

function connect() {
  ws = new WebSocket(`ws://${location.host}/ws`);
  ws.binaryType = 'arraybuffer';
  ws.onopen = () => sendJson({ type: 'join', room });
  ws.onclose = () => setStatus('Disconnected. Reload to rejoin.');
  ws.onmessage = ({ data }) => onMessage(JSON.parse(data));
}

function onMessage(message) {
  if (message.type === 'joined') {
    role = message.role;
    setStatus(`Waiting for the other person. Share ${location.href}`);
    message.lines.forEach(addLine);
    message.claims.forEach(renderClaim);
    if (message.peerPresent) call();
  } else if (message.type === 'full') {
    setStatus('This call already has two people.');
  } else if (message.type === 'signal') {
    onSignal(message.data);
  } else if (message.type === 'peer-left') {
    closePeer();
    setStatus('The other person left. They can rejoin with the same link.');
  } else if (message.type === 'line') {
    addLine(message.line);
  } else if (message.type === 'claim') {
    renderClaim(message.claim);
  }
}

function openPeer() {
  pc = new RTCPeerConnection({ iceServers: [] });
  mic.getTracks().forEach((track) => pc.addTrack(track, mic));
  pc.onicecandidate = ({ candidate }) => {
    if (candidate) sendJson({ type: 'signal', data: { candidate } });
  };
  pc.onconnectionstatechange = () => {
    if (pc?.connectionState === 'connected') {
      note('connected');
      setStatus(role === 'A' ? 'Connected. Your words appear on the left.' : 'Connected. Your words appear on the right.');
    }
  };
  pc.ontrack = ({ streams: [remote] }) => {
    $('speaker').srcObject = remote;
    $('speaker').play().catch(() => {});
    hear(remote);
  };
}

function closePeer() {
  pc?.close();
  pc = null;
  hearing?.disconnect();
  hearing = null;
}

async function call() {
  openPeer();
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  sendJson({ type: 'signal', data: { description: pc.localDescription } });
}

async function onSignal({ description, candidate }) {
  if (description) {
    if (!pc) openPeer();
    await pc.setRemoteDescription(description);
    if (description.type === 'offer') {
      await pc.setLocalDescription(await pc.createAnswer());
      sendJson({ type: 'signal', data: { description: pc.localDescription } });
    }
  } else if (candidate && pc) {
    await pc.addIceCandidate(candidate);
  }
}

// Each panel transcribes what arrives over the call, so a line from a speaker
// proves that speaker's audio crossed the connection.
function hear(remote) {
  hearing?.disconnect();
  const source = audio.createMediaStreamSource(remote);
  const worklet = new AudioWorkletNode(audio, 'hearing', { numberOfOutputs: 0 });
  worklet.port.onmessage = ({ data: { pcm, chunkMs } }) => {
    const endedAt = Date.now();
    const header = new Float64Array([endedAt - chunkMs, endedAt]);
    ws.send(new Blob([header, pcm]));
  };
  source.connect(worklet);
  hearing = source;
  audio.resume();
}

function addLine(line) {
  $('said-empty').hidden = true;
  const item = document.createElement('li');
  item.className = 'line';
  item.dataset.lineId = line.id;
  item.dataset.speaker = line.speaker;
  item.textContent = line.text;
  $('lyrics').querySelector('.current')?.classList.remove('current');
  item.classList.add('current');
  $('lyrics').append(item);
  note('line', { lineId: line.id });
  centerOn(item);
}

function centerOn(item) {
  const offset = $('said').clientHeight * 0.42 - item.offsetTop - item.offsetHeight / 2;
  $('lyrics').style.transform = `translateY(${offset}px)`;
}

function renderClaim() {}
