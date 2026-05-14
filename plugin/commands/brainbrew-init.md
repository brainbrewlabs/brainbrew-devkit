---
name: brainbrew:init
description: Initialize BrainBrew DevKit for Codex by installing supported global hooks and creating project state.
---

# /brainbrew:init

Run:

```bash
brainbrew codex init
```

Then report the updated hooks file path and whether `hooks = true` is enabled in `~/.codex/config.toml`.

Guardrails:

- Preserve unrelated user hooks.
- Do not add Claude-only hook names to Codex.
- `plugin_hooks = false` is acceptable because BrainBrew installs supported global Codex hooks.
