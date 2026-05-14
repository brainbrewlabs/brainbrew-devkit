import { homedir } from 'os';
import { join } from 'path';
import type { RuntimeProfile } from './types.js';

const homeDir = join(homedir(), '.codex');

export const CODEX_UNSUPPORTED_HOOKS = [
  'SubagentStart',
  'SubagentStop',
  'SessionEnd',
  'Notification',
  'PreCompact',
  'PostCompact',
] as const;

export const codexRuntime: RuntimeProfile = {
  name: 'codex',
  displayName: 'Codex',
  homeDir,
  configFile: join(homeDir, 'config.toml'),
  hooksFile: join(homeDir, 'hooks.json'),
  skillsDir: join(homeDir, 'skills'),
  projectMemoryDirName: '.codex/brainbrew',
  supportedHooks: [
    'SessionStart',
    'UserPromptSubmit',
    'PreToolUse',
    'PermissionRequest',
    'PostToolUse',
    'Stop',
  ],
  chainMode: 'recipe',
  pluginManifestPath: 'plugin-codex/.codex-plugin/plugin.json',
  hookTemplatePath: 'plugin-codex/hooks.json',
  runnerScriptName: 'codex-runner.cjs',
  ownedHookId: 'brainbrew-devkit',
  skillMode: 'global',
};
