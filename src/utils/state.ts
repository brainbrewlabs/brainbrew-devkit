import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, renameSync } from 'fs';
import { join } from 'path';
import { TMP_DIR } from './paths.js';

const STATE_DIR = join(TMP_DIR, 'chain-state');

export type AwaitToken =
  | { kind: 'subagent'; agentType: string; nodeId: string }
  | { kind: 'mcp'; toolName: string; nodeId: string }
  | { kind: 'tool'; toolName: string; nodeId: string };

interface ChainState {
  previousAgents: Array<{ type: string; outputSummary?: string; outputPath?: string }>;
  currentAgent?: string;
  sharedContext?: Record<string, unknown>;
  phaseTracking?: {
    totalPhases: number;
    completedPhases: number;
    phases: string[];
  };
  activeTeam?: {
    name: string;
    teammates: Array<{ name: string; agent: string; status: 'pending' | 'running' | 'complete' }>;
    startedAt: string;
  };
  chainBlockCount?: number;
  allowedAgents?: string[];
  awaiting?: AwaitToken;
  outputs?: Record<string, unknown>;
}

function statePath(sessionId: string): string {
  return join(STATE_DIR, `${sessionId}.json`);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitize(raw: unknown): ChainState | null {
  if (!isPlainObject(raw)) return null;
  const out: ChainState = { previousAgents: [] };
  if (Array.isArray(raw.previousAgents)) {
    out.previousAgents = raw.previousAgents.filter(
      (entry): entry is { type: string } => isPlainObject(entry) && typeof entry.type === 'string',
    ) as ChainState['previousAgents'];
  }
  if (typeof raw.currentAgent === 'string') out.currentAgent = raw.currentAgent;
  if (isPlainObject(raw.sharedContext)) out.sharedContext = raw.sharedContext;
  if (
    isPlainObject(raw.phaseTracking)
    && typeof (raw.phaseTracking as Record<string, unknown>).totalPhases === 'number'
    && typeof (raw.phaseTracking as Record<string, unknown>).completedPhases === 'number'
    && Array.isArray((raw.phaseTracking as Record<string, unknown>).phases)
  ) {
    out.phaseTracking = raw.phaseTracking as ChainState['phaseTracking'];
  }
  if (isPlainObject(raw.activeTeam)) out.activeTeam = raw.activeTeam as ChainState['activeTeam'];
  if (typeof raw.chainBlockCount === 'number') out.chainBlockCount = raw.chainBlockCount;
  if (Array.isArray(raw.allowedAgents) && raw.allowedAgents.every((a) => typeof a === 'string')) {
    out.allowedAgents = raw.allowedAgents as string[];
  }
  if (isPlainObject(raw.awaiting)) {
    const a = raw.awaiting as Record<string, unknown>;
    if ((a.kind === 'subagent' || a.kind === 'mcp' || a.kind === 'tool') && typeof a.nodeId === 'string') {
      if (a.kind === 'subagent' && typeof a.agentType === 'string') {
        out.awaiting = { kind: 'subagent', agentType: a.agentType, nodeId: a.nodeId };
      } else if ((a.kind === 'mcp' || a.kind === 'tool') && typeof a.toolName === 'string') {
        out.awaiting = { kind: a.kind, toolName: a.toolName, nodeId: a.nodeId };
      }
    }
  }
  if (isPlainObject(raw.outputs)) out.outputs = raw.outputs;
  return out;
}

export function getState(sessionId: string): ChainState | null {
  if (!sessionId) return null;
  const file = statePath(sessionId);
  if (!existsSync(file)) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    try { unlinkSync(file); } catch { /* ignore */ }
    return null;
  }
  const clean = sanitize(raw);
  if (!clean) {
    try { unlinkSync(file); } catch { /* ignore */ }
    return null;
  }
  return clean;
}

export function updateState(sessionId: string, updates: Partial<ChainState>): void {
  if (!sessionId) return;
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  const current = getState(sessionId) || { previousAgents: [] };
  const merged = sanitize({ ...current, ...updates }) || { previousAgents: [] };
  const finalPath = statePath(sessionId);
  const tmpPath = `${finalPath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmpPath, JSON.stringify(merged, null, 2));
  renameSync(tmpPath, finalPath);
}

export function clearState(sessionId: string): void {
  const file = statePath(sessionId);
  if (existsSync(file)) unlinkSync(file);
}
