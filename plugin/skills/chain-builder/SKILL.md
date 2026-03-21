---
name: chain-builder
description: Create, modify, and manage agent chains and per-project hooks. Use when user says "show chain", "add agent to chain", "create chain", "modify chain", "add hook", "create custom hook", "activate chain", "switch chain", or wants to customize agent workflow.
argument-hint: [describe what you want to do with the chain or hooks]
---

# Chain Builder

Build and manage agent chains + per-project custom hooks. Single YAML = entire chain.

## Workflow

1. **Understand** — read current chain state, show diagram
2. **Modify** — interpret natural language, update chain YAML
3. **Validate** — topology check before any generation
4. **Generate** — produce chain-config.json + agent files + verification rules
5. **Activate** — switch active chain

## Commands

| Intent | Action |
|--------|--------|
| Show chain | Read `chain-config.json` → display text diagram |
| Add agent X after Y | Update YAML → validate → generate |
| Create agent X | Generate agent `.md` + add to YAML |
| Remove agent X | Update YAML → validate → generate |
| When X fails, go to Y | Update conditional routing in YAML |
| Save chain as NAME | Write `~/.claude/chains/NAME.yaml` |
| Activate chain NAME | Load YAML → backup → validate → generate |
| Switch to NAME | Backup current → activate NAME |
| List chains | `ls ~/.claude/chains/*.yaml` |
| Test chain | Run validation, report results |
| Add hook EVENT | Create per-project custom hook |
| Show hooks | List project hooks for current CWD |
| Remove hook NAME | Remove custom hook from project |

## Per-Project Hooks

Manage custom hooks that run per-project alongside the plugin chain. Details in `references/per-project-hooks.md`.

### Quick Reference

```bash
# User says: "add a PostToolUse hook for linting"
# chain-builder does:
1. Encode CWD: /Users/me/myapp → -Users-me-myapp
2. Create ~/.claude/projects/-Users-me-myapp/chain-config.yaml
3. Create ~/.claude/projects/-Users-me-myapp/custom-hooks/lint-check.js
4. Show confirmation
```

## Show Chain Diagram

Read `chain-config.json` and display:

```
planner → plan-reviewer → implementer → code-reviewer → tester → git-manager
              ↓ ISSUES        ↓ ISSUES        ↓ FAIL
            planner        implementer      debugger → implementer
```

## Modify Chain

Parse user's natural language → update `~/.claude/chains/{name}.yaml`.
Schema reference: `references/chain-schema.md`

## Validate

Before every generate, run checks from `references/validation-rules.md`.

## Generate

From YAML, produce chain-config.json + verification-rules.json + agent .md files.
Always backup before overwrite. Never overwrite existing agent `.md` files.

## Rules

- YAML in `~/.claude/chains/` is the source of truth
- Always validate before generate
- Always backup before overwrite
- Ask user to confirm before activating
- Show diagram after every modification
