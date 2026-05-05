import { readFileSync } from 'fs';
import { join } from 'path';
import { getState, updateState } from '../utils/state.js';
import { log, logEvent } from '../utils/logger.js';
import { TMP_DIR } from '../utils/paths.js';
import { advanceFromMcp, advanceFromTool } from '../core/runtime.js';

const LOG_FILE = join(TMP_DIR, 'post-tool-use.log');

function main(): void {
  try {
    const stdin = readFileSync(0, 'utf-8').trim();
    if (!stdin) process.exit(0);

    const p = JSON.parse(stdin) as {
      tool_name?: string;
      tool_input?: Record<string, unknown>;
      tool_response?: Record<string, unknown> | { content?: Array<{ type: string; text: string }>; output?: string };
      tool_use_id?: string;
      session_id?: string;
      cwd?: string;
    };

    const toolName = p.tool_name ?? '';
    const sessionId = p.session_id ?? '';
    const cwd = p.cwd ?? process.cwd();

    if (!sessionId || !toolName) process.exit(0);
    if (toolName === 'Task') process.exit(0);

    const state = getState(sessionId);
    if (!state?.awaiting) process.exit(0);

    const awaiting = state.awaiting;
    const isMcp = toolName.startsWith('mcp__');
    const matches = isMcp
      ? awaiting.kind === 'mcp' && awaiting.toolName === toolName
      : awaiting.kind === 'tool' && awaiting.toolName === toolName;

    if (!matches) {
      log(LOG_FILE, `tool=${toolName} awaiting=${awaiting.kind}:${awaiting.kind === 'subagent' ? awaiting.agentType : awaiting.toolName} → no match`);
      process.exit(0);
    }

    log(LOG_FILE, `tool=${toolName} matches awaiting node=${awaiting.nodeId} → advance`);
    logEvent({ event: 'mcp-advance', tool: toolName, node: awaiting.nodeId, session: sessionId });

    const decision = isMcp
      ? advanceFromMcp(cwd, sessionId, awaiting.nodeId, toolName, p.tool_response ?? {})
      : advanceFromTool(cwd, sessionId, awaiting.nodeId, toolName, p.tool_response ?? {});

    updateState(sessionId, { awaiting: undefined });

    if (decision?.instruction) {
      console.log(JSON.stringify({
        continue: true,
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: decision.instruction,
        },
      }));
      process.exit(2);
    }

    process.exit(0);
  } catch (e: unknown) {
    log(LOG_FILE, `[ERROR] ${(e as Error).message}`);
    process.exit(0);
  }
}

main();
