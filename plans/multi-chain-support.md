# Multi-Chain Support Plan

## Summary

Support multiple named chains per project. Currently `chain-config.yaml` stores hooks + flow in one monolithic file. New design: `chain-config.yaml` becomes a 2-line pointer; actual chain definitions live in `.claude/chains/{name}.yaml`.

## Target Structure

```
.claude/chain-config.yaml       # pointer (2 lines)
.claude/chains/
  develop.yaml                  # chain 1 (hooks + flow)
  discovery.yaml                # chain 2 (hooks + flow)
```

Pointer format:
```yaml
active: develop
chains_dir: .claude/chains/
```

Chain files keep the exact same format they have today (hooks + flow sections).

## Backward Compatibility

Detection: if `chain-config.yaml` content matches `/^(flow|hooks):/m` it is legacy (single-chain). If it matches `/^active:/m` it is new-format (pointer). Legacy files work unchanged -- the resolver returns the file itself as the active chain config.

---

## Implementation Sequence

Execute in this exact order. Each step depends on the previous.

### Step 1: CREATE `src/utils/chain-resolver.ts`

New file. All downstream consumers import from here.

```typescript
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync, renameSync } from 'fs';
import { join, dirname } from 'path';

export interface ResolvedChain {
  configPath: string;
  chainName: string;
  isLegacy: boolean;
}

export function resolveActiveChain(cwd: string): ResolvedChain | null {
  const pointerPath = join(cwd, '.claude', 'chain-config.yaml');
  if (!existsSync(pointerPath)) return null;

  const content = readFileSync(pointerPath, 'utf-8');

  if (/^(flow|hooks):/m.test(content)) {
    return { configPath: pointerPath, chainName: 'default', isLegacy: true };
  }

  const activeMatch = content.match(/^active:\s*(.+)/m);
  if (!activeMatch) return null;

  const active = activeMatch[1].trim();
  const dirMatch = content.match(/^chains_dir:\s*(.+)/m);
  const chainsDir = dirMatch ? dirMatch[1].trim() : '.claude/chains/';
  const chainPath = join(cwd, chainsDir, `${active}.yaml`);

  if (!existsSync(chainPath)) return null;

  return { configPath: chainPath, chainName: active, isLegacy: false };
}

export function readActiveChainContent(cwd: string): string | null {
  const resolved = resolveActiveChain(cwd);
  if (!resolved) return null;
  return readFileSync(resolved.configPath, 'utf-8');
}

export function listChains(cwd: string): string[] {
  const pointerPath = join(cwd, '.claude', 'chain-config.yaml');
  if (!existsSync(pointerPath)) return [];

  const content = readFileSync(pointerPath, 'utf-8');

  if (/^(flow|hooks):/m.test(content)) {
    return ['default'];
  }

  const dirMatch = content.match(/^chains_dir:\s*(.+)/m);
  const chainsDir = dirMatch ? dirMatch[1].trim() : '.claude/chains/';
  const fullDir = join(cwd, chainsDir);

  if (!existsSync(fullDir)) return [];

  return readdirSync(fullDir)
    .filter(f => f.endsWith('.yaml'))
    .map(f => f.replace('.yaml', ''));
}

export function getActiveChainName(cwd: string): string | null {
  const resolved = resolveActiveChain(cwd);
  return resolved?.chainName ?? null;
}

export function writePointer(cwd: string, active: string, chainsDir = '.claude/chains/'): void {
  const pointerPath = join(cwd, '.claude', 'chain-config.yaml');
  const content = `active: ${active}\nchains_dir: ${chainsDir}\n`;
  writeFileSync(pointerPath, content);
}

export function migrateToMultiChain(cwd: string): string {
  const pointerPath = join(cwd, '.claude', 'chain-config.yaml');
  const chainsDir = join(cwd, '.claude', 'chains');
  mkdirSync(chainsDir, { recursive: true });

  const legacyPath = join(chainsDir, 'legacy.yaml');
  const content = readFileSync(pointerPath, 'utf-8');
  writeFileSync(legacyPath, content);
  writePointer(cwd, 'legacy');
  return 'legacy';
}
```

### Step 2: MODIFY `src/hooks/runner.ts`

**What changes**: `loadProjectHooks()` function. Replace direct `chain-config.yaml` read with `readActiveChainContent()`.

Add import at top (after existing imports on line 19-21):
```typescript
import { readActiveChainContent } from '../utils/chain-resolver.js';
```

Replace lines 83-89 of `loadProjectHooks()`:

OLD:
```typescript
  const configPath = join(cwd, '.claude', 'chain-config.yaml');
  if (existsSync(configPath)) {
    const config = parseYamlConfig(readFileSync(configPath, 'utf-8'));
    const projectHooks = (config.hooks[event] || []).map(h => resolveScriptPath(h, cwd));
    hooks.push(...projectHooks);
  }
```

NEW:
```typescript
  const chainContent = readActiveChainContent(cwd);
  if (chainContent) {
    const config = parseYamlConfig(chainContent);
    const projectHooks = (config.hooks[event] || []).map(h => resolveScriptPath(h, cwd));
    hooks.push(...projectHooks);
  }
```

### Step 3: MODIFY `src/hooks/post-agent.ts`

**What changes**: `loadChainConfig()` function. Replace direct file read with resolver.

Add import at top (after line 7):
```typescript
import { readActiveChainContent } from '../utils/chain-resolver.js';
```

Replace `loadChainConfig` body (lines 37-47):

OLD:
```typescript
function loadChainConfig(cwd: string): ChainConfig {
  const configPath = join(cwd, '.claude', 'chain-config.yaml');
  if (!existsSync(configPath)) return {};

  try {
    const content = readFileSync(configPath, 'utf-8');
    return parseSimpleYaml(content);
  } catch {
    return {};
  }
}
```

NEW:
```typescript
function loadChainConfig(cwd: string): ChainConfig {
  try {
    const content = readActiveChainContent(cwd);
    if (!content) return {};
    return parseSimpleYaml(content);
  } catch {
    return {};
  }
}
```

### Step 4: MODIFY `src/hooks/session-start.ts`

**What changes**: `hasTeamNodes()` function. Replace direct file read with resolver.

Add import at top (after line 2):
```typescript
import { readActiveChainContent } from '../utils/chain-resolver.js';
```

Replace `hasTeamNodes` body (lines 4-9):

OLD:
```typescript
function hasTeamNodes(cwd: string): boolean {
  const configPath = join(cwd, '.claude', 'chain-config.yaml');
  if (!existsSync(configPath)) return false;
  const content = readFileSync(configPath, 'utf-8');
  return /^\s+type:\s*team/m.test(content);
}
```

NEW:
```typescript
function hasTeamNodes(cwd: string): boolean {
  const content = readActiveChainContent(cwd);
  if (!content) return false;
  return /^\s+type:\s*team/m.test(content);
}
```

The `import { readFileSync, existsSync } from 'fs'` on line 1 can have `existsSync` removed since it is no longer used directly (only `readFileSync` remains for stdin). Actually `readFileSync` is still used on line 13 for stdin. Keep the import but drop `existsSync`.

OLD (line 1):
```typescript
import { readFileSync, existsSync } from 'fs';
```
NEW:
```typescript
import { readFileSync } from 'fs';
```

Also remove `import { join } from 'path';` on line 2 since `join` is no longer used.

### Step 5: MODIFY `src/mcp/server.ts` -- Update `template_bump` handler

**What changes**: Instead of copying template YAML directly to `chain-config.yaml`, copy it to `.claude/chains/{template}.yaml` and write a pointer. If old-format exists, migrate first.

Add import at top (after line 12):
```typescript
import { resolveActiveChain, readActiveChainContent, listChains, writePointer, migrateToMultiChain } from '../utils/chain-resolver.js';
```

Replace lines 152-188 (the dirs creation through return) inside `case 'template_bump'`:

OLD:
```typescript
        const dirs = ['.claude/agents', '.claude/skills', '.claude/hooks', '.claude/memory'];
        dirs.forEach(d => mkdirSync(join(cwd, d), { recursive: true }));

        // Copy agents
        const agentsDir = join(templateDir, 'agents');
        let agentCount = 0;
        if (existsSync(agentsDir)) {
          readdirSync(agentsDir).filter(f => f.endsWith('.md')).forEach(f => {
            copyFileSync(join(agentsDir, f), join(cwd, '.claude/agents', f));
            agentCount++;
          });
        }

        // Copy skills (recursive to handle subdirectories)
        const skillsDir = join(templateDir, 'skills');
        let skillCount = 0;
        if (existsSync(skillsDir)) {
          readdirSync(skillsDir).forEach(skill => {
            const src = join(skillsDir, skill);
            const dest = join(cwd, '.claude/skills', skill);
            if (statSync(src).isDirectory()) {
              copyDirRecursive(src, dest);
              skillCount++;
            }
          });
        }

        // Copy chain config
        copyFileSync(templateYaml, join(cwd, '.claude/chain-config.yaml'));

        // Read flow for display
        const config = readFileSync(templateYaml, 'utf-8');
        const flowMatch = config.match(/flow:[\s\S]*/);
        const flow = flowMatch ? flowMatch[0].substring(0, 500) : '';

        return success(`✓ Template "${template}" set up!\n\nAgents: ${agentCount}\nSkills: ${skillCount}\n\n${flow}`);
```

NEW:
```typescript
        const dirs = ['.claude/agents', '.claude/skills', '.claude/hooks', '.claude/memory', '.claude/chains'];
        dirs.forEach(d => mkdirSync(join(cwd, d), { recursive: true }));

        // Copy agents
        const agentsDir = join(templateDir, 'agents');
        let agentCount = 0;
        if (existsSync(agentsDir)) {
          readdirSync(agentsDir).filter(f => f.endsWith('.md')).forEach(f => {
            copyFileSync(join(agentsDir, f), join(cwd, '.claude/agents', f));
            agentCount++;
          });
        }

        // Copy skills (recursive to handle subdirectories)
        const skillsDir = join(templateDir, 'skills');
        let skillCount = 0;
        if (existsSync(skillsDir)) {
          readdirSync(skillsDir).forEach(skill => {
            const src = join(skillsDir, skill);
            const dest = join(cwd, '.claude/skills', skill);
            if (statSync(src).isDirectory()) {
              copyDirRecursive(src, dest);
              skillCount++;
            }
          });
        }

        // Migrate old-format chain-config.yaml if present
        const existingChain = resolveActiveChain(cwd);
        if (existingChain?.isLegacy) {
          migrateToMultiChain(cwd);
        }

        // Copy chain to .claude/chains/{template}.yaml
        copyFileSync(templateYaml, join(cwd, '.claude/chains', `${template}.yaml`));

        // Update pointer to new active chain
        writePointer(cwd, template);

        // Read flow for display
        const config = readFileSync(templateYaml, 'utf-8');
        const flowMatch = config.match(/flow:[\s\S]*/);
        const flow = flowMatch ? flowMatch[0].substring(0, 500) : '';

        return success(`Template "${template}" set up!\n\nAgents: ${agentCount}\nSkills: ${skillCount}\nActive chain: ${template}\n\n${flow}`);
```

### Step 6: MODIFY `src/mcp/server.ts` -- Update `chain_validate` handler

Replace lines 207-213 (config path resolution):

OLD:
```typescript
      case 'chain_validate': {
        const configPath = join(cwd, '.claude', 'chain-config.yaml');
        if (!existsSync(configPath)) {
          return error('No chain config found at .claude/chain-config.yaml');
        }

        const content = readFileSync(configPath, 'utf-8');
```

NEW:
```typescript
      case 'chain_validate': {
        const resolved = resolveActiveChain(cwd);
        if (!resolved) {
          return error('No chain config found. Run template_bump to set up a workflow.');
        }

        const content = readFileSync(resolved.configPath, 'utf-8');
```

Also update the success messages at lines 317 and 321 to include chain name:

OLD (line 317):
```typescript
          const summary = `✅ Chain config is valid\n\nNodes: ${flowNodes.size}\nAgents installed: ${installedAgents.size}\nTeam nodes: ${[...flowNodes.values()].filter(n => n.isTeam).length}`;
```
NEW:
```typescript
          const summary = `Chain "${resolved.chainName}" is valid\n\nNodes: ${flowNodes.size}\nAgents installed: ${installedAgents.size}\nTeam nodes: ${[...flowNodes.values()].filter(n => n.isTeam).length}`;
```

OLD (line 321):
```typescript
        return success(`Chain validation found ${issues.length} issue(s):\n\n${issues.join('\n')}\n\nNodes: ${flowNodes.size} | Agents installed: ${installedAgents.size}`);
```
NEW:
```typescript
        return success(`Chain "${resolved.chainName}" validation found ${issues.length} issue(s):\n\n${issues.join('\n')}\n\nNodes: ${flowNodes.size} | Agents installed: ${installedAgents.size}`);
```

### Step 7: MODIFY `src/mcp/server.ts` -- Add `chain_list` and `chain_switch` tools

Add to the `TOOLS` array (after the `chain_validate` definition, before the memory tools):

```typescript
  {
    name: 'chain_list',
    description: 'List all available chains in the project and show which is active',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'chain_switch',
    description: 'Switch the active chain. Takes effect immediately for subsequent agent runs.',
    inputSchema: {
      type: 'object',
      properties: {
        chain: { type: 'string', description: 'Chain name to activate (without .yaml extension)' },
      },
      required: ['chain'],
    },
  },
```

Add handler cases inside the switch statement (after `chain_validate` case, before `memory_add`):

```typescript
      case 'chain_list': {
        const chains = listChains(cwd);
        if (chains.length === 0) {
          return success('No chains found. Run template_bump to set up a workflow.');
        }
        const activeName = getActiveChainName(cwd);
        const lines = chains.map(c => c === activeName ? `- **${c}** (active)` : `- ${c}`);
        return success(`Chains:\n\n${lines.join('\n')}`);
      }

      case 'chain_switch': {
        const chain = args?.chain as string;
        const chains = listChains(cwd);

        if (chains.length === 0) {
          return error('No chains found. Run template_bump first.');
        }

        if (!chains.includes(chain)) {
          return error(`Chain "${chain}" not found. Available: ${chains.join(', ')}`);
        }

        const current = getActiveChainName(cwd);
        if (current === chain) {
          return success(`Chain "${chain}" is already active.`);
        }

        writePointer(cwd, chain);
        return success(`Switched active chain to "${chain}".`);
      }
```

Also add `getActiveChainName` to the import added in Step 5:
```typescript
import { resolveActiveChain, readActiveChainContent, listChains, getActiveChainName, writePointer, migrateToMultiChain } from '../utils/chain-resolver.js';
```

### Step 8: MODIFY `plugin/skills/chain-builder/SKILL.md`

Update the skill documentation. Key changes:

1. Replace the "Chain Config Structure" section to explain the pointer + chains directory
2. Add "List Chains" section showing `mcp__brainbrew__chain_list()`
3. Add "Switch Active Chain" section showing `mcp__brainbrew__chain_switch(chain: "name")`
4. Update "Show Chain Flow" to mention the active chain
5. Update "Create Custom Workflow" steps to include creating chain file in `.claude/chains/`

Specific text to add/replace:

Replace the "Chain Config Structure" section with:
```markdown
## Chain Config Structure

The project uses a pointer file + chain directory:

```
.claude/chain-config.yaml       # pointer to active chain
.claude/chains/
  develop.yaml                  # chain definition (hooks + flow)
  discovery.yaml                # another chain
```

Pointer file (`.claude/chain-config.yaml`):
```yaml
active: develop
chains_dir: .claude/chains/
```

Each chain file in `.claude/chains/` has the same format:
```yaml
hooks:
  PostToolUse:
    - plugin:post-agent.cjs
  SubagentStart:
    - plugin:subagent-start.cjs
  SubagentStop:
    - plugin:subagent-stop.cjs

flow:
  agent-name:
    routes:
      next-agent: "When to go here"
    decide: |
      AI routing rules
```

## List Chains

```
mcp__brainbrew__chain_list()
```

Shows all chains and which is active.

## Switch Active Chain

```
mcp__brainbrew__chain_switch(chain: "discovery")
```

Takes effect immediately for subsequent agent runs.
```

### Step 9: BUILD

```bash
npm run build
```

This compiles all TypeScript into:
- `plugin/scripts/runner.cjs`
- `plugin/scripts/post-agent.cjs`
- `plugin/scripts/subagent-start.cjs`
- `plugin/scripts/session-start.cjs`
- `plugin/mcp/mcp-server.cjs`

---

## File Change Summary

| # | File | Action | What Changes |
|---|------|--------|-------------|
| 1 | `src/utils/chain-resolver.ts` | CREATE | `resolveActiveChain()`, `readActiveChainContent()`, `listChains()`, `getActiveChainName()`, `writePointer()`, `migrateToMultiChain()` |
| 2 | `src/hooks/runner.ts` | MODIFY | `loadProjectHooks()`: replace direct file read with `readActiveChainContent()`. Add 1 import, change 4 lines. |
| 3 | `src/hooks/post-agent.ts` | MODIFY | `loadChainConfig()`: replace direct file read with `readActiveChainContent()`. Add 1 import, change 5 lines. |
| 4 | `src/hooks/session-start.ts` | MODIFY | `hasTeamNodes()`: replace direct file read with `readActiveChainContent()`. Add 1 import, change 4 lines. Remove unused `existsSync` and `join` imports. |
| 5 | `src/mcp/server.ts` | MODIFY | (a) `template_bump`: add `.claude/chains` to dirs, migrate old format, copy to chains dir, write pointer. (b) `chain_validate`: use resolver for config path, show chain name. (c) Add `chain_list` tool + handler. (d) Add `chain_switch` tool + handler. Add 1 import line. |
| 6 | `plugin/skills/chain-builder/SKILL.md` | MODIFY | Update docs: pointer structure, chain_list, chain_switch, updated workflow steps. |

---

## Acceptance Criteria

### Manual Tests (implementer should verify)

1. **Legacy backward compat**: With an existing old-format `chain-config.yaml` (has `flow:` key), running `npm run build` and using the plugin should work identically to before. No migration happens until `template_bump` is called.

2. **template_bump migrates old format**: Starting from old-format `chain-config.yaml`:
   - Call `template_bump(template: "develop")`
   - Verify `.claude/chains/legacy.yaml` exists with old content
   - Verify `.claude/chains/develop.yaml` exists with template content
   - Verify `.claude/chain-config.yaml` reads `active: develop` / `chains_dir: .claude/chains/`

3. **template_bump on fresh project**: No existing config:
   - Call `template_bump(template: "develop")`
   - Verify `.claude/chains/develop.yaml` exists
   - Verify pointer file created

4. **chain_list**: After bumping 2 templates (develop, then research):
   - `chain_list()` returns both, marks active one

5. **chain_switch**: After bumping develop + research:
   - `chain_switch(chain: "develop")` updates pointer
   - Next agent run uses develop chain flow

6. **chain_validate**: Works against resolved chain path, shows chain name in output

7. **Build succeeds**: `npm run build` completes without errors

### Automated Build Check

```bash
npm run build && echo "BUILD OK" || echo "BUILD FAILED"
npm run lint && echo "LINT OK" || echo "LINT FAILED"
```

---

## Risks

- **Hand-rolled YAML**: Pointer file is 2 lines, trivially parseable. No risk.
- **Path joins**: `chains_dir` is relative to cwd. `join(cwd, chainsDir, name + '.yaml')` handles this.
- **session-start.ts**: Runs once per session. If user switches chains mid-session, team protocol injection reflects the chain active at session start. Hooks (runner, post-agent) re-read on every invocation so they pick up changes immediately. This is acceptable.

## Unresolved Questions

None -- all decisions resolved in the plan above. Migration is explicit (only via template_bump), switching is immediate for hooks, and session-start limitation is documented.
