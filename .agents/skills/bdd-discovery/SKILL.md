---
name: bdd-discovery
description: Use this skill whenever an AI agent is acting as the orchestrator of a multi-agent software factory and needs to scope, decompose, or plan a feature/mission before any code is written. Triggers on requests like "scope this feature", "break this into user stories", "run a discovery workshop", "plan the mission", "what should we build first", or whenever the user describes a desired product behavior and the orchestrator must turn that into well-formed user stories, acceptance criteria, and a feature list. This skill teaches the agent to apply BDD discovery practices — Card/Conversation/Confirmation (Ron Jeffries), example mapping, OOPSI, and feature mapping — so the validation contract handed to the contract agent is grounded in concrete examples rather than vague requirements. Make sure to use this skill before generating a validation contract or handing work to a contract/gherkin agent.
---

# BDD Discovery for Orchestrators

This skill is the **planning half** of Behaviour-Driven Development for a multi-agent software factory. It is used by the **orchestrator** role to turn a fuzzy product goal into a clear set of user stories, rules, examples, and acceptance criteria that downstream agents (contract agent, workers, validators) can act on without re-deriving the intent.

The contract of this skill is simple: by the time the orchestrator finishes a discovery pass, every story has a card, a confirmed conversation summary, and at least one concrete confirmation example. Anything less is a hand-off leak — the contract agent will have to guess.

## Why this skill exists

In a software factory (see Factory's "Missions" pattern, Cognition's multi-agent posts, and Ron Jeffries' XP writings), the orchestrator's job is **not** to write code. It is to:

1. Have the right conversation with the human/product owner at the right time.
2. Produce a specification whose correctness is defined *independently of any implementation*.
3. Decompose that spec into bounded features workers can ship serially.

If the orchestrator skips discovery and jumps straight to "build a login page", the workers produce something the validators will fail and the contract agent cannot check. BDD discovery is what makes multi-day autonomous work possible — the validation contract the orchestrator writes here is the only thing holding the system together across a 16-hour run.

## The three C's: Card, Conversation, Confirmation

Every user story the orchestrator produces must satisfy all three. If any one is missing, the story is not ready for the contract agent.

- **Card** — A short, written token (a line in `features.json`) that names the story. It does not contain the requirement. It identifies it.
- **Conversation** — A captured summary of the exchange between orchestrator and stakeholder that produced the story. The orchestrator should ask strategic questions until requirements are unambiguous. Write the answers down so the contract agent doesn't have to ask them again.
- **Confirmation** — At least one concrete example (preferably executable) that proves the story is done. This is the seed for a Gherkin scenario. Without it, "done" is a matter of opinion.

**Why all three?** Because documentation and tests are side effects. The real goal is shared understanding. The card is cheap, the conversation is rich, and the confirmation is what makes the conversation trustworthy.

## The orchestrator's discovery loop

When the user describes a desired system (or when a new feature is proposed mid-mission), run this loop in order. Do not skip steps. Do not run them in parallel — each step depends on the prior one's output.

### Step 1 — Card: write the user story

Use the canonical format. Always include the `<actor>`, the `<feature>`, and the `<benefit>`. If any field is missing, ask the human.

```markdown
As an <actor>
I want a <feature>
So that <benefit>
```

**Example:**
```markdown
As a mobile bank customer
I want to see my account balance on the accounts page
So that I can make better-informed decisions about my spending
```

A good story is small enough to deliver in a single feature (3–5 Gherkin steps), testable, and demonstrable. If a story is too big, break it down. If it's too small, fold it into a neighbor.

### Step 2 — Conversation: ask the strategic questions

Run a discovery workshop. The Three Amigos should be present (or represented): product owner, developer, tester. In a single-agent orchestrator, you are all three — be explicit about which hat you're wearing in each question.

Useful prompts to ask the human (or to answer yourself if you're scoping autonomously):

- What does the user see when this works? What do they see when it doesn't?
- What's the smallest version that's still useful? What's the version we're *not* building yet?
- Are there rules the system must always obey (invariants)?
- What edge cases have we seen in similar systems?
- What does "done" look like — observably — to a real user?

Keep the workshop to **25–30 minutes per story**. If you go over, the story is too big — break it down or park it for more research.

**Three useful workshop techniques:**

- **Example Mapping** — Use a rule (one summary of an acceptance criterion) per yellow card, and a green example card per concrete case that proves or breaks the rule. Blue cards are new questions. Red cards are story splits.
- **OOPSI Mapping** — Map Outcomes → Outputs → Processes → Scenarios → Inputs. Use this when the user is describing a workflow rather than a single feature.
- **Feature Mapping** — Pick a story, identify actors, break the story into tasks, map each task to a concrete example.

Pick one. Don't mix them. The point is shared understanding, not the format.

### Step 3 — Confirmation: extract the examples

For each rule that emerged from the conversation, write at least one **concrete example**. Examples should be:

- **Concrete, not abstract.** Use real names, real amounts, real dates. "Joe has a balance of £42" beats "the user has a non-zero balance".
- **Free of implementation detail.** "Imagine it's 1922." No mentions of HTTP, REST, JSON, React, or databases in the example itself. Those belong in the step definitions the contract/worker agents will write later.
- **Observable from outside the system.** A change in the database is not an outcome. A page rendering, a message arriving, a button being disabled — those are.

Each example becomes a Gherkin `Scenario` in the validation contract. The orchestrator writes the example in plain English here; the contract agent (gherkin-contract skill) translates it to strict Gherkin syntax.

### Step 4 — Hand off to the contract agent

The orchestrator's job ends when it has produced:

1. A list of user stories, each with card + conversation summary + at least one example.
2. A list of business rules (invariants) extracted from the conversation.
3. A list of explicit non-goals (so the contract agent doesn't gold-plate).

Hand these to the contract agent. The contract agent will:

- Translate each example into a Gherkin `Scenario`.
- Group scenarios into `Feature` blocks.
- Group `Feature` blocks into milestones.
- Produce the `validation-contract.md` file workers and validators will check against.

The orchestrator does **not** write Gherkin itself unless explicitly asked. The orchestrator writes in the problem domain. The contract agent writes in the specification language.

## When to call a discovery workshop mid-mission

Discovery is not a one-time event at the start of a mission. Call a new mini-workshop whenever:

- A worker surfaces a gap ("this acceptance criterion is ambiguous").
- A validator flags a behavior the contract didn't cover.
- The user adds a new requirement mid-mission.
- A fix feature requires re-scoping.

In all of these cases, the orchestrator's job is the same: card, conversation, confirmation. Do not let workers or validators rewrite the contract — they don't have the context, and they have implementation bias. Bring the gap back to the orchestrator and run the loop again.

## What this skill does NOT do

- It does not write Gherkin. (That's `gherkin-contract`.)
- It does not write step definitions or glue code. (That's the worker.)
- It does not write test code. (That's the worker, after reading the contract.)
- It does not validate behavior. (That's the validator.)

If you are tempted to do any of these, you are drifting out of the orchestrator role. Stop and either delegate or run discovery again.

## Bundled references

- `references/user-story.md` — Detailed user-story format and examples.
- `references/discovery-workshop.md` — Full discovery workshop guide (what/when/who/how long/why).
- `references/card-conversation-confirmation.md` — Ron Jeffries on the three C's.

Read these when you need the source material for a specific decision (e.g., "should this be its own story or a sub-task?"). For most invocations the body of this SKILL.md is enough.
