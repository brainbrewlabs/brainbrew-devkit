import type { ProviderDef } from './registry.js';

/**
 * Wire-format adapters.
 *
 * Different LLM APIs are NOT all OpenAI Chat Completions. The endpoint suffix,
 * auth scheme, request body, and response shape all vary. The plugin can't guess
 * the suffix from the URL — so the `adapter` field in providers.json names the
 * wire format, and the adapter owns the four things that differ:
 *
 *   buildUrl       — endpoint suffix (`/chat/completions` vs `/v1/messages` vs `:generateContent`)
 *   authHeaders    — auth scheme (Bearer vs x-api-key vs x-goog-api-key)
 *   buildBody      — request body shape
 *   extractContent — where the text answer lives in the response JSON
 *
 * The decide contract is shared: every adapter asks the model for JSON-only
 * output and returns the raw text; the HTTP client JSON.parses that into
 * {route, reason}. Adapters differ in transport + envelope, not the protocol.
 *
 * baseURL is always user-supplied (no preset/guessed base URLs). The suffix is
 * appended idempotently — if a baseURL already ends with the suffix, it is not
 * doubled, so a user can paste a full endpoint URL and it still works.
 */

export type AdapterKind = 'openai' | 'anthropic' | 'gemini';

export const ADAPTER_KINDS: readonly AdapterKind[] = ['openai', 'anthropic', 'gemini'];

export interface ProviderAdapter {
  kind: AdapterKind;
  /** Full request URL. Never embeds secrets (auth is in headers), so it is display-safe. */
  buildUrl(baseURL: string, model: string): string;
  /** Auth headers for the inline token, or `{}` when no token is set (no-auth request). */
  authHeaders(token: string | null): Record<string, string>;
  /** Request body for a single-user-message decide prompt. */
  buildBody(model: string, prompt: string): unknown;
  /** Pull the text answer out of the parsed response JSON. Empty string ⇒ caller treats as failure. */
  extractContent(json: unknown): string;
}

function trimBase(base: string): string {
  return base.replace(/\/+$/, '');
}

/** Append `suffix` unless `base` already ends with it — avoids `/chat/completions/chat/completions`. */
function withSuffix(base: string, suffix: string): string {
  const b = trimBase(base);
  return b.endsWith(suffix) ? b : b + suffix;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/** OpenAI Chat Completions — also OpenRouter, Groq, DeepSeek, Mistral, Together, xAI, Ollama, Xiaomi MiMo, MiniMax, Gemini OpenAI-shim. */
const openai: ProviderAdapter = {
  kind: 'openai',
  buildUrl: (base) => withSuffix(base, '/chat/completions'),
  authHeaders: (token) => {
    const h: Record<string, string> = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  },
  buildBody: (model, prompt) => ({
    model,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0,
  }),
  extractContent: (json) => {
    const j = json as { choices?: Array<{ message?: { content?: string } }> };
    return str(j.choices?.[0]?.message?.content);
  },
};

/** Anthropic Messages API — native `/v1/messages`, x-api-key auth, content-block response. */
const anthropic: ProviderAdapter = {
  kind: 'anthropic',
  buildUrl: (base) => withSuffix(base, '/v1/messages'),
  authHeaders: (token) => {
    const h: Record<string, string> = {};
    if (token) {
      h['x-api-key'] = token;
      h['anthropic-version'] = '2023-06-01';
    }
    return h;
  },
  buildBody: (model, prompt) => ({
    model,
    max_tokens: 1024,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  }),
  extractContent: (json) => {
    const j = json as { content?: Array<{ type?: string; text?: string }> };
    const block = j.content?.find((b) => b.type === 'text') ?? j.content?.[0];
    return str(block?.text);
  },
};

/** Google Gemini native — `/models/{model}:generateContent`, x-goog-api-key auth, candidates/parts response. */
const gemini: ProviderAdapter = {
  kind: 'gemini',
  buildUrl: (base, model) => `${trimBase(base)}/models/${model}:generateContent`,
  authHeaders: (token) => {
    const h: Record<string, string> = {};
    if (token) h['x-goog-api-key'] = token;
    return h;
  },
  buildBody: (_model, prompt) => ({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0, responseMimeType: 'application/json' },
  }),
  extractContent: (json) => {
    const j = json as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return str(j.candidates?.[0]?.content?.parts?.[0]?.text);
  },
};

export const ADAPTERS: Record<AdapterKind, ProviderAdapter> = { openai, anthropic, gemini };

/** Resolve the adapter for a provider. Defaults to `openai` when `provider` is unset. */
export function resolveAdapter(provider: ProviderDef): ProviderAdapter {
  return ADAPTERS[provider.provider ?? 'openai'] ?? ADAPTERS.openai;
}
