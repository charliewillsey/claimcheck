# Scenario 05: Science at dinner

**DRAFT LABELS.** Written by the build agent. Not confirmed by Malcolm or Charlie.

## Script

A: My cousin will not vaccinate her kids. We got into it at dinner on Sunday.
B: Oh no. Why not?
A: She kept saying that [c1] vaccines cause autism.
B: What did you say?
A: I changed the subject. I cannot deal with those fights.
B: Did you at least get good weather up there?
A: No, there was a huge storm. Her tree got hit last summer, so she says she is safe now, because [c2] lightning never strikes the same place twice.
B: That is one way to think about it.
A: Then a bat flew into the garage and everyone lost it.
B: I hate those things. [c3] Bats are completely blind, so they just crash into stuff.
A: After that we drove up to the cabin in the mountains. The pasta took forever to cook up there.
B: Yeah, [c4] water boils at a lower temperature at high altitude.
A: Huh, I never knew why.
B: Did your nephew show you his dinosaur collection?
A: He will not stop talking about it. He told me [c5] humans and dinosaurs lived at the same time.
B: I think dinosaurs are the best part of being a kid.
A: He is doing a school project on genetics now. [c6] Watson and Crick described the double helix structure of DNA in nineteen fifty three.
B: Smart kid.

## Labels

### c1
- claim: Vaccines cause autism.
- verdict: disputed
- source: https://www.who.int/news/item/11-12-2025-statement-gacvs-vaccines-autism
- opened: plain fetch
- evidence: the available high-quality scientific evidence indicates that vaccines, including those with thiomersal or aluminium or both, do not cause autism.

### c2
- claim: Lightning never strikes the same place twice.
- verdict: disputed
- source: https://www.weather.gov/safety/lightning-myths
- opened: plain fetch
- evidence: Fact: Lightning often strikes the same place repeatedly, especially if it's a tall, pointy, isolated object.

### c3
- claim: Bats are completely blind.
- verdict: disputed
- source: https://www.usgs.gov/faqs/are-bats-blind
- opened: plain fetch
- evidence: No, bats are not blind.

### c4
- claim: Water boils at a lower temperature at high altitude.
- verdict: supported
- source: https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/high-altitude-cooking
- opened: plain fetch
- evidence: As atmospheric pressure decreases, water boils at lower temperatures.

### c5
- claim: Humans and dinosaurs lived at the same time.
- verdict: disputed
- source: https://pubs.usgs.gov/gip/dinosaurs/people.html
- opened: plain fetch
- evidence: After the dinosaurs died out, nearly 65 million years passed before people appeared on Earth.

### c6
- claim: Watson and Crick described the double helix structure of DNA in 1953.
- verdict: supported
- source: https://www.britannica.com/science/DNA
- opened: Firecrawl scrape (plain fetch returned 403)
- evidence: In 1953, using experimental data from several researchers, including Franklin and Maurice Wilkins, biochemist James Watson and biophysicist Francis Crick described DNA as two intertwined strands held together by complementary base pairing.
