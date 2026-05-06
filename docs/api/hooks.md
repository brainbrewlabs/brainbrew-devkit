# Hooks Reference

Built-in hooks that power the chain engine. They are dispatched inline by `runner.cjs` — no chain-level configuration is required.

## post-agent (PostToolUse)

Fires after an agent completes. Reads the active chain's `decide:` prompt, calls Haiku, picks the next agent.

**Behavior:**

1. Agent completes
2. Load active chain from `.claude/chains/{active}.yaml`
3. If `decide` prompt exists → call Haiku with routing rules
4. Haiku returns `{"route": "agent-name", "reason": "..."}`
5. Emit MANDATORY NEXT STEP instruction

## runner (PreToolUse) + subagent-start (SubagentStart)

Injects context when an agent spawns:

- Previous agent's full output (auto-injected into the new agent's `prompt`)
- Chain state
- Team context (if part of a parallel team)
- Per-node `context:` field as a `<system-reminder>` block

## subagent-stop (SubagentStop)

Verifies output quality, blocks incomplete work with retry feedback.

**Quality Checks:**

- Output not empty
- No critical errors
- Task appears complete

## session-end (SessionEnd)

Cleans up Memory Bus session data. Runs automatically.

## User Hooks

To run your own scripts at any lifecycle event, create `.claude/hooks.yaml`:

```yaml
PostToolUse:
  - ./my-validator.js
SubagentStart:
  - ./inject-env.js
```

User hooks run **after** the built-ins. See [Custom Hooks](/guide/custom-hooks) for the full guide.

## Hook Contract

Your script receives the hook event payload via **stdin** (JSON) and communicates back via **stdout** + **exit code**:

| Exit code | stdout | Effect |
|-----------|--------|--------|
| `0` | _(empty)_ | No-op |
| `0` | `{"decision": "block", "reason": "..."}` | Block the tool use |
| `2` | JSON with `hookSpecificOutput` | Inject context |
| `0` | Any other text | Pass-through output |

## Script Path Resolution

| Prefix | Resolves to | Example |
|--------|-------------|---------|
| `./` | `{cwd}/.claude/hooks/` | `./my-hook.js` |
| `/absolute` | Absolute path | `/usr/local/hooks/lint.js` |
| `plugin:` | Plugin's built-in scripts | `plugin:post-agent.cjs` |

## Hook Events

| Event | When it fires |
|-------|---------------|
| `PreToolUse` | Before any tool runs |
| `PostToolUse` | After any tool completes |
| `SubagentStart` | When a subagent spawns |
| `SubagentStop` | When a subagent completes |
| `SessionEnd` | When the Claude Code session ends |
