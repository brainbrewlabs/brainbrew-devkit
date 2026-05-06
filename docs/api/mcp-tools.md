# MCP Tools Reference

All brainbrew functionality exposed via MCP tools.

## Template Tools

### template_bump

Set up a workflow template in the current project.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| template | string | Yes | Template name. The schema's `enum` is generated at server startup from `plugin/config/templates/*.yaml` — call `template_list` for the current set. |

**Example:**

```
mcp__brainbrew__template_bump(template: "develop")
```

### template_list

List all available workflow templates.

**Parameters:** None

**Example:**

```
mcp__brainbrew__template_list()
```

## Chain Tools

### chain_validate

Validate the active chain config.

**Checks:**
- All agents in flow exist
- Team nodes have valid teammates
- Routes point to valid targets
- No dead-end nodes

**Parameters:** None

**Example:**

```
mcp__brainbrew__chain_validate()
```

### chain_list

List all available chains and show which is active.

**Parameters:** None

**Example:**

```
mcp__brainbrew__chain_list()
```

### chain_switch

Switch the active chain.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| chain | string | Yes | Chain name to activate |

**Example:**

```
mcp__brainbrew__chain_switch(chain: "discovery")
```

### chain_run

Activate a chain and enforce spawning its first agent immediately. Switches the active chain, clears previous state, and instructs Claude to spawn the first agent.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| chain | string | Yes | Chain name to run |

**Example:**

```
mcp__brainbrew__chain_run(chain: "develop")
```

### stop_chain

Stop the active chain. Clears all pending chain-state files so PreToolUse/Stop guards no longer block. MCP equivalent of typing `skip chain` — but global, not per-session.

**Parameters:** None

**Example:**

```
mcp__brainbrew__stop_chain()
```

## Setup Tools

### init

Register brainbrew chain hooks in `~/.claude/settings.json`. Required once for opencode users (Claude Code reads hooks directly from the plugin manifest, so this is optional under Claude Code).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| events | string[] | No | Subset of events to register. Defaults to all. |

**Example:**

```
mcp__brainbrew__init()
```

## Memory Bus Tools

### memory_add

Send a message to agents via Memory Bus.

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| content | string | Yes | - | Message content |
| target | string | No | global | Who receives: global, next, agent:NAME, chain:NAME |
| persistence | string | No | session | session, once, permanent |
| priority | string | No | normal | low, normal, high, urgent |

**Example:**

```
mcp__brainbrew__memory_add(
  content: "Fix the auth bug",
  target: "agent:implementer",
  persistence: "once"
)
```

### memory_list

List messages in the Memory Bus.

**Parameters:** None

**Example:**

```
mcp__brainbrew__memory_list()
```

### memory_clear

Clear messages from Memory Bus.

**Parameters:** None (clears all session messages)

**Example:**

```
mcp__brainbrew__memory_clear()
```
