# OpenCode Quickstart

Brainbrew DevKit supports [OpenCode](https://opencode.ai) as a first-class platform alongside Claude Code.

## Install

```bash
npm install -g brainbrew-opencode
```

Then register the plugin in `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["brainbrew-opencode"]
}
```

Restart OpenCode — **brainbrew** will appear in the Plugins list (`ctrl+p` → Plugins).

## Optional: Set a Routing Model

By default brainbrew uses keyword-only routing (no AI call). To enable AI-powered routing, add a `brainbrew` section to your config:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["brainbrew-opencode"],
  "brainbrew": {
    "routingModel": "anthropic/claude-haiku-4-5"
  }
}
```

Any model available in OpenCode works: `openai/gpt-4o-mini`, `google/gemini-flash-2.0`, etc.

## Set Up a Workflow

After restarting, ask OpenCode to set up a workflow:

```
"Set up a development workflow"
```

Or call the MCP tool directly:

```
mcp__brainbrew__template_bump(template: "develop")
```

## Start Working

```
/code implement feature X   → plan → code → review → test → commit
```

The chain handles routing, retries, and coordination automatically.

## Project-Level Config

To configure routing per-project, add `opencode.json` in your project root:

```json
{
  "brainbrew": {
    "routingModel": "openai/gpt-4o-mini"
  }
}
```

Project config takes priority over global config.

## Available Templates

| Template | Agents | Chain |
|----------|--------|-------|
| **develop** | 22 | planner → plan-reviewer → implementer → **parallel-review** → tester → git-manager |
| **devops** | 10 | code-scanner → security-auditor → test-runner → deployer → monitor |
| **review** | 1 | code-reviewer → END |
| **minimal** | 0 | hooks only |

See [all templates](/templates/) for the full list.

## Difference from Claude Code

| | Claude Code | OpenCode |
|---|---|---|
| Routing AI | Claude Haiku (built-in) | Configurable via `routingModel` |
| Install | `/plugin install` | `npm install -g brainbrew-opencode` |
| Hook system | `settings.json` | Plugin `hooks` export |
| MCP | `mcp.json` | `mcp` plugin export |

## Next Steps

- [Chain Workflow](/guide/chain-workflow) — How chains and routing work
- [Custom Agents](/guide/custom-agents) — Create your own agents
- [Templates](/templates/) — Browse workflow templates
