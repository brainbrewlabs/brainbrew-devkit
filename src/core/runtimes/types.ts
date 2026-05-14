export type RuntimeName = 'claude' | 'opencode' | 'codex';

export type RuntimeChainMode = 'orchestrated' | 'bridge' | 'recipe';

export type RuntimeSkillMode = 'plugin-local' | 'global' | 'bridge';

export interface RuntimeProfile {
  name: RuntimeName;
  displayName: string;
  homeDir: string;
  configFile: string;
  hooksFile: string;
  skillsDir: string;
  projectMemoryDirName: string;
  supportedHooks: readonly string[];
  chainMode: RuntimeChainMode;
  pluginManifestPath: string;
  hookTemplatePath: string;
  runnerScriptName: string;
  ownedHookId: string;
  skillMode: RuntimeSkillMode;
}

export interface RuntimeHookCommand {
  command?: unknown;
}

export interface RuntimeHookEntry {
  hooks?: RuntimeHookCommand[];
}

export function supportsHook(runtime: RuntimeProfile, hookName: string): boolean {
  return runtime.supportedHooks.includes(hookName);
}

export function isOwnedHookEntry(entry: RuntimeHookEntry, ownedHookId: string, runnerScriptName: string): boolean {
  if (!Array.isArray(entry.hooks)) return false;
  return entry.hooks.some(hook => {
    if (typeof hook.command !== 'string') return false;
    return (
      hook.command.includes(`/scripts/${runnerScriptName} `) ||
      (hook.command.includes(ownedHookId) && hook.command.includes(runnerScriptName))
    );
  });
}
