# Skill-Dev Template

Workflow for building new Claude Code agent skills end-to-end — from discovery through review.

## Chain Flow

```
skill-finder → skill-creator → skill-reviewer → END
                                    ↓ NEEDS FIX
                              skill-improver → skill-reviewer
                                    ↓ REWRITE
                              skill-creator
```

## Agents Included

- **skill-finder** — Searches Vercel Skills, GitHub, and Anthropic's official skills for relevant prior art
- **skill-creator** — Authors the new skill (`SKILL.md`, references, scripts)
- **skill-reviewer** — Audits the skill against quality standards. Returns PASS, NEEDS FIX, or REWRITE
- **skill-improver** — Applies targeted fixes when the reviewer flags issues

## Features

- **Research-first** — `skill-finder` surfaces existing skills before you author a new one
- **Review-driven** — `skill-reviewer` decides between END, fix, or rewrite based on verdict
- **Self-correcting** — fixes loop back through review automatically
- **Reset counters** — the reviewer node resets loop counters so revision cycles aren't capped

## Usage

```
mcp__brainbrew__template_bump(template: "skill-dev")
```

Then restart Claude Code and use:

```
"Build me a skill for writing tests"
"Create a skill that scaffolds React components"
```

## Flow Config

```yaml
flow:
  skill-finder:
    routes:
      skill-creator: "Research complete, ready to create skill"

  skill-creator:
    routes:
      skill-reviewer: "Skill created, ready for review"

  skill-reviewer:
    reset_counters: true
    routes:
      END: "Skill passed review"
      skill-improver: "Skill needs fixes"
      skill-creator: "Skill needs full rewrite"
    decide: |
      If verdict is PASS, no critical or major issues -> "END"
      If verdict is NEEDS FIX, has fixable issues -> "skill-improver"
      If verdict is REWRITE, fundamentally broken -> "skill-creator"

  skill-improver:
    routes:
      skill-reviewer: "Fixes applied, ready for re-review"
```

## When to Use

Use the `skill-dev` template when:

- Authoring a new skill for `.claude/skills/` or your plugin
- You want existing skills surveyed before writing from scratch
- You want a review gate that distinguishes fixable issues from a full rewrite
