# PROGRESS

STOPPED FOR FOUNDER REVIEW: labels are drafts, score is provisional

**Goal:** see PROMPT.md North Star. Two people talk; the app shows what's said and live-pulls reputable sources on the factual claims.

**Start the app:**

```
cd ~/claimcheck && PORT=3100 npm start
```

Then open http://localhost:3100 in two browser tabs or windows, using the same room link in both, and click Join call in each. Port 3100 is used because Malcolm's softphone holds 3000. It needs Python with `faster-whisper`, the logged-in `claude` CLI, and `FIRECRAWL_API_KEY` in `.env.local`.

**Current state (2026-10-31):**
- Audio path built and tested: two bundled-Chromium panels connect over real WebRTC, and each transcribes the audio it receives from the other. `npm test` passes.
- Left panel: live transcript in the Apple Music lyrics style, with each caller on their own side.
- Right panel: each factual claim with a verdict, a reason, a quote from the source, and a link. Sources come only from the allowlist in `lib/allowlist.js`.
- The LLM and speech engines sit behind one adapter each: `lib/llm.js` and `lib/speech.js`.
- Eval: 3 consecutive passing full runs of all 5 scenarios (runs 8, 9, 10) on one unchanged build, `78b5d02`. See `EVAL_LOG.md`, with per-claim detail in `eval/results/`.

**What the score does and does not show:**
- The build agent wrote the scripts and labels. Neither founder has confirmed them, so 93-97% is provisional.
- Run 7 used the same build and failed: 93.1% overall, but scenario 03 fell to 71.4%. So this build clears the gate most of the time, not every time.
- "Vikings wore horned helmets into battle" came back unverified in runs 7-10. The verdict is honest but disagrees with the label, and it is the main reason scenario 03 has little margin.
- Every eval call used scripted macOS voices. No real people on real microphones have tested it yet.

**Next step:** founders confirm the `QUESTIONS.md` defaults, review the labels in `docs/scenarios/`, and try a live call.

**Blockers:** none. Waiting on founder review.
