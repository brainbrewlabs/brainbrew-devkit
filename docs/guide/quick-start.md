# Quick Start

::: tip Build your own (recommended)
Templates are **examples, not best practice**. For a chain that fits your project, ask **chain-builder**:

```
"Build me a chain for this project"
```

The agent reads your codebase, asks a few questions, and writes a chain. Use templates only as a quick starting point.
:::

## 1. Pick a Template

After installing the plugin, set up a workflow template:

```
"Set up a development workflow"   → Full dev pipeline with 22 agents
"I need a CI/CD pipeline"         → DevOps chain with auto-rollback
```

Or use the MCP tool directly:

```
mcp__brainbrew__template_bump(template: "develop")
```

## 2. Restart Claude Code

After bumping a template, restart your Claude Code session for the new hooks, agents, and chain config to take effect.

## 3. Start Working

```
/code implement feature X         → Pipeline runs: plan → code → review → test → commit
```

That's it. The chain handles routing, error recovery, and coordination.

## opencode users

brainbrew-devkit also runs under [opencode](https://opencode.ai) via the [oh-my-opencode (OHO)](https://github.com/code-yeongyu/oh-my-opencode) plugin.

::: warning Prerequisite
Install the plugin in **Claude Code** first. opencode has no plugin marketplace — OHO discovers brainbrew-devkit from `~/.claude/plugins/` after Claude Code installs it.
:::

After installing in Claude Code:

1. Add OHO to `~/.config/opencode/opencode.json`:
   ```json
   { "plugin": ["oh-my-openagent@latest"] }
   ```
2. Run `/brainbrew-devkit:init` to write hook entries to `~/.claude/settings.json` (OHO only dispatches hooks declared there, not from plugin manifests).
3. Restart opencode.

Claude Code reads hooks directly from the plugin manifest — step 2 is **only** required for opencode. See [Installation](/guide/installation#opencode-support) for the full guide.

## Natural Language Commands

```
"Create an agent for API testing"      → create_agent(...)
"Build me a deployment skill"          → create_skill(...)
"Tell implementer to fix the bug"      → memory_add(target: agent:implementer)
"What agents do I have?"               → list_agents()
```

## Available Templates

| Template | Chain |
|----------|-------|
| **develop** | plan → code → review → test → commit |
| **devops** | scan → secure → test → deploy |
| **marketing** | research → write → edit → publish |
| **research** | gather → analyze → report |
| **docs** | scan code → write → review |
| **support** | classify → answer → review |
| **data** | collect → clean → chart → report |
| **moderation** | scan → classify → flag → act |
| **review** | code-reviewer only |
| **skill-dev** | build new agent skills |

## Next Steps

- [Chain Workflow](/guide/chain-workflow) — Understand how chains work
- [Memory Bus](/guide/memory-bus) — Inter-agent communication
- [Custom Agents](/guide/custom-agents) — Create your own agents
