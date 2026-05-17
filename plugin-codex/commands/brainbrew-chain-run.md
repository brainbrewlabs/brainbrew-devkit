---
name: brainbrew:chain-run
description: Follow a BrainBrew workflow recipe in Codex. Usage: /brainbrew:chain-run [template]
args:
  template: BrainBrew workflow template name, such as develop, review, docs, devops, research, or skill-dev
---

# /brainbrew:chain-run

Use BrainBrew workflow guidance in Codex without assuming automatic Claude-style chain routing.

1. If BrainBrew MCP tools are available, call `chain_run` for the requested template.
2. If MCP is not available, use the matching synced `*-workflow` skill as recipe guidance.
3. Translate each workflow node into explicit Codex phases: planning, implementation, review, verification, and handoff.
4. Track pending gates under `.codex/brainbrew/` through supported Codex hooks when hooks are enabled.

Guardrails:

- Workflow YAML is guidance in Codex, not an executable state machine.
- Do not rely on Claude-only subagent lifecycle hooks.
- Preserve unrelated user edits and avoid destructive git operations.
