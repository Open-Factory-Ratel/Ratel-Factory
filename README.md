<p align="center">
  <img src="Ratel_logo.png" alt="Ratel Logo" width="200">
</p>

<h1 align="center">Ratel — AI Software Factory</h1>

<p align="center">
  <strong>Thin deterministic orchestration + model-owned implementation for autonomous software missions</strong>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#development">Development</a>
</p>

---

## What is Ratel?

Ratel is an **AI Software Factory** — a framework for running autonomous software development missions. It orchestrates AI agents to plan, implement, and validate software projects while maintaining thin deterministic control over bookkeeping, isolation, routing, schemas, timeouts, persistence, and handoffs.

**Core philosophy:**
- **Deterministic code** owns schemas, persistence, routing, timeouts, integration, completion integrity, aggregation
- **Model agents** own planning, implementation, validation judgment, and product interpretation
- **Non-bypassable gates** ensure features can only complete when workers produce clean handoffs with merged branches and zero high-severity issues

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git
- (Optional) Ollama for local AI models
- (Optional) API keys for OpenAI, Anthropic, or other Pi-supported providers

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ratel

# Install dependencies
npm install

# Build the factory
npm run build

# Start the factory in development mode
npm run dev
```

### Running a Mission

1. Start the factory: `npm run dev`
2. The factory will enter **Intake** phase and ask about your project
3. Describe what you want to build (e.g., "A real-time chat app with AI categorization")
4. The orchestrator will run through phases: Discovery → Clarification → Constraint Analysis → Validation Contract → Feature Decomposition → User Approval → Execution
5. Workers implement features one at a time, validators verify them
6. Mission artifacts are persisted in `.missions/current/`

---

## Architecture

```
User
  ↓
Orchestrator (mission planning, user interaction, phase transitions)
  ├─→ Research Agent (read-only investigation)
  ├─→ Smart Friend (peer reviewer)
  ├─→ Contract Writer (Gherkin .feature files)
  ├─→ Worker Agent (implements one feature)
  │     └─→ Prepared serial git branch (integration → feat/Fx)
  ├─→ Scrutiny Validator (automated checks + code review)
  └─→ User-Testing Validator (browser-based scenario execution)
            └─→ Sharded per .feature file
```

### Key Components

| Component | Responsibility |
|-----------|---------------|
| **Orchestrator** | Mission lifecycle, user communication, agent spawning, go/no-go decisions |
| **Worker** | Single-feature implementation with TDD, git commits, structured handoff |
| **Scrutiny Validator** | Automated tests, typecheck, lint + parallel code review subagents |
| **User-Testing Coordinator** | Deterministic shard planning, one shard per `.feature` file |
| **User-Testing Shard** | Browser automation per feature file, scenario execution |
| **Observatory** | Live dashboard of agent lifecycles, tool calls, parse status |

---

## How It Works

### Mission Phases

1. **Intake** — User describes the project goal
2. **Discovery** — Codebase inspection, feasibility analysis
3. **Clarification** — Requirements refinement with user
4. **Constraint Analysis** — Tech stack, non-goals, risk assessment
5. **Validation Contract** — Gherkin `.feature` files defining "done"
6. **Feature Decomposition** — Break into implementable features with assertions
7. **User Approval** — Present plan, user confirms or adjusts
8. **Execution** — Workers implement features, validators verify

### Workspace Resolution

The factory discovers or prepares the canonical workspace:
- Reads `requirements.json` for explicit `directory` field
- Auto-initializes git in the target directory if needed
- Creates `integration` branch as the canonical integration point
- Workers work in serial feature branches (`feat/F1`, `feat/F2`, ...)
- Clean handoffs are merged back to `integration`

### Completion Gate

A feature can only be marked **completed** when:
- Worker handoff parses successfully (`parseStatus: "ok"`)
- `leftUndone` is empty
- No high-severity issues discovered
- Workspace finalization is `merged` or `skipped`

This is enforced by the `mark_feature_completed` tool — direct `features.json` writes are rejected.

---

## Configuration

### `ratel.json`

The main factory configuration:

```json
{
  "name": "ratel",
  "version": "0.1.0",
  "orchestrator": {
    "model": "opencode-go/deepseek-v4-pro",
    "thinkingLevel": "medium",
    "defaultSkills": [
      "grill-with-docs",
      "parallel-web-search",
      "agent-browser",
      ...
    ]
  },
  "workers": {
    "model": "ollama/kimi-k2.6:cloud",
    "defaultTools": ["read", "bash", "edit", "write"]
  },
  "validators": {
    "model": "ollama/minimax-m3:cloud",
    "defaultTools": ["read", "bash", "grep", "find", "ls"]
  }
}
```

### Model Configuration

Ratel uses the Pi SDK model registry. Set models via:
- `ratel.json` — default for all missions
- `set_model` tool — per-session override
- Environment / Pi SDK auth storage — provider API keys

### Skills

Skills are loaded from:
- `.pi/skills/` — Pi SDK built-in skills (agent-browser, find-docs, etc.)
- `skills/` — Your custom skills
- `.agents/skills/` — Agent-specific skills

See `skills-lock.json` for the skills manifest.

---

## Development

### Scripts

```bash
npm run dev       # Start factory in development mode (tsx)
npm run build     # Compile TypeScript to dist/
npm start         # Run compiled factory (node dist/main.js)
npm test          # Run all tests (77 tests)
```

### Project Structure

```
ratel/
├── src/                    # Factory source code
│   ├── main.ts            # Entry point, session lifecycle
│   ├── orchestrator.ts    # OrchestratorAgent class
│   ├── worker.ts          # Worker agent spawning
│   ├── validators.ts      # Scrutiny & user-testing validators
│   ├── tools.ts           # Orchestrator tool definitions
│   ├── prompts.ts         # System prompts for all agents
│   ├── workspace-resolution.ts  # Canonical workspace discovery
│   ├── user-testing-coordinator.ts  # Shard coordinator
│   ├── feature-completion.ts      # Completion gate logic
│   ├── report-submission.ts       # Structured report tools
│   ├── mission-schema.ts         # Artifact normalization
│   ├── artifacts.ts              # Mission artifact I/O
│   ├── types.ts                 # TypeScript interfaces
│   └── ...
├── test/                   # Factory tests (14 test files)
├── .pi/skills/            # Pi SDK skills
├── skills/                # Custom skills
├── skills-lock.json       # Skills manifest
├── ratel.json             # Factory configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies (Pi SDK, TypeBox)
```

### Testing

The factory has 77 tests covering:
- Workspace resolution with explicit directories
- Feature completion gate enforcement
- Report submission and parsing
- JSONL robustness
- Mission schema normalization
- Integration preflight checks
- User-testing shard aggregation
- Validation recovery semantics

### Observatory Dashboard

When the factory starts, it launches an observatory dashboard:
- URL: `http://localhost:8765` (auto-falls back if port busy)
- **Live Monitoring**: Shows agent spans, tool calls, parse status, phase transitions, diff files, and validator logs.
- **Widescreen Plan Review Console**: During the `user_approval` phase, the dashboard transitions into a full-page split-pane review interface:
  - **Left Pane (Tabbed Editor)**: Toggle between a rich **Preview** of the Gherkin validation contract (automatically formatted headers, checkboxes, lists, and code blocks) and a raw **Edit Markdown** text editor. Active typing protection prevents server polling from resetting your edits.
  - **Right Pane (Sidebar Context)**: Shows the current mission goal, active features checklist, feedback comments box, and action buttons (**Approve & Run Mission** or **Request Edits / Send Back**).
  - Approving or requesting edits writes the files back to the workspace and automatically resolves the blocked orchestrator CLI gate.
- Data source: `.missions/current/events.jsonl`

---

## Philosophy & Constraints

**What the factory controls (deterministic):**
- Branch detection, workspace finalization
- Parse/report schema validation
- Timeouts, raw output persistence
- Shard IDs, concurrency limits
- Artifact paths, aggregate bookkeeping

**What models control (judgment):**
- Planning, implementation decisions
- Pass/fail judgment on validation
- Product issue severity and rationale
- Scope interpretation

**Anti-patterns the factory avoids:**
- Hard-coded scenario severity rules
- Deterministic product behavior rules
- Replacing validators with deterministic BDD runners
- Heavy deterministic state machines

---

## License

[Add your license here]

---

<p align="center">
  <em>Built with the Pi SDK — agent-native orchestration for autonomous software development</em>
</p>
