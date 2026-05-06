# Hook System

`runner.cjs` dispatches built-in chain scripts (`post-agent`, `subagent-start`, `subagent-stop`, `post-tool-use`) inline for the relevant events. Chain template files only contain a `flow:` section — no `hooks:` block.

For user customization, create `.claude/hooks.yaml` to register additional scripts that run after the built-ins for any lifecycle event.

Chain routing (MANDATORY NEXT STEP) triggers when the agent type is defined in the active chain's `flow:` section.

### Chain Enforcement (built into runner.cjs)

Before running user hooks, `runner.cjs` enforces pending chain steps:

- **PreToolUse:** Blocks all non-Agent tool calls when a chain step is pending. Returns a block decision with a reminder to spawn the required agent.
- **Stop:** Blocks session stop when a chain step is pending. Returns a MANDATORY NEXT STEP reminder.
- **Release:** After 3 blocked attempts on the same event, the pending state is cleared and the block is lifted with a hint.
- **Bypass:** The user can type `skip chain` or `/skip-chain` at any time to clear the pending chain step immediately.

Each agent automatically receives the previous agent's full output injected into its prompt by the PreToolUse hook (`runner.cjs`) as a `## Previous Agent Output ({type})` section. This requires no configuration — it happens for every agent in a chain.

# Agent Chain Protocol (MANDATORY)

## Hook-Driven Chaining

Agent workflow is managed by PostToolUse hooks. When a hook emits a **MANDATORY NEXT STEP** instruction, you MUST follow it exactly.

### Rules

1. **After any chain agent completes, ONLY follow the hook instruction.** Do NOT do manual work between chain steps (no searching, no editing, no running commands yourself).
2. **Do NOT background chain agents.** Always wait for foreground completion so the hook can fire and chain.
3. **Do NOT manually spawn chain agents.** Only spawn the FIRST agent in a chain (e.g., `implementer` for `/code`, `planner` for `/cook`). Hooks handle the rest.
4. **Do NOT run tests via Bash.** Let the `tester` agent handle it.
5. **Do NOT edit code/plans yourself** when a chain agent (planner, implementer) should do it.

### Chain Flow

```
planner -> plan-reviewer -> implementer -> parallel-review (team) -> tester -> git-manager
              | ISSUES        | ISSUES           | ISSUES            | FAIL
            planner        implementer        implementer        debugger -> implementer
```

### What "follow the hook" means

- Hook says "spawn planner" -> you spawn planner. Do NOT read files and edit the plan yourself.
- Hook says "spawn implementer" -> you spawn implementer. Do NOT write code yourself.
- Hook says "spawn debugger" -> you spawn debugger. Do NOT debug yourself.
- Hook says nothing (no MANDATORY NEXT STEP) -> chain is done, report to user.
