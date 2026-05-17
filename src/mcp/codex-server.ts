/**
 * Codex-safe BrainBrew MCP server.
 *
 * This server intentionally avoids Claude/opencode setup tools. It exposes
 * BrainBrew workflow helpers that operate on Codex project state only.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { parseChainYaml } from '../core/config.js';

const PLUGIN_ROOT = process.env.BRAINBREW_PLUGIN_ROOT || process.env.CODEX_PLUGIN_ROOT || dirname(dirname(__filename));
const TEMPLATE_ROOT = join(PLUGIN_ROOT, 'config', 'templates');
const CODEX_STATE_DIR = join('.codex', 'brainbrew');
const CODEX_CHAINS_DIR = join(CODEX_STATE_DIR, 'chains');
const CODEX_ACTIVE_CHAIN = join(CODEX_STATE_DIR, 'active-chain.json');

type ToolResponse = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};

function success(text: string): ToolResponse {
  return { content: [{ type: 'text', text }] };
}

function error(text: string): ToolResponse {
  return { content: [{ type: 'text', text }], isError: true };
}

function templateNames(): string[] {
  if (!existsSync(TEMPLATE_ROOT)) return [];
  return readdirSync(TEMPLATE_ROOT)
    .filter(file => file.endsWith('.yaml') && statSync(join(TEMPLATE_ROOT, file)).isFile())
    .map(file => file.replace(/\.yaml$/, ''))
    .sort();
}

function ensureState(cwd: string): void {
  mkdirSync(join(cwd, CODEX_CHAINS_DIR), { recursive: true });
}

function chainPath(cwd: string, chain: string): string {
  return join(cwd, CODEX_CHAINS_DIR, `${chain}.yaml`);
}

function listProjectChains(cwd: string): string[] {
  const dir = join(cwd, CODEX_CHAINS_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(file => file.endsWith('.yaml') && statSync(join(dir, file)).isFile())
    .map(file => file.replace(/\.yaml$/, ''))
    .sort();
}

function getActiveChain(cwd: string): string | null {
  const file = join(cwd, CODEX_ACTIVE_CHAIN);
  if (!existsSync(file)) return null;
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf-8')) as { active?: unknown };
    return typeof parsed.active === 'string' ? parsed.active : null;
  } catch {
    return null;
  }
}

function setActiveChain(cwd: string, chain: string): void {
  ensureState(cwd);
  writeFileSync(join(cwd, CODEX_ACTIVE_CHAIN), JSON.stringify({ active: chain }, null, 2) + '\n');
}

function validName(name: unknown): name is string {
  return typeof name === 'string' && /^[a-zA-Z0-9_-]+$/.test(name);
}

function firstFlowNode(content: string): string {
  const parsed = parseChainYaml(content);
  return Object.keys(parsed.flow)[0] ?? '';
}

const TOOLS = [
  {
    name: 'template_bump',
    description: 'Copy a BrainBrew workflow recipe into .codex/brainbrew/chains and mark it active for Codex guidance.',
    inputSchema: {
      type: 'object',
      properties: {
        template: {
          type: 'string',
          enum: templateNames(),
          description: 'BrainBrew template name',
        },
      },
      required: ['template'],
    },
  },
  {
    name: 'template_list',
    description: 'List BrainBrew workflow templates available to copy into Codex project state.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'chain_list',
    description: 'List BrainBrew workflow recipes copied into .codex/brainbrew/chains.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'chain_switch',
    description: 'Set the active BrainBrew workflow recipe for Codex guidance.',
    inputSchema: {
      type: 'object',
      properties: {
        chain: { type: 'string', description: 'Chain name to activate' },
      },
      required: ['chain'],
    },
  },
  {
    name: 'chain_run',
    description: 'Set the active BrainBrew workflow recipe and return Codex-oriented execution guidance.',
    inputSchema: {
      type: 'object',
      properties: {
        chain: { type: 'string', description: 'Chain name to use' },
      },
      required: ['chain'],
    },
  },
  {
    name: 'chain_validate',
    description: 'Validate the active BrainBrew workflow recipe structure for Codex guidance.',
    inputSchema: { type: 'object', properties: {} },
  },
];

const server = new Server(
  { name: 'brainbrew-codex', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;
  const cwd = process.cwd();

  try {
    switch (name) {
      case 'template_list': {
        const templates = templateNames();
        return success(templates.length ? `Available BrainBrew templates:\n\n${templates.map(t => `- ${t}`).join('\n')}` : 'No BrainBrew templates found.');
      }

      case 'template_bump': {
        const template = args?.template;
        if (!validName(template)) return error('Invalid template name.');
        const source = join(TEMPLATE_ROOT, `${template}.yaml`);
        if (!existsSync(source)) return error(`Template "${template}" not found.`);
        ensureState(cwd);
        writeFileSync(chainPath(cwd, template), readFileSync(source, 'utf-8'));
        setActiveChain(cwd, template);
        return success(`Template "${template}" copied to ${CODEX_CHAINS_DIR} and marked active for Codex guidance.`);
      }

      case 'chain_list': {
        const chains = listProjectChains(cwd);
        if (!chains.length) return success('No BrainBrew chains found in .codex/brainbrew/chains. Run template_bump first.');
        const active = getActiveChain(cwd);
        return success(`BrainBrew chains:\n\n${chains.map(chain => chain === active ? `- **${chain}** (active)` : `- ${chain}`).join('\n')}`);
      }

      case 'chain_switch': {
        const chain = args?.chain;
        if (!validName(chain)) return error('Invalid chain name.');
        if (!existsSync(chainPath(cwd, chain))) return error(`Chain "${chain}" not found in ${CODEX_CHAINS_DIR}.`);
        setActiveChain(cwd, chain);
        return success(`Active BrainBrew chain set to "${chain}".`);
      }

      case 'chain_run': {
        const chain = args?.chain;
        if (!validName(chain)) return error('Invalid chain name.');
        const file = chainPath(cwd, chain);
        if (!existsSync(file)) return error(`Chain "${chain}" not found in ${CODEX_CHAINS_DIR}. Run template_bump first.`);
        const content = readFileSync(file, 'utf-8');
        setActiveChain(cwd, chain);
        const first = firstFlowNode(content);
        return success(
          `BrainBrew chain "${chain}" is active for Codex guidance.\n\n` +
          (first ? `Start with the "${first}" phase. ` : '') +
          'Use the workflow as a recipe; Codex does not execute Claude-style automatic chain routing.',
        );
      }

      case 'chain_validate': {
        const active = getActiveChain(cwd);
        if (!active) return error('No active BrainBrew chain. Run template_bump or chain_switch first.');
        const file = chainPath(cwd, active);
        if (!existsSync(file)) return error(`Active chain "${active}" is missing from ${CODEX_CHAINS_DIR}.`);
        const parsed = parseChainYaml(readFileSync(file, 'utf-8'));
        const nodes = Object.keys(parsed.flow);
        const issues: string[] = [];
        if (!nodes.length) issues.push('No flow nodes found.');
        for (const [node, entry] of Object.entries(parsed.flow)) {
          for (const target of [entry.next, entry.on_fail, entry.on_issues].filter(Boolean)) {
            if (target !== 'END' && typeof target === 'string' && !parsed.flow[target]) {
              issues.push(`Node "${node}" references missing target "${target}".`);
            }
          }
        }
        return success(issues.length ? `Chain "${active}" has ${issues.length} issue(s):\n\n${issues.join('\n')}` : `Chain "${active}" is valid for Codex guidance. Nodes: ${nodes.length}`);
      }

      default:
        return error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return error((err as Error).message);
  }
});

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
