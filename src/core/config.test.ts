import { describe, it, expect } from 'vitest';
import { parseChainYaml } from './config.js';
import { getStrategy, listStrategies } from './strategies/registry.js';

describe('parseChainYaml v1 auto-lift', () => {
  it('lifts agent flow entry to type=agent + spec.name', () => {
    const c = parseChainYaml(`
flow:
  planner:
    routes:
      implementer: "Plan ready"
  implementer:
    next: null
`);
    expect(c.flow.planner.type).toBe('agent');
    expect(c.flow.planner.spec).toEqual({ name: 'planner' });
    expect(c.flow.implementer.type).toBe('agent');
    expect(c.flow.implementer.routing).toBeDefined();
  });

  it('lifts team node with teammates into spec', () => {
    const c = parseChainYaml(`
flow:
  reviewers:
    type: team
    teammates:
      - name: security
        agent: security-scan
      - name: quality
        agent: code-reviewer
    routes:
      tester: "all approved"
`);
    expect(c.flow.reviewers.type).toBe('team');
    const spec = c.flow.reviewers.spec as { teammates: Array<{ name: string; agent: string }> };
    expect(spec.teammates).toHaveLength(2);
    expect(spec.teammates[0].agent).toBe('security-scan');
  });

  it('reports v1 detection on legacy chains', () => {
    const c = parseChainYaml(`flow:\n  a:\n    next: b\n  b:\n    next: null\n`);
    expect(c.version).toBe(1);
  });
});

describe('parseChainYaml v2 explicit', () => {
  it('keeps spec/routing/inputs as-is on version: 2', () => {
    const c = parseChainYaml(`
version: 2
flow:
  fetch:
    type: mcp
    spec:
      server: github
      tool: search_repositories
      input: { query: "anthropic" }
    routing:
      next: analyze
  analyze:
    type: agent
    spec: { name: explorer }
    routing: { next: null }
`);
    expect(c.version).toBe(2);
    expect(c.flow.fetch.type).toBe('mcp');
    expect((c.flow.fetch.spec as Record<string, unknown>).server).toBe('github');
    expect(c.flow.analyze.type).toBe('agent');
  });
});

describe('strategy registry', () => {
  it('registers all 5 built-in strategies', () => {
    expect(listStrategies().sort()).toEqual(['agent', 'mcp', 'team', 'tool', 'transform']);
  });

  it('mcp strategy validates server+tool', () => {
    const s = getStrategy('mcp')!;
    const bad = s.validate({ type: 'mcp', spec: {} } as never, 'x', { agents: [], flow: {}, name: '', description: '', version: 2 });
    expect(bad.ok).toBe(false);
    const good = s.validate({ type: 'mcp', spec: { server: 'github', tool: 'search_repos' } } as never, 'x', { agents: [], flow: {}, name: '', description: '', version: 2 });
    expect(good.ok).toBe(true);
  });

  it('mcp strategy enter() emits MANDATORY NEXT STEP + awaiting token', () => {
    const s = getStrategy('mcp')!;
    const result = s.enter('fetch', { type: 'mcp', spec: { server: 'github', tool: 'search_repositories' } } as never, { chain: { agents: [], flow: {}, name: '', description: '', version: 2 }, sessionId: 's', cwd: '/' });
    expect(result.instruction).toContain('mcp__github__search_repositories');
    expect(result.awaiting).toEqual({ kind: 'mcp', toolName: 'mcp__github__search_repositories', nodeId: 'fetch' });
  });

  it('tool strategy rejects tools outside allowlist', () => {
    const s = getStrategy('tool')!;
    const bad = s.validate({ type: 'tool', spec: { tool: 'EvilTool' } } as never, 'x', { agents: [], flow: {}, name: '', description: '', version: 2 });
    expect(bad.ok).toBe(false);
    const good = s.validate({ type: 'tool', spec: { tool: 'Bash' } } as never, 'x', { agents: [], flow: {}, name: '', description: '', version: 2 });
    expect(good.ok).toBe(true);
  });

  it('transform strategy evaluates expression synchronously', () => {
    const s = getStrategy('transform')!;
    const r = s.enter('compute', { type: 'transform', spec: { fn: '1 + 2' } } as never, { chain: { agents: [], flow: {}, name: '', description: '', version: 2 }, sessionId: 'no-session', cwd: '/' });
    expect(r.syncOutputs).toBe(3);
  });
});
