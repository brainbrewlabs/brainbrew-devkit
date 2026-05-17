---
name: brainbrew:status
description: Diagnose BrainBrew DevKit's Codex plugin, hook, skill, runner, workflow state, and MCP setup.
---

# /brainbrew:status

Run:

```bash
brainbrew codex status
```

If MCP access is relevant, also run:

```bash
codex mcp list
```

Summarize only problems and the smallest next command to fix each one.

Do not print secrets or MCP environment values.
