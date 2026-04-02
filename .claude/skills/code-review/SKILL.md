---
name: code-review
description: Reviews code changes following project standards. Use when reviewing code, analyzing a PR, posting review comments, or when the user asks for a code review or feedback on changes.
---

# Code Review

Post inline comments on specific lines where applicable. Evaluate from three perspectives and label each finding clearly.

## [Code Quality] — Google Senior Engineer lens

- Naming and readability
- Single responsibility
- TypeScript correctness
- React/Next.js patterns (Server/Client boundary, Server Actions vs Route Handlers)
- Dead code, unnecessary complexity

## [Security] — OWASP lens

- Authentication/authorization gaps
- Injection risks (raw SQL, `dangerouslySetInnerHTML`)
- Sensitive data exposure (API keys, env vars leaking to client)
- Input validation at system boundaries

## [Architecture] — Staff Engineer lens

- Server/Client boundary correctness
- Dependency direction (UI importing DB logic, etc.)
- Coupling that will hurt as the codebase grows
- Premature or missing abstraction

## Severity Labels

**Quality / Architecture:** `MUST` / `SHOULD` / `NICE-TO-HAVE`

**Security:** `CRITICAL` / `HIGH` / `MEDIUM` / `LOW`
