import { runInNewContext } from 'vm';
import type { NodeStrategy } from './types.js';
import { getState } from '../../utils/state.js';

const DEFAULT_TIMEOUT_MS = 1000;

function evalExpr(expr: string, scope: Record<string, unknown>): unknown {
  return runInNewContext(`(${expr})`, { ...scope }, { timeout: DEFAULT_TIMEOUT_MS });
}

export const transformStrategy: NodeStrategy = {
  type: 'transform',

  validate(node, nodeId) {
    const errors: string[] = [];
    const fn = node.spec?.['fn'];
    if (typeof fn !== 'string' || !fn) errors.push(`transform node "${nodeId}": missing spec.fn (string expression)`);
    return { ok: errors.length === 0, errors };
  },

  enter(_nodeId, node, ctx) {
    const fn = String(node.spec?.['fn'] ?? '');
    const state = getState(ctx.sessionId);
    const outputs = state?.outputs ?? {};
    const inputs: Record<string, unknown> = {};
    if (node.inputs) {
      for (const [key, binding] of Object.entries(node.inputs)) {
        if (binding.from) {
          const path = binding.from.split('.');
          let cur: unknown = outputs;
          for (const p of path) {
            if (cur && typeof cur === 'object') cur = (cur as Record<string, unknown>)[p];
            else { cur = undefined; break; }
          }
          inputs[key] = cur;
        } else if ('value' in binding) {
          inputs[key] = binding.value;
        }
      }
    }
    let result: unknown = null;
    try {
      result = evalExpr(fn, { state: outputs, inputs });
    } catch (e) {
      return {
        syncOutputs: { error: (e as Error).message },
        syncGoto: node.routing?.on_fail ?? node.on_fail ?? null,
      };
    }
    return {
      syncOutputs: result,
      syncGoto: node.routing?.next ?? node.next ?? null,
    };
  },
};
