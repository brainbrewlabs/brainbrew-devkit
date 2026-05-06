# Workflow Templates

Pre-built agent chains for common workflows.

::: tip Templates are reference examples, not best practice
Every project is different — your real workflow needs its own chain. Ask **chain-builder**: *"Build me a chain for this project"*. It reads your codebase, asks a few questions, and writes a chain that fits. Use templates as a starting point to copy from.
:::

| Template | Agents | Chain |
|----------|--------|-------|
| [develop](/templates/develop) | 12 | planner → plan-reviewer → implementer → **parallel-review** (team) → tester → git-manager |
| [devops](/templates/devops) | 10 | code-scanner → security-auditor → test-runner → deployer → monitor |
| [marketing](/templates/marketing) | 6 | researcher → content-writer → editor → seo-optimizer → publisher → analyzer |
| [research](/templates/research) | 5 | topic-researcher → source-gatherer → analyzer → synthesizer → report-writer |
| [docs](/templates/docs) | 5 | code-scanner → doc-generator → doc-reviewer → formatter → publisher |
| [support](/templates/support) | 5 | ticket-classifier → router → knowledge-searcher → response-drafter → reviewer |
| [data](/templates/data) | 5 | data-collector → cleaner → analyzer → visualizer → reporter |
| [moderation](/templates/moderation) | 5 | content-scanner → classifier → flagger → reviewer → actioner |
| [review](/templates/review) | 1 | code-reviewer → END |
| [skill-dev](/templates/skill-dev) | 4 | skill-finder → skill-creator → skill-reviewer (PASS=END, FIX→skill-improver) |

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
