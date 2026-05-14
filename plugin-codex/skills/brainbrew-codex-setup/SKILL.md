---
name: brainbrew-codex-setup
description: Use when setting up, verifying, or repairing BrainBrew DevKit in Codex, including hooks, global skills, MCP config, runner files, and plugin-native assets.
---

# BrainBrew Codex Setup

Use this skill when the user asks to install BrainBrew for Codex, repair missing hooks, sync skills, or verify that BrainBrew is available after plugin installation.

## Setup Flow

1. Confirm the BrainBrew package or plugin is available locally.
2. Run:

   ```bash
   brainbrew codex init
   brainbrew codex sync-skills
   brainbrew codex status
   ```

3. If `brainbrew codex init` reports a missing runner, build or reinstall the package so `plugin-codex/scripts/codex-runner.cjs` exists.
4. If status reports `hooks = true: no`, ask the user to add this to `~/.codex/config.toml`:

   ```toml
   hooks = true
   ```

5. If MCP tools are needed, compare `codex mcp list` with the packaged server at `plugin-codex/mcp/mcp-server.cjs`.

## Codex Runtime Rules

- BrainBrew writes supported hook entries to `~/.codex/hooks.json`.
- `plugin_hooks = false` is acceptable.
- Active Codex skills live in `~/.codex/skills`.
- Workflow recipes guide the work; they do not execute automatic Claude-style chain routing.
- Do not add `SubagentStart`, `SubagentStop`, `SessionEnd`, `Notification`, `PreCompact`, or `PostCompact` to Codex hooks.
