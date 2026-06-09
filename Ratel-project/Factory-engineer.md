Everyone's building multi-agent systems, but nobody agrees on how. This talk proposes a taxonomy of five frontier multi-agent strategies and shows what happens when you compose them into a single architecture. Drawing from production data at Factory, we walk through a three-role system (orchestrator, workers, validators) that uses validation contracts, structured agent handoffs, and adversarial verification. We cover the case for serial over parallel execution, why model selection per role is a compounding advantage, and how to design systems that get better with each model generation instead of being made obsolete by them.  
  
Speaker info:  
\- https://github.com/lukealvoeiro  
\- https://www.linkedin.com/in/lukealvoeiro  
  
Timestamp:  
0:00 Introduction to multi-agent systems and the bottleneck of human attention  
1:50 Taxonomy of five frontier multi-agent frameworks  
4:04 Introducing 'Missions': The three-role architecture (Orchestrator, Workers, Validators)  
6:34 The importance of validation contracts for consistent quality  
8:09 Maintaining long-term context through structured handoffs  
9:17 The case for serial execution over parallel execution  
10:30 Mission control: Monitoring agent progress  
11:22 Strategic model selection per role ('Droid whispering')  
13:06 Production data analysis: Building a Slack clone  
14:34 Designing systems that improve with each model generation  
15:51 Conclusion: The shifting economics of software engineering

## Transcript

### Introduction to multi-agent systems and the bottleneck of human attention

**0:07** · \[music\] Hi everyone. My name is Luke and my goal is that 20 minutes from now you'll be able to assemble agent teams that can complete tasks orders of magnitude harder than what you can complete with a single agent today.

**0:27** · A little bit about me. So I come from a background in dev tools.

**0:32** · About 2 and 1/2 years ago I started a project at Block which is where I was working at the time. And that project evolved into Goose.

**0:40** · Goose is now one of the leading coding agents is open source and it's recently was was donated to the AI agentic AI Foundation. So it's been really cool to see.

**0:52** · Now nowadays I work at Factory where I lead our core agent harness and Factory's mission is to bring autonomy to the entire software development life cycle.

**1:04** · So I want to start off with a claim.

**1:06** · The bottleneck in software engineering nowadays is not intelligence. It's now limited by human attention.

**1:12** · Even the best engineers can only complete a couple of tasks at a time.

**1:17** · They may have a backlog of 50 features but they can only drive a few forward per day because every task requires their attention. Every commit needs their review.

**1:26** · Today's models are smart enough to figure out all 50 of these tasks but there's not enough uh just bandwidth to supervise their implementation.

**1:36** · So we kept asking ourselves what if a human decides what to build and then a system figures out how to do so. Right?

**1:43** · An agent could just work for hours for days and you come back to finish work.

**1:47** · So that's what I'm here to talk about.

### Taxonomy of five frontier multi-agent frameworks

**1:50** · When you start researching multi-agent frameworks and systems you quickly realize that the field's a bit of a mess. Everyone has their own framework, their own terminology, their own opinions of what works and doesn't work.

**2:02** · And so I want to propose a simple taxonomy. There's five frontier multi-agent frameworks.

**2:07** · One is delegation. Right? This is where one agent spawns another agent and the parent agent may say go figure out the database schema and then gets a response back.

**2:17** · This is the simplest form of multi-agent communication as what most people implement first. You have you know sub agents and coding tools are the most common example.

**2:28** · The other one is creator verifier.

**2:30** · Right? Where one agent builds something and then you have another agent that checks that work.

**2:35** · And the key here is like a separation of concerns. The parent the the agent that implemented the the code is has some cost bias. Right? Wants that code to work.

**2:45** · A fresh agent with fresh context is way more likely to find issues and this is why we do code review as humans as well.

**2:52** · Another one is direct communication.

**2:54** · This is when agents communicate without a central coordinator. Right? It's the kind of like DMing each other.

**3:00** · It's hard to get right though because state fragments across conversations without that coordinator and there's no single source of truth.

**3:09** · The next one is negotiation. Right?

**3:11** · Negotiation is when agents communicate but over a shared resource. So that may be you know they want to use the same API. They want to modify the same portion of the code base.

**3:23** · But negotiation doesn't need to be adversarial. In fact the best use case is when there is net positive sum trading. Right? And that's when agents have like a potential win-win situation while interacting. And then the last one is broadcast and that is when one agent sends information to many.

**3:41** · Think of it like you know status updates, new context that applies to everyone, you shared constraints.

**3:48** · It's a bit less flashy than the other ones but it's critical for maintaining coherence over long-running tasks.

**3:56** · And so when you have all of these different building blocks how do you assemble that into a system that can run for many days?

**4:03** · So missions is our answer. It's a system that combines four of those. Delegation, creator verifier, broadcast and negotiation into a single workflow. You describe a goal.

### Introducing 'Missions': The three-role architecture (Orchestrator, Workers, Validators)

**4:16** · You scope that through a conversation.

**4:18** · You approve a plan and then the system handles execution for hours or days and that enables you to focus on something else.

**4:27** · Notably a mission is not a single agent session. It's an ecosystem of agents that communicate through structured handoffs and shared state.

**4:36** · It uses a three-role architecture.

**4:38** · There's orchestrator, there's workers and then there's validators.

**4:42** · The orchestrator handles planning. When you describe what you want the orchestrator is kind of like your sounding board. Ask you the right strategic questions. It you know checks out if there's any unclear requirements in in the problem space and then it eventually produces a plan that includes features, milestones and then something that's called a validation contract. And that validation contract defines what done sort of means before any coding is done.

**5:09** · And I'll come back to why that matters because it turns out to be really important to the system.

**5:13** · The next role are workers. They handle implementation.

**5:17** · When a feature is assigned to a worker that worker has clean context, no accumulated baggage, no degraded attention. Right? The worker reads its spec. It implements the feature and then commits by Git allowing the next worker to inherit a clean slate and a working code base. And then the last role are validators. They handle verification.

**5:38** · And so most systems validate by maybe running lint, type check, tests. Maybe they do code review.

**5:45** · Missions does all of that but we also validate behavior. Instead of just asking you know does the code look right? We wonder does this work end to end? That's the difference that lets lets missions run for many hours, many days in a row without drifting. And making it work had to involve sort of rethinking validation entirely.

**6:06** · So when you've worked with coding agents before you've probably seen this pattern where an agent builds a feature.

**6:13** · It writes some tests. The tests pass.

**6:15** · There's full coverage.

**6:17** · But the tests were sort of shaped by the code not by what the code was attempting to actually do.

**6:23** · Tests written after implementation don't catch bugs. They confirm decisions. So if you rely on validation like that your system will eventually drift.

### The importance of validation contracts for consistent quality

**6:34** · That's why this validation contract exists. It's written during planning before any code and it defines correctness independently of implementation. So for a complex project this can be hundreds of assertions and each feature is assigned one or more assertions that it must satisfy.

**6:50** · The sum of all features must mean that every assertion is covered.

**6:57** · After each after each milestone of features we have two types of validators that run.

**7:03** · So you have the scrutiny validator and the user testing validator. The first one is more traditional. It runs the test suite, type checking, lints and critically it spawns dedicated code review agents for each completed feature within the milestone.

**7:17** · And then the second one which is the user testing validator is more interesting. It kind of acts like a QA engineer. It spawns the application. It interacts with it through computer use or something similar to that. It fills out forms, you know, checks that pages render correctly, clicks buttons and ensures that functional flows work holistically.

**7:38** · So this step takes significantly longer than the previous one of the scrutiny validator because the the system is interacting with a live application. And what we've noticed is that missions most of the missions wall clock time is actually spent here waiting for this like real world execution to occur instead of generating tokens.

**7:59** · Critically neither validator has seen the code before.

**8:03** · They're not invested in the implementation and so validation is adversarial by design.

### Maintaining long-term context through structured handoffs

**8:09** · Okay. So then validation catches bugs.

**8:11** · Right? But for a system that runs for many days you also need to make sure that context isn't lost between the agents.

**8:19** · When a worker finishes a feature it doesn't just say I'm done.

**8:23** · It fills out a structured handoff detailing what was completed, what was left undone, what commands were run throughout that that agent loop and what were the the exit codes of those commands.

**8:35** · What issues were discovered and did it abide by the procedures that the orchestrator defined for that worker?

**8:43** · That's how we catch issues and how the system self-heals.

**8:47** · The errors get caught at milestone boundaries. Corrective work gets scoped and the mission sort of like pulls itself back on track. Not by hoping that agents remember what happened but by forcing them to write it down and then actually address issues and I'll I'll present on that in just a sec.

**9:06** · Our longest mission ran for 16 days which is much longer than a full sprint and we believe that they can run for 30.

**9:13** · That's only possible because of the structure.

### The case for serial execution over parallel execution

**9:17** · So once we had this architecture the next question became became how do we actually run it? Right?

**9:23** · The most obvious choice is like parallelism. If you have 10 agents running at one point in time then you have 10 times the throughput. But we tried that and it doesn't really work for tasks in the like software dev domain because agents conflict. They step on each other's changes. They duplicate work. They make inconsistent architectural decisions. And so the coordination overhead ends up eating up the speed gains all the while you're burning tokens.

**9:50** · The difference with missions is that we run features serially.

**9:53** · So there's only one worker or validator running at any given point in time.

**9:58** · Within a feature, we allow for parallelization on read-only operations.

**10:03** · So, you have something like searching through the code base or researching APIs, all that gets parallelized. Within validators, we also parallelize read-only operations such as code review.

**10:15** · This is serial execution with with targeted internal parallelization. It seems slower on paper, but the error rate drops dramatically, and when you have tasks that run for many days, this sort of correctness compounds.

**10:29** · Now, your your standard chat interface doesn't really work for something that lasts many days. At a quick glance, you need to be able to be able to see how much of the project have you completed, and what's what amount of the budget that you originally like set off with have you burned through.

### Mission control: Monitoring agent progress

**10:45** · So, using a mission actually, we built mission control, which is a dedicated view for this. You can see what does what is active worker doing right now, uh read off handoff summary is that detail. What did the worker the validator discover, um how it's going to sort of like alter its course moving forward.

**11:03** · Or, you could just, you know, go check out, um go hang out with your friends that night. This entire view lets you just run missions asynchronously, and you could be plugged in as a project manager overseeing implementation, or you could just, you know, go and and uh hang out with your friends.

### Strategic model selection per role ('Droid whispering')

**11:22** · Okay. So, the right model in each role.

**11:24** · Um everything here sort of assumes one thing, and that is that you're using the right model in each role. Planning benefits from slow, careful reasoning, implementation from fast code fluency and creativity, validation benefits from uh precise instruction following, right?

**11:42** · And so, no single model nor model provider is best at all three of these.

**11:47** · Using systems like missions requires the development of a new skill, which internally we've been calling droid whispering, but it's this idea that you need to be able to mentally model how different LLMs interact, where they fail, how those failures compound over a multi-day run, and then you need to make a deliberate choice as to which model sits in which seat.

**12:06** · Theo, the engineer who built our missions prototype, came up with our our model defaults, but we really encourage people to make these uh their own and customize them to the needs of their project.

**12:17** · So, for example, validation might use a different model provider entirely to make sure that it's not biased by the same training data.

**12:24** · This is a structural advantage of a model-agnostic architecture.

**12:28** · You're only as strong as your weakest link. And if you're locked into one model provider, then you're constrained by that family's weakest capability.

**12:36** · As models continue to specialize, the ability to put the right model in the right seat becomes a compounding advantage.

**12:44** · It works in the other direction, too. If you're using missions, the structure of that can compensate for models that are not quite at like the frontier level performance. So, the validation contracts, the milestone checkpoints, they allow you to run missions very very successfully even using open-weight models.

**13:04** · Now, this all sounds quite theoretical.

### Production data analysis: Building a Slack clone

**13:06** · What does it actually look like in production?

**13:08** · I've got an example of building a clone of Slack right here. This slide has a ton of info, but I'll walk you through just a few things that I want to call out.

**13:16** · 60% of our time is spent on implementation, and 60% of our tokens as well.

**13:23** · Notice how validation never succeeds on the first go. That's in the mission What's it?

**13:29** · The one on the bottom left. Um we almost always have to create follow-up features. So, it really demonstrates like the value of a system that does this QA loop.

**13:38** · You end up with with 50% of your lines of code at the very end, in the bottom right, being tests, and 90% of your uh code is covered by those tests.

**13:49** · And lastly, we take advantage of prompt caching heavily to make sure that we're sort of offsetting um the the price of running such a long task.

**14:00** · People have really taken to missions, and it's been awesome to see what folks have been building with them. Um some examples I've included in this slide, but ones that I want to call out are specifically in the enterprise setting, which is where Factory really shines. Um they've been used to prototype new ideas and features overnight, to um make sure that people can uh build internal tools at increasingly rapid rates, to run huge refactors and migrations, for ML search uh research, sorry, and to modernize uh codebases so that agents are more productive in them.

**14:33** · Um one thing that I wanted to talk about was also this concept of like the bitter lesson, because every person building multi-agent systems has this fear of the next model release sort of like making their their architecture obsolete overnight.

### Designing systems that improve with each model generation

**14:48** · Um so, when we were building missions, we decided we had to make this system get better with every model improvement.

**14:56** · This means that almost all of the orchestration logic is defined in prompts and skills, um instead of like a hard-coded state machine.

**15:04** · How it decomposes failures and um or decomposes features and handles failures is all in about like 700 lines of text, and four sentences of this can alter the execution strategy pretty dramatically.

**15:17** · Worker behavior is driven by skills that the orchestrator defines per mission, so you get very customized behavior, and the only deterministic logic is very thin, and it's focused on enabling models to do what they do best while the system handles like the bookkeeping, right? Stuff like running validation and ensuring that progress is blocked when there are some handoff issues that are not addressed.

**15:39** · So, missions sort of ensure the the discipline, and the models provide the intelligence uh using primitives that they're already familiar with, like agents.md, skills, etc.

### Conclusion: The shifting economics of software engineering

**15:51** · So, what does this unlock?

**15:53** · Remember the bottleneck that I started off with? Human attention.

**15:56** · The economics are sort of changing.

**15:58** · Before, a team of five engineers might be able to uh work on 10 work streams at any given point in time.

**16:04** · Now, maybe with missions, we can bring that up to 30.

**16:07** · The team can focus on interesting problems such as uh the architecture, product decisions, um instead of uh worrying about the execution per se.

**16:17** · And the important thing is the codebase ends up cleaner than when you started.

**16:22** · The end-to-end tests, the unit tests, the skills, the structure that missions provide uh means that agents and humans are more productive in that environment moving forward.

**16:33** · So, now that you understand how missions are structured and how they actually work, you can see that they're really a composition of those original um strategies, right? Delegation shows up everywhere in how the orchestrator spawns workers and how we spawn research sub-agents. Creator-verifier is fundamental in that validation and implementation are always separate agents with separate context.

**16:53** · Broadcast runs through the shared mission state that every agent references, and negotiation shows up at milestone boundaries, where the orchestrator defines, you know, does this does this handoff summary sort of like look correct? Do we need to create follow-up features, rescope, etc.

**17:11** · But strategies aren't enough. You need the connective tissue. You need uh these structured handoffs so that agents don't lose context, you need the right model in each role, and you need an architecture that will improve with each model improvement.

**17:24** · So, what I like to think about is that people in this room who are thinking in terms of agent ecosystems, who develop an intuition for how different models compose under pressure, um that those folks are going to be really shipping the next generation of innovation.

**17:38** · Uh there's a lot of open questions still, right? Um how do we further parallelize the workload of missions so that they run faster? How do we start orchestrating missions themselves into even more complex workflows?

**17:50** · Uh but the data from production missions is clear. This works on real projects at scale today.

**17:56** · So, this is what I'll leave you with. Open Droid, try running /missions, argue with the orchestrator about the scope, approve the plan, and then go do something else.

**18:08** · I'm excited to see what you guys build, and I'll be around to answer any questions uh for the rest of the day.

**18:13** · Thanks.
