---
name: codex-sync-skills
description: Sync BrainBrew's Codex-compatible skills into the user's global Codex skills directory.
---

# /codex-sync-skills

Project BrainBrew skills, workflow recipes, and role guidance into Codex global skills.

## Workflow

1. Run:

   ```bash
   brainbrew codex sync-skills
   ```

2. Summarize the number of installed or updated skills.
3. If conflicts are reported, explain that BrainBrew preserves user-owned skills in `~/.codex/skills` unless they contain BrainBrew ownership metadata.
4. Suggest `brainbrew codex status` to verify the resulting setup.

## Guardrails

- Do not manually delete user skills.
- Do not claim Claude-style chain execution in Codex. Synced workflow skills are recipe guidance.
