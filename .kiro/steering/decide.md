---
inclusion: manual
---

# Deciding between options

Type `#decide` in chat when two or more approaches compete. Adapted from Mystira's `arbiter` and Retort's `arbiter-agent` and `advisor-agent`.

## Hard constraints (an option that breaks one cannot be recommended)

- The player never decides what comes next, how a piece is taught, or whether an answer is right (`product.md`).
- No personalisation rules, scoring logic, story generation or profile logic in this repo.
- No real user data anywhere in the repo. Demo users are invented.
- Where the audience profile in `security.md` applies, handling it must not be deferred to a later ticket.

## Score each option 1 to 5, with a one-line reason

| Dimension | Question |
| --- | --- |
| Fit | Does it respect the player/engine boundary and the structure in `structure.md`? |
| Testability | Can it be tested without mocking internals? What is the test surface? |
| Maintenance | How many new abstractions, and what is the blast radius of future change? |
| Performance | Render cost, bundle size, round trips on a slow device or connection. |
| Privacy | What user data does it touch, and is that the minimum? |
| Cost | Hosting, third-party services, LLM tokens, CI minutes. |

Weight the dimension that matters most for this decision twice, and say which and why.

## Output

Scorecard, the deciding factor, a recommendation, the conditions or risks, and the text of a short ADR if the decision is worth recording (context, decision, consequences). Give a recommendation, not a survey; if the options are close, say so and name what would tip it.
