import type { NodeStrategy } from './types.js';
import { agentStrategy } from './agent.js';
import { teamStrategy } from './team.js';
import { mcpStrategy } from './mcp.js';
import { toolStrategy } from './tool.js';
import { transformStrategy } from './transform.js';

const registry = new Map<string, NodeStrategy>();

function register(s: NodeStrategy): void {
  registry.set(s.type, s);
}

register(agentStrategy);
register(teamStrategy);
register(mcpStrategy);
register(toolStrategy);
register(transformStrategy);

export function getStrategy(type: string): NodeStrategy | undefined {
  return registry.get(type);
}

export function listStrategies(): string[] {
  return [...registry.keys()];
}
