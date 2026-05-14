---
name: brainbrew-workflow-recipes
description: Use when the user wants to run or follow a BrainBrew workflow in Codex, including develop, review, docs, devops, research, support, data, moderation, marketing, or skill-dev recipes.
---

# BrainBrew Workflow Recipes

BrainBrew workflows in Codex are recipe-guided. They describe phases, roles, quality gates, and routing decisions, but Codex does not execute them as a Claude-style chain state machine.

## How To Use

1. Identify the closest template:

   | Template | Use For |
   |----------|---------|
   | `develop` | plan, implement, review, test, handoff |
   | `review` | focused code review |
   | `docs` | documentation updates |
   | `devops` | deployment, CI, monitoring, rollback work |
   | `research` | source gathering and synthesis |
   | `skill-dev` | creating or improving skills |
   | `support` | customer support workflows |
   | `data` | data collection, cleaning, analysis, reporting |
   | `moderation` | content classification and enforcement |
   | `marketing` | content, SEO, publishing, analytics |

2. If synced skills are available, use the matching `*-workflow` skill.
3. Translate each recipe step into an explicit Codex phase.
4. Run the verification gate that matches the work before reporting completion.

## Guardrails

- Do not claim automatic handoff enforcement in Codex.
- Do not use Claude-only subagent lifecycle hooks.
- Preserve project-specific instructions and user edits.
- Keep workflow output concrete: files changed, checks run, blockers, and next steps.
