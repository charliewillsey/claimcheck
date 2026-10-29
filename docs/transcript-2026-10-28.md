# Call transcript — Charlie Willsey ("You") + Malcolm Mahaney ("Participant")

Recorded 2026-10-28. Verbatim, unedited. This is the source of truth for intent; PROMPT.md is derived from it.

---

You
Yeah, but but 

Participant
Okay, oh yeah, 

You
that 

Participant
so. 

You
also, um, this will, you can get the transcript from this. 

Participant
Yeah, that show, we can have a restructure. Yeah, you go first. Do you do your brain jump? I do my brain jump, and then we can 

You
Okay, 

Participant
just iterate. 

You
it's actually something that I have like sort of like thought of adjacently, like more of like, I was thinking of like a news feed application, but, um, My, my thoughts, I want to be specific with through lines. A huge issue for friends when they're talking is wondering if the other is capping. Because When you're making a point and you're argues with somebody and you're wanting to move fast, It's frustrating when you have to kind of tip your hat to a buddy who made a really good point. But you're not sure if the tools in his rhetoric were unethical or untrue or unfactual tools. So, therefore, it makes the entire conversation and like they, basically like the, the, the mutual outcome of the conversation is, is diminished or dampened because you're kind of in the back of your mind questioning, hmm, like, I don't know if he was really like making, like, really actually if actually sound points. So could we have a system where it's even adopted by Apple or it could be like in a coat that's an overlap, kind of you just, you turn it on kind of like a VPN while you're on a call, just like, you know, pressing call record, and instead of like watching FaceTime, you know, you're holding your phone talking, you have like on, like, you know, the screen is split down the middle on the left side is the act of transcription. Um, Kind of like, you know, Apple Music lyrics style. And then on the right side, you know, actively pulling up, uh, you know, uh, reputable sites and cross referencing, um, things that you're saying. I think this would help people be slower to, uh, say things, um, because, uh, if we're all being honest. Um, I think that we, All too often make points about things that we are pretty sure we read. Um, but we don't have access to that article. Um, and if we do, um, Well, it's just, if we did, it would be nice to be able to pull that crap up. So maybe another application of this is like people could also have like the user app interface where they have their, let's call this company Malcolm and Charlie's app. They go into their Malcolm and Charlie's app, and there, they're able to dump their articles, dump their sources of rhetoric that they accumulate over time. It's like, it could have an Instagram connector. It could have a TikTok connector. It basically, it could just be when you, you know, click share video or share whatever, you can share it to this app. It's stored in there. And then, like, that way you can start building almost like, and hopefully this wouldn't turn into like people building their own ideologies and we'd have to be careful that that would not be like a bad use case for this app. But it would just kind of be like, yeah, you can pull. Hopefully there would be some type of like really like complex index matching machine that, you know, in real time would match your words and then hopefully do some like, um, obviously we'd have to use like a type of uh, predicted, like a predictability index, like a predictable, like a predicting AI, an AI that's like predicting based off of like machine learning, like, you know, the the trends of your language and like, oh, it seems like Charlie's about to say something here that's, you know, he's most likely going to be referring to this article, so I'm going to preemptively bring it up, and it could be like kind of, we could have like a section, like a, we could code 

Participant
Yeah. 

You
this layer where it's like in a queue, and then there's a 2nd like index matching 

Participant
Sorry, sorry, 

You
validation 

Participant
sorry, keep, keep 

You
where 

Participant
it. 

You
it lets it go into like actually where it's brought up. So it's like, What? 

Participant
Yeah, keep it 

You
Okay. 

Participant
MVP. Keep an MVP. Yeah, yeah. So yeah, I'm just gonna come in with it, come with the technical sides here, so yeah, um, agent, quick note, uh, that is that that your job is to build this and ask us a preliminary questions all at once, ask all your questions at once, up to 10 for us to answer, to give you additional feedback on what it is we want you to make. Here's your testing loop. You are going to one use, for this purpose, you don't use any audio tools other than just web, to web, um, call panels, you're gonna have, uh, you're gonna have a, if you have 2, Okay. This here's what we're gonna do. So you're going to Fuck, what's the best way? Yeah, you're going, you're gonna call, you're gonna create a site, and then it's Versell linked up to this, by the way, Charlie, quick 

You
Sure. 

Participant
question. Yeah, so Brazil is linked up. You're gonna create, uh, you're gonna create. 

You
Yeah, ever sells super base, uh, GitHub. And yeah, I mean, I mean, we could add in anything. My software suite is pretty versatile, so. 

Participant
His 

You
It's 

Participant
create 

You
a local 

Participant
the 

You
hook. 

Participant
local host and it's going to be web to web audio, audio conversation. And then the key thing here is that you're going to train it through a few different scenarios. we're going to give you after this. You can include that as one of your questions, but you have to call and see that the model provides the necessary facts for it, and that it passes an eval loop, uh, by me and Charlie, uh, say 3 to, we'll go 3 to 5 times, and then we can just train you off that. We're going to give you 3 to 5 show. 3 to 5 good examples to train it off of. And we can start with that. And then, um, from there, yeah, you just gotta, you're gonna, we're gonna give you that eval and then you got to hit the numbers. Um, what's that, what's that evaluation metric when we give it to you? Uh, say like, like, uh, get to like 90%, 90% eventually. Like that's going to be the threshold that we're going to do. Can you get 75% agreement of what me and Charlie would think is good and bad. Once you can do, once you can do that, once you can figure out good and bad, then we're gonna go and off those, off those 3 to 5 examples, once we can, once you can hit those metrics 3 to 5 times and making like the proper sources, et cetera. That's what it's going to be. You can ask a clarifying question about that. Then we're going to go scale it up a little bit. But yeah, in terms of design, minimalist, just make sure, one, that the audio path is tested, don't stop building until it's tested, approved and ran, and 2, that, um, you get that, you don't stop uh, iterating your recall method until you're able to hit that 70, let's say call it 75% uh, eval criteria. That's all that's all for me. 

You
Okay, that's pretty good. Um, I would, I wouldn't have any follow-up to that. Besides, um, Execute to completion. Uh, keep the human in the loop. Um. 

Participant
Use/gold by way, have you/gold 

You
Have 

Participant
before? 

You
I know? 

Participant
So/gold means that Claude will continuously reprompt himself until the goal is met, so it will run for 48 hours straight until that goal is met. It's a command. It's like a skill slash goal skill. That means don't stop until this criteria is 

You
Yeah. 

Participant
bad. I gave it clear success criteria. won't stop until it's built. I gave the 2 design criteria. If you want to give any objective metrics as to hit, it literally won't stop until it hits it. 

You
Um, and then, I, I, I think that if, do, do you want to like give it like a through line to like, point back towards so that it doesn't start like, you don't, we don't want it to have it like, we don't want it to start having like context, degradation, like, I don't want it to like, if it is going to slash goal, and continue to like reiterate. Like, I don't want it to start degenerate the scope of things. So should we give it like through lines to where, if it is iterating like, if it's like the 5th turn and it's like 24 hours in and it's 

Participant
Yeah, 

You
just like still 

Participant
yeah. 

You
is no, like we, it needs to, 

Participant
No 

You
it 

Participant
charge. 

You
needs to like simplify. 

Participant
Yeah, I got you, got you. It's, it's got you. So if you want, what you should do is what I call watchdog agent. Have it launch a 2nd terminal agent, which is in a, which is in a separate window. It's not a subagent, it's an independent agent, it's running in its own runtime, and in its job every 10, 15 minutes, is to watch the model and make sure it hasn't deviated from its initial prompt. Every 10 to 15 minutes and it, and it will, it can compact it if necessary at that watchdog. Just make sure it runs on a separate terminal. 

You
So, okay. Yeah, yeah, that's that's that, I like that. I like that name. That's funny. I like it. 

Participant
Yeah, I love dude, watch trust me. Watchdogs were one of the best, like, slash goal was probably the best vibe coding, like, tactic I learned, but watchdogs up there, bro. Like, watch dogs are so clutch. They just prevent the model from fucking up, bro. 

You
Yeah, 

Participant
Like, 

You
okay, well, um, I'm gonna stop recording. 