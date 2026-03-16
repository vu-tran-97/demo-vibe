---
name: no-console-log
description: Prevent console.log in source code — use a proper logger instead
event: PostToolUse
tools: ["Write", "Edit"]
action: block
---

# Rule: No console.log

## Pattern
Check if the written/edited file is under `src/` and contains `console.log`, `console.warn`, `console.error`, or `console.debug`.

## Exclusions
- Test files (`*.spec.ts`, `*.test.ts`)
- Config files (`next.config.ts`, `*.config.js`)

## Message
Do not use `console.log` in source code. Use a proper logger utility instead. See CLAUDE.md Prohibited Practices.
