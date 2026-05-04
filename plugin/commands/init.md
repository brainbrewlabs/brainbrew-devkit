---
description: Register brainbrew chain hooks in ~/.claude/settings.json (required for opencode)
---

Call the `mcp__plugin_brainbrew-devkit_brainbrew__init` MCP tool with no arguments.

After it returns, tell the user:
- The number of events registered and the runner path it wrote.
- That they must restart opencode (or Claude Code) for the new hook entries to be picked up.
- That this step is idempotent and only required once per machine for opencode users — Claude Code reads hooks directly from the plugin manifest.

Do not modify `~/.claude/settings.json` yourself; rely on the MCP tool.
