#!/usr/bin/env node

import { appendFileSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, statSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';

type RunnerState = {
  runnerVersion: number;
  eventCounts: Record<string, number>;
  lastEvent: string;
  lastEventAt: string;
  lastCwd: string;
  stateDir: string;
  legacyStateDir?: string;
  activeWorkflow?: WorkflowState;
};

type WorkflowStatus = 'running' | 'completed';

type WorkflowState = {
  name: string;
  status: WorkflowStatus;
  currentStep: string;
  startedAt: string;
  updatedAt: string;
  lastPrompt?: string;
  lastTool?: string;
  lastRoleOutput?: string;
  pendingGates: string[];
};

const STATE_DIR = join('.codex', 'brainbrew');
const LEGACY_STATE_DIR = join('.codex', 'memory');
const DEFAULT_PENDING_GATES = ['plan-review', 'code-review', 'security-review', 'test'];

function readStdin(): string {
  try {
    return readFileSync(0, 'utf-8').trim();
  } catch {
    return '';
  }
}

function readPayload(stdin: string): Record<string, unknown> {
  if (!stdin) return {};
  try {
    const parsed = JSON.parse(stdin) as unknown;
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function loadState(stateFile: string): RunnerState {
  if (!existsSync(stateFile)) {
    return { runnerVersion: 2, eventCounts: {}, lastEvent: '', lastEventAt: '', lastCwd: '', stateDir: STATE_DIR };
  }

  try {
    const parsed = JSON.parse(readFileSync(stateFile, 'utf-8')) as RunnerState;
    if (!parsed || typeof parsed !== 'object' || !parsed.eventCounts) throw new Error('invalid state');
    return parsed;
  } catch {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    try {
      renameSync(stateFile, join(dirname(stateFile), `workflow-state.corrupt-${stamp}.json`));
    } catch {}
    return { runnerVersion: 2, eventCounts: {}, lastEvent: '', lastEventAt: '', lastCwd: '', stateDir: STATE_DIR };
  }
}

function isSymlink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

function isUnder(parent: string, child: string): boolean {
  return child === parent || child.startsWith(`${parent}/`);
}

function prepareMemoryDir(cwd: string): string | null {
  const projectRoot = realpathSync(cwd);
  const codexDir = join(cwd, '.codex');
  const memoryDir = join(cwd, STATE_DIR);

  if (existsSync(codexDir) && isSymlink(codexDir)) return null;
  if (existsSync(memoryDir) && isSymlink(memoryDir)) return null;

  mkdirSync(memoryDir, { recursive: true });

  const realMemoryDir = realpathSync(memoryDir);
  if (!isUnder(projectRoot, realMemoryDir)) return null;
  return memoryDir;
}

function readLegacyState(cwd: string): RunnerState | null {
  const legacyDir = join(cwd, LEGACY_STATE_DIR);
  const legacyFile = join(legacyDir, 'workflow-state.json');
  if (!existsSync(legacyFile) || isSymlink(legacyDir) || isSymlink(legacyFile)) return null;
  try {
    const parsed = JSON.parse(readFileSync(legacyFile, 'utf-8')) as RunnerState;
    if (!parsed || typeof parsed !== 'object' || !parsed.eventCounts) return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeWriteJson(filePath: string, value: unknown): void {
  if (existsSync(filePath) && isSymlink(filePath)) return;
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmpPath, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
  renameSync(tmpPath, filePath);
}

function safeAppendJsonLine(filePath: string, value: unknown): void {
  if (existsSync(filePath) && isSymlink(filePath)) return;
  appendFileSync(filePath, JSON.stringify(value) + '\n');
}

function getPayloadText(payload: Record<string, unknown>): string {
  const candidates = [
    payload.prompt,
    payload.user_prompt,
    payload.input,
    payload.message,
    payload.text,
  ];
  return candidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
}

function detectWorkflow(prompt: string): string | null {
  const lower = prompt.toLowerCase();
  const explicit = lower.match(/brainbrew(?:\s+codex)?\s+(?:workflow|chain|recipe)\s+([a-z0-9_-]+)/);
  if (explicit?.[1]) return explicit[1];

  const slash = lower.match(/\/brainbrew[:_-](?:workflow|chain-run)\s+([a-z0-9_-]+)/);
  if (slash?.[1]) return slash[1];

  const template = lower.match(/\b(develop|review|docs|devops|research|skill-dev|support|data|moderation|marketing)\s+(?:workflow|chain|recipe)\b/);
  if (template?.[1]) return template[1];

  if (lower.includes('brainbrew') && (lower.includes('workflow') || lower.includes('chain') || lower.includes('recipe'))) {
    return 'unspecified';
  }

  return null;
}

function inferStepFromTool(toolName: string): string | null {
  const lower = toolName.toLowerCase();
  if (lower.includes('spawn_agent') || lower.includes('agent') || lower.includes('task')) return 'delegation';
  if (lower.includes('apply_patch') || lower.includes('edit') || lower.includes('write')) return 'implementation';
  if (lower.includes('exec') || lower.includes('bash')) return 'verification';
  return null;
}

function updateWorkflowState(state: RunnerState, eventName: string, payload: Record<string, unknown>, now: string): void {
  const prompt = getPayloadText(payload);
  if (eventName === 'UserPromptSubmit' && prompt) {
    const workflowName = detectWorkflow(prompt);
    if (workflowName) {
      state.activeWorkflow = {
        name: workflowName,
        status: 'running',
        currentStep: 'planning',
        startedAt: now,
        updatedAt: now,
        lastPrompt: prompt.slice(0, 500),
        pendingGates: [...DEFAULT_PENDING_GATES],
      };
      return;
    }
  }

  const workflow = state.activeWorkflow;
  if (!workflow || workflow.status !== 'running') return;

  workflow.updatedAt = now;
  if (prompt) workflow.lastPrompt = prompt.slice(0, 500);

  const toolName = typeof payload.tool_name === 'string' ? payload.tool_name : typeof payload.tool === 'string' ? payload.tool : '';
  if (toolName) {
    workflow.lastTool = toolName;
    const inferredStep = inferStepFromTool(toolName);
    if (inferredStep) workflow.currentStep = inferredStep;
  }

  const lowerPrompt = prompt.toLowerCase();
  const completedGates = [
    ['plan-review', ['plan reviewed', 'plan approved', 'reviewed the plan']],
    ['code-review', ['code review passed', 'review complete', 'reviewed the diff']],
    ['security-review', ['security review passed', 'security scan passed', 'no security issues']],
    ['test', ['tests pass', 'test passed', 'verification passed', 'build passed']],
  ] as const;
  for (const [gate, markers] of completedGates) {
    if (markers.some(marker => lowerPrompt.includes(marker))) {
      workflow.pendingGates = workflow.pendingGates.filter(item => item !== gate);
    }
  }

  if (workflow.pendingGates.length === 0) {
    workflow.status = 'completed';
    workflow.currentStep = 'completed';
  }
}

function warnIfWorkflowIncomplete(state: RunnerState): void {
  const workflow = state.activeWorkflow;
  if (!workflow || workflow.status !== 'running' || workflow.pendingGates.length === 0) return;
  console.error(`[brainbrew-codex] Workflow "${workflow.name}" is still advisory-running. Pending gates: ${workflow.pendingGates.join(', ')}.`);
}

function main(): void {
  const eventName = process.argv[2] ?? 'unknown';
  const stdin = readStdin();
  const payload = readPayload(stdin);
  const cwd = typeof payload.cwd === 'string' && payload.cwd ? resolve(payload.cwd) : process.cwd();

  try {
    if (!existsSync(cwd) || !statSync(cwd).isDirectory()) process.exit(0);

    const memoryDir = prepareMemoryDir(cwd);
    if (!memoryDir) process.exit(0);

    const now = new Date().toISOString();
    const stateFile = join(memoryDir, 'workflow-state.json');
    const state = existsSync(stateFile) ? loadState(stateFile) : readLegacyState(cwd) ?? loadState(stateFile);
    state.runnerVersion = 2;
    state.stateDir = STATE_DIR;
    if (!state.legacyStateDir && existsSync(join(cwd, LEGACY_STATE_DIR, 'workflow-state.json'))) {
      state.legacyStateDir = LEGACY_STATE_DIR;
    }
    state.eventCounts[eventName] = (state.eventCounts[eventName] ?? 0) + 1;
    state.lastEvent = eventName;
    state.lastEventAt = now;
    state.lastCwd = cwd;
    updateWorkflowState(state, eventName, payload, now);
    safeWriteJson(stateFile, state);

    safeAppendJsonLine(join(memoryDir, 'events.jsonl'), {
      event: eventName,
      at: now,
      cwd,
      session_id: payload.session_id,
      tool_name: payload.tool_name,
      workflow: state.activeWorkflow?.name,
      workflow_step: state.activeWorkflow?.currentStep,
    });

    if (eventName === 'Stop') warnIfWorkflowIncomplete(state);
  } catch (err) {
    console.error(`[codex-runner] ${(err as Error).message}`);
  }

  process.exit(0);
}

main();
