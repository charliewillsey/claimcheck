# /goal — ClaimCheck MVP (paste this whole file after `/goal` in Claude Code)

## Where you are
- Repo: `charliewillsey/claimcheck` (private). Clone it and work only inside it.
- Spec: `PROMPT.md` — the single source of truth. Re-read it at the start of EVERY iteration.
- Founders' original intent: `docs/transcript-2026-10-28.md` (Charlie Willsey + Malcolm Mahaney). Read it in full once before iteration 1.
- An independent WATCHDOG agent audits this repo every hour (`WATCHDOG.md`). Before each iteration, check for `CORRECTION.md`. If it exists, obey it first, then delete it in your next commit.

## North Star
Two people are talking. Show what's being said, and live-pull reputable sources that cross-reference the factual claims they make, so nobody has to wonder if the other person is "capping."

## Step 0: questions (do this first)
Open `QUESTIONS.md`.
- If the **Answers** section is empty, ask the founders all 10 questions in ONE message and wait. Write their answers into `QUESTIONS.md` and commit.
- If it is answered, proceed.

## Build order (MVP only, minimalist)
1. **Audio path:** a two-panel browser-to-browser audio call on localhost (WebRTC / Web Audio only). Test it end-to-end before moving on.
2. **Left panel:** live transcription in Apple-Music-lyrics style, with the current line highlighted and auto-scrolling.
3. **Right panel:** claim detection. For each factual claim, show reputable sources plus a verdict (supported / disputed / unverified) with links.
4. **Eval harness:** run each founder scenario as a real two-panel call. Log each claim, its sources and verdict, then score agreement against the founder labels in `EVAL_LOG.md`.
5. **Deploy:** push to Vercel only after steps 1–4 pass. Use Supabase only if `QUESTIONS.md` says to store data.

## Goal is MET only when ALL are true
1. The audio path is built, tested end-to-end between two panels, and running. Record the evidence in `PROGRESS.md`.
2. The eval reaches **≥75% agreement** with founder labels, with proper sources cited, on **3 consecutive full runs** (all logged in `EVAL_LOG.md`).
3. The founders have reviewed and approved it. Human in the loop: stop at each gate (audio path working → first eval run → 75% ×3) and show results before continuing.

The stretch target of 90% agreement comes later, after the scenario set scales up. It is not part of this goal.

## Anti-drift rules
- No scope beyond MVP. Personal source library, IG/TikTok connectors, predictive pre-fetch, phone/VPN mode and echo-chamber guardrails all go in `ROADMAP.md` only.
- If 3 or more iterations pass with no eval improvement, SIMPLIFY: cut complexity rather than adding it.
- Keep `PROGRESS.md` current after every iteration: goal, state, next step, blockers. The watchdog reads it.
- If context feels degraded (repeating work, contradicting earlier decisions), compact and restart from `PROMPT.md` + `PROGRESS.md`.
- Commit small and often to `main` with clear messages, so the watchdog can see what changed.
