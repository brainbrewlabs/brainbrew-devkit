# Codex Beta Release Notes

BrainBrew DevKit now includes beta support for Codex as a first-class runtime. The Codex integration is packaged separately from the Claude Code plugin surface so Codex discovers only Codex-safe commands, agents, skills, hooks, and scripts.

## Included

- Dedicated Codex plugin package: `plugin-codex/`
- Codex marketplace entry: `.agents/plugins/marketplace.json`
- Codex plugin commands:
  - `/brainbrew:init`
  - `/brainbrew:codex-sync-skills`
  - `/brainbrew:status`
  - `/brainbrew:chain-run`
  - `/brainbrew:template-bump`
- Codex-safe agents under `plugin-codex/agents/`
- Codex-safe skills under `plugin-codex/skills/`
- Codex-supported hook template under `plugin-codex/hooks.json`
- Codex hook runner state under `.codex/brainbrew/`
- Global skill projection through `brainbrew codex sync-skills`

## Supported Hooks

BrainBrew installs only Codex-supported hook events:

- `SessionStart`
- `UserPromptSubmit`
- `PreToolUse`
- `PermissionRequest`
- `PostToolUse`
- `Stop`

Claude-only lifecycle events are intentionally not installed for Codex.

## MCP

The BrainBrew MCP server is packaged at:

```bash
plugin-codex/mcp/mcp-server.cjs
```

For beta, register MCP explicitly:

```bash
codex mcp add brainbrew -- node <installed-plugin-root>/mcp/mcp-server.cjs
```

This avoids depending on unverified plugin-root variable expansion for auto-loaded Codex MCP configs.

## Verification Checklist

Before public production:

1. Push or merge this branch so `brainbrewlabs/brainbrew-devkit` includes `plugin-codex/`.
2. In a fresh Codex home, run:

   ```text
   /plugins marketplace add brainbrewlabs/brainbrew-devkit
   /plugins install brainbrew-devkit
   ```

3. Confirm these commands appear and run:
   - `/brainbrew:init`
   - `/brainbrew:codex-sync-skills`
   - `/brainbrew:status`
   - `/brainbrew:chain-run develop`
   - `/brainbrew:template-bump develop`
4. Register MCP manually and verify `chain_list`, `chain_run`, `chain_switch`, `chain_validate`, and `template_bump`.
5. Run `brainbrew codex status` and confirm unsupported hooks are `none`.

## Known Limitations

- Codex workflows are recipe-guided, not Claude-style executable chain state machines.
- Active Codex skills are global under `~/.codex/skills`.
- MCP auto-load through plugin metadata is not enabled in beta until Codex plugin MCP variable behavior is confirmed.
