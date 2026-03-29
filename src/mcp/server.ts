/**
 * BrainBrew MCP Server
 * All plugin functionality exposed as MCP tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, existsSync, mkdirSync, readdirSync, copyFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { resolveActiveChain, listChains, getActiveChainName, writePointer, migrateToMultiChain } from '../utils/chain-resolver.js';

// Recursive directory copy
function copyDirRecursive(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (stat.isFile()) {
      copyFileSync(srcPath, destPath);
    }

  }
}
import { publish, list, clear } from '../memory/bus.js';
import { MessageTarget, MessagePersistence, MessagePriority } from '../memory/types.js';

// Plugin root from env
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || dirname(dirname(dirname(__filename)));
const TEMPLATES_DIR = join(PLUGIN_ROOT, 'config', 'templates');

const server = new Server(
  {
    name: 'brainbrew',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ─── Tool Definitions ────────────────────────────────────────────────────────

const TOOLS = [
  // ─── Workflow/Template Tools ───
  {
    name: 'template_bump',
    description: 'Set up a workflow template in the current project. Copies agents, skills, and chain config to .claude/',
    inputSchema: {
      type: 'object',
      properties: {
        template: {
          type: 'string',
          enum: ['develop', 'devops', 'marketing', 'research', 'docs', 'support', 'data', 'moderation', 'review', 'minimal'],
          description: 'Template name to set up',
        },
      },
      required: ['template'],
    },
  },
  {
    name: 'template_list',
    description: 'List all available workflow templates',
    inputSchema: { type: 'object', properties: {} },
  },

  {
    name: 'chain_validate',
    description: 'Validate the chain config. Checks that all agents in flow exist, team nodes have valid teammates, routes point to valid targets, and detects dead-end nodes.',
    inputSchema: { type: 'object', properties: {} },
  },
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

  // ─── Memory Bus Tools ───
  {
    name: 'memory_add',
    description: 'Send a message to agents via Memory Bus. Use for inter-agent communication.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Message content' },
        target: {
          type: 'string',
          description: 'Who receives: "global" (all), "next" (next agent), "agent:NAME", "chain:NAME"',
          default: 'global',
        },
        persistence: {
          type: 'string',
          enum: ['session', 'once', 'permanent'],
          description: 'session (default, temp), once (consumed), permanent (forever)',
          default: 'session',
        },
        priority: {
          type: 'string',
          enum: ['low', 'normal', 'high', 'urgent'],
          default: 'normal',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'memory_list',
    description: 'List messages in the Memory Bus',
    inputSchema: {
      type: 'object',
      properties: {
        agent: { type: 'string', description: 'Filter by agent' },
      },
    },
  },
  {
    name: 'memory_clear',
    description: 'Clear messages from Memory Bus',
    inputSchema: {
      type: 'object',
      properties: {
        agent: { type: 'string', description: 'Clear for specific agent' },
        all: { type: 'boolean', description: 'Clear all messages' },
      },
    },
  },

];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

// ─── Tool Handlers ───────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const cwd = process.cwd();

  try {
    switch (name) {
      // ─── bump_template ───
      case 'template_bump': {
        const template = args?.template as string;
        if (!/^[a-z0-9_-]+$/.test(template)) {
          return error('Invalid template name');
        }
        const templateDir = join(TEMPLATES_DIR, template);
        const templateYaml = join(TEMPLATES_DIR, `${template}.yaml`);

        if (!existsSync(templateYaml)) {
          return error(`Template "${template}" not found`);
        }

        const dirs = ['.claude/agents', '.claude/skills', '.claude/hooks', '.claude/memory', '.claude/chains'];
        dirs.forEach(d => mkdirSync(join(cwd, d), { recursive: true }));

        const agentsDir = join(templateDir, 'agents');
        let agentCount = 0;
        if (existsSync(agentsDir)) {
          readdirSync(agentsDir).filter(f => f.endsWith('.md')).forEach(f => {
            copyFileSync(join(agentsDir, f), join(cwd, '.claude/agents', f));
            agentCount++;
          });
        }

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

        const existingChain = resolveActiveChain(cwd);
        if (existingChain?.isLegacy) {
          migrateToMultiChain(cwd);
        }

        copyFileSync(templateYaml, join(cwd, '.claude/chains', `${template}.yaml`));

        writePointer(cwd, template);

        const config = readFileSync(templateYaml, 'utf-8');
        const flowMatch = config.match(/flow:[\s\S]*/);
        const flow = flowMatch ? flowMatch[0].substring(0, 500) : '';

        return success(`Template "${template}" set up!\n\nAgents: ${agentCount}\nSkills: ${skillCount}\nActive chain: ${template}\n\n${flow}`);
      }

      // ─── list_templates ───
      case 'template_list': {
        const templates = readdirSync(TEMPLATES_DIR)
          .filter(f => f.endsWith('.yaml'))
          .map(f => f.replace('.yaml', ''));

        const info = templates.map(t => {
          const yaml = readFileSync(join(TEMPLATES_DIR, `${t}.yaml`), 'utf-8');
          const desc = yaml.split('\n').find(l => l.startsWith('#'))?.replace('#', '').trim() || '';
          return `- **${t}**: ${desc}`;
        }).join('\n');

        return success(`Available templates:\n\n${info}`);
      }

      // ─── chain_validate ───
      case 'chain_validate': {
        const resolved = resolveActiveChain(cwd);
        if (!resolved) {
          return error('No chain config found. Run template_bump to set up a workflow.');
        }

        const content = readFileSync(resolved.configPath, 'utf-8');
        const issues: string[] = [];

        const installedAgents = new Set<string>();
        const agentsDir = join(cwd, '.claude', 'agents');
        if (existsSync(agentsDir)) {
          readdirSync(agentsDir)
            .filter(f => f.endsWith('.md'))
            .forEach(f => installedAgents.add(f.replace('.md', '')));
        }

        const flowNodes = new Map<string, { isTeam: boolean; teammates: Array<{ name: string; agent: string }>; routes: string[] }>();
        let currentNode = '';
        let inFlow = false;
        let inTeammates = false;
        let inRoutes = false;
        let isTeam = false;
        let teammates: Array<{ name: string; agent: string }> = [];
        let routes: string[] = [];
        let currentTm: { name: string; agent: string } | null = null;

        const flushNode = () => {
          if (!currentNode) return;
          if (currentTm) { teammates.push({ ...currentTm }); currentTm = null; }
          flowNodes.set(currentNode, { isTeam, teammates: [...teammates], routes: [...routes] });
          teammates = []; routes = []; isTeam = false;
        };

        for (const line of content.split('\n')) {
          if (line.match(/^flow:\s*$/)) { inFlow = true; continue; }
          if (!inFlow) continue;
          if (line.match(/^\S/) && !line.match(/^flow:/)) { inFlow = false; flushNode(); continue; }

          const nodeMatch = line.match(/^  (\S+):\s*$/);
          if (nodeMatch) {
            flushNode();
            currentNode = nodeMatch[1];
            inTeammates = false; inRoutes = false;
            continue;
          }

          const propFields = /^\s+(type|decide|next|on_fail|on_issues):\s*/;
          if (line.match(propFields) && currentNode) {
            if (line.match(/^\s+type:\s*team/)) isTeam = true;
            inTeammates = false; inRoutes = false;
            if (currentTm) { teammates.push({ ...currentTm }); currentTm = null; }
            continue;
          }

          if (line.match(/^\s+teammates:\s*$/) && currentNode) { inTeammates = true; inRoutes = false; continue; }
          if (line.match(/^\s+routes:\s*$/) && currentNode) { inRoutes = true; inTeammates = false; if (currentTm) { teammates.push({ ...currentTm }); currentTm = null; } continue; }

          if (inTeammates) {
            const startMatch = line.match(/^\s+- name:\s*(.+)/);
            if (startMatch) {
              if (currentTm) teammates.push({ ...currentTm });
              currentTm = { name: startMatch[1].trim(), agent: '' };
              continue;
            }
            const agentMatch = line.match(/^\s+agent:\s*(.+)/);
            if (agentMatch && currentTm) { currentTm.agent = agentMatch[1].trim(); continue; }
          }

          if (inRoutes) {
            const routeMatch = line.match(/^\s{6}(\S+):\s*"[^"]*"\s*$/);
            if (routeMatch) { routes.push(routeMatch[1]); continue; }
          }
        }
        flushNode();

        const allNodeNames = new Set(flowNodes.keys());

        for (const [nodeName, node] of flowNodes) {
          if (node.isTeam) {
            if (node.teammates.length === 0) {
              issues.push(`❌ Team "${nodeName}" has no teammates`);
            }
            for (const tm of node.teammates) {
              if (!tm.name) issues.push(`❌ Team "${nodeName}" has a teammate without a name`);
              if (!tm.agent) {
                issues.push(`❌ Teammate "${tm.name}" in team "${nodeName}" missing agent field`);
              } else if (!installedAgents.has(tm.agent)) {
                issues.push(`❌ Teammate "${tm.name}" → agent "${tm.agent}" not found in .claude/agents/`);
              }
            }
          } else {
            if (!installedAgents.has(nodeName) && nodeName !== 'END') {
              issues.push(`⚠ Flow node "${nodeName}" has no matching agent file in .claude/agents/`);
            }
          }

          if (node.routes.length === 0 && nodeName !== 'END') {
            issues.push(`⚠ Node "${nodeName}" has no routes (dead-end)`);
          }

          for (const target of node.routes) {
            if (target === 'END') continue;
            if (!allNodeNames.has(target)) {
              issues.push(`❌ Route "${nodeName}" → "${target}" but "${target}" is not defined in flow`);
            }
          }
        }

        if (issues.length === 0) {
          const summary = `Chain "${resolved.chainName}" is valid\n\nNodes: ${flowNodes.size}\nAgents installed: ${installedAgents.size}\nTeam nodes: ${[...flowNodes.values()].filter(n => n.isTeam).length}`;
          return success(summary);
        }

        return success(`Chain "${resolved.chainName}" validation found ${issues.length} issue(s):\n\n${issues.join('\n')}\n\nNodes: ${flowNodes.size} | Agents installed: ${installedAgents.size}`);
      }

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

        const pointerPath = join(cwd, '.claude', 'chain-config.yaml');
        const pointerContent = readFileSync(pointerPath, 'utf-8');
        const dirMatch = pointerContent.match(/^chains_dir:\s*(.+)/m);
        const existingChainsDir = dirMatch ? dirMatch[1].trim() : '.claude/chains/';
        writePointer(cwd, chain, existingChainsDir);
        return success(`Switched active chain to "${chain}".`);
      }

      // ─── memory_add ───
      case 'memory_add': {
        const content = args?.content as string;
        const target = (args?.target as MessageTarget) || 'global';
        const persistence = (args?.persistence as MessagePersistence) || 'session';
        const priority = (args?.priority as MessagePriority) || 'normal';

        const msg = publish(content, {
          target,
          persistence,
          priority,
          createdBy: 'mcp',
          cwd,
        });

        return success(`✓ Message added\n  Target: ${msg.target}\n  Persistence: ${msg.persistence}`);
      }

      // ─── memory_list ───
      case 'memory_list': {
        const messages = list({ agentType: args?.agent as string, cwd });

        if (messages.length === 0) {
          return success('No messages in Memory Bus');
        }

        const output = messages
          .map((m, i) => `${i + 1}. [${m.target}] (${m.persistence}) - ${m.content}`)
          .join('\n');

        return success(`Memory Bus (${messages.length}):\n\n${output}`);
      }

      // ─── memory_clear ───
      case 'memory_clear': {
        const cleared = clear({
          agentType: args?.agent as string,
          all: args?.all as boolean,
          cwd,
        });

        return success(`✓ Cleared ${cleared} messages`);
      }

      default:
        return error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return { content: [{ type: 'text' as const, text: 'Error: Chain operation failed' }], isError: true };
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function success(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function error(text: string) {
  return { content: [{ type: 'text' as const, text: `Error: ${text}` }], isError: true };
}

// ─── Start Server ────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
