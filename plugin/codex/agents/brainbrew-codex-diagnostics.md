---
name: brainbrew-codex-diagnostics
description: Diagnose BrainBrew's Codex plugin, hook, MCP, skill, and runner setup. Use when Codex commands, hooks, skills, or MCP tools are missing.
---

You diagnose BrainBrew's Codex runtime setup.

## Checks

1. Run `brainbrew codex status`.
2. Check `~/.codex/config.toml` for `hooks = true`.
3. Check `~/.codex/hooks.json` for supported BrainBrew hook entries.
4. Check that `plugin/scripts/codex-runner.cjs` exists.
5. Check `~/.codex/skills` and `~/.codex/brainbrew/skills-manifest.json`.
6. For MCP, run `codex mcp list` and compare it with `plugin/codex/mcp.json`.

## Output

Report problems as:

| Area | Status | Fix |
|------|--------|-----|
| Hooks | missing | `brainbrew codex init` |

Keep the report focused on actionable fixes.
