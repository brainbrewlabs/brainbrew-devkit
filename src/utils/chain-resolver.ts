import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { getProjectConfigDir } from './platform.js';

export interface ResolvedChain {
  configPath: string;
  chainName: string;
  isLegacy: boolean;
}

export function resolveActiveChain(cwd: string): ResolvedChain | null {
  const configDir = getProjectConfigDir(cwd);
  const pointerPath = join(cwd, configDir, 'chain-config.yaml');
  if (!existsSync(pointerPath)) return null;

  const content = readFileSync(pointerPath, 'utf-8');

  if (/^(flow|hooks):/m.test(content)) {
    return { configPath: pointerPath, chainName: 'default', isLegacy: true };
  }

  const activeMatch = content.match(/^active:\s*(.+)/m);
  if (!activeMatch) return null;

  const active = activeMatch[1].trim();
  const dirMatch = content.match(/^chains_dir:\s*(.+)/m);
  const chainsDir = dirMatch ? dirMatch[1].trim() : `${configDir}/chains/`;

  if (active.includes('..') || chainsDir.includes('..')) return null;

  const chainPath = join(cwd, chainsDir, `${active}.yaml`);
  const resolvedPath = resolve(chainPath);
  const expectedBase = resolve(join(cwd, configDir));
  if (!resolvedPath.startsWith(expectedBase)) return null;

  if (!existsSync(chainPath)) return null;

  return { configPath: chainPath, chainName: active, isLegacy: false };
}

export function readActiveChainContent(cwd: string): string | null {
  const resolved = resolveActiveChain(cwd);
  if (!resolved) return null;
  return readFileSync(resolved.configPath, 'utf-8');
}

export function listChains(cwd: string): string[] {
  const configDir = getProjectConfigDir(cwd);
  const pointerPath = join(cwd, configDir, 'chain-config.yaml');
  if (!existsSync(pointerPath)) return [];

  const content = readFileSync(pointerPath, 'utf-8');

  if (/^(flow|hooks):/m.test(content)) {
    return ['default'];
  }

  const dirMatch = content.match(/^chains_dir:\s*(.+)/m);
  const chainsDir = dirMatch ? dirMatch[1].trim() : `${configDir}/chains/`;

  if (chainsDir.includes('..')) return ['default'];
  const fullDir = join(cwd, chainsDir);
  const resolvedDir = resolve(fullDir);
  const expectedBase = resolve(join(cwd, configDir));
  if (!resolvedDir.startsWith(expectedBase)) return ['default'];

  if (!existsSync(fullDir)) return [];

  return readdirSync(fullDir)
    .filter(f => f.endsWith('.yaml'))
    .map(f => f.replace('.yaml', ''));
}

export function getActiveChainName(cwd: string): string | null {
  const resolved = resolveActiveChain(cwd);
  return resolved?.chainName ?? null;
}

export function writePointer(cwd: string, active: string, chainsDir?: string): void {
  const configDir = getProjectConfigDir(cwd);
  const resolvedChainsDir = chainsDir ?? `${configDir}/chains/`;

  const validName = /^[a-zA-Z0-9_\-\/.]+$/;
  if (!validName.test(active) || active.includes('..')) throw new Error('Invalid chain name');
  if (!validName.test(resolvedChainsDir) || resolvedChainsDir.includes('..')) throw new Error('Invalid chains directory');

  const pointerPath = join(cwd, configDir, 'chain-config.yaml');
  const content = `active: ${active}\nchains_dir: ${resolvedChainsDir}\n`;
  writeFileSync(pointerPath, content);
}

export function migrateToMultiChain(cwd: string): string {
  const configDir = getProjectConfigDir(cwd);
  const pointerPath = join(cwd, configDir, 'chain-config.yaml');
  const chainsDir = join(cwd, configDir, 'chains');
  mkdirSync(chainsDir, { recursive: true });

  const legacyPath = join(chainsDir, 'legacy.yaml');
  const content = readFileSync(pointerPath, 'utf-8');
  writeFileSync(legacyPath, content);
  writePointer(cwd, 'legacy');
  return 'legacy';
}
