// Runs on the audio thread at 16 kHz. Cuts what the panel hears into short speech chunks.
const FRAME = 480; // 30 ms
const FRAME_MS = 30;
const VOICE_RMS = 0.006;
const PAUSE_MS = 400;
const SHORT_PAUSE_MS = 200; // once a chunk runs long, take any breath as the cut
const LONG_CHUNK_MS = 6000;
const MAX_CHUNK_MS = 10000;
const MIN_VOICED_MS = 240;
const LEAD_IN_FRAMES = 10;

class Hearing extends AudioWorkletProcessor {
  constructor() {
    super();
    this.frame = new Float32Array(FRAME);
    this.filled = 0;
    this.leadIn = [];
    this.chunk = null;
    this.voicedMs = 0;
    this.quietMs = 0;
  }

  process(inputs) {
    const samples = inputs[0][0];
    if (samples) {
      for (const sample of samples) {
        this.frame[this.filled++] = sample;
        if (this.filled === FRAME) {
          this.onFrame(this.frame.slice());
          this.filled = 0;
        }
      }
    }
    return true;
  }

  onFrame(frame) {
    const rms = Math.sqrt(frame.reduce((sum, value) => sum + value * value, 0) / FRAME);
    const voiced = rms >= VOICE_RMS;

    if (!this.chunk) {
      if (!voiced) {
        this.leadIn.push(frame);
        if (this.leadIn.length > LEAD_IN_FRAMES) this.leadIn.shift();
        return;
      }
      this.chunk = [...this.leadIn, frame];
      this.leadIn = [];
      this.voicedMs = FRAME_MS;
      this.quietMs = 0;
      return;
    }

    this.chunk.push(frame);
    this.voicedMs += voiced ? FRAME_MS : 0;
    this.quietMs = voiced ? 0 : this.quietMs + FRAME_MS;

    const chunkMs = this.chunk.length * FRAME_MS;
    const pauseMs = chunkMs >= LONG_CHUNK_MS ? SHORT_PAUSE_MS : PAUSE_MS;
    if (this.quietMs >= pauseMs || chunkMs >= MAX_CHUNK_MS) this.flush(chunkMs);
  }

  flush(chunkMs) {
    if (this.voicedMs >= MIN_VOICED_MS) {
      const pcm = new Int16Array(this.chunk.length * FRAME);
      this.chunk.forEach((frame, index) => {
        frame.forEach((value, offset) => {
          pcm[index * FRAME + offset] = Math.max(-1, Math.min(1, value)) * 32767;
        });
      });
      this.port.postMessage({ pcm, chunkMs }, [pcm.buffer]);
    }
    this.chunk = null;
    this.voicedMs = 0;
    this.quietMs = 0;
  }
}

registerProcessor('hearing', Hearing);
