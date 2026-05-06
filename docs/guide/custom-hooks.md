# Custom Hooks

Run your own scripts at lifecycle events alongside Brainbrew's built-ins.

## Overview

The plugin's `runner.cjs` dispatches built-in chain logic (`post-agent`, `subagent-start`, `subagent-stop`, `post-tool-use`) inline for each event. Chain files only contain a `flow:` section — there is **no** `hooks:` block in the chain YAML.

For your own scripts, create `.claude/hooks.yaml` at the project root. Scripts there run **after** the built-ins for the matching event.

## Registering User Hooks

`.claude/hooks.yaml`:

```yaml
PostToolUse:
  - ./my-post-validator.js
SubagentStart:
  - ./inject-env-context.js
SessionEnd:
  - ./cleanup.js
```

## Script Path Resolution

| Prefix | Resolves to | Example |
|--------|-------------|---------|
| `./` | `{cwd}/.claude/hooks/` | `./my-hook.js` |
| `/absolute` | Absolute path | `/usr/local/hooks/lint.js` |
| `plugin:` | Plugin's built-in scripts | `plugin:post-agent.cjs` (rarely needed — built-ins run automatically) |

## Script Contract

Your script receives the hook event payload via **stdin** (JSON) and communicates back via **stdout** + **exit code**:

| Exit code | stdout | Effect |
|-----------|--------|--------|
| `0` | _(empty)_ | No-op |
| `0` | `{"decision": "block", "reason": "..."}` | Block the tool use |
| `2` | JSON with `hookSpecificOutput` | Inject context into Claude's conversation |
| `0` | Any other text | Pass-through output |

## Example: Inject Context

```js
const stdin = require('fs').readFileSync(0, 'utf-8');
const payload = JSON.parse(stdin);

console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'SubagentStart',
    additionalContext: `<system-reminder>Environment: ${process.env.NODE_ENV}</system-reminder>`,
  },
}));
```

Save as `.claude/hooks/inject-env-context.js` and register in `.claude/hooks.yaml`.

## Example: Block Dangerous Commands

```js
const stdin = require('fs').readFileSync(0, 'utf-8');
const payload = JSON.parse(stdin);
const cmd = payload.tool_input?.command || '';

if (cmd.includes('deploy') && cmd.includes('production')) {
  console.log(JSON.stringify({
    decision: 'block',
    reason: 'Production deploys require manual approval',
  }));
}
```

Save as `.claude/hooks/block-prod-deploy.js` and add under `PostToolUse` in `.claude/hooks.yaml`.

## Built-in Behaviour (no config required)

### post-agent (PostToolUse)

Fires after an agent completes. Reads the active chain's `decide:` prompt, calls Haiku, picks the next agent, and emits the MANDATORY NEXT STEP instruction.

### runner / subagent-start (PreToolUse + SubagentStart)

PreToolUse injects the previous agent's full output into the next agent's prompt under a `## Previous Agent Output (type)` section. SubagentStart adds chain state, team context, and any per-node `context:` field as a `<system-reminder>` block. No setup needed.

#### Per-Agent Context Injection

Use `context:` on a flow node to inject agent-specific instructions:

```yaml
flow:
  implementer:
    context: |
      Follow No Comments Policy.
      Use Base UI components.
    routes:
      code-reviewer: "Done"
```

### subagent-stop (SubagentStop)

Verifies output quality and blocks incomplete work with retry feedback.

### session-end (SessionEnd)

Cleans up Memory Bus session data.

## Hook Events

| Event | When it fires |
|-------|---------------|
| `PreToolUse` | Before any tool runs |
| `PostToolUse` | After any tool completes |
| `SubagentStart` | When a subagent spawns |
| `SubagentStop` | When a subagent completes |
| `SessionEnd` | When the Claude Code session ends |
