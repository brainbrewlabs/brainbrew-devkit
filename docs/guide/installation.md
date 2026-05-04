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

brainbrew-devkit also runs under [opencode](https://opencode.ai), but **only via the [oh-my-opencode (OHO)](https://github.com/code-yeongyu/oh-my-opencode) plugin** — opencode itself does not read Claude Code plugin manifests. OHO ships a Claude Code plugin loader that discovers plugins from `~/.claude/plugins/` and registers their hooks, agents, and skills inside opencode.

### Setup

1. **Install OHO first** in your opencode config (`~/.config/opencode/opencode.json`):

   ```json
   {
     "plugin": ["oh-my-openagent@latest"]
   }
   ```

2. **Install brainbrew-devkit through Claude Code** as shown above. OHO picks it up automatically from `~/.claude/plugins/installed_plugins.json`.

3. **Restart opencode.** OHO scans the installed plugins on startup, loads `plugin/hooks/hooks.json`, substitutes `${CLAUDE_PLUGIN_ROOT}` with the actual install path, and dispatches hook events to brainbrew's runner.

Without OHO, opencode will not see brainbrew's hooks or chain routing, even if the plugin is installed in Claude Code.

## Next Steps

- [Quick Start](/guide/quick-start) — Set up your first workflow
- [Templates](/templates/) — Browse available workflow templates
