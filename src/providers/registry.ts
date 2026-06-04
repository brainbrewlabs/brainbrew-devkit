import { readFileSync, writeFileSync, existsSync } from 'fs';
import { GLOBAL_PROVIDERS_FILE } from '../utils/paths.js';
import type { AdapterKind } from './adapters.js';
import { ADAPTER_KINDS, resolveAdapter } from './adapters.js';

export interface ProviderDef {
  /**
   * Provider / wire format. Picks the endpoint suffix, auth scheme, body shape,
   * and response parser. One of: openai (default) | anthropic | gemini.
   * See adapters.ts.
   */
  provider?: AdapterKind;
  /** Full request URL, used VERBATIM (no suffix appended). Wins over baseURL. */
  endpoint?: string;
  /** Base URL — the adapter appends its suffix (idempotently). Ignored if `endpoint` is set. */
  baseURL?: string;
  model: string;
  token?: string;
  headers?: Record<string, string>;
  /** Optional per-provider timeout (ms). */
  timeout_ms?: number;
}

export interface ProviderRegistry {
  providers: Record<string, ProviderDef>;
  /** Per-name origin for `providers_list` MCP tool. */
  origins: Record<string, string>;
  /** Issues found while loading (malformed entries skipped, not fatal). */
  warnings: string[];
  /** Chain-wide decide provider (providers.json `active_decide_provider`). */
  activeDecideProvider?: string;
  /** Forbid the silent `claude -p` fallback (providers.json `require_decide_provider`). */
  requireDecideProvider?: boolean;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function readJsonOrEmpty(file: string): Record<string, unknown> | null {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf-8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeProvider(name: string, raw: unknown, source: string, warnings: string[]): ProviderDef | null {
  if (!isPlainObject(raw)) {
    warnings.push(`${source}: provider "${name}" must be an object`);
    return null;
  }
  const model = raw.model;
  if (typeof model !== 'string' || !model) {
    warnings.push(`${source}: provider "${name}" missing model`);
    return null;
  }
  const baseURL = typeof raw.baseURL === 'string' && raw.baseURL ? raw.baseURL : undefined;
  const endpoint = typeof raw.endpoint === 'string' && raw.endpoint ? raw.endpoint : undefined;
  if (!baseURL && !endpoint) {
    warnings.push(`${source}: provider "${name}" needs baseURL or endpoint`);
    return null;
  }
  let provider: AdapterKind = 'openai';
  if (typeof raw.provider === 'string') {
    if (!ADAPTER_KINDS.includes(raw.provider as AdapterKind)) {
      warnings.push(
        `${source}: provider "${name}" — unknown provider "${raw.provider}". ` +
          `Use one of: ${ADAPTER_KINDS.join(', ')}`,
      );
      return null;
    }
    provider = raw.provider as AdapterKind;
  }
  const out: ProviderDef = { model, provider };
  if (endpoint) out.endpoint = endpoint;
  if (baseURL) out.baseURL = baseURL;
  // Bearer token inline. Present -> bearer auth, absent -> no auth.
  if (typeof raw.token === 'string' && raw.token) {
    out.token = raw.token;
  }
  if (isPlainObject(raw.headers)) {
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw.headers)) {
      if (typeof v === 'string') headers[k] = v;
    }
    if (Object.keys(headers).length) out.headers = headers;
  }
  if (typeof raw.timeout_ms === 'number' && (raw.timeout_ms as number) > 0) {
    out.timeout_ms = raw.timeout_ms as number;
  }
  return out;
}

function mergeLayer(
  registry: ProviderRegistry,
  file: string,
  data: Record<string, unknown> | null,
): void {
  if (!data) return;

  // Chain-wide routing defaults (global-only; no per-repo override).
  const drp = data.active_decide_provider;
  if (typeof drp === 'string' && drp.trim() !== '') {
    // Non-empty string: must be a valid provider name. Empty/whitespace → unset (off).
    if (/^[a-zA-Z0-9_-]+$/.test(drp)) {
      registry.activeDecideProvider = drp;
    } else {
      registry.warnings.push(`${file}: active_decide_provider must be a provider name string`);
    }
  } else if (drp !== undefined && typeof drp !== 'string') {
    registry.warnings.push(`${file}: active_decide_provider must be a string`);
  }
  if (data.require_decide_provider === true) {
    registry.requireDecideProvider = true;
  }

  const providers = data.providers;
  if (!isPlainObject(providers)) {
    registry.warnings.push(`${file}: missing providers object`);
    return;
  }
  for (const [name, raw] of Object.entries(providers)) {
    const def = normalizeProvider(name, raw, file, registry.warnings);
    if (def) {
      registry.providers[name] = def;
      registry.origins[name] = file;
    }
  }
}

/**
 * Load provider registry from ~/.claude/brainbrew/providers.json (global only).
 */
export function loadProviderRegistry(): ProviderRegistry {
  const registry: ProviderRegistry = { providers: {}, origins: {}, warnings: [] };
  mergeLayer(registry, GLOBAL_PROVIDERS_FILE, readJsonOrEmpty(GLOBAL_PROVIDERS_FILE));
  return registry;
}

/**
 * Return the inline bearer token for a provider, or null if none set.
 * Tokens live inline in providers.json `token`; absent → no-auth request.
 */
export function resolveProviderToken(provider: ProviderDef): string | null {
  return provider.token ?? null;
}

/**
 * Resolve the request URL. An explicit `endpoint` is used verbatim; otherwise the
 * provider's adapter appends its suffix to the user-supplied `baseURL`. No guessing.
 */
export function resolveProviderUrl(provider: ProviderDef): string {
  if (provider.endpoint) return provider.endpoint;
  return resolveAdapter(provider).buildUrl(provider.baseURL ?? '', provider.model);
}

/**
 * Set `active_decide_provider` in providers.json. Validates the name is a
 * configured provider; preserves all other content. Returns {ok} or an error
 * message the caller can surface. Backs the `providers_use` MCP tool.
 */
export function setActiveDecideProvider(name: string): { ok: boolean; error?: string } {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return { ok: false, error: `invalid provider name "${name}"` };
  }
  if (!existsSync(GLOBAL_PROVIDERS_FILE)) {
    return { ok: false, error: `no providers file at ${GLOBAL_PROVIDERS_FILE} — add a provider first` };
  }
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(readFileSync(GLOBAL_PROVIDERS_FILE, 'utf-8')) as Record<string, unknown>;
  } catch {
    return { ok: false, error: `${GLOBAL_PROVIDERS_FILE} is not valid JSON` };
  }
  const providers = isPlainObject(data.providers) ? data.providers : {};
  if (!isPlainObject(providers[name])) {
    const avail = Object.keys(providers);
    return {
      ok: false,
      error: `provider "${name}" not configured. Available: ${avail.length ? avail.join(', ') : '(none)'}`,
    };
  }
  data.active_decide_provider = name;
  writeFileSync(GLOBAL_PROVIDERS_FILE, JSON.stringify(data, null, 2) + '\n');
  return { ok: true };
}
