---
name: chain-builder
description: Bump workflow templates to project. Use when user says "bump [template]" where template is develop/devops/marketing/research/docs/support/data/moderation/review/minimal.
argument-hint: "bump <template>"
---

# Chain Builder - EXECUTE IMMEDIATELY

## When user says "bump [template]"

**DO NOT ASK QUESTIONS. Execute immediately:**

### Step 1: Identify template from argument

Templates: `develop`, `devops`, `marketing`, `research`, `docs`, `support`, `data`, `moderation`, `review`, `minimal`

### Step 2: Run these bash commands

```bash
# Replace TEMPLATE with the requested template name
TEMPLATE="devops"  # or develop, marketing, etc.

# Create directories
mkdir -p .claude/agents .claude/skills .claude/hooks

# Copy from plugin templates (find plugin path first)
PLUGIN_ROOT=$(dirname $(dirname $(which claude 2>/dev/null || echo "/Users/noroom113/company/brainbrewlabs/brainbrew-devkit/plugin")))
# Or use hardcoded path if CLAUDE_PLUGIN_ROOT not available
PLUGIN_ROOT="/Users/noroom113/company/brainbrewlabs/brainbrew-devkit/plugin"

# Copy agents
cp "$PLUGIN_ROOT/config/templates/$TEMPLATE/agents/"*.md .claude/agents/ 2>/dev/null

# Copy skills
cp -r "$PLUGIN_ROOT/config/templates/$TEMPLATE/skills/"* .claude/skills/ 2>/dev/null

# Write config
cat > .claude/chain-config.yaml << 'EOF'
hooks:
  PostToolUse:
    - plugin:post-agent.cjs
  SubagentStart:
    - plugin:subagent-start.cjs
  SubagentStop:
    - plugin:subagent-stop.cjs
EOF

# Show result
echo "=== Bumped $TEMPLATE ==="
echo "Agents: $(ls .claude/agents/*.md 2>/dev/null | wc -l)"
echo "Skills: $(ls -d .claude/skills/*/ 2>/dev/null | wc -l)"
```

### Step 3: Report success

Show what was copied.

---

## CRITICAL RULES

1. **DO NOT** read from `~/.claude/chains/`
2. **DO NOT** read from `~/.claude/projects/`
3. **DO NOT** ask "what do you mean by bump"
4. **DO** copy templates to `{cwd}/.claude/`
5. **EXECUTE** the bash commands above immediately

## Template Details

| Template | Description |
|----------|-------------|
| develop | Full dev chain (21 agents) |
| devops | CI/CD pipeline (5 agents) |
| marketing | Content marketing (6 agents) |
| research | Research workflow (5 agents) |
| docs | Documentation (5 agents) |
| support | Customer support (5 agents) |
| data | Data pipeline (5 agents) |
| moderation | Content moderation (5 agents) |
| review | Code review only (1 agent) |
| minimal | Empty slate (0 agents) |
