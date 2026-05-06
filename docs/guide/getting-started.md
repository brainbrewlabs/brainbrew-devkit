# Getting Started

This guide will help you get up and running with Brainbrew Devkit in minutes.

## What is Brainbrew?

Brainbrew Devkit adds an orchestration layer to Claude Code — self-correcting agent pipelines with automatic routing, retry, and coordination.

Instead of manually deciding what agent to run next, Brainbrew uses AI-powered routing (via Haiku) to analyze output and pick the appropriate next step.

## Quick Setup

### 1. Install the Plugin

```bash
/plugin marketplace add brainbrewlabs/brainbrew-devkit
/plugin install brainbrew-devkit
```

### 2. Build a Chain (recommended)

The included templates are **examples, not best practice**. Every project has its own workflow — ask **chain-builder** to design one that fits:

```
"Build me a chain for this project"
"I need: design review → implement → security scan → deploy"
```

Need a specific capability? Ask **skill-finder** — it searches Vercel Skills, GitHub, and Anthropic's official skills, then installs a match.

Or start from a template:

```
"Set up a development workflow"
```

This installs the `develop` template with 22 agents and a full chain flow.

### 3. Start Working

```
/code implement login feature
```

The pipeline runs automatically:
- **planner** creates the plan
- **plan-reviewer** validates it
- **implementer** writes code
- **code-reviewer** checks quality (routes back if issues)
- **tester** runs tests (routes to debugger if fails)
- **git-manager** commits and creates PR

## Core Concepts

### Chain Flow

A chain defines the sequence of agents and routing rules:

```yaml
flow:
  code-reviewer:
    routes:
      tester: "Code approved, ready for testing"
      implementer: "Code has issues, needs fixes"
    decide: |
      If code is APPROVED → "tester"
      If ANY bugs, issues → "implementer"
```

### Memory Bus

Agents communicate via the Memory Bus:

```
"Tell implementer to fix the auth bug"
→ memory_add(content: "...", target: "agent:implementer")
```

### Agent Teams

Run multiple agents in parallel at a chain step:

```yaml
parallel-review:
  type: team
  teammates:
    - name: code-quality
      agent: code-reviewer
    - name: security-check
      agent: security-scan
```

## Next Steps

- [Installation](/guide/installation) — Detailed setup instructions
- [Chain Workflow](/guide/chain-workflow) — Deep dive into chains
- [Templates](/templates/) — Browse available templates
