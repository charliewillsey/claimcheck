# EVAL LOG

Provisional: every score here is measured against DRAFT LABELS the build agent wrote. Neither founder has confirmed them.

A run counts toward the gate only if the whole run and every one of the 5 scenarios reach 75%. Per-claim detail for each run is in `eval/results/`.

| Run | Date | Scenarios | Agreement | Sources OK | Median seconds, claim to first source | What changed | What failed |
|-----|------|-----------|-----------|------------|---------------------------------------|--------------|-------------|
| 1 | 2026-10-31 05:29 | 01 4/6, 02 4/9, 03 5/12, 04 4/11, 05 5/8 | 47.8% FAIL | 22/29 | 5.1s | Baseline: first full run | 01 c3 source_does_not_support; 01 false positive; 02 c4 source_does_not_support; 02 false positive; 02 false positive; 02 false positive; 02 false positive; 03 c4 missed; 03 c5 source_does_not_support; 03 false positive; 03 false positive; 03 false positive; 03 false positive; 03 false positive; 04 c4 missed; 04 c6 quote_not_on_page; 04 false positive; 04 false positive; 04 false positive; 04 false positive; 04 false positive; 05 c6 source_does_not_support; 05 false positive; 05 false positive |
