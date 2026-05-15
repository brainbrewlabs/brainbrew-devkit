import { readFileSync } from 'fs';
import { getState, updateState } from '../utils/state.js';
import { log, logEvent } from '../utils/logger.js';
import { CHAIN_CONFIG_FILE, VERIFICATION_RULES_FILE, TMP_DIR } from '../utils/paths.js';
import { readActiveChainContent } from '../utils/chain-resolver.js';
import { parseChainYaml } from '../core/config.js';
import { loadProjectConfig } from '../utils/project-config.js';
import { stringify as stringifyYaml } from 'yaml';
import { join } from 'path';

const LOG_FILE = join(TMP_DIR, 'subagent-start.log');


interface AgentConfig {
  chainNext?: string | null;
  instructions?: string;
}

interface ChainConfig {
  agents: Record<string, AgentConfig>;
}

let CONFIG: ChainConfig = { agents: {} };
try {
  CONFIG = JSON.parse(readFileSync(CHAIN_CONFIG_FILE, 'utf-8')) as ChainConfig;
} catch {
  try {
    const oldRules = JSON.parse(readFileSync(VERIFICATION_RULES_FILE, 'utf-8')) as Record<string, { chainNext?: string }>;
    for (const [type, rule] of Object.entries(oldRules)) {
      CONFIG.agents[type] = { chainNext: rule.chainNext };
    }
  } catch { /* no config */ }
}

function getAgentConfig(type: string): AgentConfig {
  return CONFIG.agents[type.toLowerCase()] ?? {};
}


function parseFlowContext(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const chain = parseChainYaml(content);
    for (const [name, entry] of Object.entries(chain.flow)) {
      if (entry.context) result[name] = entry.context.trim();
    }
  } catch { /* ignore */ }
  return result;
}

function getConfigKeysForAgent(chainContent: string, agentType: string): string[] {
  try {
    const chain = parseChainYaml(chainContent);
    const entry = chain.flow[agentType.toLowerCase()];
    return entry?.config_keys ?? [];
  } catch {
    return [];
  }
}

// Slice a parsed config object to only the requested top-level keys.
// Returns null if no requested keys are present.
function sliceConfig(cfg: Record<string, unknown>, keys: string[]): Record<string, unknown> | null {
  const sliced: Record<string, unknown> = {};
  for (const k of keys) {
    if (k in cfg) sliced[k] = cfg[k];
  }
  return Object.keys(sliced).length > 0 ? sliced : null;
}


function main(): void {
  try {
    const stdin = readFileSync(0, 'utf-8').trim();
    if (!stdin) process.exit(0);

    const p = JSON.parse(stdin) as {
      agent_type?: string;
      subagent_type?: string;
      agent_name?: string;
      agentName?: string;
      agent?: string;
      tool_input?: { subagent_type?: string };
      metadata?: { agent?: string };
      agent_id?: string;
      agentId?: string;
      transcript_path?: string;
      session_id?: string;
      cwd?: string;
    };

    const type = p.agent_type
      ?? p.subagent_type
      ?? p.tool_input?.subagent_type
      ?? p.metadata?.agent
      ?? p.agentName
      ?? p.agent_name
      ?? p.agent
      ?? '';
    const id = p.agent_id ?? p.agentId ?? '';
    const transcriptPath = p.transcript_path ?? '';
    const sessionId = p.session_id ?? '';

    log(LOG_FILE, `START ${type}:${id}`);
    logEvent({ event: 'start', agent: type, id, session: sessionId });

    if (sessionId) {
      const currentState = getState(sessionId);
      if (currentState?.currentAgent && currentState.currentAgent === type.toLowerCase()) {
        updateState(sessionId, { currentAgent: undefined, chainBlockCount: 0, allowedAgents: [] });
      }
    }

    const agentConfig = getAgentConfig(type);
    const chainNext = agentConfig.chainNext;
    const instructions = agentConfig.instructions ?? '';

    let context = `
## Context
- Main Session: ${transcriptPath}
- Session ID: ${sessionId}
- You can read the main transcript to understand parent context if needed.
`;

    if (chainNext) {
      context += `
## Chain Workflow
After completing this task, the next agent should be: **${chainNext}**
Ensure your output is complete enough for the next agent to proceed.
`;
    }

    if (instructions) {
      context += instructions;
    }

    if (type.toLowerCase() === 'git-manager') {
      context += `
## Phase Reporting (REQUIRED)
After committing, check for a plan file in the project's plans/ directory.
If found, report phase status in your output:

### Phase Status
- **Committed**: [Phase name/number you just committed]
- **Remaining**: [List remaining phases, or "None" if all complete]

This helps the workflow decide if more implementation is needed.
`;
    }

    const state = getState(sessionId);

    if (state?.activeTeam) {
      const team = state.activeTeam as { name: string; teammates: Array<{ name: string; agent: string; status: string }> };
      const myTeammate = team.teammates.find(t => t.agent === type.toLowerCase());
      if (myTeammate) {
        context += `
## Team Context
You are part of the **${team.name}** team.
Your role: **${myTeammate.name}**
Other teammates: ${team.teammates.filter(t => t.name !== myTeammate.name).map(t => t.name).join(', ')}

Focus on your specific review area. Your output will be combined with other teammates' results.
`;
      }
    }

    if (state?.sharedContext) {
      context += `
## Shared Context from Previous Agents
${JSON.stringify(state.sharedContext, null, 2)}
`;
    }

    const cwd = p.cwd ?? process.cwd();

    let chainContent: string | null = null;
    try {
      chainContent = readActiveChainContent(cwd);
    } catch (e) {
      log(LOG_FILE, `[CONTEXT] Error reading chain: ${(e as Error).message}`);
    }

    // Inject project-level config — merge of .claude/config.yaml (shared)
    // and .claude/config.local.yaml (personal, gitignored; local wins),
    // then sliced to the top-level keys this agent declared in its chain
    // flow entry (`config_keys: [user, git, ...]`). Agents with no
    // `config_keys` get no config (opt-in per agent).
    try {
      if (chainContent) {
        const keys = getConfigKeysForAgent(chainContent, type);
        if (keys.length > 0) {
          const loaded = loadProjectConfig(cwd);
          if (loaded) {
            const sliced = sliceConfig(loaded.data, keys);
            if (sliced) {
              const yamlOut = stringifyYaml(sliced).trim();
              const sourcesNote = loaded.sources.join(' + ');
              context += `\n## Project Config\nShared project settings from ${sourcesNote} (keys: ${keys.join(', ')}). Respect these values — do not hardcode alternates.\n\n\`\`\`yaml\n${yamlOut}\n\`\`\`\n`;
              log(LOG_FILE, `[CONFIG] Injected keys=${keys.join(',')} sources=${sourcesNote} for ${type}`);
            } else {
              log(LOG_FILE, `[CONFIG] No matching keys in config for ${type} (requested: ${keys.join(',')})`);
            }
          }
        }
      }
    } catch (e) {
      log(LOG_FILE, `[CONFIG] Error: ${(e as Error).message}`);
    }

    try {
      if (chainContent) {
        const config = parseFlowContext(chainContent);
        const nodeContext = config[type.toLowerCase()];
        if (nodeContext) {
          context += `\n## Chain Instructions\n${nodeContext}\n`;
          log(LOG_FILE, `[CONTEXT] Injected chain context for ${type} (${nodeContext.length} chars)`);
        }
      }
    } catch (e) {
      log(LOG_FILE, `[CONTEXT] Error: ${(e as Error).message}`);
    }

    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SubagentStart',
        additionalContext: `<system-reminder>\n${context.trim()}\n</system-reminder>`,
      },
    }));

    process.exit(0);

  } catch (e: unknown) {
    console.error(`[subagent-start] ${(e as Error).message}`);
    process.exit(0);
  }
}

main();
