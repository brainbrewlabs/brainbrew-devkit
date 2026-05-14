---
name: codex-init
description: Install BrainBrew's supported Codex hook entries and create project state.
---

# /codex-init

Run BrainBrew's Codex runtime initializer for the current workspace.

## Workflow

1. Verify this repository or installed plugin package has been built. The runner must exist at `plugin/scripts/codex-runner.cjs`.
2. Run:

   ```bash
   brainbrew codex init
   ```

3. If the command reports `hooks = true` is missing, tell the user to add it to `~/.codex/config.toml` and rerun this command.
4. Report the updated hooks file path and remind the user to restart Codex if hook changes are not picked up.

## Guardrails

- Do not add Claude-only hook names to `~/.codex/hooks.json`.
- Preserve unrelated user hooks.
- `plugin_hooks = false` is acceptable; BrainBrew uses supported global hooks.
