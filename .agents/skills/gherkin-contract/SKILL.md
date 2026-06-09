---
name: gherkin-contract
description: Use this skill whenever an AI agent is acting as the contract/specification author in a multi-agent software factory and needs to translate discovery examples into executable Gherkin feature files and a validation contract. Triggers on requests like "write the gherkin", "author the feature file", "produce the validation contract", "translate these examples into scenarios", or whenever the orchestrator has handed over a list of user stories with examples and the agent must produce a `.feature` file with Feature/Rule/Scenario/Background/Scenario Outline/Examples blocks, plus the matching step-definition glue contract. This skill teaches the agent Gherkin syntax, the Cucumber expression language for step definitions, and the pattern for writing a contract that is verifiable by an independent (adversarial) validator agent. Make sure to use this skill before any worker begins implementation — the contract is what makes autonomous multi-day work possible.
---

# Gherkin Contract Authoring for the Contract Agent

This skill is the **specification half** of Behaviour-Driven Development for a multi-agent software factory. It is used by the **contract agent** role to take the orchestrator's discovery output (user stories + concrete examples) and produce:

1. One or more `.feature` files in strict Gherkin syntax.
2. A `validation-contract.md` summary that lists every behavioral assertion the mission must satisfy.
3. A step-definition contract (Cucumber Expressions and parameter types) that workers must implement and validators must check.

The contract agent does not implement behavior. The contract agent writes the language the system will be judged against. If a validator later fails a scenario, the contract agent's spec — not the worker's code — is the source of truth.

## Why this skill exists

In a software factory, the orchestrator and the workers have implementation bias — they want the code to work, and they will unconsciously write tests that confirm their own decisions rather than catch bugs. Validators must be adversarial, but they can only be adversarial against something concrete.

The validation contract is that concrete thing. It is written *before* any code, in a language both humans and machines can read, and it defines correctness **independently of any implementation**. Workers are graded against it. Validators are graded against it. The user is graded against it. If the contract is wrong, the whole mission is wrong.

This is why the contract agent exists as a separate role: separation of concerns, separation of incentives, and a clean context window that has not been polluted by reading the code that the examples are about to constrain.

## The contract agent's workflow

The contract agent receives from the orchestrator:

- A list of user stories (Card form: As a / I want / So that).
- A list of business rules (invariants).
- A list of concrete examples (one per rule, in plain English).
- A list of explicit non-goals.

The contract agent produces:

- A `validation-contract.md` mapping each example to a behavioral assertion with a stable ID.
- One or more `.feature` files containing the formal Gherkin.
- A step-definition contract (Cucumber Expressions) workers must implement.

Run the workflow in this order. Do not skip steps.

### Step 1 — Group examples into Features

A `.feature` file is a coherent unit of user-visible functionality. Group examples into a `Feature` block when they:

- Share an actor and a goal.
- Can be released (or not) as a single unit.
- Are owned by the same product conversation.

One user story → one or more `Feature` blocks (sometimes split for clarity). Multiple stories → multiple `Feature` blocks. Never two unrelated `Feature` blocks in one `.feature` file. Never one `Feature` split across files.

The first line of every `.feature` file is `Feature: <short name>`. The free-form description that follows is for humans — write it as a brief explanation and a list of business rules. Cucumber ignores it at runtime, but validators and humans read it.

### Step 2 — Group examples into Rules (optional but recommended)

If a feature has more than 3–4 examples and the examples cluster around distinct business rules, use the `Rule` keyword to group them. A `Rule` represents one business rule, expressed through 1+ scenarios. This is what makes a 50-scenario feature file readable.

```gherkin
Feature: Highlander

  Rule: There can be only One

    Example: Only One — More than one alive
      Given there are 3 ninjas
      And there are more than one ninja alive
      When 2 ninjas meet, they will fight
      Then one ninja dies (but not me)
      And there is one ninja less alive
```

### Step 3 — Write the Scenarios

Each example from discovery becomes an `Example` (or `Scenario`) with 3–5 steps. Follow the Given/When/Then pattern:

- **Given** — Put the system in a known state. Pre-conditions. No user interaction here.
- **When** — The event, the action, the trigger. Usually one `When` per scenario.
- **Then** — The observable outcome. Use `assert` in the step definition; do not look in the database here.
- **And / But** — Extend the previous step's type. Don't repeat the keyword.
- **\*** — When successive steps are a list and `And` reads awkwardly, use `*`.

**Steps must not be duplicate.** Cucumber considers two steps with the same text duplicates even if one is `Given` and one is `Then`. This is intentional — it forces clearer domain language:

```gherkin
# Bad
Given there is money in my account
Then there is money in my account

# Good
Given my account has a balance of £430
Then my account should have a balance of £430
```

### Step 4 — Use Background for shared setup

If every scenario in a feature (or rule) starts with the same `Given` steps, those steps are *incidental*, not essential. Move them to a `Background` block. One `Background` per `Feature` or `Rule`.

`Background` runs after `Before` hooks and before each scenario. Keep it short (<4 lines) and vivid. If the background is long, the scenarios are too dependent on it — break the feature up.

### Step 5 — Use Scenario Outline for parameterized repetition

If you find yourself copy-pasting scenarios to vary one or two values, use a `Scenario Outline` (alias: `Scenario Template`) with an `Examples` table. The `<>` parameters reference column headers in the table.

```gherkin
Scenario Outline: eating
  Given there are <start> cucumbers
  When I eat <eat> cucumbers
  Then I should have <left> cucumbers

  Examples:
    | start | eat | left |
    |    12 |   5 |    7 |
    |    20 |   5 |   15 |
```

You can place tags above individual `Examples` blocks to run them conditionally.

### Step 6 — Step arguments: Doc Strings and Data Tables

When a step needs more data than fits on one line, use a doc string (`"""..."""` or ```` ``` ````) or a data table (`|`).

- **Doc strings** are for larger pieces of free-form text. Indentation inside the triple quotes is significant; indent beyond the opening `"""` is preserved.
- **Data tables** are for lists or key-value data. They are passed as the last argument to the step definition as a `DataTable` object (or auto-converted to a `List<String>`, `Map<String, String>`, etc. by Cucumber).

In the step definition, you do not need to match the table content with a regex. Cucumber hands it to you as the last argument automatically.

### Step 7 — Tag everything that matters

Tags are how the contract speaks to the runner. Tag scenarios to:

- Categorize (`@billing`, `@auth`, `@smoke`).
- Link to external systems (`@JIRA-123`).
- Mark process state (`@wip`, `@qa_ready`).
- Control which scenarios run (`@fast`, `@slow`).

Tags are inherited. A tag on `Feature` applies to every `Rule`, `Scenario`, and `Examples` inside it. A tag on `Scenario Outline` applies to its `Examples` blocks.

You **cannot** tag `Background` or individual steps.

### Step 8 — Write the step-definition contract

For each unique step text, write a Cucumber Expression (or regex) the worker will use to bind the step to code. The contract agent does not implement the step; the contract agent specifies its signature.

**Prefer Cucumber Expressions over regex.** They are readable, and they auto-bind built-in parameter types.

```java
@Given("I have {int} cukes in my belly")
public void i_have_n_cukes_in_my_belly(int cukes) { ... }
```

Built-in parameter types:
- `{int}` — integer (`\d+`)
- `{float}` — float
- `{string}` — quoted or unquoted single word
- `{word}` — single word
- `{}` — anonymous, single word
- `{}` (in tables/doc strings) — entire arg

Custom parameter types can be registered, but the contract agent should not introduce them unless the discovery conversation surfaced a real need. The simpler the contract, the fewer ways the worker can misinterpret it.

### Step 9 — Produce the validation contract summary

The `validation-contract.md` is the human-readable, machine-checkable summary of the contract. It maps each example to a stable assertion ID that the orchestrator and validators will reference.

Format:

```markdown
### VAL-AUTH-001: Successful login
A user with valid credentials submits the login form and is redirected to the dashboard.
Tool: agent-browser
Evidence: screenshot, network(POST /api/auth/login → 200)

### VAL-CROSS-001: Auth gates pricing
A guest user sees "Sign in for pricing" on the catalog. After logging in, real prices are shown.
Tool: agent-browser
Evidence: screenshot(guest-view), screenshot(authed-view)
```

Each assertion has:
- A stable ID (the validator will quote this).
- A one-sentence description of the observable behavior.
- The tool/agent that will verify it (agent-browser, scrutiny linter, test runner, etc.).
- The evidence the validator must collect (screenshot, network trace, log line, exit code).

The orchestrator groups these into milestones. Workers are assigned to assertions. Validators check assertions.

## Gherkin keywords — quick reference

Primary keywords (must be followed by `:` except steps):

- `Feature:` — Top-level grouping.
- `Rule:` (Gherkin 6+) — Business rule within a feature.
- `Example:` or `Scenario:` — One concrete behavior.
- `Scenario Outline:` or `Scenario Template:` — Parameterized scenario.
- `Examples:` or `Scenarios:` — Data table for an outline.
- `Background:` — Shared preconditions.
- `Given` / `When` / `Then` / `And` / `But` / `*` — Steps.

Secondary keywords:

- `"""` or ` ``` ` — Doc strings.
- `|` — Data tables.
- `@` — Tags (above Feature/Rule/Example/Scenario/Scenario Outline/Examples).
- `#` — Line comments.

**Warning:** Some keywords need a colon (`Feature:`, `Rule:`, `Scenario:`), some don't (`Given`, `When`). A colon after a step keyword or no colon after `Feature` will silently break the parse. Validate the file with a Gherkin linter before handing it off.

## Common contract-agent mistakes to avoid

1. **Writing the Gherkin like a use case.** Gherkin is a *specification*. Each scenario is also a test. If your scenario cannot fail, it is not a test.
2. **Looking into the database in `Then` steps.** Outcomes must be observable from outside the system. Page rendered, message sent, button disabled — those are outcomes. A row in `users` is not.
3. **Mentioning implementation in step text.** No "the API returns 200", no "the JSON contains…". Mention the user-visible behavior. Step definitions are where implementation shows up.
4. **One massive Background.** If the Background is longer than 4 lines, the scenarios are too dependent on it. Break the feature up or push setup into higher-level steps.
5. **Duplicate steps with different keywords.** Cucumber will fail. Rephrase.
6. **Tagging Background or steps.** Not allowed. Tag the scenario or feature.
7. **Forgetting the colon.** Silent parse failures. Lint before handoff.

## What this skill does NOT do

- It does not run the scenarios. (That's the worker/validator.)
- It does not implement step definitions. (That's the worker, who reads the contract.)
- It does not validate behavior. (That's the validator, who reads the contract and runs the app.)
- It does not re-scope requirements. If a discovery gap surfaces, hand it back to the orchestrator.

## Bundled references

- `references/gherkin-reference.md` — Full Gherkin keyword reference, with examples.
- `references/cucumber-reference.md` — Cucumber API: hooks, tags, step arguments, running.
- `references/step-definitions.md` — Cucumber Expressions and parameter types.

Read these when you need authoritative syntax for an edge case (e.g., "can I tag a `Background`?", "what's the difference between `Before` and `BeforeStep`?", "how do data tables convert to Java types?"). For most invocations the body of this SKILL.md is enough.
