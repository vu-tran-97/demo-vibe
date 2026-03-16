---
name: no-any-type
description: Prevent usage of 'any' type in TypeScript source code
event: PostToolUse
tools: ["Write", "Edit"]
action: block
---

# Rule: No `any` Type

## Pattern
Check if the written/edited file is a TypeScript file under `src/` and contains `: any`, `as any`, `<any>`, or `any[]`.

## Exclusions
- Type declaration files (`*.d.ts`)
- Config files

## Message
Do not use `any` type. Use proper type annotations or `unknown` if the type is truly dynamic. See CLAUDE.md Prohibited Practices.
