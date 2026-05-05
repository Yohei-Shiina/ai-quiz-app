---
name: create-issue
description: Creates GitHub issues following project conventions. Use when creating an issue or when the user asks to open or file an issue. Automatically applies the correct title format, body template, and repository target.
---

# Create Issue

## Before Creating

**Always show the draft to the user and get confirmation before running `gh issue create`.** Never create an issue without explicit approval.

## Repository Target

| Issue type | Repository | URL |
|---|---|---|
| App development (features, bugs, UI) | `ai-quiz-app` | https://github.com/Yohei-Shiina/ai-quiz-app |
| Project management, docs, CLAUDE.md | `one-step-archive` | https://github.com/Yohei-Shiina/one-step-archive |

**Rule:** Does this issue touch actual app code? → YES: `ai-quiz-app`, NO: `one-step-archive`

## Title Format

```
As a [user/developer], I can <what they can do>
```

- English only
- Describe the capability from the user or developer perspective

### Examples

```
As a user, I can log in with Google
As a developer, I can read functions written in consistent arrow function style
```

## Body Template

```
## Background
<Why this issue exists. What problem it solves or what decision was made.>

## Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Definition of Done
<Describe the state when this issue is complete.>
```

- English only
- Background = optional for simple issues, required for refactors and architecture decisions
- Tasks = concrete implementation steps (one checkbox per unit)
- Definition of Done = observable outcome, not a task list

## Labels

Apply exactly one priority label:

| Label | When to use |
|---|---|
| `priority: high` | Core user-facing functionality; app feels broken without it |
| `priority: medium` | Noticeable gap but app still usable |
| `priority: low` | Polish / nice-to-have, not urgent |

## gh Command

```bash
gh issue create \
  --repo Yohei-Shiina/<repo> \
  --title "As a [user/developer], I can ..." \
  --body "..." \
  --label "priority: <high|medium|low>"
```
