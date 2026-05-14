---
name: codex-status
description: Diagnose BrainBrew's Codex plugin, hook, skill, runner, and MCP setup.
---

# /codex-status

Check BrainBrew's Codex runtime status and report actionable next steps.

## Workflow

1. Run:

   ```bash
   brainbrew codex status
   ```

2. Review:
   - `hooks = true`
   - BrainBrew hook count
   - unsupported hook names
   - runner presence
   - generated skill count
   - stale or missing generated skills
   - project BrainBrew state

3. If MCP access is needed, also run:

   ```bash
   codex mcp list
   ```

4. Summarize only problems and the smallest next command to fix each one.

## Guardrails

- This command is read-only except for any diagnostics Codex itself records.
- Do not print secrets or MCP environment values.
