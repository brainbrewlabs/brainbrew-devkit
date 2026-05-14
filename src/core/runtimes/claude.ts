import { homedir } from 'os';
import { join } from 'path';
import type { RuntimeProfile } from './types.js';

const homeDir = join(homedir(), '.claude');

export const claudeRuntime: RuntimeProfile = {
  name: 'claude',
  displayName: 'Claude Code',
  homeDir,
  configFile: join(homeDir, 'settings.json'),
  hooksFile: join(homeDir, 'settings.json'),
  skillsDir: join(homeDir, 'skills'),
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
  chainMode: 'orchestrated',
  pluginManifestPath: 'plugin/.claude-plugin/plugin.json',
  hookTemplatePath: 'plugin/hooks/hooks.json',
  runnerScriptName: 'runner.cjs',
  ownedHookId: 'brainbrew-devkit',
  skillMode: 'plugin-local',
};
