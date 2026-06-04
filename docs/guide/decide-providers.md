# Decide Providers

A node's `decide:` prompt picks the next route in a chain. By default that routing
runs through `claude -p` (headless Claude, billed as API usage). You can route with a
cheaper or local model instead by registering a **provider** and activating it.

## Config

Providers live in one user-global file — set once, every chain on the machine uses it:

```
~/.claude/brainbrew/providers.json
```

```json
{
  "active_decide_provider": "minimax",
  "require_decide_provider": false,
  "providers": {
    "minimax": {
      "provider": "openai",
      "baseURL": "https://host/gateway/v1",
      "model": "MiniMax/MiniMax-M2.7",
      "token": "sk-..."
    },
    "local": {
      "baseURL": "http://localhost:11434/v1",
      "model": "qwen2.5:7b"
    }
  }
}
```

OpenAI-compatible endpoints (OpenAI, OpenRouter, LiteLLM, Ollama, vLLM, Groq, DeepSeek,
xAI, Xiaomi MiMo, MiniMax, …) work out of the box. Anthropic and Gemini native APIs work
too — see `provider` below. `token` present → auth header for that adapter; omit it for
no-auth (e.g. local Ollama).

### Endpoint: `baseURL` vs `endpoint`

Two ways to point at the API — no URL guessing, each field has one meaning:

| Field | Meaning |
|---|---|
| `baseURL` | A **base** URL. The protocol adapter appends the path — for `provider: "openai"` (default) that's `/chat/completions`. Same convention as the OpenAI SDK / Continue / `@ai-sdk/openai-compatible`. |
| `endpoint` | A **full** URL, used **verbatim** (no path added). Escape hatch for non-standard routes. Wins if both are set. |

```
baseURL:  https://host/v1                  → POST https://host/v1/chat/completions
endpoint: https://host/custom/route        → POST https://host/custom/route  (as-is)
```

### `provider`: the wire-format adapter

`provider` picks the adapter — the endpoint suffix, auth header, request body, and
response parser. Default is `"openai"`. The suffix is appended to `baseURL` only (an
explicit `endpoint` is always verbatim).

| `provider` | suffix appended to `baseURL` | auth header | reads response from |
|---|---|---|---|
| `openai` (default) | `/chat/completions` | `Authorization: Bearer <token>` | `choices[].message.content` |
| `anthropic` | `/v1/messages` | `x-api-key` + `anthropic-version` | `content[].text` |
| `gemini` | `/models/<model>:generateContent` | `x-goog-api-key` | `candidates[].content.parts[].text` |

```json
{
  "provider": "anthropic",
  "baseURL": "https://api.anthropic.com",
  "model": "claude-3-5-haiku-latest",
  "token": "sk-ant-..."
}
```

There are **no preset base URLs** — you always supply `baseURL` (or `endpoint`). An unknown
`provider` value is rejected at load with a warning.

### Settings

| Key | Meaning |
|---|---|
| `active_decide_provider` | Provider name every `decide:` node routes through. Chain-wide — no per-node or per-repo override. Set to `""` to turn off (falls back to `claude -p`). |
| `require_decide_provider` | `true` forbids the silent `claude -p` fallback — guarantees a configured provider is used, never silently spends `claude -p` credits. |

## When does routing call a model?

A routing LLM (provider, else `claude -p`) fires **only on a branching node** — all
three must hold:

1. the node has a `decide:` block, **and**
2. the upstream agent output is **> 50 chars**, **and**
3. there is ≥ 1 non-END route to choose.

Everything else is deterministic (no model call):

| Node shape | What runs | source tag |
|---|---|---|
| All routes = END | stop | `[skip]` |
| 1 non-END route, no `decide:` | take it | `[skip]` |
| `decide:` present but output ≤ 50 chars | keyword match | `[keyword]` |
| **`decide:` + output > 50 + ≥1 route** | routing LLM (below) | — |

So straight-line single-route hops never call a provider; only nodes that actually
branch on agent output do.

## The decide cascade

When the routing-LLM tier is reached, behavior splits on `require_decide_provider`:

**`require_decide_provider: false` (default — best effort):**

1. Provider resolved + reachable → `[provider:NAME]`
2. Provider call fails (timeout / 4xx / 5xx) or returns garbage → keyword → `[fallback:NAME-error]`
3. No provider resolved → `claude -p` (haiku) → `[claude-p]`; keyword on failure

**`require_decide_provider: true` (strict — the provider must decide):**

1. Provider resolved + reachable → `[provider:NAME]`
2. Provider call **fails** or returns garbage → **error, chain stops** → `[error:provider-failed]`
3. No provider resolved (unset / typo) → **error, chain stops** → `[error:no-provider]`

In strict mode there is **no silent fallback** — not `claude -p`, not keyword. If the
configured provider can't make the call, the chain hard-stops so you notice.

## Managing providers

Ask Claude in chat — it invokes the matching MCP **tool** (these are tools, not slash
commands; the built-in `/mcp` only opens the server manager):

| Ask Claude | Tool called | Effect |
|---|---|---|
| "list my decide providers" | `providers_list` | show providers + which is active + fix hints |
| "use xiaomi-mimo as the decide provider" | `providers_use` | write `active_decide_provider` |
| "test the active provider" (or name one) | `providers_test` | 1-token ping → pass/fail + latency |

`providers_use` is the correct way to activate a provider. `chain_switch` is unrelated —
it only changes which chain *flow* is active, never the provider.

To turn routing off, set `active_decide_provider: ""` in providers.json (no tool unsets it).

## Observing which path ran

Each routing decision is logged to `~/.claude/tmp/chain-events.jsonl` as a `complete`
event with a `reason` field carrying the `[source]` tag above:

```bash
grep '"agent":"<node>"' ~/.claude/tmp/chain-events.jsonl | tail -1
```

`[provider:xiaomi-mimo]` = provider HTTP used · `[claude-p]` = fallback to Claude ·
`[keyword]` / `[fallback:…]` = deterministic keyword.

## Troubleshooting

**Chain stops with "CHAIN ROUTING ERROR … no provider configured and require_decide_provider is on" (`[error:no-provider]`).**
You set `require_decide_provider: true` but no valid `active_decide_provider`. Fix — edit
`~/.claude/brainbrew/providers.json` and either:

1. set `active_decide_provider` to a configured provider name (verify with `providers_test`), or
2. set `require_decide_provider: false` to allow the `claude -p` fallback.

**Chain stops with "provider … HTTP … and require_decide_provider is on" (`[error:provider-failed]`).**
The active provider is configured but the call failed (bad endpoint, token, model, or
network). In strict mode that's a hard stop instead of a silent keyword fallback. Fix —
run `providers_test` to see the exact error, correct the provider entry, or set
`require_decide_provider: false` to allow best-effort fallback.