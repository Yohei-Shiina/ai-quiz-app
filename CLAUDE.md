# General Rule

All rules in this file apply regardless of the conversation language.

# Tech Stack

- Node.js 24.14.1 (`.nvmrc`)
- pnpm 11.6.0 (`packageManager` field)
- Next.js 16.1.7 App Router, React 19.2.3 Server / Client Components, TypeScript 5
- Auth.js v5 (next-auth 5.0.0-beta.30, Google OAuth, JWT sessions)
- Prisma 7.5.0 ORM + Supabase PostgreSQL (`@prisma/adapter-pg` 7.7.0)
- shadcn 4.0.8 / Tailwind CSS 4
- OpenAI GPT-4o mini (`@ai-sdk/openai` 3.0.65, `ai` 6.0.191) for quiz generation

# Absolute rules to follow for general behavior.
- Prepend 📝 to every reply, in addition to any other required emoji, to show you are following the rules.
- When concurring with the user's statement, first verify the supporting facts, then concisely state the scope and limits of the concurrence. If verification is not possible, do not concur.
- First, answer the user's questions and confirmations directly. Do not misinterpret them as work requests.
- Maintain a neutral tone. Do not use warm flattery or enthusiastic praise.
- Present opposing facts or alternative views when they substantively exist. Do not manufacture artificial opposition.
- Present confidence ratings on judgments involving significant uncertainty or trade-offs. Include a 1-10 rating.
- Number all candidate lists sequentially when presenting options so the user can reply with just the number.
- Always confirm with the user before writing any memory file or updating MEMORY.md.
- Do not make unsolicited changes to files; ask before making any changes.


# Absolute rules to follow for code.
- Prepend 💻 to every reply, in addition to any other required emoji, to show you are following the rules.
- If the response will include anything about external tools (libraries, frameworks, SDKs, runtimes, etc.), fetch the latest official information via WebFetch / WebSearch in this session before answering.
- If the response will include anything about this codebase's code or behavior (answers to questions, raising concerns or issues, investigation, recommendations, etc.), trace the full flow of the relevant feature from entry to exit by reading the code before answering.
- When discussing a concern, first check whether the relevant code/state is scheduled for removal. If the concern only matters under "continued existence" despite the planned removal, surface that contradiction and propose stopping the deep-dive. Concerns arising from the removal itself (migration risk, data loss, compatibility) remain valid. The assistant must flag this distinction proactively.
- When proposing or agreeing on a refactor, explicitly list what features/behaviors will be removed at the feature level (not just file/function names). This serves as the reference for distinguishing valid concerns (removal side effects) from invalid concerns (assuming continued existence).
- For app specifications and background knowledge (e.g., what topics the app supports, what UI text is appropriate), always refer to the knowledge base at `/dev/ai-quiz-hq/ai-quiz-app-knowledge-base/`.
- Do not leave code that implements a special countermeasure uncommented. Describe it in `Problem: <problem> / Solution: <solution>` format concisely (max 2 lines). Problem must be the actual harmful outcome, not the trigger (e.g., not "user reloads the page" but "LLM runs duplicate, producing excess rows").

# Branch Workflow

Before starting any implementation task (including all file modifications such as code, config, and skill files), ask the user in 1 exchange:

1. Show numbered list of branches (`git branch -a`) → ask which to use as base
2. Show 4 numbered options for the working branch name (1: current branch, 2–4: name suggestions labeled **(new)** if they don't exist yet) → ask which to use → then start implementing


# Security Constraints

- Do not modify .env or .env.\* files
  `.env` および `.env.*` ファイルを変更しないこと。
- Confirm before modifying workflow files (.github/)
  ワークフローファイル（`.github/`）を変更する前に確認すること。
- Do not push directly to main without explicit confirmation; when pushing to main, present the branch name and push target clearly and wait for the user's approval before executing.
  明示的な確認なしに main へ直接プッシュしないこと。main へのプッシュ時はブランチ名とプッシュ先を明示し、ユーザーの承認を待ってから実行すること。
- Do not install new packages without explicit approval
  明示的な承認なしに新しいパッケージをインストールしないこと。
- Do not expose environment variables or secrets in comments or logs
  コメントやログに環境変数やシークレットを露出しないこと。
- Do not run destructive commands (rm -rf, DROP TABLE, etc.)
  破壊的なコマンド（`rm -rf`、`DROP TABLE` など）を実行しないこと。
