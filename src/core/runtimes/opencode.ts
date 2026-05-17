import { homedir } from 'os';
import { join } from 'path';
import type { RuntimeProfile } from './types.js';

const homeDir = join(homedir(), '.config', 'opencode');

export const opencodeRuntime: RuntimeProfile = {
  name: 'opencode',
  displayName: 'opencode',
  homeDir,
  configFile: join(homeDir, 'opencode.json'),
  hooksFile: join(homedir(), '.claude', 'settings.json'),
  skillsDir: join(homedir(), '.claude', 'skills'),
  projectMemoryDirName: '.claude/memory',
  supportedHooks: [
    'PreToolUse',
    'PostToolUse',
    'SubagentStart',
    'SubagentStop',
    'Stop',
    'UserPromptSubmit',
    'SessionStart',
    'SessionEnd',
    'Notification',
  ],
  chainMode: 'bridge',
  pluginManifestPath: 'plugin/.claude-plugin/plugin.json',
  hookTemplatePath: 'plugin/hooks/hooks.json',
  runnerScriptName: 'runner.cjs',
  ownedHookId: 'brainbrew-devkit',
  skillMode: 'bridge',
};
