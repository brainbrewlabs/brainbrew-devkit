import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';

export interface LoadedProjectConfig {
  data: Record<string, unknown>;
  sources: string[];
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// Deep merge: `override` wins on conflict.
// Objects are merged recursively; arrays/scalars are replaced wholesale.
function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (isPlainObject(v) && isPlainObject(out[k])) {
      out[k] = deepMerge(out[k] as Record<string, unknown>, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function readYamlSafe(path: string): Record<string, unknown> | null {
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf-8');
    const parsed = parseYaml(raw);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// Load `.claude/config.yaml` (shared) merged with `.claude/config.local.yaml`
// (personal, gitignored). Local overrides shared. Returns null if neither exists.
export function loadProjectConfig(cwd: string): LoadedProjectConfig | null {
  const sharedPath = join(cwd, '.claude', 'config.yaml');
  const localPath = join(cwd, '.claude', 'config.local.yaml');

  const shared = readYamlSafe(sharedPath);
  const local = readYamlSafe(localPath);

  if (!shared && !local) return null;

  const sources: string[] = [];
  if (shared) sources.push('.claude/config.yaml');
  if (local) sources.push('.claude/config.local.yaml');

  const merged = deepMerge(shared ?? {}, local ?? {});
  return { data: merged, sources };
}
