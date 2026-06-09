# Orchestrator Skills

Skills placed here are auto-discovered by Pi's `DefaultResourceLoader` when the orchestrator runs from the Ratel repo root.

## How skill discovery works

1. `DefaultResourceLoader` walks `.pi/skills/` (project-local) and `~/.pi/agent/skills/` (global)
2. Every `SKILL.md` found becomes available to the orchestrator
3. Pi injects skill descriptions into the system prompt
4. The model decides which skill to invoke via `/skill:name`

## Default Orchestrator Skills

These skills are loaded by default into every orchestrator session. They serve the orchestrator's planning, architecture, and coordination role — not implementation.

| Skill | Role in Orchestrator |
|---|---|
| **grill-with-docs** | Plan alignment and terminology sharpening during intake/clarification. Challenges assumptions, updates `CONTEXT.md` and ADRs inline. |
| **find-skills** | Discover relevant implementation skills on demand. The orchestrator searches for skills (auth, database, framework) when making tech-stack decisions, then records constraints — it does not implement. |
| **ui-ux-pro-max** | UX constraint reasoning during constraint analysis. Helps define visual design, interaction patterns, accessibility, and layout requirements without writing components. |
| **parallel-web-search** | Discovery phase research. Gathers current information, docs, patterns, feasibility data to inform requirements and constraints. |
| **agent-browser** | Inspect live systems and web apps. Used when the orchestrator needs to verify existing behavior, examine a running product, or understand current UI state before planning changes. |
| **html-visual** | Generate interactive HTML visualizations (architecture diagrams, flowcharts, dashboards, timelines, mindmaps) for architecture reviews, milestone plans, or explaining complex structures to the user. |
| **html-as-output** | Generate HTML documents as structured output for architecture reviews, explanations, and reports. Alternative to html-visual when the goal is a readable document rather than an interactive visualization. |
| **skill-creator** | Create custom skills to pass down to workers, validators, or other factory agents. The orchestrator designs a skill for a specific task (e.g., "React component testing pattern") and delegates it to the appropriate agent. |
| **slc-product-thinking** | Simple-Lovable-Complete product thinking. Helps the orchestrator discipline scope, prioritize features, and ensure what gets built is genuinely valuable to users — not just feature-complete. |
| **software-design-philosophy** | Deep modules, information hiding, strategic vs tactical programming, complexity budget. Guides the orchestrator in making structural decisions that leave the codebase cleaner than it started. |
| **architecture-blueprint-generator** | Comprehensive architecture blueprint generation with visual diagrams, pattern detection, and technology stack analysis. Produces architectural documentation the orchestrator can use for planning and user approval. |
| **brainstorming** | Creative exploration of ideas, requirements, and design alternatives before committing to a direction. Use during intake and discovery when the user's goal is still fuzzy or when multiple approaches are possible. |

## Skill usage by phase

| Phase | Recommended Skills |
|---|---|
| Intake | `grill-with-docs`, `ui-ux-pro-max`, `brainstorming`, `slc-product-thinking` |
| Discovery | `parallel-web-search`, `agent-browser`, `find-skills`, `brainstorming` |
| Clarification | `grill-with-docs`, `ui-ux-pro-max`, `slc-product-thinking` |
| Constraint Analysis | `ui-ux-pro-max`, `find-skills`, `html-visual`, `html-as-output`, `slc-product-thinking`, `software-design-philosophy`, `architecture-blueprint-generator` |
| Validation Contract | `grill-with-docs`, `software-design-philosophy` |
| Feature Decomposition | `html-visual`, `html-as-output`, `skill-creator`, `architecture-blueprint-generator`, `software-design-philosophy` |
| User Approval | `html-visual`, `html-as-output` |

## Adding more skills

### Option A: Install globally (available to all Pi sessions)
```bash
npx skills@latest add mattpocock/skills
```

### Option B: Copy specific skills into this directory (repo-local only)
```bash
cp -r ~/.pi/agent/skills/some-skill .pi/skills/
```

### Option C: Add custom Ratel-specific skills
Create a new directory here with a `SKILL.md` following the skills standard.

## Default Contract Agent Skills

These skills are loaded by default into every Validation Contract Writer session.

| Skill | Role in Contract Agent |
|---|---|
| **parallel-web-search** | Research domain-specific validation patterns. |
| **find-docs** | Look up library/framework documentation to understand what behavior needs validation. |
| **software-design-philosophy** | Ensure assertions are about behavior through public interfaces, not implementation details. |
| **ui-ux-pro-max** | For screenshot evidence assertions, ensure user-observable behavior. |
| **slc-product-thinking** | Ensure coverage across Simple, Lovable, Complete dimensions. |
| **html-as-output** | Generate interactive HTML validation contract documents. |
| **gherkin-contract** | Translate user stories and examples into executable Gherkin `.feature` files with step-definition glue contracts. |
| **cucumber-gherkin** | BDD testing with Cucumber/Gherkin: keywords, step definitions, Cucumber Expressions, hooks, tags, data tables. |

## Default Worker Skills

These skills are loaded by default into every Worker Agent session. They are universal implementation skills — not stack-specific. Stack-specific skills (FastAPI, Clerk, Drizzle, Supabase, shadcn, etc.) are discovered on demand via `/skill:find-skills`.

| Skill | Role in Worker |
|---|---|
| **tdd** | Core discipline. Red-green-refactor, vertical slices, tracer bullets, what makes good vs bad tests. |
| **writing-plans** | Plan vertical slices and public interfaces before coding complex features. |
| **diagnose** | Disciplined debugging loop when tests fail or bugs emerge. |
| **prototype** | Build throwaway prototypes to validate uncertain designs before committing. |
| **zoom-out** | Get broader context on unfamiliar code areas, module relationships, callers. |
| **find-docs** | Look up specific library/framework documentation for authoritative API references. |
| **parallel-web-search** | Quick web lookups for error messages, best practices, current patterns. |
| **building-components** | Build accessible, composable UI components when the feature has frontend surface. |
| **find-skills** | Discover stack-specific skills on demand. The worker checks what skills the orchestrator created for this mission, then discovers additional ones from the global pool. |

### Stack-specific skill discovery

The Worker does NOT load stack-specific skills by default (no FastAPI, Clerk, Drizzle, etc. pre-loaded). This prevents context bloat. Instead:

1. The Worker reads the codebase to identify the tech stack (package.json, requirements.txt, etc.)
2. The Worker invokes `/skill:find-skills` with a query like "FastAPI testing patterns" or "Clerk auth setup"
3. If the orchestrator created custom skills for this mission (e.g., "mission-specific auth patterns"), they appear in the discovery results
4. The Worker invokes the relevant skill and absorbs its guidance

## "Default" skills concept

Currently ALL discovered skills are "available" — the model sees them and decides when to use them.

The `ratel.json` `phaseSkills` map suggests which skills to invoke at each mission phase. A future phase-transition hook will auto-prep these recommendations into the prompt.
