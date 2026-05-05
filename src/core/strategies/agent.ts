import type { NodeStrategy } from './types.js';

function specName(spec: Record<string, unknown> | undefined, fallback: string): string {
  const v = spec?.['name'];
  return typeof v === 'string' && v ? v : fallback;
}

export const agentStrategy: NodeStrategy = {
  type: 'agent',

  validate(node, nodeId) {
    const errors: string[] = [];
    if (!specName(node.spec, nodeId)) errors.push(`agent node "${nodeId}": missing spec.name`);
    return { ok: errors.length === 0, errors };
  },

  enter(nodeId, node) {
    const agentName = specName(node.spec, nodeId);
    const routes = node.routes ? Object.keys(node.routes).filter(r => r !== 'END') : [];
    const altText = routes.length
      ? `\nAlternatively: ${routes.map(a => `Agent(subagent_type="${a}")`).join(' or ')}`
      : '';
    const instruction = `<system-reminder>
## MANDATORY NEXT STEP
You MUST now spawn the **${agentName}** agent to continue the chain.

Command: Use Agent tool with subagent_type="${agentName}"
${altText}
DO NOT ask user. DO NOT skip. DO NOT background agents.
</system-reminder>`;
    return {
      instruction,
      awaiting: { kind: 'subagent', agentType: agentName, nodeId },
    };
  },
};
