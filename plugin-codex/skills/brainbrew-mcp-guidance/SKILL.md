---
name: brainbrew-mcp-guidance
description: Use when configuring or troubleshooting BrainBrew MCP access in Codex, including .mcp.json, codex mcp commands, and available BrainBrew MCP tools.
---

# BrainBrew MCP Guidance

BrainBrew ships an MCP server at `plugin-codex/mcp/mcp-server.cjs`. Codex users should manage MCP registration with `codex mcp`.

## Verify MCP

```bash
codex mcp list
```

If BrainBrew is missing, register the installed plugin's `mcp/mcp-server.cjs` with an absolute path.

## Useful BrainBrew Tools

- `template_bump`: copy a workflow recipe into `.codex/brainbrew/chains`.
- `template_list`: list packaged BrainBrew workflow templates.
- `chain_list`: list copied BrainBrew workflow recipes.
- `chain_switch`: set the active BrainBrew workflow recipe.
- `chain_run`: activate a workflow recipe and return Codex guidance.
- `chain_validate`: check the active workflow recipe structure.

## Guardrails

- Do not print secrets from MCP config.
- Prefer `codex mcp get brainbrew` or `codex mcp list` for diagnostics.
- Keep MCP registration separate from hook setup; hooks are handled by `brainbrew codex init`.
