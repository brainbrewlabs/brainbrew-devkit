# Getting Started

This guide will help you get up and running with Brainbrew Devkit in minutes.

## What is Brainbrew?

**Self-correcting agent chains for Claude Code and opencode.** A chain of agents takes turns. One plans, one codes, one reviews, one tests, one commits. If an agent fails, another fixes it and the chain retries — automatically.

Instead of manually deciding what agent to run next, Brainbrew uses AI-powered routing (via Haiku) to analyze each agent's output and pick the appropriate next step.

## Prerequisites

- [Claude Code](https://docs.claude.com/en/docs/claude-code) or [opencode](https://opencode.ai)
- Node.js 18+

## Quick Setup

### 1. Install the Plugin

```bash
/plugin marketplace add brainbrewlabs/brainbrew-devkit
/plugin install brainbrew-devkit
```

After installation, **restart Claude Code** (or opencode) for hooks, agents, and the chain config to take effect.

### 2. Build a Chain (recommended)

Templates are **reference examples, not best practice**. Every project is different — your real workflow needs its own chain. Just describe it:

```
"Build me a chain for this project"
"I need: design review → implement → security scan → deploy"
```

The **chain-builder** agent reads your codebase, asks a few questions, and writes a chain that fits.

Need a specific capability? Ask **skill-finder** — it searches Vercel Skills, GitHub, and Anthropic's official skills, then installs a match:

```
"Find a skill for writing tests"
"Install a skill for database migrations"
```

Or start from a template (use only as a copy-from starting point):

```
"Set up a development workflow"
```

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
