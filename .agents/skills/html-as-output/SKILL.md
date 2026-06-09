---
name: html-as-output
description: "Produce rich HTML documents (single self-contained files) instead of markdown for any artifact the user will read, share, or review: specs, plans, reports, code reviews, design prototypes, comparisons, explainers, status updates, incident reports, custom editing interfaces, data visualizations. Trigger on phrases like \"write me a spec\", \"make a plan\", \"draft a report\", \"explain how this works\", \"compare these options\", \"prototype this UI\", \"summarize for the team\", \"weekly status\", \"incident report\", \"make it visual\", \"side-by-side comparison\", \"interactive\", \"I need to review this\". Push back on the default of producing long markdown files. Even when the user asks for a \"doc\" or \"document\" or \"writeup,\" reach for HTML by default. Based on Anthropic's \"The Unreasonable Effectiveness of HTML\" guidance."
---

# HTML as the default output format

When producing any artifact a human will read, **default to a single self-contained HTML file** rather than a markdown file. HTML conveys information density that markdown can't, and humans actually read it.

## Why HTML over markdown

- **Information density** — tables, CSS-styled layouts, SVG diagrams, real colors, real spacing, code with syntax highlighting, embedded interactive elements. Things markdown approximates badly (color via Unicode, diagrams via ASCII, layouts via code blocks) are native in HTML.
- **Visual clarity & ease of reading** — humans don't read 100-line markdown files. We skim, we look for structure, we get bored. A well-styled HTML document with tabs, illustrations, links, and good typography is actually read end-to-end.
- **Shareability** — markdown doesn't render in browsers. HTML does. Upload to S3, send a link, done. People are dramatically more likely to actually open and read a link than to download an attachment.
- **Two-way interaction** — sliders to tune parameters, drag-drop reordering, copy-as-prompt buttons. The artifact becomes an editor for the thing it describes.
- **Mobile responsiveness** — adapts to whatever the reader is on.

**Trade-offs to be honest about:**
- 2-4x slower to generate than markdown
- Noisy diffs in version control (HTML diffs are hard to review)
- Token-heavier (less of a concern with 1M+ context windows)

These trade-offs are real but worth it for any artifact a human is going to spend time on.

## The default pattern

For almost any "write me a document about X" request, produce **one self-contained HTML file** with:
- Inline CSS in a `<style>` block (no external stylesheets)
- Embedded SVG for diagrams (no external images unless necessary)
- Minimal JavaScript only if interactivity adds value
- A clean, readable design — typography hierarchy, good spacing, sensible color palette
- Opened in the browser locally (ask the user, or just `open file.html`)

Single file = portable, shareable, no build step.

## When to use which (the small exception list)

**Use markdown when:**
- The file is going into a code repo where diffs matter (README, CONTRIBUTING, inline docs in a codebase)
- The artifact is genuinely a quick note (< 30 lines, no structure beyond headers)
- The file is part of a markdown-native workflow (Jekyll, Obsidian, GitHub PR descriptions where markdown is required)
- The file is going into a system that consumes markdown (mkdocs, docusaurus, etc.)

**Default to HTML for everything else.** This includes: specs, plans, reports, research summaries, status updates, incident reports, code explainers, PR walkthroughs, design prototypes, comparison documents, dashboards, training material, talks/decks, custom editing UIs.

## Concrete use cases (use these as templates)

**Specs & plans** — go beyond bullets. Include mockups (inline SVG or simplified HTML), data flow diagrams, key code snippets, links to relevant files. The reviewer can actually navigate the spec.

**Code review & PR walkthroughs** — render the actual diff with margin annotations, color-code findings by severity, link to relevant files. Attach one to every PR.

**Design & prototypes** — sketch the design in HTML, even if the final surface is React/Swift. Add sliders/knobs for the parameters you want the user to tune. Always include a "copy as prompt" or "copy as JSON" button that exports the chosen state.

**Reports & research** — synthesize across data sources (codebase, Slack, git history, web), render as a long HTML document with SVG diagrams, an interactive explainer, or a slide-style deck. Optimize for "read it once, get the point."

**Custom editing interfaces** — when describing the thing in text is harder than using the thing. Examples:
- Reprioritize 30 Linear tickets → draggable cards across Now/Next/Later/Cut columns
- Edit a feature-flag config → form-based editor with dependency warnings
- Tune a system prompt → side-by-side editor with live-rendered sample inputs
- Curate a dataset → approve/reject rows with tags
- Pick a value that's painful in text → color picker, easing-curve editor, regex playground

**The trick for editing interfaces: always end with an export.** "Copy as JSON," "Copy as markdown," "Copy as prompt that recreates this state." The UI is a way to express intent; the export is what you actually use.

## Make it look good (without overthinking)

A few defaults that make HTML documents readable by default:
- One accent color, used sparingly
- A readable serif or well-chosen sans for body text
- Generous line-height and max-width on body text (~65-75 characters per line)
- Clear visual hierarchy: h1/h2/h3 sized appropriately, sections visually distinct
- Code in a monospace block with subtle background tint
- Diagrams as SVG (not raster images) so they scale and stay sharp

If the user has a design system, point the agent at it (single design-system HTML file as a reference). Otherwise, default to a clean, minimal aesthetic.

## How to ask the agent for this

Don't overthink the prompt. "Make me a HTML file for X" works. The skill is in *knowing to ask* — once the user has internalized that HTML is the default for any document they'll read, the prompting gets simple.

Useful patterns:
- "Make me an HTML doc with 6 distinctly different approaches laid out in a grid so I can compare them."
- "Create a thorough implementation plan as a single HTML file with mockups, data flow, and key code snippets."
- "Help me review this PR — render the diff with inline annotations, color-code findings, focus on streaming/backpressure."
- "Build me an HTML editor for X with sliders/knobs and a copy-as-prompt export."

## Pairing with other tools

- **MCPs for context** — Claude Code can read the codebase, Slack, Linear, git history, the web (Claude in Chrome), and use all of that to inform the HTML it produces. Use this for reports and explainers — the HTML is the output, the MCPs are the input.
- **Git** — commit the HTML file like any other artifact. Diffs will be noisy, but for sharing and reading it's the right format.
- **Browser** — `open file.html` to view. For sharing, upload to S3 or similar and send a link.

## The deeper point

The reason HTML is "unreasonably effective" isn't really about features. It's that **the user actually reads it.** The 100-line markdown plan that nobody opens accomplishes nothing. The HTML document that gets reviewed, shared, and acted on accomplishes the actual goal. Optimizing for the artifact being read — not just produced — is the whole game.
