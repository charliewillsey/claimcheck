# Step 0 — Founder questions (asked 2026-10-28)

Answer inline under each. Build starts once these are answered.

1. **Test scenarios.** Send the 3–5 scenarios. Format: a written script (Speaker A / Speaker B lines) is enough — I'll synthesize audio for automated runs. Include which lines contain claims.
2. **Labels / what "good" means.** Per claim, what earns a "good": correct verdict, a correct reputable source, or both? Is the 75% agreement scored per-claim or per-scenario?
3. **Speech-to-text.** Browser Web Speech API (free, Chrome-only, weaker accuracy) or a paid streaming STT (Deepgram / OpenAI / AssemblyAI)? If paid, which account/key?
4. **Fact-check engine.** Which LLM + search for claim detection and sourcing (e.g., Claude API + web search, Perplexity, Exa/Brave)? API keys and a per-call or monthly budget cap?
5. **"Reputable sites."** Hard allowlist (e.g., AP, Reuters, .gov, .edu, peer-reviewed, Wikipedia?) or let the model judge source quality?
6. **Latency.** How fast must a source appear after the claim is spoken — under 5s, under 10s, or "by end of the turn" is fine?
7. **What counts as a claim.** Only checkable facts (stats, events, quotes), or also flag opinions as "opinion — not checkable"?
8. **Who sees the right panel.** Both callers see the same split view, or only the person who turned it on?
9. **Test harness.** OK to run automated evals with scripted TTS audio piped into two headless browser panels on localhost, with you two doing live calls only at approval gates?
10. **Name + Supabase.** Keep "claimcheck" as the working name? New Supabase project or an existing one? Should we store transcripts/claims (privacy implications) or keep calls ephemeral for MVP?

## Answers

