# PROJECT: ClaimCheck — Live Conversation Fact-Check (working name; "Malcolm & Charlie's app")

Founders: Charlie Willsey + Malcolm Mahaney. Source of intent: `docs/transcript-2026-10-28.md` (read it in full before iteration 1).
Run this with `/goal`. A separate WATCHDOG agent (see `WATCHDOG.md`) audits you against this file every 10–15 min.

## NORTH STAR (re-read before every iteration)
Two people are talking. Show what's being said, and live-pull reputable sources that cross-reference the factual claims they make — so nobody has to wonder if the other person is "capping," and people get slower to say things they only *think* they read. If a change doesn't serve this, don't make it.

## STEP 0 — ASK FIRST, THEN BUILD
Before writing product code, ask the founders ALL clarifying questions in one message (max 10), then wait. One question must request the 3–5 test scenarios and the good/bad labels. (Done 2026-10-28 — see `QUESTIONS.md`; answers go there.)

## MVP SCOPE (build only this)
1. Web-to-web audio call between two browser panels on localhost. Browser audio only (WebRTC / Web Audio). No other audio tools or services without founder approval.
2. Split-screen UI during the call:
   - LEFT: live transcription, Apple-Music-lyrics style (current line highlighted, smooth scroll).
   - RIGHT: live claim detection → for each factual claim, pull reputable sources, show verdict (supported / disputed / unverified) + links.
3. Minimalist design.

Stack: GitHub (this repo, private) · Vercel · Supabase. Localhost first; deploy to Vercel only after the audio path passes.

## OUT OF SCOPE FOR MVP (log in ROADMAP.md, do not build)
- Personal source library (users dump articles; share-sheet connectors for Instagram/TikTok).
- Predictive pre-fetch (predict which article the speaker is about to cite → queue → second index-matching/validation layer before surfacing).
- Phone/OS-level "turn it on like a VPN / call record" mode; Apple adoption.
- Guardrails so the personal library doesn't become an ideology echo chamber.

## TEST & EVAL LOOP
- Run each founder scenario as a real two-panel web call on localhost (scripted audio or live speech).
- Per claim, log: transcript text, claim detected, sources pulled, verdict.
- Score against founder good/bad labels → agreement rate.
- PASS GATE: ≥75% agreement, sustained 3 consecutive full eval runs, with proper sources cited.
- STRETCH: 90% once the scenario set scales up.
- Running log: `EVAL_LOG.md` (run #, score, what changed, what failed).

## DONE CRITERIA (do not stop until all true)
1. Audio path built, tested end-to-end between two panels, and running.
2. Eval passes the 75% gate 3 runs in a row.
3. Founders reviewed and approved — human in the loop: show results at each gate before moving on.

## ANTI-DRIFT RULES
- Re-read this file at the start of every iteration. Check `CORRECTION.md` (watchdog) before working.
- 3+ iterations without eval improvement → SIMPLIFY (cut complexity, don't add).
- Never expand scope beyond MVP without asking.
- Keep `PROGRESS.md` current: goal, current state, next step, blockers.
