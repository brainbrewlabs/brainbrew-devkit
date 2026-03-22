---
name: chain-builder
description: >-
  Set up workflow templates for projects. Trigger when user says:
  "set up a workflow", "create a development workflow", "I need a CI/CD pipeline",
  "set up devops", "initialize project workflow", "bump develop", "bump devops",
  "create agent chain", "set up marketing workflow", "configure dev environment".
  Templates: develop, devops, marketing, research, docs, support, data, moderation, review, minimal.
argument-hint: "bump <template>"
---

# Chain Builder

## EXECUTE THIS EXACT BASH COMMAND

When user says "bump [template]", run this **single bash command** (replace TEMPLATE value):

```bash
TEMPLATE="devops" && PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-/Users/noroom113/company/brainbrewlabs/brainbrew-devkit/plugin}" && mkdir -p .claude/agents .claude/skills .claude/hooks && cp "$PLUGIN_ROOT/config/templates/$TEMPLATE/agents/"*.md .claude/agents/ 2>/dev/null; cp -r "$PLUGIN_ROOT/config/templates/$TEMPLATE/skills/"* .claude/skills/ 2>/dev/null; cp "$PLUGIN_ROOT/config/templates/$TEMPLATE.yaml" .claude/chain-config.yaml && echo "=== Bumped $TEMPLATE ===" && cat .claude/chain-config.yaml && echo "" && echo "Agents:" && ls .claude/agents/*.md 2>/dev/null
```

## CRITICAL RULES

1. **USE BASH ONLY** - Do NOT use Write tool
2. **SINGLE COMMAND** - Run everything in one bash call
3. **USE `cp`** - Copy the YAML file, do NOT write new content
4. The `cp` command copies the FULL config including `flow:` section with routes

## Templates

`develop`, `devops`, `marketing`, `research`, `docs`, `support`, `data`, `moderation`, `review`, `minimal`

## What gets copied

- `agents/*.md` → `.claude/agents/`
- `skills/*` → `.claude/skills/`
- `$TEMPLATE.yaml` → `.claude/chain-config.yaml` (has hooks + flow)

## Next Steps - Customize Your Workflow

After bumping a template, suggest these options to the user:

| Want to... | Say this |
|------------|----------|
| Create a new agent | "Create an agent for [task]" → triggers `/improve-agent` |
| Create a new skill | "Create a skill for [task]" → triggers `/skill-creator` |
| Improve an agent | "Improve my [agent-name] agent" → triggers `/improve-agent` |
| Improve a skill | "Improve my [skill-name] skill" → triggers `/skill-improver` |
| Find more skills | "Find me a skill for [task]" → triggers `/skillhub` |

## After Bump - Tell User

After successfully bumping a template, tell the user:

```
Workflow set up! You can now:
- "Create an agent for X" - add custom agents
- "Create a skill for Y" - add custom skills
- "Improve my [agent] agent" - enhance existing agents
- "Find a skill for Z" - search SkillHub for more skills
```
