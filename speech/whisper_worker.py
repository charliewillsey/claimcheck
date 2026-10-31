"""Local Whisper base model. Reads length-prefixed 16 kHz PCM on stdin, writes one JSON line per chunk."""
import json
import struct
import sys

import numpy as np
from faster_whisper import WhisperModel

MODEL = "base.en"


def read_exact(size):
    data = b""
    while len(data) < size:
        part = sys.stdin.buffer.read(size - len(data))
        if not part:
            return None
        data += part
    return data


def main():
    model = WhisperModel(MODEL, device="cpu", compute_type="int8", cpu_threads=4)
    print(json.dumps({"ready": True, "model": MODEL}), flush=True)
    while True:
        header = read_exact(4)
        if header is None:
            return
        pcm = read_exact(struct.unpack("<I", header)[0])
        if pcm is None:
            return
        audio = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768.0
        segments, _ = model.transcribe(audio, language="en", condition_on_previous_text=False)
        kept = [s.text.strip() for s in segments if s.no_speech_prob < 0.8]
        print(json.dumps({"text": " ".join(kept).strip()}), flush=True)


if __name__ == "__main__":
    main()
