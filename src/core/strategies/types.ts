import type { ChainDef, FlowEntry } from '../config.js';
import type { AwaitToken } from '../../utils/state.js';

export interface StrategyContext {
  chain: ChainDef;
  sessionId: string;
  cwd: string;
  eventPayload?: unknown;
}

export interface EnterResult {
  instruction?: string;
  awaiting?: AwaitToken;
  syncOutputs?: unknown;
  syncGoto?: string | null;
}

export interface CompleteResult {
  outputs?: unknown;
  goto?: string | null;
  failed?: boolean;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export interface NodeStrategy {
  type: string;
  validate(node: FlowEntry, nodeId: string, chain: ChainDef): ValidationResult;
  enter(nodeId: string, node: FlowEntry, ctx: StrategyContext): EnterResult;
  onComplete?(nodeId: string, node: FlowEntry, ctx: StrategyContext): CompleteResult;
}
