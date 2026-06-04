import type { FlowEntry } from '../core/config.js';
import type { ProviderRegistry } from '../providers/registry.js';
import { callProvider } from '../providers/http.js';
import { callHaiku } from '../ai/haiku.js';
import { keywordDecide } from './keyword.js';

export interface DecideOutcome {
  route: string | null;
  reason: string;
  /** Diagnostic tag for telemetry: keyword | provider:<name> | fallback */
  source: string;
}

function isEnd(r: string): boolean {
  return r === 'END';
}

/**
 * Validate an LLM-returned route value against this node's routes.
 *   - `null`      → END (valid, terminates chain)
 *   - `<key>`     → route key matched directly, or matched by description value
 *   - `undefined` → invalid / unusable → caller should fall back
 */
function validateLlmRoute(
  route: unknown,
  routes: Record<string, string>,
  routeNames: string[],
): string | null | undefined {
  if (typeof route !== 'string' || !route) return undefined;
  if (isEnd(route)) return null;
  if (routes[route] !== undefined) return route;
  return routeNames.find(r => routes[r] === route) ?? undefined;
}

/**
 * Run the decide step for a node. Fires the LLM when `decide` is set,
 * `agentOutput.length > 50`, and ≥ 1 non-END route exists.
 *
 * Resolution: provider in registry → HTTP; no provider → `claude -p`; else keyword.
 * `requireDecideProvider` turns any provider failure into a hard error (route=null)
 * instead of falling back. Decide-skip: single non-END route AND no `decide` block.
 */
export async function runDecide(
  node: FlowEntry,
  agentOutput: string,
  registry: ProviderRegistry,
  decideProvider?: string,
  requireDecideProvider = false,
): Promise<DecideOutcome> {
  const routes = node.routes ?? {};
  const routeNames = Object.keys(routes);
  const nonEnd = routeNames.filter(r => !isEnd(r));

  const decide = node.decide;
  const hasDecideBlock = decide !== undefined && decide !== null;
  const rules = decide;
  // Every node uses the chain-wide decide provider.
  const providerName = decideProvider;

  const keyword = (): DecideOutcome => {
    const d = keywordDecide(agentOutput, routes, {
      onFail: node.on_fail,
      onIssues: node.on_issues,
      defaultNext: typeof node.next === 'string' ? node.next : undefined,
    });
    return { route: d.route, reason: d.reason, source: 'keyword' };
  };

  // All-END short-circuit
  if (nonEnd.length === 0) {
    return { route: null, reason: 'all routes END', source: 'skip' };
  }

  // Decide-skip: only when NO decide block AND single non-END route
  if (nonEnd.length === 1 && !hasDecideBlock) {
    return { route: nonEnd[0], reason: 'single non-END route — decide skipped', source: 'skip' };
  }

  // Not an LLM-decide situation (no decide intent or output too short) → keyword.
  if (!hasDecideBlock || agentOutput.length <= 50) {
    return keyword();
  }

  // Provider name set but missing from registry (typo / misconfig).
  if (providerName && !registry.providers[providerName]) {
    if (requireDecideProvider) {
      return {
        route: null,
        reason: `provider "${providerName}" not configured and require_decide_provider is on`,
        source: 'error:no-provider',
      };
    }
    const kw = keyword();
    return {
      route: kw.route,
      reason: `provider "${providerName}" not configured — fell back to keyword: ${kw.reason}`,
      source: `fallback:${providerName}-missing`,
    };
  }

  // No provider resolved at all → claude -p fallback, or error under strict mode.
  if (!providerName) {
    if (requireDecideProvider) {
      return {
        route: null,
        reason: 'no provider configured and require_decide_provider is on',
        source: 'error:no-provider',
      };
    }
    const prompt = buildDecidePrompt(rules, routes, agentOutput);
    const haiku = callHaiku(prompt);
    const validated = validateLlmRoute(haiku.route, routes, routeNames);
    if (!haiku.error && validated !== undefined) {
      const reason = typeof haiku.reason === 'string' ? haiku.reason : '';
      return { route: validated, reason, source: 'claude-p' };
    }
    const kw = keyword();
    const why = haiku.error ? String(haiku.message ?? haiku.error) : 'returned invalid route';
    return {
      route: kw.route,
      reason: `claude -p ${why} — fell back to keyword: ${kw.reason}`,
      source: 'fallback:claude-p-error',
    };
  }

  // Provider path (resolved + in registry).
  const provider = registry.providers[providerName];
  const prompt = buildDecidePrompt(rules, routes, agentOutput);
  const httpResult = await callProvider(provider, prompt);
  if (httpResult.ok && httpResult.response) {
    const { route, reason } = httpResult.response;
    const validated = validateLlmRoute(route, routes, routeNames);
    if (validated !== undefined) {
      return { route: validated, reason, source: `provider:${providerName}` };
    }
  }

  // Provider HTTP failed or returned an invalid route.
  const why = httpResult.error ?? 'returned invalid route';

  // require_decide_provider=true → the resolved provider MUST decide. A failure is
  // a hard error, never a silent keyword fallback.
  if (requireDecideProvider) {
    return {
      route: null,
      reason: `provider "${providerName}" ${why} and require_decide_provider is on`,
      source: 'error:provider-failed',
    };
  }

  // Best-effort mode → keyword fallback.
  const kw = keyword();
  return {
    route: kw.route,
    reason: `provider "${providerName}" ${why} — fell back to keyword: ${kw.reason}`,
    source: `fallback:${providerName}-error`,
  };
}

function buildDecidePrompt(
  rules: string | undefined,
  routes: Record<string, string>,
  agentOutput: string,
): string {
  const routesList = Object.entries(routes)
    .map(([name, desc]) => `- "${name}" → ${desc || name}`)
    .join('\n');

  return `You are a chain router. Analyze the agent output and pick the next route.

ROUTING RULES:
${rules ?? '(no specific rules — use route descriptions)'}

AVAILABLE ROUTES:
${routesList}
- "END" → stop the chain

AGENT OUTPUT:
${agentOutput.slice(0, 2000)}

Respond ONLY with JSON: {"route": "<name or END>", "reason": "brief explanation"}`;
}
