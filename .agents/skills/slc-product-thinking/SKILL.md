---
name: slc-product-thinking
description: Apply Jason Cohen's SLC (Simple, Lovable, Complete) framework when ideating startup ideas, designing a product v1, scoping an MVP, choosing what to build first, deciding whether a half-built project is worth shipping, or pushing back on "MVP" thinking. Trigger on phrases like "should I build this", "what's the v1 of", "MVP", "minimum viable", "version 1", "first version", "scope it down", "is this ready to launch", "ship the smallest thing", "what should I cut", "is this lovable", or whenever the user is deciding what to put in or leave out of a product. Don't wait for the user to name the framework — if the question is about the shape of an early product, use this lens.
---

# SLC: Simple, Lovable, Complete

A mental model for the first version of a product. The replacement for "MVP" (Minimum Viable Product), which optimizes for the builder's learning at the customer's expense. SLC optimizes for both.

## The core shift

**MVP** asks: "What's the smallest thing I can ship to *learn something*?"
**SLC** asks: "What's the smallest thing that someone would genuinely *want to use*?"

The customer's experience is the constraint, not the builder's learning budget. The builder still learns — fast — but the customer isn't being treated as a free research subject.

## The three properties

**Simple** — small enough to build and ship quickly. Customers forgive missing features when the product never claimed to have them.

**Lovable** — people have to *want* to use it. Love is the competitive moat. Two products with the same feature set can have wildly different fates; the one people love wins. Love comes from many places: elegant UX, delightful UI, brand, copy, the company itself (Buffer's transparency, Basecamp's stance), a deep connection to a specific audience (Heroku's command-line homepage speaking to devs). Pick one and lean in.

**Complete** — version 1.0 of something simple, not version 0.1 of something broken. A scope narrow enough to be done. When the customer uses it, the thing they came for *works*, end to end. No "coming soon" placeholders in the critical path.

The test for "Complete": if you stop building forever after this release, is what you shipped still a good product? An abandoned MVP is a bad product. An abandoned SLC is a modest, honest, useful product.

## How it changes what you build

- **Cut features aggressively** — not to be "minimal," but to keep scope narrow enough to be *finished and polished*. The cutoff isn't "what's the least I can ship?" It's "what's the smallest scope where I can ship something the customer is happy with?"
- **Spend on the parts the customer touches** — design, copy, onboarding, the core loop. Not infrastructure for hypothetical scale.
- **Decide what kind of love you're generating** — pick one channel (UX, brand, audience-fit, story) and make that the centerpiece. Trying to do all of them dilutes.
- **Ship the smallest lovable loop, not the largest feature set** — what's the one thing a user does that makes them come back?

## The Maslow inversion (optional, useful)

Conventional product wisdom climbs Maslow bottom-up: Useful → Reliable → Easy to use → Delightful → Meaningful. "Get useful first, then make it nice." SLC argues: **climb top-down instead.** Start with Delight, even if the scope of "Useful" is narrow. A small lovable thing beats a large dull thing.

This is why Snapchat (a tap-to-send-disappearing-photo screen) beat more "complete" camera apps. Why early WhatsApp (a status message) won. Why early Google Docs beat Microsoft Word on collaboration. Why Linear, with less features than Jira, is loved.

## Decision questions to apply

When the user is scoping, designing, or evaluating an early product, push on these:

1. **What's the smallest scope where this is a finished product, not a fragment of one?** (Forces "Complete.")
2. **What would make someone *want* to use this over the alternative — including doing nothing?** (Forces "Lovable" — and surfaces whether there's actually a pull.)
3. **If I never build v2, is v1 still good?** (Forces honesty about scope; rejects MVP disguised as SLC.)
4. **Am I cutting features, or am I cutting love?** (Surfaces whether simplification is going too far.)
5. **Is this a v1.0 of something simple, or a v0.1 of something complex?** (The most diagnostic question. If the honest answer is the second, redesign the scope.)
6. **What kind of love am I generating — and is it the kind my actual customer responds to?** (Prevents generic "make it pretty" advice.)

## Common failure modes to flag

- **MVP in SLC clothing** — narrow scope but still buggy, missing, embarrassing. Call this out: the "S" and "L" don't compensate for being unfinished.
- **Feature creep disguised as completeness** — adding more to feel "done." Push back: done means the *core* is finished, not that more is built.
- **Confusing "delight" with "polish"** — delight comes from a specific choice (UX, brand, audience-fit, story), not generic prettiness. Ask which one.
- **Solving for the builder's anxiety** — the user worried about "what if they want X?" Answer: if X is critical, X is in scope. If X is nice-to-have, the SLC is honest about not having it.
- **Skipping the love because "utility is what people pay for"** — yes, but love is what makes people *switch* and *tell others*. Especially true in crowded markets and for new products with no switching cost yet.

## Reference examples (use to anchor intuition)

- **Snapchat v1** — one screen: tap anywhere = take photo, send to friend, disappears. No video, no filters, no feed. Loved.
- **WhatsApp v1** — "What are you doing right now?" status. Just that. Then chat (because users abused status to message for free).
- **Google Docs v1** — ~3% of Word's features, but real-time collaboration. Loved for what it did, not penalized for what it didn't.
- **Twitter v1** — 140 chars, send. Replies and retweets invented by users as convention, formalized later.
- **Dropbox v1** — one folder, syncs (eventually) across devices.
- **Slack v1** — chat, search, integrations. Few features, loved.
- **Linear, Basecamp, Notion, Cron** — narrow tools, opinionated UX, design-forward, beloved in their niches.

The pattern: small surface area, finished in itself, a specific kind of love at the center.

## How to use this skill

When the user is in product-ideation mode, this skill is a lens to apply, not a checklist to tick. Use the decision questions to surface tensions, not to lecture. Push back on MVP-itis with the specific alternative — "what if we cut the scope so the remaining thing is finished *and* the design is the point?" — not by reciting the framework.

If the user is past v1 and iterating, the framework still applies but loosens: completeness and love matter more, simplicity relaxes as features earn their place.
