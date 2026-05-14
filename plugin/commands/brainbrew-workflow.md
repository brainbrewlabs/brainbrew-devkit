---
name: brainbrew-workflow
description: Use a BrainBrew template as a Codex recipe-guided workflow for planning, implementation, review, and testing.
---

# /brainbrew-workflow

Use BrainBrew workflow guidance in Codex without assuming automatic Claude-style chain routing.

## Arguments

- `template`: optional workflow template name. Common values: `develop`, `review`, `docs`, `devops`, `research`, `skill-dev`.
- `task`: optional task description.

## Workflow

1. If BrainBrew skills have not been synced, run:

   ```bash
   brainbrew codex sync-skills
   ```

2. Pick the closest synced workflow skill, such as `develop-workflow`, `review-workflow`, or `docs-workflow`.
3. Follow the recipe as role guidance:
   - clarify or plan when the recipe starts with planning
   - implement in scoped steps
   - run the relevant review and verification gates
   - keep user-owned files and unrelated edits intact

4. Report which workflow recipe was used and which checks were completed.

## Guardrails

- Workflow YAML is guidance in Codex, not an executable state machine.
- Do not spawn unavailable Claude subagents or rely on `SubagentStart`/`SubagentStop`.
