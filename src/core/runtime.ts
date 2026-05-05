import { readActiveChainContent } from '../utils/chain-resolver.js';
import { parseChainYaml, type ChainDef, type FlowEntry } from './config.js';
import { getState, updateState, type AwaitToken } from '../utils/state.js';
import { getStrategy } from './strategies/registry.js';

export interface AdvanceDecision {
  nextNodeId: string | null;
  instruction?: string;
}

function loadChain(cwd: string): ChainDef | null {
  const content = readActiveChainContent(cwd);
  if (!content) return null;
  return parseChainYaml(content);
}

export function getNode(chain: ChainDef, nodeId: string): FlowEntry | null {
  return chain.flow[nodeId] ?? null;
}

export function resolveRoute(node: FlowEntry, label: string): string | null {
  if (node.routes && node.routes[label]) return label;
  if (label === 'next' && node.next) return node.next;
  if (label === 'on_fail' && node.on_fail) return node.on_fail;
  if (label === 'on_issues' && node.on_issues) return node.on_issues;
  return null;
}

function saveOutput(sessionId: string, nodeId: string, value: unknown): void {
  const state = getState(sessionId);
  const outputs = { ...(state?.outputs ?? {}), [nodeId]: value };
  updateState(sessionId, { outputs });
}

function setAwaiting(sessionId: string, token: AwaitToken | undefined): void {
  updateState(sessionId, { awaiting: token });
}

export function enterNode(cwd: string, sessionId: string, nodeId: string): AdvanceDecision {
  const chain = loadChain(cwd);
  if (!chain) return { nextNodeId: null };
  const node = getNode(chain, nodeId);
  if (!node) return { nextNodeId: null };

  const type = (node.type ?? 'agent') as string;
  const strategy = getStrategy(type);
  if (!strategy) return { nextNodeId: null };

  const result = strategy.enter(nodeId, node, { chain, sessionId, cwd });
  if (result.awaiting) setAwaiting(sessionId, result.awaiting);
  return { nextNodeId: nodeId, instruction: result.instruction };
}

export function advanceFromMcp(
  cwd: string,
  sessionId: string,
  nodeId: string,
  toolName: string,
  toolResponse: unknown,
): AdvanceDecision {
  const chain = loadChain(cwd);
  if (!chain) return { nextNodeId: null };
  const node = getNode(chain, nodeId);
  if (!node) return { nextNodeId: null };

  const strategy = getStrategy('mcp');
  if (!strategy?.onComplete) return { nextNodeId: null };

  const result = strategy.onComplete(nodeId, node, { chain, sessionId, cwd, eventPayload: { toolName, toolResponse } });
  if (result.outputs !== undefined) saveOutput(sessionId, nodeId, result.outputs);
  return advanceTo(cwd, sessionId, result.goto ?? null);
}

export function advanceFromTool(
  cwd: string,
  sessionId: string,
  nodeId: string,
  toolName: string,
  toolResponse: unknown,
): AdvanceDecision {
  const chain = loadChain(cwd);
  if (!chain) return { nextNodeId: null };
  const node = getNode(chain, nodeId);
  if (!node) return { nextNodeId: null };

  const strategy = getStrategy('tool');
  if (!strategy?.onComplete) return { nextNodeId: null };

  const result = strategy.onComplete(nodeId, node, { chain, sessionId, cwd, eventPayload: { toolName, toolResponse } });
  if (result.outputs !== undefined) saveOutput(sessionId, nodeId, result.outputs);
  return advanceTo(cwd, sessionId, result.goto ?? null);
}

function advanceTo(cwd: string, sessionId: string, nextNodeId: string | null): AdvanceDecision {
  if (!nextNodeId || nextNodeId === 'END') return { nextNodeId: null };

  const chain = loadChain(cwd);
  if (!chain) return { nextNodeId: null };
  const next = getNode(chain, nextNodeId);
  if (!next) return { nextNodeId: null };

  const type = (next.type ?? 'agent') as string;
  const strategy = getStrategy(type);
  if (!strategy) return { nextNodeId: null };

  const result = strategy.enter(nextNodeId, next, { chain, sessionId, cwd });
  if (result.awaiting) setAwaiting(sessionId, result.awaiting);
  else setAwaiting(sessionId, undefined);

  if (type === 'transform' && result.syncOutputs !== undefined) {
    saveOutput(sessionId, nextNodeId, result.syncOutputs);
    return advanceTo(cwd, sessionId, result.syncGoto ?? null);
  }

  return { nextNodeId, instruction: result.instruction };
}
