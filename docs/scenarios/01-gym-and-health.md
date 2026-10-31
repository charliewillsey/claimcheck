# Scenario 01: Gym and health

**DRAFT LABELS.** Written by the build agent. Not confirmed by Malcolm or Charlie.

## Script

A: Hey, did you make it to the gym this morning?
B: Yeah, I went early. My hands are killing me though.
A: You have to stop doing that thing with your fingers. [c1] Cracking your knuckles gives you arthritis.
B: You are capping. I feel like I have heard that my whole life.
A: Whatever. You look exhausted, by the way. How much are you sleeping?
B: Maybe five hours a night. I honestly think that's plenty.
A: No way. [c2] The CDC says adults need at least seven hours of sleep a night.
B: Fine. I will try going to bed earlier next week.
A: Are you still doing those long lifting sessions?
B: Yeah, lifting is way more fun than cardio. But [c3] the World Health Organization says adults should get at least one hundred fifty minutes of moderate exercise every week, so I do my walks too.
A: Good for you. I got sick last month, and my doctor would not give me anything.
B: What did you have?
A: The flu. I wanted something for it, but the doctor said no.
B: Yeah, [c4] antibiotics don't work on viruses like the flu.
A: That is so annoying. I hate going to the doctor.
B: Did you get a flu shot this year?
A: Never. [c5] The flu shot can give you the flu, so I skip it.
B: Are you serious? We are going to argue about this the whole way home.

## Labels

### c1
- claim: Cracking your knuckles causes arthritis.
- verdict: disputed
- source: https://www.health.harvard.edu/pain/does-cracking-knuckles-cause-arthritis
- opened: plain fetch
- evidence: Cracking your knuckles may aggravate the people around you, but it probably won't raise your risk for arthritis.

### c2
- claim: The CDC says adults need at least seven hours of sleep a night.
- verdict: supported
- source: https://www.cdc.gov/sleep/about/index.html
- opened: plain fetch
- evidence: Adult 18–60 years 7 or more hours

### c3
- claim: The World Health Organization recommends that adults get at least 150 minutes of moderate exercise per week.
- verdict: supported
- source: https://www.who.int/news-room/fact-sheets/detail/physical-activity
- opened: plain fetch
- evidence: the global recommendations of at least 150 minutes of moderate-intensity physical activity per week

### c4
- claim: Antibiotics do not work on viruses such as the flu.
- verdict: supported
- source: https://www.cdc.gov/antibiotic-use/about/index.html
- opened: plain fetch
- evidence: Antibiotics DO NOT work on viruses.

### c5
- claim: The flu shot can give you the flu.
- verdict: disputed
- source: https://www.cdc.gov/flu/prevention/misconceptions.html
- opened: plain fetch
- evidence: Flu vaccines cannot cause flu illness.
