/**
 * Keyword fallback decider, no LLM, deterministic.
 *
 * Logic extracted from legacy `post-agent.ts` getNextAgent so chains can use
 * keyword-only routing without invoking any provider. Caller passes in the
 * agent output text + the routes map; we return the route key or null.
 */

export interface KeywordDecision {
  route: string | null;
  reason: string;
}

const ISSUE_KEYWORDS = ['issues', 'fail', 'error', 'bug', 'broken'];
const PASS_KEYWORDS = ['pass', 'approved', 'success', 'all good', 'lgtm'];

export function keywordDecide(
  text: string,
  routes: Record<string, string>,
  fallback: { onFail?: string; onIssues?: string; defaultNext?: string },
): KeywordDecision {
  const routeNames = Object.keys(routes);
  if (routeNames.length === 0) {
    return { route: null, reason: 'no routes defined' };
  }

  const lower = text.toLowerCase();
  const hasIssues = ISSUE_KEYWORDS.some(k => lower.includes(k));
  const hasPassed = PASS_KEYWORDS.some(k => lower.includes(k));

  if (hasIssues && !hasPassed) {
    if (fallback.onFail && routes[fallback.onFail] !== undefined) {
      return { route: fallback.onFail, reason: 'keyword: failure detected' };
    }
    if (fallback.onIssues && routes[fallback.onIssues] !== undefined) {
      return { route: fallback.onIssues, reason: 'keyword: issues detected' };
    }
    // First non-success-shaped route name
    const fixLike = routeNames.find(n => /fix|fail|issue|on_fail|on_issues|abort/i.test(n));
    if (fixLike) return { route: fixLike, reason: 'keyword: fallback failure-shaped route' };
  }

  if (hasPassed) {
    const okLike = routeNames.find(n => /next|pass|approve|success|continue|ok/i.test(n));
    if (okLike) return { route: okLike, reason: 'keyword: pass detected' };
  }

  const def = fallback.defaultNext && routes[fallback.defaultNext] !== undefined ? fallback.defaultNext : routeNames[0];
  return { route: def, reason: 'keyword: default to first route' };
}
