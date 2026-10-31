# Scenario 04: Money and government

**DRAFT LABELS.** Written by the build agent. Not confirmed by Malcolm or Charlie.

## Script

A: I saw a job posting yesterday that made me so mad.
B: What was wrong with it?
A: The pay was awful. It barely beat the legal minimum.
B: That is rough. [c1] The federal minimum wage is still only seven dollars and twenty five cents an hour.
A: I think that should be way higher, honestly.
B: Same. Everything feels so expensive right now.
A: That is why I want to move somewhere with more space. Maybe Texas. [c2] It is the largest state in the country by area.
B: I would stay right here in California. [c3] California has more people than any other state.
A: And all of them are on the freeway at the same time.
B: Ha. Honestly, taxes bother me more than traffic.
A: Blame the Constitution. [c4] The Sixteenth Amendment, ratified in nineteen thirteen, is what lets Congress collect a federal income tax.
B: And I will be paying into Social Security for the next forty years.
A: [c5] Franklin Roosevelt signed Social Security into law in nineteen thirty five.
B: That feels like a different planet. The whole world looks different now. [c6] China still has more people than any other country.
A: Hmm, I would want to double check that one.
B: You always say that.

## Labels

### c1
- claim: The federal minimum wage is $7.25 an hour.
- verdict: supported
- source: https://www.dol.gov/agencies/whd/minimum-wage
- opened: plain fetch
- evidence: The federal minimum wage is $7.25 per hour effective July 24, 2009.

### c2
- claim: Texas is the largest state in the United States by area.
- verdict: disputed
- source: https://www.britannica.com/topic/largest-U-S-state-by-area
- opened: Firecrawl scrape (plain fetch not attempted; Britannica returned 403 on every plain fetch)
- evidence: one is by far the biggest: Alaska. At 665,384 square miles (1,723,337 square km), it is more than double the size of the second largest state, Texas

### c3
- claim: California has more people than any other U.S. state.
- verdict: supported
- source: https://www.britannica.com/place/California-state
- opened: Firecrawl scrape (plain fetch not attempted; Britannica returned 403 on every plain fetch)
- evidence: by the early 1960s it was the most populous U.S. state

### c4
- claim: The Sixteenth Amendment, ratified in 1913, lets Congress collect a federal income tax.
- verdict: supported
- source: https://www.archives.gov/milestone-documents/16th-amendment
- opened: plain fetch
- evidence: Passed by Congress on July 2, 1909, and ratified February 3, 1913, the 16th amendment established Congress's right to impose a Federal income tax.

### c5
- claim: Franklin Roosevelt signed Social Security into law in 1935.
- verdict: supported
- source: https://www.archives.gov/milestone-documents/social-security-act
- opened: plain fetch
- evidence: Eventually a compromise bill passed both houses, and on August 15, 1935, President Roosevelt signed the Social Security Act into law.

### c6
- claim: China has more people than any other country.
- verdict: disputed
- source: https://www.britannica.com/place/India/Demographic-trends
- opened: Firecrawl scrape (plain fetch not attempted; Britannica returned 403 on every plain fetch)
- evidence: According to population estimates by the United Nations, India surpassed China in 2023 to become the most populous country in the world.
