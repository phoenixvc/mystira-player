---
inclusion: fileMatch
fileMatchPattern: ["src/**/*.tsx", "src/**/*.css", "**/*.module.css"]
---

# Frontend

Loaded when UI code is open. Adapted from Retort's `frontend-agent` and the Mystira `mystira-illuminator`; stack and test rules are in `tech.md` and `testing.md`.

- Read the existing components before writing a new one, and match the patterns already there.
- One responsibility per component. Typed props, no `any`.
- Accessibility first: semantic HTML, labels on controls, full keyboard operation, visible focus. axe runs on every node and interaction type, so a violation here fails the harness.
- No hardcoded colours or spacing; use the theme's design tokens or CSS variables.
- No `console.log` in committed code.
- Every network call has an explicit timeout (`AbortSignal.timeout(...)`), and a failed or slow call degrades to a visible state, never an endless spinner. Mystira's admin login once sat on a spinner for minutes behind an untimed auth call.
- The player never decides what comes next or whether an answer is right (see `product.md`). If a component needs that, it asks the engine.
- Implement UI logic here; leave visual design decisions (new tokens, theming) to the user.
