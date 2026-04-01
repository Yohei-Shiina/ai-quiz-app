# PR Title Convention

## Format

```
<type>: <summary>
```

## Types


| Type       | Use when                                       |
| ---------- | ---------------------------------------------- |
| `feat`     | Adding a new feature                           |
| `fix`      | Fixing a bug                                   |
| `refactor` | Improving code without changing behavior       |
| `chore`    | Dependency updates, CI, config changes         |
| `docs`     | Documentation only                             |
| `style`    | Formatting, semicolons, etc. (no logic change) |
| `test`     | Adding or updating tests                       |


## Summary Rules

- English, lowercase start, no trailing period
- Use imperative mood (`add`, `fix`, `update`)
- 50 characters max
- Describe **what**, not **why** (why goes in the PR body)

## Examples

```
feat: add user profile page
fix: resolve null pointer on login
chore: bump next.js to 15.1
refactor: extract auth logic into hook
docs: add PR title convention
```

## Notes

- Based on [Conventional Commits](https://www.conventionalcommits.org/).
- Scope (e.g., `feat(auth):`) is optional. Add when the project grows.

