import { mkdtempSync, mkdirSync, readdirSync, writeFileSync, readFileSync, existsSync, rmSync, symlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CODEX_UNSUPPORTED_HOOKS, codexRuntime } from '../core/runtimes/codex.js';
import {
  CODEX_TOOL_MATCHER,
  buildCodexHookEntry,
  codexCommand,
  collectCodexSkillSources,
  createCodexHooks,
  createCodexSkillProjection,
  mergeCodexHooks,
  quoteCommandPath,
  readCodexHooksFile,
  syncCodexSkills,
  writeCodexHooksFile,
} from './codex.js';

let tempDirs: string[] = [];

function tempDir(name = 'brainbrew-codex-'): string {
  const dir = mkdtempSync(join(tmpdir(), name));
  tempDirs.push(dir);
  return dir;
}

function makePluginRoot(): string {
  const root = tempDir('brainbrew plugin root ');
  mkdirSync(join(root, 'plugin-codex', '.codex-plugin'), { recursive: true });
  mkdirSync(join(root, 'plugin-codex', 'agents'), { recursive: true });
  mkdirSync(join(root, 'plugin-codex', 'commands'), { recursive: true });
  mkdirSync(join(root, 'plugin-codex', 'skills', 'memory'), { recursive: true });
  mkdirSync(join(root, 'plugin-codex', 'scripts'), { recursive: true });
  mkdirSync(join(root, 'plugin-codex', 'mcp'), { recursive: true });
  mkdirSync(join(root, 'plugin', '.codex-plugin'), { recursive: true });
  mkdirSync(join(root, 'plugin', '.claude-plugin'), { recursive: true });
  mkdirSync(join(root, 'plugin', 'agents'), { recursive: true });
  mkdirSync(join(root, 'plugin', 'codex', 'agents'), { recursive: true });
  mkdirSync(join(root, 'plugin', 'commands'), { recursive: true });
  mkdirSync(join(root, 'plugin', 'codex'), { recursive: true });
  mkdirSync(join(root, 'plugin', 'codex', 'skills', 'memory'), { recursive: true });
  mkdirSync(join(root, 'plugin', 'scripts'), { recursive: true });
  mkdirSync(join(root, 'plugin', 'mcp'), { recursive: true });
  mkdirSync(join(root, 'plugin', 'skills', 'memory'), { recursive: true });
  mkdirSync(join(root, 'plugin', 'config', 'templates', 'alpha', 'skills', 'shared'), { recursive: true });
  mkdirSync(join(root, 'plugin', 'config', 'templates', 'beta', 'skills', 'shared'), { recursive: true });
  mkdirSync(join(root, 'plugin', 'config', 'templates', 'alpha', 'agents'), { recursive: true });
  mkdirSync(join(root, 'plugin', 'config', 'templates', 'beta', 'agents'), { recursive: true });
  const codexManifest = JSON.stringify({
    name: 'brainbrew-devkit',
    agents: './agents/',
    commands: './commands/',
    skills: './skills/',
    hooks: './hooks.json',
  });
  writeFileSync(join(root, 'plugin-codex', '.codex-plugin', 'plugin.json'), codexManifest);
  writeFileSync(join(root, 'plugin', '.codex-plugin', 'plugin.json'), codexManifest);
  writeFileSync(join(root, 'plugin', '.mcp.json'), JSON.stringify({
    mcpServers: { brainbrew: { type: 'stdio' } },
  }));
  writeFileSync(join(root, 'plugin', '.claude-plugin', 'plugin.json'), '{}');
  writeFileSync(join(root, 'plugin-codex', 'agents', 'brainbrew-codex-coordinator.md'), '---\nname: brainbrew-codex-coordinator\n---\n');
  for (const commandName of [
    'brainbrew-chain-run',
    'brainbrew-init',
    'brainbrew-status',
    'brainbrew-sync-brainbrew-skills',
    'brainbrew-template-bump',
  ]) {
    writeFileSync(join(root, 'plugin-codex', 'commands', `${commandName}.md`), `---\nname: ${commandName.replace(/^brainbrew-/, 'brainbrew:')}\ndescription: Test command\n---\n`);
  }
  writeFileSync(join(root, 'plugin-codex', 'hooks.json'), JSON.stringify({ hooks: {} }));
  writeFileSync(join(root, 'plugin-codex', 'skills', 'memory', 'SKILL.md'), `---
name: memory
description: Codex-safe memory support.
---

Use shared memory in Codex.
`);
  writeFileSync(join(root, 'plugin-codex', 'scripts', 'codex-runner.cjs'), '');
  writeFileSync(join(root, 'plugin-codex', 'mcp', 'mcp-server.cjs'), '');
  writeFileSync(join(root, 'plugin', 'agents', 'brainbrew-codex-coordinator.md'), '---\nname: brainbrew-codex-coordinator\n---\n');
  writeFileSync(join(root, 'plugin', 'codex', 'agents', 'brainbrew-codex-coordinator.md'), '---\nname: brainbrew-codex-coordinator\n---\n');
  writeFileSync(join(root, 'plugin', 'commands', 'codex-status.md'), '---\ndescription: Status\n---\n');
  writeFileSync(join(root, 'plugin', 'codex', 'hooks.json'), JSON.stringify({ hooks: {} }));
  writeFileSync(join(root, 'plugin', 'codex', 'skills', 'memory', 'SKILL.md'), `---
name: memory
description: Codex-safe memory support.
---

Use shared memory in Codex.
`);
  writeFileSync(join(root, 'plugin', 'scripts', 'codex-runner.cjs'), '');
  writeFileSync(join(root, 'plugin', 'mcp', 'mcp-server.cjs'), '');
  writeFileSync(join(root, 'plugin', 'skills', 'memory', 'SKILL.md'), `---
name: memory
description: Memory support.
---

Use shared memory. Store active skills in .claude/skills when needed.
`);
  writeFileSync(join(root, 'plugin', 'config', 'templates', 'alpha', 'skills', 'shared', 'SKILL.md'), `---
name: shared
description: Shared alpha skill.
---

Alpha instruction.
`);
  writeFileSync(join(root, 'plugin', 'config', 'templates', 'beta', 'skills', 'shared', 'SKILL.md'), `---
name: shared
description: Shared beta skill.
---

Beta instruction.
`);
  writeFileSync(join(root, 'plugin', 'config', 'templates', 'alpha', 'agents', 'planner.md'), `---
name: planner
description: Plans work.
---

Plan carefully.
`);
  writeFileSync(join(root, 'plugin', 'config', 'templates', 'beta', 'agents', 'planner.md'), `---
name: planner
description: Plans beta work.
---

Plan beta carefully.
`);
  writeFileSync(join(root, 'plugin', 'config', 'templates', 'alpha.yaml'), `name: alpha
description: Alpha workflow
flow:
  planner:
    next: null
`);
  return root;
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
  tempDirs = [];
});

describe('codex runtime hooks', () => {
  it('declares the exact supported and unsupported hook lists', () => {
    expect(codexRuntime.projectMemoryDirName).toBe('.codex/brainbrew');
    expect(codexRuntime.supportedHooks).toEqual([
      'SessionStart',
      'UserPromptSubmit',
      'PreToolUse',
      'PermissionRequest',
      'PostToolUse',
      'Stop',
    ]);
    expect(CODEX_UNSUPPORTED_HOOKS).toEqual([
      'SubagentStart',
      'SubagentStop',
      'SessionEnd',
      'Notification',
      'PreCompact',
      'PostCompact',
    ]);
  });

  it('generates only supported hooks with quoted runner paths', () => {
    const hooks = createCodexHooks('/tmp/plugin root');
    expect(Object.keys(hooks.hooks).sort()).toEqual([...codexRuntime.supportedHooks].sort());
    expect(hooks.hooks.PreToolUse[0].matcher).toBe(CODEX_TOOL_MATCHER);
    expect(hooks.hooks.SessionStart[0].matcher).toBe('.*');
    expect(hooks.hooks.PostToolUse[0].hooks[0].timeout).toBe(60);
    expect(hooks.hooks.SessionStart[0].hooks[0].command).toBe("node '/tmp/plugin root/plugin/scripts/codex-runner.cjs' SessionStart");
  });

  it('quotes runner paths with POSIX single-quote escaping', () => {
    expect(quoteCommandPath('/tmp/plugin root/$HOME/`cmd`/$(cmd)/plugin/scripts/codex-runner.cjs')).toBe("'/tmp/plugin root/$HOME/`cmd`/$(cmd)/plugin/scripts/codex-runner.cjs'");
    expect(quoteCommandPath("/tmp/plugin 'root'/plugin/scripts/codex-runner.cjs")).toBe("'/tmp/plugin '\\''root'\\''/plugin/scripts/codex-runner.cjs'");
  });

  it('preserves non-brainbrew hooks and replaces stale brainbrew-owned hooks', () => {
    const existing = {
      hooks: {
        SessionStart: [
          { matcher: '.*', hooks: [{ type: 'command' as const, command: 'node "/user/hook.js"', timeout: 5 }] },
          { matcher: '.*', hooks: [{ type: 'command' as const, command: 'node "/old/brainbrew-devkit/scripts/codex-runner.cjs" SessionStart', timeout: 5 }] },
        ],
        Notification: [
          { matcher: '.*', hooks: [{ type: 'command' as const, command: 'node "/user/notification.js"', timeout: 5 }] },
        ],
      },
    };

    const merged = mergeCodexHooks(existing, '/tmp/plugin root');
    expect(merged.hooks.SessionStart).toHaveLength(2);
    expect(merged.hooks.SessionStart[0].hooks[0].command).toContain('/user/hook.js');
    expect(merged.hooks.SessionStart[1]).toEqual(buildCodexHookEntry('/tmp/plugin root', 'SessionStart'));
    expect(merged.hooks.Notification).toEqual(existing.hooks.Notification);
  });

  it('invalid hooks.json reports a clear error and leaves the original file in place', () => {
    const dir = tempDir();
    const hooksFile = join(dir, 'hooks.json');
    writeFileSync(hooksFile, '{bad');
    expect(() => readCodexHooksFile(hooksFile)).toThrow(/Invalid Codex hooks JSON/);
    expect(readFileSync(hooksFile, 'utf-8')).toBe('{bad');
  });

  it('creates a backup before writing hooks', () => {
    const dir = tempDir();
    const hooksFile = join(dir, 'hooks.json');
    writeFileSync(hooksFile, JSON.stringify({ hooks: {} }));
    writeCodexHooksFile(hooksFile, { hooks: { Stop: [] } });
    const backups = readFileSync(hooksFile, 'utf-8');
    expect(backups).toContain('"Stop"');
    expect(existsSync(`${hooksFile}.bak`)).toBe(true);
  });
});

describe('codex skill projection', () => {
  it('refuses to overwrite user skills without a brainbrew marker', () => {
    const pluginRoot = makePluginRoot();
    const codexHome = tempDir();
    mkdirSync(join(codexHome, 'skills', 'memory'), { recursive: true });
    writeFileSync(join(codexHome, 'skills', 'memory', 'SKILL.md'), 'user skill');

    const result = syncCodexSkills({ pluginRoot, codexHome, now: new Date('2026-05-14T00:00:00Z') });
    expect(result.conflicts.map(c => c.skillName)).toContain('memory');
    expect(readFileSync(join(codexHome, 'skills', 'memory', 'SKILL.md'), 'utf-8')).toBe('user skill');
  });

  it('generates workflow skills as recipe guidance, not executable state machines', () => {
    const pluginRoot = makePluginRoot();
    const sources = collectCodexSkillSources(pluginRoot);
    const workflow = sources.find(s => s.skillName === 'alpha-workflow');
    expect(workflow).toBeDefined();
    const projection = createCodexSkillProjection(workflow!);
    expect(projection.skillMarkdown.startsWith('---')).toBe(true);
    expect(projection.skillMarkdown).toContain('recipe and guidance only');
    expect(projection.skillMarkdown).toContain('not an executable state machine');
  });

  it('keeps generated and copied skill frontmatter at byte 1', () => {
    const pluginRoot = makePluginRoot();
    const sources = collectCodexSkillSources(pluginRoot);
    for (const source of sources) {
      expect(createCodexSkillProjection(source).skillMarkdown.startsWith('---')).toBe(true);
    }
  });

  it('includes template skills and disambiguates colliding template skills and agents', () => {
    const pluginRoot = makePluginRoot();
    const sources = collectCodexSkillSources(pluginRoot);
    expect(sources.map(s => s.skillName)).toEqual(expect.arrayContaining([
      'alpha-shared',
      'beta-shared',
      'alpha-planner',
      'beta-planner',
      'alpha-workflow',
    ]));
  });

  it('tracks copied plugin skills in the Codex manifest', () => {
    const pluginRoot = makePluginRoot();
    const codexHome = tempDir();
    const result = syncCodexSkills({ pluginRoot, codexHome, now: new Date('2026-05-14T00:00:00Z') });
    expect(result.installed).toContain('memory');
    const manifest = JSON.parse(readFileSync(join(codexHome, 'brainbrew', 'skills-manifest.json'), 'utf-8'));
    expect(manifest.skills.some((entry: { skillName: string; kind: string }) => entry.skillName === 'memory' && entry.kind === 'plugin-skill')).toBe(true);
  });

  it('prefers canonical plugin-codex skills over duplicate plugin skills', () => {
    const pluginRoot = makePluginRoot();
    const codexHome = tempDir();

    syncCodexSkills({ pluginRoot, codexHome, now: new Date('2026-05-14T00:00:00Z') });

    const syncedSkill = readFileSync(join(codexHome, 'skills', 'memory', 'SKILL.md'), 'utf-8');
    expect(syncedSkill).toContain('Codex-safe memory support.');
    expect(syncedSkill).not.toContain('Store active skills in .claude/skills');
  });

  it('does not delete a destination skill when only stale manifest ownership exists', () => {
    const pluginRoot = makePluginRoot();
    const codexHome = tempDir();
    mkdirSync(join(codexHome, 'skills', 'memory'), { recursive: true });
    mkdirSync(join(codexHome, 'brainbrew'), { recursive: true });
    writeFileSync(join(codexHome, 'skills', 'memory', 'SKILL.md'), 'user-edited skill without marker');
    writeFileSync(join(codexHome, 'brainbrew', 'skills-manifest.json'), JSON.stringify({
      skills: [{ skillName: 'memory', source: 'old', kind: 'plugin-skill', generatedAt: '2026-05-14T00:00:00Z' }],
    }));

    const result = syncCodexSkills({ pluginRoot, codexHome, now: new Date('2026-05-14T00:00:00Z') });
    expect(result.conflicts.map(c => c.skillName)).toContain('memory');
    expect(readFileSync(join(codexHome, 'skills', 'memory', 'SKILL.md'), 'utf-8')).toBe('user-edited skill without marker');
  });

  it('skips symlinked support files when syncing skills', () => {
    const pluginRoot = makePluginRoot();
    const outside = tempDir();
    writeFileSync(join(outside, 'secret.txt'), 'secret');
    symlinkSync(join(outside, 'secret.txt'), join(pluginRoot, 'plugin', 'skills', 'memory', 'secret-link.txt'));
    const codexHome = tempDir();

    syncCodexSkills({ pluginRoot, codexHome, now: new Date('2026-05-14T00:00:00Z') });
    expect(existsSync(join(codexHome, 'skills', 'memory', 'secret-link.txt'))).toBe(false);
  });

  it('skips Claude-only skills instead of blindly installing them', () => {
    const pluginRoot = makePluginRoot();
    mkdirSync(join(pluginRoot, 'plugin', 'skills', 'claude-only'), { recursive: true });
    writeFileSync(join(pluginRoot, 'plugin', 'skills', 'claude-only', 'SKILL.md'), `---
name: claude-only
description: Claude only.
---

Use SubagentStart and TeamCreate.
`);
    const sources = collectCodexSkillSources(pluginRoot);
    expect(sources.map(s => s.skillName)).not.toContain('claude-only');
  });
});

describe('codex command/status behavior', () => {
  it('status reports a missing runner path', () => {
    const pluginRoot = tempDir();
    mkdirSync(join(pluginRoot, 'plugin'), { recursive: true });
    const codexHome = tempDir();
    codexCommand(['status'], { 'plugin-root': pluginRoot, home: codexHome });
    const output = vi.mocked(console.log).mock.calls.flat().join('\n');
    expect(output).toContain('Runner: missing');
  });

  it('status reports plugin-native assets and current project state', () => {
    const pluginRoot = makePluginRoot();
    const codexHome = tempDir();
    const cwd = tempDir();
    const originalCwd = process.cwd();
    mkdirSync(join(cwd, codexRuntime.projectMemoryDirName), { recursive: true });

    try {
      process.chdir(cwd);
      codexCommand(['status'], { 'plugin-root': pluginRoot, home: codexHome });
      const output = vi.mocked(console.log).mock.calls.flat().join('\n');
      expect(output).toContain('Plugin manifest: present');
      expect(output).toContain('Plugin commands: 5 declared, present');
      expect(output).toContain('Plugin agents: 1 declared, present');
      expect(output).toContain('Plugin-native skills: 1 declared, present');
      expect(output).toContain('Plugin MCP declaration: none declared');
      expect(output).toContain('Packaged MCP server: present');
      expect(output).toContain('Packaged hook template: 1 declared, present');
      expect(output).toContain('Plugin apps: none declared');
      expect(output).toContain('Plugin assets: none declared');
      expect(output).toContain('Project state: initialized (.codex/brainbrew)');
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('status reports legacy project state for older Codex V1 workspaces', () => {
    const pluginRoot = makePluginRoot();
    const codexHome = tempDir();
    const cwd = tempDir();
    const originalCwd = process.cwd();
    mkdirSync(join(cwd, '.codex', 'memory'), { recursive: true });

    try {
      process.chdir(cwd);
      codexCommand(['status'], { 'plugin-root': pluginRoot, home: codexHome });
      const output = vi.mocked(console.log).mock.calls.flat().join('\n');
      expect(output).toContain('Project state: legacy initialized (.codex/memory)');
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('status reports present project state when workflow state exists', () => {
    const pluginRoot = makePluginRoot();
    const codexHome = tempDir();
    const cwd = tempDir();
    const originalCwd = process.cwd();
    mkdirSync(join(cwd, codexRuntime.projectMemoryDirName), { recursive: true });
    writeFileSync(join(cwd, codexRuntime.projectMemoryDirName, 'workflow-state.json'), '{}');

    try {
      process.chdir(cwd);
      codexCommand(['status'], { 'plugin-root': pluginRoot, home: codexHome });
      const output = vi.mocked(console.log).mock.calls.flat().join('\n');
      expect(output).toContain('Project state: present (.codex/brainbrew)');
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('brainbrew help still lists existing commands', async () => {
    const cliSource = readFileSync(join(process.cwd(), 'src', 'cli.ts'), 'utf-8');
    expect(cliSource).toContain('init');
    expect(cliSource).toContain('hook <subcommand>');
    expect(cliSource).toContain('codex <subcommand>');
  });

  it('codex help exposes only the public BrainBrew-owned sync command', () => {
    codexCommand(['sync-skills'], {});
    const output = vi.mocked(console.log).mock.calls.flat().join('\n');
    expect(output).toContain('sync-brainbrew-skills');
    expect(output).not.toContain('Sync BrainBrew skills into');
  });

  it('packages only the public BrainBrew Codex prompt commands', () => {
    const commandDir = join(process.cwd(), 'plugin-codex', 'commands');
    const names = readdirSync(commandDir)
      .filter(file => file.endsWith('.md'))
      .map(file => readFileSync(join(commandDir, file), 'utf-8').match(/^name:\s*(.+)$/m)?.[1])
      .sort();

    expect(names).toEqual([
      'brainbrew:chain-run',
      'brainbrew:init',
      'brainbrew:status',
      'brainbrew:sync-brainbrew-skills',
      'brainbrew:template-bump',
    ]);
  });

  it('packaged Codex MCP server exposes only Codex-safe BrainBrew workflow tools', () => {
    const script = join(process.cwd(), 'plugin-codex', 'mcp', 'mcp-server.cjs');
    if (!existsSync(script)) return;

    const request = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }) + '\n';
    const result = spawnSync('node', [script], {
      input: request,
      encoding: 'utf-8',
      timeout: 1000,
    });

    expect(result.stderr).toBe('');
    const response = JSON.parse(result.stdout.trim()) as { result: { tools: Array<{ name: string }> } };
    const names = response.result.tools.map(tool => tool.name).sort();
    expect(names).toEqual([
      'chain_list',
      'chain_run',
      'chain_switch',
      'chain_validate',
      'template_bump',
      'template_list',
    ]);
    expect(names).not.toContain('init');
    expect(names).not.toContain('memory_add');
    expect(names).not.toContain('plugin_list');
  });
});
