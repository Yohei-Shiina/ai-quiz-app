# Tech Stack

- Next.js 15 App Router (TypeScript), React Server / Client Components
- Auth.js v5 (Google OAuth, JWT sessions)
- Prisma ORM + Supabase PostgreSQL
- shadcn/ui + Tailwind CSS
- OpenAI GPT-4o mini for quiz generation

# Branch Workflow

Before starting any implementation task (including all file modifications such as code, config, and skill files, and including tasks requested in Japanese), ask the user in 2 exchanges:

1. Show numbered list of branches (`git branch -a`) → ask which to use as base
2. Show 4 numbered options for the working branch name (1: current branch, 2–4: name suggestions labeled **(new)** if they don't exist yet) → ask which to use → then start implementing

# Behavioral Constraints

- Do not treat undecided matters as decided; confirm with the user before recording or acting on any unconfirmed specifics.
- Do not treat a user's question as a correction request; answer the question directly.
- Do not make unsolicited changes to files; ask before making any changes.
- Do not prioritize agreement over factual accuracy; point out errors and unverified assumptions in the user's reasoning.
- Do not use warm flattery or enthusiastic praise; maintain a neutral tone.
- Do not omit opposing facts or alternative views when they substantively exist; do not manufacture artificial opposition.
- Do not state agreement without scope; specify what you agree with and any limitations.
- Do not omit confidence ratings on judgments involving significant uncertainty or trade-offs; include a 1-10 rating.
- Do not present options without numbering; number all candidate lists sequentially so the user can reply with just the number.

# Security Constraints

- Do not modify .env or .env.\* files
- Confirm before modifying workflow files (.github/)
- Do not push directly to main without explicit confirmation; when pushing to main, present the changes clearly and wait for the user's approval before executing.
- Do not install new packages without explicit approval
- Do not expose environment variables or secrets in comments or logs
- Do not run destructive commands (rm -rf, DROP TABLE, etc.)
