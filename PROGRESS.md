# PROGRESS

**Goal:** see PROMPT.md North Star. Two people talk; the app shows what's said and live-pulls reputable sources on the factual claims.

**Current state (2026-10-30):**
- Founder answers recorded as Malcolm's defaults. Charlie has not confirmed them (`QUESTIONS.md`).
- 5 scenarios with 29 claims frozen in `docs/scenarios/`, marked DRAFT LABELS.
- Audio path works: two bundled-Chromium panels connect over real WebRTC, and each transcribes the audio it receives from the other. `npm test` covers this.
- Claim pipeline, source panel, strict scorer and eval harness are built.

**Next step:** iterate on the eval until 3 consecutive full runs clear 75% overall and in every scenario.

**Blockers:** none.
