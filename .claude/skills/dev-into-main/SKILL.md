---
name: dev-into-main
description: Creates a "Dev into Main" release PR from dev to main using Changelog format. Use when the user wants to promote dev changes to main.
---

# Dev into Main

## Purpose

Create a release PR from `dev` → `main`. No branch workflow prompt needed — source and target are fixed.

## Steps

### 1. Check pending commits

```bash
git log main..dev --oneline
```

If output is empty, tell the user there is nothing to release and stop.

### 2. Categorize commits

Map commit prefixes to Changelog sections:

| Commit prefix | Section |
|---|---|
| `feat(db):` | **Migration** |
| `feat:` / `feat(*):` | **Added** |
| `fix:` / `fix(*):` | **Fixed** |
| `chore:` / `docs:` / `style:` / `refactor:` / `test:` | **Internal** |

Rules:
- Use the **commit subject** (after the prefix), not the raw commit line
- Rewrite into user-facing plain language (e.g. "add multi-select topic deletion" → "複数トピックの一括削除")
- Omit sections with no entries
- Migration section describes the schema change and the required deploy command (`prisma migrate deploy`)

### 3. Create the PR

```bash
gh pr create \
  --base main \
  --head dev \
  --title "Dev into Main" \
  --body "..."
```

Body format:

```markdown
## Added
- <user-facing description>

## Fixed
- <user-facing description>

## Internal
- <brief description>

## Migration
- <schema change description> （要 `prisma migrate deploy`）
```

Only include sections that have entries.
