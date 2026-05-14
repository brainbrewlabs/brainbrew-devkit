#!/usr/bin/env node

import { appendFileSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, statSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';

type RunnerState = {
  runnerVersion: number;
  eventCounts: Record<string, number>;
  lastEvent: string;
  lastEventAt: string;
  lastCwd: string;
};

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
    return { runnerVersion: 1, eventCounts: {}, lastEvent: '', lastEventAt: '', lastCwd: '' };
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
    return { runnerVersion: 1, eventCounts: {}, lastEvent: '', lastEventAt: '', lastCwd: '' };
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
  const memoryDir = join(codexDir, 'memory');

  if (existsSync(codexDir) && isSymlink(codexDir)) return null;
  if (existsSync(memoryDir) && isSymlink(memoryDir)) return null;

  mkdirSync(memoryDir, { recursive: true });

  const realMemoryDir = realpathSync(memoryDir);
  if (!isUnder(projectRoot, realMemoryDir)) return null;
  return memoryDir;
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
    const state = loadState(stateFile);
    state.runnerVersion = 1;
    state.eventCounts[eventName] = (state.eventCounts[eventName] ?? 0) + 1;
    state.lastEvent = eventName;
    state.lastEventAt = now;
    state.lastCwd = cwd;
    safeWriteJson(stateFile, state);

    safeAppendJsonLine(join(memoryDir, 'events.jsonl'), {
      event: eventName,
      at: now,
      cwd,
      session_id: payload.session_id,
      tool_name: payload.tool_name,
    });
  } catch (err) {
    console.error(`[codex-runner] ${(err as Error).message}`);
  }

  process.exit(0);
}

main();
