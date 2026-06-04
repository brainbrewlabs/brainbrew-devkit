import type { ProviderDef } from './registry.js';
import { resolveProviderToken, resolveProviderUrl } from './registry.js';
import { resolveAdapter } from './adapters.js';

export interface DecideResponse {
  route: string;
  reason: string;
}

export interface HttpCallResult {
  ok: boolean;
  response?: DecideResponse;
  error?: string;
  /** Wall-clock latency for telemetry. */
  duration_ms: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Call a provider's decide endpoint to route a chain.
 *
 * The provider's adapter (openai | anthropic | gemini) supplies the URL suffix,
 * auth headers, request body, and response parser — so non-OpenAI APIs work too.
 *
 * Returns a parsed `{route, reason}` object. The caller validates `route`
 * against the available routes (decide runner does that).
 *
 * Strategy: every adapter asks the model to respond with JSON only; we extract
 * the text content per adapter, then JSON.parse it. This matches the legacy
 * Haiku adapter contract so the decide runner can swap implementations.
 */
export async function callProvider(
  provider: ProviderDef,
  prompt: string,
): Promise<HttpCallResult> {
  const startedAt = Date.now();
  const adapter = resolveAdapter(provider);
  let authHeader: Record<string, string>;
  try {
    authHeader = adapter.authHeaders(resolveProviderToken(provider));
  } catch (e) {
    return { ok: false, error: (e as Error).message, duration_ms: 0 };
  }

  const url = resolveProviderUrl(provider);
  const body = JSON.stringify(adapter.buildBody(provider.model, prompt));

  const timeoutMs = provider.timeout_ms ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...(provider.headers ?? {}),
      },
      body,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        ok: false,
        error: `HTTP ${res.status}: ${text.slice(0, 500) || res.statusText}`,
        duration_ms: Date.now() - startedAt,
      };
    }

    const json = await res.json();
    const content = adapter.extractContent(json);
    if (!content) {
      return {
        ok: false,
        error: 'provider returned empty content',
        duration_ms: Date.now() - startedAt,
      };
    }

    let parsed: { route?: unknown; reason?: unknown };
    try {
      parsed = JSON.parse(content);
    } catch {
      return {
        ok: false,
        error: `provider response was not valid JSON: ${content.slice(0, 200)}`,
        duration_ms: Date.now() - startedAt,
      };
    }
    const route = typeof parsed.route === 'string' ? parsed.route : '';
    const reason = typeof parsed.reason === 'string' ? parsed.reason : '';
    if (!route) {
      return {
        ok: false,
        error: 'provider response missing route field',
        duration_ms: Date.now() - startedAt,
      };
    }
    return { ok: true, response: { route, reason }, duration_ms: Date.now() - startedAt };
  } catch (e) {
    const err = e as Error;
    const aborted = err.name === 'AbortError';
    return {
      ok: false,
      error: aborted ? `provider timeout after ${timeoutMs}ms` : `provider call failed: ${err.message}`,
      duration_ms: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(tid);
  }
}
