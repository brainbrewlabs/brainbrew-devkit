import type { NodeStrategy } from './types.js';

function buildToolName(spec: Record<string, unknown> | undefined): string | null {
  const server = spec?.['server'];
  const tool = spec?.['tool'];
  if (typeof server !== 'string' || typeof tool !== 'string') return null;
  if (!server || !tool) return null;
  return `mcp__${server}__${tool}`;
}

export const mcpStrategy: NodeStrategy = {
  type: 'mcp',

  validate(node, nodeId) {
    const errors: string[] = [];
    const server = node.spec?.['server'];
    const tool = node.spec?.['tool'];
    if (typeof server !== 'string' || !server) errors.push(`mcp node "${nodeId}": missing spec.server`);
    if (typeof tool !== 'string' || !tool) errors.push(`mcp node "${nodeId}": missing spec.tool`);
    if (typeof server === 'string' && !/^[a-z0-9_-]+$/.test(server)) errors.push(`mcp node "${nodeId}": invalid server name "${server}"`);
    if (typeof tool === 'string' && !/^[a-z0-9_-]+$/.test(tool)) errors.push(`mcp node "${nodeId}": invalid tool name "${tool}"`);
    return { ok: errors.length === 0, errors };
  },

  enter(nodeId, node) {
    const toolName = buildToolName(node.spec);
    if (!toolName) {
      return { instruction: `Chain error: mcp node "${nodeId}" has invalid spec.` };
    }
    const inputJson = JSON.stringify(node.spec?.['input'] ?? {}, null, 2);
    const instruction = `<system-reminder>
## MANDATORY NEXT STEP — MCP TOOL CALL
Chain node **${nodeId}** requires calling MCP tool: \`${toolName}\`

Call the tool with this input:
\`\`\`json
${inputJson}
\`\`\`

The chain will advance automatically when the tool returns.
DO NOT ask user. DO NOT skip. Call the tool now.
</system-reminder>`;
    return {
      instruction,
      awaiting: { kind: 'mcp', toolName, nodeId },
    };
  },

  onComplete(_nodeId, node, ctx) {
    const payload = ctx.eventPayload as { toolName: string; toolResponse: unknown } | undefined;
    const goto = node.routing?.next ?? node.next ?? null;
    return { outputs: payload?.toolResponse ?? null, goto };
  },
};
