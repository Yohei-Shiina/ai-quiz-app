---
name: create-pr
description: Creates pull requests following project conventions. Use when creating a PR, running gh pr create, or when the user asks to open, submit, or push a PR. Automatically applies the correct title format and body template.
---

# Create PR

## Title Format

`<type>: <summary>`

### Types

| Type       | Use when                                       |
| ---------- | ---------------------------------------------- |
| `feat`     | Adding a new feature                           |
| `fix`      | Fixing a bug                                   |
| `refactor` | Improving code without changing behavior       |
| `chore`    | Dependency updates, CI, config changes         |
| `docs`     | Documentation only                             |
| `style`    | Formatting, semicolons, etc. (no logic change) |
| `test`     | Adding or updating tests                       |

### Summary Rules

- English, lowercase start, imperative mood, no trailing period
- 50 characters max
- Describe **what**, not **why**

### Examples

```
feat: add user profile page
fix: resolve null pointer on login
chore: bump next.js to 15.1
refactor: extract auth logic into hook
```

## PR Body Template

```
## What
<!-- 2-3 sentences -->

## Why
<!-- Why is this change needed? -->

## Changes
<!-- Bullet point per changed file or logical unit -->

## Screenshots
<!-- For UI changes. Remove if not applicable. -->

Closes #<issue_number>
```

## gh Command

```bash
gh pr create --title "<type>: <summary>" --body "..."
```

- Do not pass `--base` (already configured in the workflow)
- Always include the issue number in the body
