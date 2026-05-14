---
name: brainbrew-mcp-guidance
description: Use when configuring or troubleshooting BrainBrew MCP access in Codex, including .mcp.json, codex mcp commands, and available BrainBrew MCP tools.
---

# BrainBrew MCP Guidance

BrainBrew ships an MCP server at `plugin/mcp/mcp-server.cjs`. Codex users should manage MCP registration with `codex mcp`.

## Verify MCP

```bash
codex mcp list
```

If BrainBrew is missing, use the Codex server definition in `plugin/codex/mcp.json` as the source of truth. For local development, register the server with an absolute path to the installed plugin's `mcp/mcp-server.cjs`.

## Useful BrainBrew Tools

- `template_bump`: copy a workflow template into the project.
- `chain_list`: list available chain configs.
- `chain_validate`: check chain structure.
- `memory_add`: pass guidance to agents or future phases.
- `memory_list`: inspect current memory.
- `list_agents`: list project agents.
- `list_skills`: list project skills.

## Guardrails

- Do not print secrets from MCP config.
- Prefer `codex mcp get brainbrew` or `codex mcp list` for diagnostics.
- Keep MCP registration separate from hook setup; hooks are handled by `brainbrew codex init`.
