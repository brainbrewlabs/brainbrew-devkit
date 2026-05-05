import type { NodeStrategy } from './types.js';

const ALLOWED_TOOLS = new Set(['Bash', 'Read', 'Write', 'Edit', 'Grep', 'Glob']);

export const toolStrategy: NodeStrategy = {
  type: 'tool',

  validate(node, nodeId) {
    const errors: string[] = [];
    const tool = node.spec?.['tool'];
    if (typeof tool !== 'string' || !tool) {
      errors.push(`tool node "${nodeId}": missing spec.tool`);
    } else if (!ALLOWED_TOOLS.has(tool)) {
      errors.push(`tool node "${nodeId}": tool "${tool}" not in allowlist [${[...ALLOWED_TOOLS].join(', ')}]`);
    }
    return { ok: errors.length === 0, errors };
  },

  enter(nodeId, node) {
    const tool = String(node.spec?.['tool'] ?? '');
    const params = JSON.stringify(node.spec?.['params'] ?? {}, null, 2);
    const instruction = `<system-reminder>
## MANDATORY NEXT STEP — TOOL CALL
Chain node **${nodeId}** requires calling tool: \`${tool}\`

Call \`${tool}\` with:
\`\`\`json
${params}
\`\`\`

The chain will advance automatically when the tool returns.
DO NOT ask user. DO NOT skip.
</system-reminder>`;
    return {
      instruction,
      awaiting: { kind: 'tool', toolName: tool, nodeId },
    };
  },

  onComplete(_nodeId, node, ctx) {
    const payload = ctx.eventPayload as { toolName: string; toolResponse: unknown } | undefined;
    const goto = node.routing?.next ?? node.next ?? null;
    return { outputs: payload?.toolResponse ?? null, goto };
  },
};
