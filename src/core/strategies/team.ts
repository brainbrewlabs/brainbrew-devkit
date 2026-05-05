import type { NodeStrategy } from './types.js';
import type { TeammateDef } from '../config.js';

function readTeammates(spec: Record<string, unknown> | undefined, fallback: TeammateDef[] | undefined): TeammateDef[] {
  const fromSpec = spec?.['teammates'];
  if (Array.isArray(fromSpec)) {
    return fromSpec
      .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
      .map(t => ({
        name: String(t['name'] ?? ''),
        agent: String(t['agent'] ?? ''),
        prompt: typeof t['prompt'] === 'string' ? t['prompt'] : undefined,
        model: typeof t['model'] === 'string' ? t['model'] : undefined,
      }));
  }
  return fallback ?? [];
}

export const teamStrategy: NodeStrategy = {
  type: 'team',

  validate(node, nodeId) {
    const errors: string[] = [];
    const teammates = readTeammates(node.spec, node.teammates);
    if (teammates.length === 0) errors.push(`team node "${nodeId}": no teammates`);
    for (const t of teammates) {
      if (!t.name) errors.push(`team node "${nodeId}": teammate missing name`);
      if (!t.agent) errors.push(`team node "${nodeId}": teammate "${t.name}" missing agent`);
    }
    return { ok: errors.length === 0, errors };
  },

  enter(nodeId, node) {
    const teammates = readTeammates(node.spec, node.teammates);
    const teamInstruction = teammates
      .map(t => `- Teammate "${t.name}" using agent type "${t.agent}"${t.prompt ? `: ${t.prompt}` : ''}${t.model ? ` (model: ${t.model})` : ''}`)
      .join('\n');
    const routesList = node.routes
      ? Object.entries(node.routes).map(([a, d]) => `- "${a}" → ${d}`).join('\n')
      : '';
    const instruction = `<system-reminder>
## MANDATORY NEXT STEP — AGENT TEAM
You MUST now create an agent team for the **${nodeId}** step.

Create a team with these teammates:
${teamInstruction}

Each teammate should work in parallel. After all teammates complete, synthesize their results and continue the chain.

Use the TeamCreate tool to create the team with the above configuration.
${routesList ? `\nAfter the team completes, route based on:\n${routesList}` : ''}
${node.decide ? `\nRouting rules:\n${node.decide}` : ''}
DO NOT ask user. DO NOT skip. Wait for all teammates to finish before proceeding.
</system-reminder>`;
    return {
      instruction,
      awaiting: { kind: 'subagent', agentType: nodeId, nodeId },
    };
  },
};
