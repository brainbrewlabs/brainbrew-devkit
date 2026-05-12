import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import { CHAINS_DIR, CHAIN_CONFIG_FILE } from '../utils/paths.js';

export interface AgentDef {
  name: string;
  existing: boolean;
  description?: string;
  model?: string;
  tools?: string[];
  skills?: string[];
  maxTurns?: number;
  color?: string;
  prompt?: string;
}

export interface TeammateDef {
  name: string;
  agent: string;
  prompt?: string;
  model?: string;
}

export interface InputBinding {
  from?: string;
  value?: unknown;
}

export interface NodeRouting {
  next?: string | null;
  on_fail?: string;
  on_issues?: string;
  on_timeout?: string;
  decide?: Array<{ when?: string; default?: boolean; goto: string }>;
}

export interface FlowEntry {
  type?: 'agent' | 'team' | 'mcp' | 'tool' | 'transform' | string;
  spec?: Record<string, unknown>;
  inputs?: Record<string, InputBinding>;
  outputs?: string[];
  routing?: NodeRouting;
  teammates?: TeammateDef[];
  routes?: Record<string, string>;
  decide?: string;
  context?: string;
  config_keys?: string[];
  saveOutput?: boolean;
  reset_counters?: boolean;
  next?: string | null;
  on_issues?: string;
  on_fail?: string;
  timeout?: string;
  retry?: { max: number; backoff?: 'fixed' | 'exp' };
  [key: string]: unknown;
}

export interface VerificationEntry {
  minLength?: number;
  requiredAny?: string[];
}

export interface ChainDef {
  name: string;
  description: string;
  version: number;
  agents: AgentDef[];
  flow: Record<string, FlowEntry>;
  verification?: Record<string, VerificationEntry>;
  saveOutput?: string[];
}

interface RawChainYaml {
  name?: string;
  description?: string;
  version?: number | string;
  agents?: Array<Record<string, unknown>>;
  flow?: Record<string, Record<string, unknown>>;
  verification?: Record<string, Record<string, unknown>>;
  saveOutput?: string[];
}

function asString(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'string') return v;
  return String(v);
}

function asStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.map(x => String(x));
}

function asBool(v: unknown): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v === 'true';
  return Boolean(v);
}

function normalizeAgent(raw: Record<string, unknown>): AgentDef {
  return {
    name: String(raw.name ?? ''),
    existing: raw.existing === undefined ? true : Boolean(raw.existing),
    description: asString(raw.description),
    model: asString(raw.model),
    tools: asStringArray(raw.tools),
    skills: asStringArray(raw.skills),
    maxTurns: typeof raw.maxTurns === 'number' ? raw.maxTurns : raw.maxTurns ? parseInt(String(raw.maxTurns)) : undefined,
    color: asString(raw.color),
    prompt: asString(raw.prompt),
  };
}

function normalizeTeammates(raw: unknown): TeammateDef[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map(t => {
    const r = t as Record<string, unknown>;
    return {
      name: String(r.name ?? ''),
      agent: String(r.agent ?? ''),
      prompt: asString(r.prompt),
      model: asString(r.model),
    };
  });
}

const KNOWN_TYPES = new Set(['agent', 'team', 'mcp', 'tool', 'transform']);

function normalizeFlowEntry(nodeId: string, raw: Record<string, unknown>, version: number): FlowEntry {
  const entry: FlowEntry = {};
  if (typeof raw.type === 'string') entry.type = raw.type;
  const teammates = normalizeTeammates(raw.teammates);
  if (teammates) entry.teammates = teammates;
  if (raw.routes && typeof raw.routes === 'object') {
    const routes: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw.routes as Record<string, unknown>)) {
      routes[k] = String(v ?? '');
    }
    entry.routes = routes;
  }
  if (raw.decide !== undefined) entry.decide = asString(raw.decide);
  if (raw.context !== undefined) entry.context = asString(raw.context);
  if (Array.isArray(raw.config_keys)) {
    entry.config_keys = (raw.config_keys as unknown[]).map(String).filter(Boolean);
  }
  const save = asBool(raw.saveOutput);
  if (save !== undefined) entry.saveOutput = save;
  const reset = asBool(raw.reset_counters);
  if (reset !== undefined) entry.reset_counters = reset;
  if ('next' in raw) entry.next = raw.next === null ? null : asString(raw.next) ?? null;
  if (raw.on_issues !== undefined) entry.on_issues = asString(raw.on_issues);
  if (raw.on_fail !== undefined) entry.on_fail = asString(raw.on_fail);
  if (raw.spec && typeof raw.spec === 'object') entry.spec = raw.spec as Record<string, unknown>;
  if (raw.inputs && typeof raw.inputs === 'object') entry.inputs = raw.inputs as Record<string, InputBinding>;
  if (Array.isArray(raw.outputs)) entry.outputs = (raw.outputs as unknown[]).map(String);
  if (raw.routing && typeof raw.routing === 'object') entry.routing = raw.routing as NodeRouting;
  if (raw.timeout !== undefined) entry.timeout = asString(raw.timeout);
  if (raw.retry && typeof raw.retry === 'object') entry.retry = raw.retry as FlowEntry['retry'];

  if (version < 2) {
    const inferredType = entry.type === 'team' ? 'team' : 'agent';
    if (!entry.type) entry.type = inferredType;
    if (!entry.spec) {
      if (inferredType === 'team') {
        entry.spec = { teammates: entry.teammates ?? [] };
      } else {
        entry.spec = { name: nodeId };
      }
    }
    if (!entry.routing) {
      entry.routing = {
        next: entry.next ?? undefined,
        on_fail: entry.on_fail,
        on_issues: entry.on_issues,
      };
    }
  } else {
    if (!entry.type) entry.type = 'agent';
    if (entry.type === 'agent' && !entry.spec) entry.spec = { name: nodeId };
  }

  for (const [k, v] of Object.entries(raw)) {
    if (
      k === 'type' || k === 'teammates' || k === 'routes' || k === 'decide' ||
      k === 'context' || k === 'config_keys' || k === 'saveOutput' || k === 'reset_counters' ||
      k === 'next' || k === 'on_issues' || k === 'on_fail' ||
      k === 'spec' || k === 'inputs' || k === 'outputs' || k === 'routing' ||
      k === 'timeout' || k === 'retry'
    ) continue;
    if (!(k in entry)) entry[k] = v;
  }
  return entry;
}

function isV1Schema(raw: RawChainYaml): boolean {
  if (raw.version === 2 || raw.version === '2') return false;
  if (!raw.flow) return true;
  for (const entry of Object.values(raw.flow)) {
    if (entry && typeof entry === 'object') {
      const e = entry as Record<string, unknown>;
      if (e.spec || e.routing || e.inputs || e.outputs) return false;
      if (typeof e.type === 'string' && !['agent', 'team'].includes(e.type) && KNOWN_TYPES.has(e.type)) return false;
    }
  }
  return true;
}

export function parseChainYaml(content: string): ChainDef {
  let raw: RawChainYaml;
  try {
    raw = (parseYaml(content) ?? {}) as RawChainYaml;
  } catch {
    raw = {};
  }

  const declaredVersion = typeof raw.version === 'number' ? raw.version : raw.version ? parseInt(String(raw.version)) || 1 : 1;
  const isLegacy = isV1Schema(raw);
  const effectiveVersion = isLegacy ? 1 : Math.max(declaredVersion, 2);

  const chain: ChainDef = {
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    version: effectiveVersion,
    agents: Array.isArray(raw.agents) ? raw.agents.map(normalizeAgent).filter(a => a.name) : [],
    flow: {},
  };

  if (raw.flow && typeof raw.flow === 'object') {
    for (const [name, entry] of Object.entries(raw.flow)) {
      if (entry && typeof entry === 'object') {
        chain.flow[name] = normalizeFlowEntry(name, entry, effectiveVersion);
      } else {
        chain.flow[name] = { type: 'agent', spec: { name }, next: null };
      }
    }
  }

  if (raw.verification && typeof raw.verification === 'object') {
    chain.verification = {};
    for (const [name, v] of Object.entries(raw.verification)) {
      const r = v as Record<string, unknown>;
      const ve: VerificationEntry = {};
      if (typeof r.minLength === 'number') ve.minLength = r.minLength;
      else if (r.minLength) ve.minLength = parseInt(String(r.minLength));
      const arr = asStringArray(r.requiredAny);
      if (arr) ve.requiredAny = arr;
      chain.verification[name] = ve;
    }
  }

  if (Array.isArray(raw.saveOutput)) {
    chain.saveOutput = raw.saveOutput.map(s => String(s).toLowerCase());
  }

  return chain;
}

export function loadChain(name: string): ChainDef | null {
  const file = join(CHAINS_DIR, `${name}.yaml`);
  if (!existsSync(file)) return null;
  return parseChainYaml(readFileSync(file, 'utf-8'));
}

export function loadChainFromContent(content: string): ChainDef {
  return parseChainYaml(content);
}

export function loadChainConfig(): Record<string, unknown> | null {
  if (!existsSync(CHAIN_CONFIG_FILE)) return null;
  try {
    return JSON.parse(readFileSync(CHAIN_CONFIG_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

export function listChains(): string[] {
  if (!existsSync(CHAINS_DIR)) return [];
  return readdirSync(CHAINS_DIR)
    .filter(f => f.endsWith('.yaml'))
    .map(f => f.replace('.yaml', ''));
}
