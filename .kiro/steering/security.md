---
inclusion: auto
name: security
description: Security and privacy rules. Use when touching authentication, secrets, configuration, stored or transmitted user data, analytics or telemetry, or third-party scripts.
---

# Security and privacy

Adapted from the Mystira `mystira-guardian` (general parts only).

## Always

- No secrets in the repo: tokens, keys and passwords live in environment variables or untracked config. `public/config.json` ships to every browser, so nothing in it may be secret.
- Collect, store and transmit the minimum. Challenge every field.
- Telemetry and logs carry buckets and flags, never names, emails or stable identifiers. Hashing a low-entropy value (an email, a short id) is not anonymisation.
- No third-party script or SDK without the user's say-so, and none that receives user data.
- Validate everything that crosses a boundary (engine responses, content files, URL parameters) with Zod or the schema.

## Audience profile (applies only when the audience includes minors)

Check `product.md`. The player is multi-use, so these apply only for deployments and content whose audience includes children or other protected groups; they are not a default for every use. When they apply:

- Age-gate before any data is stored, and make the gate a hard one, not advisory.
- Consent from a parent or guardian must be verified, not just claimed, and the record must be auditable.
- Deletion is complete: every copy, including backups within a stated window.
- No analytics or error-tracking SDKs for these users without consent.
- No dark patterns that nudge past consent.
- Tests for age gating, consent and deletion paths should be agreed with the user as a coverage target, and gaps escalated, not just advised.

These come from Mystira's guardian agent, not from a legal review. For legal requirements (COPPA, GDPR-K, POPIA and the like), take the rules from the user's compliance documents.
