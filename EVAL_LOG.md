# EVAL LOG

Provisional: every score here is measured against DRAFT LABELS the build agent wrote. Neither founder has confirmed them.

A run counts toward the gate only if the whole run and every one of the 5 scenarios reach 75%. Per-claim detail for each run is in `eval/results/`.

| Run | Date | Scenarios | Agreement | Sources OK | Median seconds, claim to first source | What changed | What failed |
|-----|------|-----------|-----------|------------|---------------------------------------|--------------|-------------|
| 1 | 2026-10-31 05:29 | 01 4/6, 02 4/9, 03 5/12, 04 4/11, 05 5/8 | 47.8% FAIL | 22/29 | 5.1s | Baseline: first full run | 01 c3 source_does_not_support; 01 false positive; 02 c4 source_does_not_support; 02 false positive; 02 false positive; 02 false positive; 02 false positive; 03 c4 missed; 03 c5 source_does_not_support; 03 false positive; 03 false positive; 03 false positive; 03 false positive; 03 false positive; 04 c4 missed; 04 c6 quote_not_on_page; 04 false positive; 04 false positive; 04 false positive; 04 false positive; 04 false positive; 05 c6 source_does_not_support; 05 false positive; 05 false positive |
| 2 | 2026-10-31 05:44 | 01 4/6, 02 5/5, 03 6/7, 04 6/6, 05 5/6 | 86.7% FAIL | 26/29 | 4.9s | Stricter detection on Sonnet; quotes are whole sentences that stand alone, taken from the page | 01 c3 source_does_not_support; 01 false positive; 03 c5 source_does_not_support; 05 c5 wrong_verdict |
| 3 | 2026-10-31 05:53 | 01 4/6, 02 4/5, 03 5/7, 04 6/6, 05 5/6 | 80% FAIL | 24/29 | 4.0s | Second look before unverified; quotes state the fact head-on and name the body for attribution claims; enough-or-too-much judgments are opinions | 01 c3 source_does_not_support; 01 false positive; 02 c2 source_does_not_support; 03 c4 source_does_not_support; 03 c5 source_does_not_support; 05 c5 source_does_not_support |
| 4 | 2026-10-31 06:04 | 01 5/5, 02 5/5, 03 6/7, 04 6/6, 05 5/6 | 93.1% PASS | 27/29 | 4.1s | Separate skeptical check picks a quote that settles the claim alone, or rejects them all; six pages read per claim | 03 c5 source_does_not_support; 05 c5 wrong_verdict |
