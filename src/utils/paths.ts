import { homedir } from 'os';
import { join } from 'path';
import { getBaseDir } from './platform.js';

export { getProjectConfigDir } from './platform.js';

const HOME = homedir();
const BASE = getBaseDir();

// Base directories (platform-aware: ~/.claude or ~/.config/opencode)
export const CLAUDE_DIR = BASE;
export const CHAINS_DIR = join(BASE, 'chains');
export const BACKUP_DIR = join(CHAINS_DIR, '.backup');
export const AGENTS_DIR = join(BASE, 'agents');
export const SKILLS_DIR = join(BASE, 'skills');
export const HOOKS_DIR = join(BASE, 'hooks', 'chains');
export const CUSTOM_HOOKS_DIR = join(HOOKS_DIR, 'custom');
export const TMP_DIR = join(BASE, 'tmp');
export const PROJECTS_DIR = join(BASE, 'projects');

// Config files
export const SETTINGS_FILE = join(BASE, 'settings.json');
export const CHAIN_CONFIG_FILE = join(HOOKS_DIR, 'chain-config.json');
export const VERIFICATION_RULES_FILE = join(HOOKS_DIR, 'verification-rules.json');
export const HOOKS_CONFIG_FILE = join(HOOKS_DIR, 'hooks-config.yaml');
export const CHAIN_EVENTS_LOG = join(TMP_DIR, 'chain-events.jsonl');

// Per-project paths
export function encodeCwd(cwd: string): string {
  return cwd.replace(/\//g, '-');
}

export function decodeCwd(encoded: string): string {
  // First char is always '-' from leading '/'
  return encoded.replace(/-/g, '/');
}

export function getProjectDir(cwd: string): string {
  return join(PROJECTS_DIR, encodeCwd(cwd));
}

export function getProjectHooksDir(cwd: string): string {
  return join(getProjectDir(cwd), 'custom-hooks');
}

export function getProjectChainConfig(cwd: string): string {
  return join(getProjectDir(cwd), 'chain-config.yaml');
}

// Suppress unused-variable warning for HOME (kept for potential callers)
void HOME;
