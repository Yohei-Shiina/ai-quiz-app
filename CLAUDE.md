# Tech Stack

- Next.js 15 App Router (TypeScript), React Server / Client Components
- Auth.js v5 (Google OAuth, JWT sessions)
- Prisma ORM + Supabase PostgreSQL
- shadcn/ui + Tailwind CSS
- OpenAI GPT-4o mini for quiz generation

# Branch Workflow

Before starting any implementation task, ask the user in 2 exchanges:
1. Show numbered list of branches (`git branch -a`) → ask which to use as base
2. Show 4 numbered options for the working branch name (1: current branch, 2–4: name suggestions labeled **(new)** if they don't exist yet) → ask which to use → then start implementing

# Security Constraints

- Do not modify .env or .env.\* files
- Confirm before modifying workflow files (.github/)
- Do not push directly to main
- Do not install new packages without explicit approval
- Do not expose environment variables or secrets in comments or logs
- Do not run destructive commands (rm -rf, DROP TABLE, etc.)
