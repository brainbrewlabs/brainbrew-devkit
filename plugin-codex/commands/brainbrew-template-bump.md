---
name: brainbrew:template-bump
description: Set up a BrainBrew workflow template for the current project. Usage: /brainbrew:template-bump [template]
args:
  template: BrainBrew workflow template name
---

# /brainbrew:template-bump

Prefer BrainBrew MCP `template_bump` when MCP is registered:

```text
template_bump({ "template": "<template>" })
```

If MCP is not registered, tell the user to register BrainBrew MCP first:

```bash
codex mcp add brainbrew -- node <installed-codex-plugin-root>/mcp/mcp-server.cjs
```

Then verify with:

```bash
codex mcp list
```

Do not copy Claude-only runtime assumptions into Codex. In Codex, the bumped chain remains workflow guidance unless an explicit Codex command or MCP tool is used to drive it.
