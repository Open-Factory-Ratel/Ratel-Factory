By Theo Luan - April 10, 2026 - 5 minute read -

Share

Engineering

Research

The architecture behind Missions: why agent context shapes every design decision, how separation of concerns and test-driven development at two levels produce reliable multi-day autonomous work, and how the system actually runs.

Agent sessions work well for focused tasks, but most real projects are too broad and complex for a single context window to hold. A single agent eventually runs into a problem: the more it sees, the less focused and reliable it becomes.

Missions is our system for solving that. It breaks large work into focused units handled by fresh agents with narrowly scoped goals, shared state, and explicit validation.

##   
Rationale

Most of the architecture follows from one core observation: **agents are highly reactive to their context.**

1. An agent's trajectory is append-only, so the model's reasoning at any given point is a function of every past thought, observation, and action.
2. Models seek coherence: they integrate what's in their context into a unified worldview and reason forward from it.
3. Therefore, they perform best when every previous step in the trajectory urges them toward the next optimal step.
4. When the context window accumulates information that is irrelevant to - or actively working against - the current goal, performance suffers.

Two failure modes follow from this:

- **Irrelevant context accumulates.** An unfocused or overly broad task means the agent's context grows with information that isn't relevant to what it's doing right now. The broader the scope, the less of the context is pulling the agent toward its next optimal step.
- **Adversarial context accumulates.** An agent that implemented something is worse at objectively evaluating its own work than a fresh, unbiased reviewer. Its prior reasoning creates a bias toward confirming what it already did.
  
  ### Implications

It's not enough to simply split up work. Each agent's goal must be focused, and its trajectory directionally consistent. In every run, we must avoid accumulating context that is:

- not useful to the agent's current task
- not aligned with the agent's incentive, or our ideal outcome for its run
  
  ##   
Design Principles

### Separation of concerns and incentives

Each role has a single goal, and the system is structured so that nothing in an agent's trajectory pulls it away from that goal.

- **The orchestrator** plans and decomposes an approach to the user's goal, and steers execution to completion, passing all validation gates. It avoids accumulating overly granular context, delegating all investigation and implementation to subagents and workers. It doesn't drive validation directly - the system injects validators at milestones to surface gaps.
- **Workers** complete well-specified features with clear success criteria. They iterate until they believe the work is correct, then hand it off. But the final judgment on correctness is not their call. An independent validator decides that.
- **Validators** evaluate completed work for correctness and completeness, surfacing bugs and gaps. They don't implement fixes - they surface issues to the orchestrator, which creates fix features that future workers implement.

### Test-driven development at two levels

The same principle operates at two scales.

- Each worker writes tests before code, so the tests reflect intended behavior rather than implementation details.
- At the mission level, the orchestrator defines correctness first - creating a validation contract, a set of behavioral assertions that define success, before defining any features.

This ordering matters. When creating the validation contract, the orchestrator draws from its understanding of requirements. If it had created the features first, the contract would be influenced by the implementation it had already planned.

These assertions are later verified by fresh agents that exercise the system as a black box - using it the way a real user would - rather than inspecting the code that implements them.

### Externalized state

No single agent needs to hold the complete picture in its context at once. The full state is distributed across shared artifacts: the validation contract, the feature list, research notes, operational guidelines, and an evolving knowledge base.

Each agent reads what's relevant to its current job. Even the orchestrator delegates deep investigation to subagents to avoid consuming every detail itself.

### Model specialization

Different models have different strengths - reasoning, discipline, creativity, thoroughness, speed, cost. No single model is best at everything.

Once roles are cleanly separated, model choice becomes local to each role: broad planning and judgment for the orchestrator, reliable execution and cost efficiency for workers, thoroughness and skepticism for validators.

## The System

With those principles in mind, here's how a mission actually runs.

A user describes what they want built. The orchestrator investigates and asks clarifying questions until the requirements are unambiguous.

Then it writes the validation contract - a finite checklist of testable behavioral assertions that define completion and correctness for the mission.

From there, it decomposes the work into features, where each feature is a bounded piece of implementation that claims which assertions it will fulfill. Features are grouped into milestones, each of which encompasses a logical unit of functionality.

Finally, it creates shared state files - boundaries and procedures for its workers that enforce optimal structure and behavior, as well as a library that will accumulate knowledge over the mission's duration.

validation-contract.mdfeatures.jsonservices.yamlAGENTS.md

```
### VAL-AUTH-001: Successful loginA user with valid credentials submits the login formand is redirected to the dashboard.Tool: agent-browserEvidence: screenshot, network(POST /api/auth/login -> 200) ### VAL-CROSS-001: Auth gates pricingA guest user sees "Sign in for pricing" on the catalog.After logging in, real prices are shown.Tool: agent-browserEvidence: screenshot(guest-view), screenshot(authed-view)...
```

A programmatic runner takes the feature list and spawns a worker for each feature in order. Each worker starts with a fresh context, receives its feature spec, writes tests first, then implements.

Once all features within a milestone are complete, the runner triggers validation using fresh agents.

- Scrutiny validators review each worker's implementation and trajectory for quality and correctness, and encode relevant knowledge updates into shared state.
- User-testing validators exercise the system as a black box - using it the way a real user would - and verify behavior against the validation contract.

After validation, the orchestrator reviews what workers and validators flagged. It creates fix features targeted at actionable gaps, which get executed before the milestone re-validates. This loop repeats until milestone validation passes.

If implementation or validation is blocked, the orchestrator halts the mission and hands control back to the user.

## Breaking down a real mission

A single mission produced a Slack clone - workspace auth, channels and threads, real-time messaging with reactions and mentions, file uploads, search, and presence and notifications.

Time

Total runtime — 16.5 h

Orchestration0.38 h · 2.3%

Implementation9.98 h · 60.5%

Validation6.14 h · 37.2%

Milestone waterfallimplval

0h2h4h6h8h10h12h14h16h

Foundation

Channels & messaging

Conversations

Interactions

Rich features

Real-time polish

Agent Runs

185 total runs

subagents

3

6

9

12

0h2h4h6h8h10h12h14h16h

Orchestration1 · 12 subagentsWorkers63Validators27 · 82 subagents

Tokens

778.5M total tokens

By type

Input30.3MCache read744.9MOutput3.4M

By role

Orchestration29.2MImplementation485.5MValidation263.8M

Code

38.8k lines — 52.5% tests

Code split

Source18.5k linesTests20.4k lines

Statement coverage

Covered89.25%Uncovered10.75%

This mission progressed through a consistent implementation-validation cadence across six milestones, with validation accounting for 37.2% of total runtime.

It generated 38.8k lines of code (52.5% of those lines tests) with 89.25% statement coverage.

Reliability Loop

Cumulative milestone passes by validation round

Round 10/6 milestones passed

Round 21/6 milestones passed

Round 32/6 milestones passed

Round 46/6 milestones passed

Passes are recorded on the final round of each milestone.

Fix feature ratio

21 fix features / 61 implementation features (34.4%)

Original40 featuresFix21 features

Issues surfaced by validators

81 total issues

Blocking65 issuesNon-blocking11 issuesSuggestion5 issues

Median trajectory length

Implementation51 turns · p90 123

Validation30 turns · p90 37

Every milestone converged in 2-4 validation rounds. That produced a steady correction loop: validators surfaced 81 issues, and the orchestrator generated 21 targeted fix features (34.4% of implementation work) to close them.

Trajectories also stayed bounded throughout execution, with median run lengths of 51 assistant turns for implementation and 30 for validation.

## Looking ahead

Missions is our first version of a system that closes the software development loop.

As models get better at reasoning, planning, execution, and computer use, each improvement compounds through the architecture: better planners produce tighter specs, better workers make fewer mistakes, and better validators can judge correctness more reliably across a wider range of surfaces. As models get faster and cheaper, the loop gets tighter - more validation rounds become practical. More ambitious missions become viable for more teams and codebases.

Missions is available today. Run `/missions` in any Droid session to start one.
