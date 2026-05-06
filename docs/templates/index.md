# Workflow Templates

Pre-built agent chains for common workflows.

::: tip Templates are reference examples, not best practice
Every project is different — your real workflow needs its own chain. Ask **chain-builder**: *"Build me a chain for this project"*. It reads your codebase, asks a few questions, and writes a chain that fits. Use templates as a starting point to copy from.
:::

| Template | Chain |
|----------|-------|
| [develop](/templates/develop) | plan → code → review → test → commit |
| [devops](/templates/devops) | scan → secure → test → deploy |
| [marketing](/templates/marketing) | research → write → edit → publish |
| [research](/templates/research) | gather → analyze → report |
| [docs](/templates/docs) | scan code → write → review |
| [support](/templates/support) | classify → answer → review |
| [data](/templates/data) | collect → clean → chart → report |
| [moderation](/templates/moderation) | scan → classify → flag → act |
| [review](/templates/review) | code-reviewer only |
| [skill-dev](/templates/skill-dev) | build new agent skills |

## Usage

Set up a template using natural language:

```
"Set up a development workflow"
"I need a CI/CD pipeline"
```

Or use the MCP tool directly:

```
mcp__brainbrew__template_bump(template: "develop")
```

## After Bumping

After bumping a template, **restart your Claude Code session** for the new hooks, agents, and chain config to take effect.

## Mix and Match

Start with one template and add agents from another:

```bash
# Start with develop template
mcp__brainbrew__template_bump(template: "develop")

# Copy agents from devops template manually
# Then add to your chain config
```
