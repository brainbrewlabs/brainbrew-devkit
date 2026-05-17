---
name: brainbrew:sync-brainbrew-skills
description: Sync BrainBrew-owned workflow, role, template, and helper skills into Codex.
---

# /brainbrew:sync-brainbrew-skills

Run:

```bash
brainbrew codex sync-brainbrew-skills
```

Report installed, skipped, and conflict counts. If conflicts are reported, explain that BrainBrew preserves user-owned skills in `~/.codex/skills` unless they contain BrainBrew ownership metadata.

This command syncs only BrainBrew-owned workflow, role, template, and helper skills. It does not migrate arbitrary Claude Code skills, agents, commands, hooks, or MCP config. For generic Claude Code to Codex migration, use OpenAI's curated `migrate-to-codex` skill.

Do not manually delete user skills.
