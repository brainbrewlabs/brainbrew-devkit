import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { getState, updateState } from '../utils/state.js';
import { log, logEvent } from '../utils/logger.js';
import { TMP_DIR, GLOBAL_PROVIDERS_FILE } from '../utils/paths.js';
import { readActiveChainContent } from '../utils/chain-resolver.js';
import { parseChainYaml, type FlowEntry } from '../core/config.js';
import { loadProviderRegistry } from '../providers/registry.js';
import { runDecide } from '../decide/runner.js';

const LOG_FILE = join(TMP_DIR, 'agent-output.log');
const PLANS_DIR = join(homedir(), '.claude', 'plans');
const MAX_AGENT_LOOPS = 0;

interface ChainConfig {
  flow?: Record<string, FlowEntry>;
  saveOutput?: string[];
}

const DEFAULT_SAVE_AGENTS = ['explore'];

function loadChainConfig(cwd: string): ChainConfig {
  try {
    const content = readActiveChainContent(cwd);
    if (!content) return { saveOutput: [...DEFAULT_SAVE_AGENTS] };
    const chain = parseChainYaml(content);
    return {
      flow: chain.flow,
      saveOutput: chain.saveOutput && chain.saveOutput.length > 0 ? chain.saveOutput : [...DEFAULT_SAVE_AGENTS],
    };
  } catch {
    return { saveOutput: [...DEFAULT_SAVE_AGENTS] };
  }
}

async function getNextAgent(
  agentType: string,
  output: string,
  config: ChainConfig
): Promise<{ next: string | null; reason: string; error?: string }> {
  const flow = config.flow?.[agentType.toLowerCase()];
  if (!flow) {
    return { next: null, reason: 'No flow defined for this agent' };
  }

  // Normalize legacy next/on_fail/on_issues into a routes map when `routes` absent,
  // so runDecide has an explicit route set to choose from.
  const node: FlowEntry = { ...flow };
  if (!node.routes) {
    const routes: Record<string, string> = {};
    if (flow.next) routes['next'] = flow.next;
    if (flow.on_fail) routes['on_fail'] = flow.on_fail;
    if (flow.on_issues) routes['on_issues'] = flow.on_issues;
    node.routes = routes;
  }

  // Decide cascade: provider HTTP → claude -p (no provider) → keyword.
  // require_decide_provider turns the no-provider branch into an error instead.
  const registry = loadProviderRegistry();
  const decision = await runDecide(node, output, registry, registry.activeDecideProvider, registry.requireDecideProvider);
  const isError = decision.source.startsWith('error:');
  return {
    next: decision.route,
    reason: `[${decision.source}] ${decision.reason}`,
    error: isError ? decision.reason : undefined,
  };
}


interface Phase {
  number: number;
  title: string;
  line: string;
  completed: boolean;
}

interface PhaseTracking {
  planFile: string;
  totalPhases: number;
  completedPhases: number;
  phases: Phase[];
}

function extractPhases(planContent: string): Phase[] {
  const phases: Phase[] = [];
  const lines = planContent.split('\n');

  const phaseRegex = /^##\s*(?:Phase|Step|Stage)\s*(\d+)[:\s-]*(.*)/i;
  const numberedRegex = /^##\s*(\d+)\.\s*(.*)/;
  const implPhaseRegex = /^###?\s*(?:Implementation\s+)?(?:Phase|Step)\s*(\d+)/i;

  for (const line of lines) {
    const match = line.match(phaseRegex) ?? line.match(numberedRegex) ?? line.match(implPhaseRegex);
    if (match) {
      phases.push({
        number: parseInt(match[1], 10),
        title: (match[2] ?? '').trim(),
        line,
        completed: false,
      });
    }
  }

  return phases;
}

function findRecentPlan(sessionId: string): string | null {
  const state = getState(sessionId);
  if (state?.phaseTracking) {
    const pt = state.phaseTracking as unknown as PhaseTracking;
    if (pt.planFile && existsSync(pt.planFile)) return pt.planFile;
  }

  if (!existsSync(PLANS_DIR)) return null;

  const files = readdirSync(PLANS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => ({
      path: join(PLANS_DIR, f),
      mtime: statSync(join(PLANS_DIR, f)).mtime,
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  return files[0]?.path ?? null;
}

function checkPhaseProgress(sessionId: string): { hasMore: boolean; allComplete?: boolean; currentPhase?: number; totalPhases?: number; nextPhase?: string; planFile?: string } {
  const rawState = getState(sessionId);
  const state = rawState as (typeof rawState & { phaseTracking?: PhaseTracking }) | null ?? {} as { phaseTracking?: PhaseTracking };

  let tracking = state.phaseTracking;
  if (!tracking) {
    const planFile = findRecentPlan(sessionId);
    if (!planFile) return { hasMore: false };

    try {
      const planContent = readFileSync(planFile, 'utf-8');
      const phases = extractPhases(planContent);
      if (phases.length <= 1) return { hasMore: false };

      tracking = {
        planFile,
        totalPhases: phases.length,
        completedPhases: 0,
        phases: phases.map(p => ({ ...p, completed: false })),
      };
      updateState(sessionId, { phaseTracking: tracking as unknown as Parameters<typeof updateState>[1]['phaseTracking'] });
    } catch {
      return { hasMore: false };
    }
  }

  tracking.completedPhases++;
  const current = tracking.completedPhases;
  const total = tracking.totalPhases;

  if (tracking.phases[current - 1]) {
    tracking.phases[current - 1].completed = true;
  }

  if (current < total) {
    updateState(sessionId, { phaseTracking: tracking as unknown as Parameters<typeof updateState>[1]['phaseTracking'] });
    const nextPhase = tracking.phases[current];
    return {
      hasMore: true,
      currentPhase: current,
      totalPhases: total,
      nextPhase: nextPhase?.title || `Phase ${current + 1}`,
      planFile: tracking.planFile,
    };
  }

  updateState(sessionId, { phaseTracking: undefined });
  return { hasMore: false, allComplete: true };
}


type ChainState = {
  previousAgents: Array<{ type: string; id: string; completedAt: string; outputSummary: string }>;
  currentAgent?: string | null;
  sharedContext?: Record<string, unknown>;
  phaseTracking?: Record<string, unknown>;
};

interface AgentTranscriptStats {
  toolCalls: Array<{ tool: string; file?: string; command?: string; pattern?: string }>;
  toolBreakdown: Record<string, number>;
  filesRead: string[];
  filesEdited: string[];
  filesCreated: string[];
  bashCommands: string[];
  grepPatterns: string[];
  globPatterns: string[];
}

const STATS_DIR = join(TMP_DIR, 'agent-stats');

function loadAgentStats(agentId: string): AgentTranscriptStats | null {
  const statsFile = join(STATS_DIR, `${agentId}.json`);
  if (!existsSync(statsFile)) return null;
  try {
    const stats = JSON.parse(readFileSync(statsFile, 'utf-8')) as AgentTranscriptStats;
    unlinkSync(statsFile);
    return stats;
  } catch {
    return null;
  }
}

function formatStatsYaml(stats: AgentTranscriptStats): string {
  let yaml = '';
  if (Object.keys(stats.toolBreakdown).length > 0) {
    yaml += 'tool_breakdown:\n';
    for (const [tool, count] of Object.entries(stats.toolBreakdown)) {
      yaml += `  ${tool}: ${count}\n`;
    }
  }
  if (stats.filesRead.length > 0) {
    yaml += 'files_read:\n';
    for (const f of stats.filesRead.slice(0, 30)) yaml += `  - "${f}"\n`;
  }
  if (stats.filesEdited.length > 0) {
    yaml += 'files_modified:\n';
    for (const f of stats.filesEdited.slice(0, 30)) yaml += `  - "${f}"\n`;
  }
  if (stats.filesCreated.length > 0) {
    yaml += 'files_created:\n';
    for (const f of stats.filesCreated.slice(0, 30)) yaml += `  - "${f}"\n`;
  }
  if (stats.bashCommands.length > 0) {
    yaml += 'bash_commands:\n';
    for (const c of stats.bashCommands.slice(0, 20)) yaml += `  - "${c.replace(/"/g, '\\"')}"\n`;
  }
  if (stats.grepPatterns.length > 0) {
    yaml += 'grep_searches:\n';
    for (const p of stats.grepPatterns.slice(0, 20)) yaml += `  - "${p.replace(/"/g, '\\"')}"\n`;
  }
  return yaml;
}

async function main(): Promise<void> {
  try {
    const stdin = readFileSync(0, 'utf-8').trim();
    if (!stdin) process.exit(0);

    const p = JSON.parse(stdin) as {
      tool_input?: { subagent_type?: string; prompt?: string; description?: string };
      tool_response?: {
        agentId?: string;
        agent_id?: string;
        agentName?: string;
        agent_name?: string;
        totalTokens?: number;
        total_tokens?: number;
        totalDurationMs?: number;
        total_duration_ms?: number;
        totalToolUseCount?: number;
        total_tool_use_count?: number;
        content?: Array<{ type: string; text: string }>;
        output?: string;
        metadata?: { agent?: string };
      };
      transcript_path?: string;
      session_id?: string;
      cwd?: string;
    };

    const tr = p.tool_response ?? {};
    const type = p.tool_input?.subagent_type
      || tr.metadata?.agent
      || tr.agent_name
      || tr.agentName
      || 'agent';
    const id = tr.agent_id ?? tr.agentId ?? '?';
    const tokens = tr.total_tokens ?? tr.totalTokens ?? 0;
    const ms = tr.total_duration_ms ?? tr.totalDurationMs ?? 0;
    const tools = tr.total_tool_use_count ?? tr.totalToolUseCount ?? 0;
    const prompt = p.tool_input?.prompt ?? '';
    const description = p.tool_input?.description ?? '';
    const _transcriptPath = p.transcript_path ?? '';
    const sessionId = p.session_id ?? '';
    const cwd = p.cwd ?? process.cwd();
    void _transcriptPath;

    const config = loadChainConfig(cwd);

    let text = '';
    if (p.tool_response?.output && p.tool_response.output.length > 0) {
      text = p.tool_response.output;
    } else if (p.tool_response?.content) {
      for (const c of p.tool_response.content) {
        if (c.type === 'text') { text = c.text; break; }
      }
    }

    const hasActiveChain = config.flow && Object.keys(config.flow).length > 0;
    const agentInFlow = hasActiveChain && config.flow![type.toLowerCase()];

    if (!agentInFlow) {
      const secs = (ms / 1000).toFixed(1);
      const kTok = (tokens / 1000).toFixed(1);
      const preview = text.length > 200 ? text.substring(0, 200) + '...' : text;
      const noti = `Agent ${type} completed | ${secs}s | ${kTok}k tokens | ${tools} tools\n\n${preview}`;
      log(LOG_FILE, `\n[${new Date().toISOString()}] ${type}:${id} ${secs}s ${kTok}k → NO CHAIN\n`);

      if (text && cwd && config.saveOutput?.includes(type.toLowerCase())) {
        try {
          const outputDir = join(cwd, '.claude', 'outputs', type.toLowerCase());
          if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
          const ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
          const filename = `${ts}.md`;
          const stats = loadAgentStats(id);
          const statsYaml = stats ? formatStatsYaml(stats) : '';
          const header = `---\nagent: ${type}\nid: ${id}\ntokens: ${tokens}\nduration_ms: ${ms}\ntools_used: ${tools}\ntimestamp: ${new Date().toISOString()}\nsession: ${sessionId}\ndescription: "${description.replace(/"/g, '\\"')}"\n${statsYaml}---\n\n`;
          const promptSection = prompt ? `## Prompt\n\n${prompt}\n\n## Output\n\n` : '';
          writeFileSync(join(outputDir, filename), header + promptSection + text);
          log(LOG_FILE, `[SAVE] ${type} → ${type.toLowerCase()}/${filename} (${text.length} chars)`);
        } catch { /* ignore */ }
      }

      console.log(JSON.stringify({
        continue: true,
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: noti,
        },
      }));
      process.exit(0);
    }

    const isBackgrounded = tokens === 0 && ms === 0 && text.length === 0;
    if (isBackgrounded) {
      const dir = dirname(LOG_FILE);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      log(LOG_FILE, `\n[${new Date().toISOString()}] ${type}:${id} BACKGROUNDED (waiting)\n`);
      logEvent({ event: 'backgrounded', agent: type, id });

      console.log(JSON.stringify({
        continue: true,
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: `<system-reminder>\n## BACKGROUND AGENT DETECTED\nAgent **${type}** was launched in background and returned empty.\n\n**You MUST wait for this agent to complete before proceeding.**\nDo NOT spawn new agents. Do NOT run commands. Do NOT skip ahead.\nThe chain will continue automatically when the agent finishes.\n</system-reminder>`,
        },
      }));
      process.exit(2);
    }

    const chainDecision = await getNextAgent(type, text, config);
    let next: string | null = chainDecision.next;

    // Routing config error (e.g. require_decide_provider on but no provider resolved).
    // Hard-stop the chain — never let a config error masquerade as a clean END.
    if (chainDecision.error) {
      log(LOG_FILE, `[CHAIN ERROR] ${type}: ${chainDecision.error}\n`);
      logEvent({ event: 'chain-error', agent: type, id, reason: chainDecision.reason });
      console.log(JSON.stringify({
        continue: true,
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: `**Chain ERROR** — routing for **${type}** could not run: ${chainDecision.error}\n\n<system-reminder>\n## CHAIN ROUTING ERROR\n${chainDecision.error}\n\nThe chain cannot continue. Do NOT spawn another agent. Do NOT skip ahead.\n\nFix — edit ${GLOBAL_PROVIDERS_FILE} and do ONE of:\n  1. Set "active_decide_provider" to a configured provider name, then verify with the providers_test MCP tool. Use providers_list to see available names.\n  2. Set "require_decide_provider": false to allow the built-in claude -p routing fallback.\n\nReport these two options to the user verbatim and stop.\n</system-reminder>`,
        },
      }));
      process.exit(2);
    }

    if (type.toLowerCase() === 'git-manager' && sessionId) {
      const progress = checkPhaseProgress(sessionId);
      if (progress.hasMore) {
        next = 'implementer';
        log(LOG_FILE, `[PHASE] ${progress.currentPhase}/${progress.totalPhases} → implementer: ${progress.nextPhase}\n`);
      } else if (progress.allComplete) {
        next = null;
        log(LOG_FILE, `[PHASE] All phases complete\n`);
      }
    }

    const currentFlow = config.flow?.[type.toLowerCase()];
    if (next && sessionId && currentFlow?.reset_counters === true) {
      const state = (getState(sessionId) ?? { previousAgents: [] }) as ChainState;
      state.previousAgents = (state.previousAgents ?? []).filter(a => a.type !== next);
      updateState(sessionId, state as Parameters<typeof updateState>[1]);
    }

    if (next && sessionId) {
      const state = (getState(sessionId) ?? { previousAgents: [] }) as ChainState;
      const nextAgentCount = (state.previousAgents ?? []).filter(a => a.type === next).length;

      if (MAX_AGENT_LOOPS > 0 && nextAgentCount >= MAX_AGENT_LOOPS) {
        log(LOG_FILE, `[LOOP BREAK] ${next} already ran ${nextAgentCount} times\n`);
        logEvent({ event: 'loop-break', agent: type, next, count: nextAgentCount, session: sessionId });

        console.log(JSON.stringify({
          continue: true,
          hookSpecificOutput: {
            hookEventName: 'PostToolUse',
            additionalContext: `**Chain stopped** — **${next}** already ran ${nextAgentCount} times (max ${MAX_AGENT_LOOPS}). Review the output above and decide how to proceed.\n\n<system-reminder>\n## CHAIN LOOP DETECTED\nThe agent **${next}** has hit the maximum revision limit (${nextAgentCount}/${MAX_AGENT_LOOPS}).\nDo NOT spawn another agent. Report this to the user with a clear summary of what was accomplished and what still needs attention.\n</system-reminder>`,
          },
        }));
        process.exit(2);
      }
    }

    const preview = text.length > 200 ? text.substring(0, 200) + '...' : text;
    const secs = (ms / 1000).toFixed(1);
    const kTok = (tokens / 1000).toFixed(1);

    let noti = `Agent ${type} completed | ${secs}s | ${kTok}k tokens | ${tools} tools`;

    if (next) {
      const nextFlow = config.flow?.[next];
      if (nextFlow?.type === 'team' && nextFlow.teammates) {
        const teammates = nextFlow.teammates;
        const teamInstruction = teammates.map(t =>
          `- Teammate "${t.name}" using agent type "${t.agent}"${t.prompt ? `: ${t.prompt}` : ''}${t.model ? ` (model: ${t.model})` : ''}`
        ).join('\n');

        const routesList = nextFlow.routes
          ? Object.entries(nextFlow.routes).map(([agent, desc]) => `- "${agent}" → ${desc}`).join('\n')
          : '';

        noti += `

<system-reminder>
## MANDATORY NEXT STEP — AGENT TEAM
You MUST now create an agent team for the **${next}** step.

Create a team with these teammates:
${teamInstruction}

Each teammate should work in parallel. After all teammates complete, synthesize their results and continue the chain.

Use the TeamCreate tool to create the team with the above configuration.
${routesList ? `\nAfter the team completes, route based on:\n${routesList}` : ''}
${nextFlow.decide ? `\nRouting rules:\n${nextFlow.decide}` : ''}
DO NOT ask user. DO NOT skip. Wait for all teammates to finish before proceeding.
</system-reminder>`;
      } else {
        const flowNode = config.flow?.[type.toLowerCase()];
        const routes = flowNode?.routes ? Object.keys(flowNode.routes).filter(r => r !== 'END') : [];
        const selfAndRoutes = [...new Set([type.toLowerCase(), ...routes])];
        const otherOptions = selfAndRoutes.filter(a => a !== next);
        const altText = otherOptions.length > 0 ? `\nAlternatively: ${otherOptions.map(a => `Agent(subagent_type="${a}")`).join(' or ')}` : '';
        noti += `

<system-reminder>
## MANDATORY NEXT STEP
You MUST now spawn the **${next}** agent to continue the chain.

Command: Use Agent tool with subagent_type="${next}"
${altText}
DO NOT ask user. DO NOT skip. DO NOT background agents.
</system-reminder>`;
      }
    } else {
      noti += `\n\nChain complete. No next agent.`;
    }

    noti += `\n\n${preview}`;

    log(LOG_FILE, `\n[${new Date().toISOString()}] ${type}:${id} ${secs}s ${kTok}k → ${next ?? 'END'}\n`);
    logEvent({
      event: 'complete',
      agent: type,
      id,
      tokens,
      duration: ms,
      tools,
      next: next ?? null,
      reason: chainDecision.reason,
    });

    if (sessionId) {
      const state = (getState(sessionId) ?? { previousAgents: [] }) as ChainState;
      state.previousAgents = state.previousAgents ?? [];
      state.previousAgents.push({
        type,
        id,
        completedAt: new Date().toISOString(),
        outputSummary: preview.substring(0, 100),
      });
      if (next) {
        state.currentAgent = next;
        const flowNode = config.flow?.[type.toLowerCase()];
        const routes = flowNode?.routes ? Object.keys(flowNode.routes).filter(r => r !== 'END') : [];
        const allowed = new Set(routes);
        allowed.add(type.toLowerCase());
        allowed.add(next);
        (state as Record<string, unknown>).allowedAgents = [...allowed];
      } else {
        state.currentAgent = null;
        state.previousAgents = [];
        (state as Record<string, unknown>).allowedAgents = [];
        (state as Record<string, unknown>).chainBlockCount = 0;
      }
      updateState(sessionId, state as Parameters<typeof updateState>[1]);

      try {
        const tmpOutputDir = join(TMP_DIR, 'agent-outputs');
        if (!existsSync(tmpOutputDir)) mkdirSync(tmpOutputDir, { recursive: true });
        writeFileSync(join(tmpOutputDir, `${id}.md`), text);
      } catch { /* ignore */ }
    }

    const flowNode = config.flow![type.toLowerCase()] as Record<string, unknown> | undefined;
    if (flowNode?.saveOutput === true && text && cwd) {
      try {
        const outputDir = join(cwd, '.claude', 'outputs', type.toLowerCase());
        if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
        const ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const filename = `${ts}.md`;
        const stats = loadAgentStats(id);
        const statsYaml = stats ? formatStatsYaml(stats) : '';
        const header = `---\nagent: ${type}\nid: ${id}\ntokens: ${tokens}\nduration_ms: ${ms}\ntools_used: ${tools}\ntimestamp: ${new Date().toISOString()}\nsession: ${sessionId}\nnext: ${next ?? 'END'}\ndescription: "${description.replace(/"/g, '\\"')}"\n${statsYaml}---\n\n`;
        const promptSection = prompt ? `## Prompt\n\n${prompt}\n\n## Output\n\n` : '';
        writeFileSync(join(outputDir, filename), header + promptSection + text);
        log(LOG_FILE, `[SAVE] ${type} → ${type.toLowerCase()}/${filename} (${text.length} chars)`);
      } catch { /* ignore save failures */ }
    }

    console.log(JSON.stringify({
      continue: true,
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: noti,
      },
    }));
    process.exit(2);

  } catch (e: unknown) {
    console.error(`[post-agent] ${(e as Error).message}`);
    process.exit(0);
  }
}

main();
