---
name: implement-ui
description: Implements UI components and pages for this project using shadcn/ui + Tailwind CSS. Use when implementing any frontend UI — components, pages, or layouts. Applies this project's design system (Warm Collection) and always uses shadcn components where available.
---

# implement-ui

You are a shadcn/ui + Tailwind CSS expert implementing UI for this specific project.

**If the UI library changes in the future, update this skill to reflect the new library.**

## Step 1: Read design constraints

Always read these two files before implementing anything:

- `/Users/yoheishiina/dev/one-step-archive/ai-quiz-app/reference/brand_tokens.md` — color tokens, typography rules, animation patterns
- `/Users/yoheishiina/dev/one-step-archive/ai-quiz-app/reference/frontend_implementation_guide.md` — component selection rules, layout patterns

## Constraint: Frontend only

Do not read or edit backend files. This includes:
- `lib/dal/`, `features/`, `prisma/`, any `actions.ts` / `services.ts` / `schema.prisma`

If the UI needs data from the server (props, server actions), use `any` or define a minimal inline type on the spot. Do not implement polling, data fetching logic, or server actions — leave those as stubs or omit entirely. The goal is visuals only.

## Step 2: Break down the implementation

Analyze what the user wants to build. List the UI elements needed (cards, inputs, buttons, avatars, etc.).

## Step 3: Determine which shadcn components to use

For each UI element:

1. Check `.claude/docs/shadcn-registry.md` — does a shadcn component exist for this?
2. If YES and it's already in `components/ui/` → read that file to discover all sub-components, then use them
3. If YES but NOT in `components/ui/` → propose installing it with `pnpm dlx shadcn add <name>` before implementing
4. If NO → implement with Tailwind only

**Rule: shadcn components take priority. Design differences are resolved with Tailwind overrides, not by avoiding the component.**

**Exception — use plain HTML instead when BOTH conditions are met:**
1. The number of classes that only undo shadcn defaults (not add design) is **3 or more**
2. The component's built-in behavior (focus ring, ARIA, keyboard interaction) is **not needed**

Example: `<Button>` as a full-width card wrapper needs `block p-0 h-auto hover:bg-transparent` (4 undo classes) and provides no needed behavior → use `<button>` instead.
Counter-example: `<Button>` for a submit "Go" needs 3 undo classes but provides `disabled` state + focus ring → keep shadcn.

## Step 4: Read relevant component files

For every shadcn component you plan to use, read `components/ui/<name>.tsx` in full. Identify all exported sub-components and their default classes. This is mandatory — never assume what sub-components exist.

## Step 5: Implement

- Use shadcn components where available
- Override styles with Tailwind classes to match brand_tokens.md
- Never use `font-semibold` (600) — use `font-normal`, `font-medium`, or `font-bold` only
- Use `font-display italic` for user-generated content (topic names, headings)
- Use `font-sans` for all UI text

## Step 6: Report

After implementing, list any shadcn components that were candidates but not used, with a clear reason for each. If every candidate was used, say so explicitly.
