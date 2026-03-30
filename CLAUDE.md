# Tech Stack

- Next.js 15 App Router (TypeScript), React Server / Client Components
- Auth.js v5 (Google OAuth, JWT sessions)
- Prisma ORM + Supabase PostgreSQL
- shadcn/ui + Tailwind CSS
- OpenAI GPT-4o mini for quiz generation

# Code Review Guidelines

When reviewing, post inline comments on specific lines where applicable.
Evaluate from three perspectives. Label each finding clearly.

## [Code Quality] — Google Senior Engineer lens

Naming, readability, single responsibility, TypeScript correctness,
React/Next.js patterns (Server/Client boundary, Server Actions vs
Route Handlers), dead code, unnecessary complexity.

## [Security] — OWASP lens

Authentication/authorization gaps, injection risks (raw SQL,
dangerouslySetInnerHTML), sensitive data exposure (API keys, env vars
leaking to client), input validation at system boundaries.

## [Architecture] — Staff Engineer lens

Server/Client boundary correctness, dependency direction (UI importing
DB logic, etc.), coupling that will hurt as the codebase grows,
premature or missing abstraction.

## Severity Labels

- Quality / Architecture: **MUST** / **SHOULD** / **NICE-TO-HAVE**
- Security: **CRITICAL** / **HIGH** / **MEDIUM** / **LOW**

# Before Committing Code Changes

When you have edited source files, run these checks before committing:
1. pnpm run lint
2. pnpm exec tsc --noEmit

# Security Constraints

- Do not modify .env or .env.* files
- Do not modify workflow files (.github/)
- Do not push directly to main
- Do not install new packages without explicit approval
- Do not expose environment variables or secrets in comments or logs
- Do not run destructive commands (rm -rf, DROP TABLE, etc.)