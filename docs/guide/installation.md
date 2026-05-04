# Installation

## Prerequisites

- Claude Code CLI installed
- Node.js 18+

## Install the Plugin

```bash
/plugin marketplace add brainbrewlabs/brainbrew-devkit
/plugin install brainbrew-devkit
```

After installation, **restart your Claude Code session** for the new hooks, agents, and chain config to take effect.

## Verify Installation

After restarting, check that the plugin is active:

```bash
/plugins
```

You should see `brainbrew-devkit` in the list.

## opencode support

brainbrew-devkit runs under [opencode](https://opencode.ai) via the [oh-my-opencode (OHO)](https://github.com/code-yeongyu/oh-my-opencode) plugin. OHO discovers Claude Code plugins from `~/.claude/plugins/` and registers their agents, skills, commands, and MCP servers inside opencode.

### Setup

1. **Install OHO** in your opencode config (`~/.config/opencode/opencode.json`):

   ```json
   {
     "plugin": ["oh-my-openagent@latest"]
   }
   ```

2. **Install brainbrew-devkit through Claude Code** as shown above. OHO will surface its agents, skills, and MCP tools (`chain_run`, `template_bump`, etc.) inside opencode automatically.

3. **Run the `init` MCP tool** to register hooks in `~/.claude/settings.json`. From inside opencode (or Claude Code), invoke the brainbrew MCP:

   ```
   mcp__plugin_brainbrew-devkit_brainbrew__init
   ```

   or in chat: *"run brainbrew init"*. The tool writes hook entries with absolute paths to the plugin's `runner.cjs`, so opencode's lack of `${CLAUDE_PLUGIN_ROOT}` env propagation is not a problem.

   This step is required for opencode. OHO's `claude-code-hooks` plugin only dispatches hooks declared in `~/.claude/settings.json` — it does **not** dispatch hooks shipped inside plugin manifests. Without this step, chain routing (PostToolUse → next agent) will not fire under opencode even though the plugin is installed.

4. **Restart opencode** so the new hook entries are picked up.

::: tip
Claude Code reads hooks directly from the plugin manifest, so you don't need `brainbrew init` for Claude Code — only for opencode.
:::

## Next Steps

- [Quick Start](/guide/quick-start) — Set up your first workflow
- [Templates](/templates/) — Browse available workflow templates
