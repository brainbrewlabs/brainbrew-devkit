---
name: discover
description: Trigger AI Discovery chain for exploring and optimizing prompts, skills, and agents through multi-agent debate
trigger: When user says "discover", "explore possibilities", "optimize prompts", "improve agents", "brainstorm with agents"
---

# AI Discovery Chain

Launch multi-agent exploration and debate to discover novel solutions and optimize AI artifacts.

## Usage

```
/discover <topic>
/discover optimize the marketing template for viral content
/discover improve the explorer agent's creativity
/discover find better patterns for error handling
```

## What It Does

1. **Phase 0: Intent Discovery** — Clarifies what you're trying to achieve
2. **Phase 1: Parallel Exploration** — Multiple agents explore from different angles
3. **Phase 2: Forum Debate** — Agents challenge and stress-test ideas
4. **Phase 3: Synthesis** — Moderator extracts actionable insights
5. **Phase 4: Optimization** — Apply improvements to prompts/skills/agents
6. **Phase 5: Validation** — Verify changes work correctly
7. **Phase 6: Report** — Document discoveries and changes

## Chain Flow

```
intent-discovery → parallel-exploration → forum-debate → synthesis
                           ↑                               ↓
                           └──── (max 2 rounds) ←──────────┘
                                                           ↓
                                              optimization → validation → report
```

## Execution

When user invokes `/discover`:

1. **Parse the topic** from arguments
2. **Spawn intent-discoverer** agent with the topic to clarify intent and define exploration directive
3. **Wait for intent analysis** — this shapes all subsequent exploration
4. The chain continues automatically via hooks

### Spawn Command

```
Agent(
  name: "intent-analyst",
  subagent_type: "intent-discoverer",
  prompt: "Analyze intent for: {user_topic}. Define exploration directive, success criteria, and what to avoid."
)
```

## Options

- `/discover <topic>` — Full chain with intent discovery
- `/discover fast <topic>` — Skip intent discovery, jump to exploration
- `/discover debate <ideas>` — Skip exploration, go straight to debate on provided ideas

## Output

The chain produces:
- **Discovery Report** — Summary of exploration, debates, and conclusions
- **Optimized Artifacts** — Improved agent/skill/prompt files (if optimization phase runs)
- **Seeds for Future** — Unresolved questions for next exploration cycle

## Examples

```
/discover how to make the critic agent more constructive
/discover ways to reduce token usage in the development chain
/discover fast viral marketing hooks for tech products
/discover debate "use websockets vs SSE for real-time updates"
```
