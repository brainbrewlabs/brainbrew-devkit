---
name: requesting-code-review
description: >-
  Request a code review by dispatching a code-reviewer subagent.
  Triggers on "review my code", "request code review", "check my implementation", "review before merge".
  NOT for moderation review — use moderation/review instead.
  NOT for plan review — use plan-review instead.
argument-hint: [description of what was implemented]
allowed-tools: Read, Bash
---

Request a code review for the following work:
<request>$ARGUMENTS</request>

## When to Use

- After completing a task or implementing a major feature
- Before merging changes to the main branch
- When stuck and needing a fresh perspective on code
- Before refactoring to establish a baseline
- After fixing a complex bug

## When NOT to Use

- Reviewing flagged user content for moderation — use **moderation/review**
- Reviewing a plan before implementation — use **plan-review**
- Running tests — let the tester agent handle it

## Instructions

1. **Get git SHAs** — run these commands to identify the review range:
   ```bash
   BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
   HEAD_SHA=$(git rev-parse HEAD)
   ```
2. **Dispatch code-reviewer subagent** — use the Task tool with superpowers:code-reviewer type, filling the template at `code-reviewer.md` with these placeholders:
   - `{WHAT_WAS_IMPLEMENTED}` — what you just built
   - `{PLAN_OR_REQUIREMENTS}` — what it should do
   - `{BASE_SHA}` — starting commit
   - `{HEAD_SHA}` — ending commit
   - `{DESCRIPTION}` — brief summary
3. **Act on feedback**:
   - Fix Critical issues immediately
   - Fix Important issues before proceeding
   - Note Minor issues for later
   - Push back if reviewer is wrong (with technical reasoning)

## Integration with Workflows

- **Subagent-driven development** — review after each task, fix before moving to next
- **Executing plans** — review after each batch of 3 tasks
- **Ad-hoc development** — review before merge or when stuck

## Rules

- Never skip review because "it's simple"
- Never ignore Critical issues
- Never proceed with unfixed Important issues
- If reviewer is wrong, push back with technical reasoning and evidence

See template at: requesting-code-review/code-reviewer.md
