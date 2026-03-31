import { homedir } from 'os';
import { existsSync } from 'fs';
import { join } from 'path';

export type Platform = 'claude' | 'opencode';

let _platform: Platform | null = null;

/**
 * Detect the active AI coding platform.
 * Evaluated in priority order — explicit override wins, then env markers, then disk probe.
 */
export function detectPlatform(): Platform {
  // 1. Explicit override (useful for testing and scripting)
  const override = process.env.BRAINBREW_PLATFORM;
  if (override === 'opencode') return 'opencode';
  if (override === 'claude') return 'claude';

  // 2. OpenCode environment markers (set when OpenCode invokes plugins/hooks)
  if (process.env.OPENCODE_PLUGIN_ROOT || process.env.OPENCODE) return 'opencode';

  // 3. Claude Code environment markers
  if (process.env.CLAUDE_PLUGIN_ROOT || process.env.CLAUDECODE) return 'claude';

  // 4. Disk probe: use OpenCode if its config exists and Claude Code's does not
  const home = homedir();
  const opencodeDir = join(home, '.config', 'opencode');
  const claudeDir = join(home, '.claude');
  if (existsSync(opencodeDir) && !existsSync(claudeDir)) return 'opencode';

  // 5. Default — backward compatible for all existing users
  return 'claude';
}

/**
 * Return the active platform (cached singleton for the process lifetime).
 */
export function getPlatform(): Platform {
  if (_platform === null) {
    _platform = detectPlatform();
  }
  return _platform;
}

/**
 * Return the global config base directory for the active platform.
 *   Claude Code → ~/.claude
 *   OpenCode    → ~/.config/opencode
 */
export function getBaseDir(): string {
  const home = homedir();
  return getPlatform() === 'opencode'
    ? join(home, '.config', 'opencode')
    : join(home, '.claude');
}

/**
 * Return the project-level config directory name for a given working directory.
 * Probes for existing config first so a user with both tools installed can have
 * separate .claude/ and .opencode/ projects on the same machine.
 */
export function getProjectConfigDir(cwd: string): string {
  // Probe for existing project configs first (platform-independent)
  if (existsSync(join(cwd, '.opencode', 'chain-config.yaml'))) return '.opencode';
  if (existsSync(join(cwd, '.claude', 'chain-config.yaml'))) return '.claude';

  // Fall back to platform default
  return getPlatform() === 'opencode' ? '.opencode' : '.claude';
}
