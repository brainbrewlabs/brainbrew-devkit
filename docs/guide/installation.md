# Installation

## Claude Code

**Prerequisites:** Claude Code CLI, Node.js 18+

```bash
/plugin marketplace add brainbrewlabs/brainbrew-devkit
/plugin install brainbrew-devkit
```

After installation, **restart your Claude Code session** for hooks and agents to take effect.

Verify:

```bash
/plugins
```

You should see `brainbrew-devkit` in the list.

## OpenCode

**Prerequisites:** [OpenCode](https://opencode.ai), Node.js 18+

```bash
npm install -g brainbrew-opencode
```

Add to `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["brainbrew-opencode"]
}
```

Restart OpenCode — brainbrew will appear in the Plugins list.

See [OpenCode Quickstart](/guide/opencode) for routing model setup and per-project config.

## Next Steps

- [Quick Start](/guide/quick-start) — Claude Code workflow setup
- [OpenCode Quickstart](/guide/opencode) — OpenCode workflow setup
- [Templates](/templates/) — Browse available workflow templates
