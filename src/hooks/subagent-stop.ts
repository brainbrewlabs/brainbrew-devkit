import { readFileSync, existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { verify, getRetries, setRetries, clearRetries, MAX_RETRIES } from '../ai/verifier.js';
import { log, logEvent } from '../utils/logger.js';
import { TMP_DIR } from '../utils/paths.js';

const LOG_FILE = join(TMP_DIR, 'subagent-stop.log');
const STATS_DIR = join(TMP_DIR, 'agent-stats');

interface ToolCall {
  tool: string;
  file?: string;
  command?: string;
  pattern?: string;
}

interface AgentTranscriptStats {
  toolCalls: ToolCall[];
  toolBreakdown: Record<string, number>;
  filesRead: string[];
  filesEdited: string[];
  filesCreated: string[];
  bashCommands: string[];
  grepPatterns: string[];
  globPatterns: string[];
}

function parseTranscript(transcriptPath: string): AgentTranscriptStats | null {
  if (!existsSync(transcriptPath)) return null;
  try {
    const content = readFileSync(transcriptPath, 'utf-8');
    const stats: AgentTranscriptStats = {
      toolCalls: [],
      toolBreakdown: {},
      filesRead: [],
      filesEdited: [],
      filesCreated: [],
      bashCommands: [],
      grepPatterns: [],
      globPatterns: [],
    };

    for (const line of content.split('\n')) {
      if (!line.trim()) continue;
      let entry: Record<string, unknown>;
      try { entry = JSON.parse(line); } catch { continue; }
      if (entry.type !== 'assistant') continue;

      const msg = entry.message as { content?: Array<{ type: string; name?: string; input?: Record<string, string> }> } | undefined;
      if (!msg?.content) continue;

      for (const block of msg.content) {
        if (block.type !== 'tool_use' || !block.name) continue;
        const tool = block.name;
        const input = block.input ?? {};
        stats.toolBreakdown[tool] = (stats.toolBreakdown[tool] ?? 0) + 1;

        const call: ToolCall = { tool };

        switch (tool) {
          case 'Read':
            if (input.file_path) {
              call.file = input.file_path;
              stats.filesRead.push(input.file_path);
            }
            break;
          case 'Edit':
          case 'MultiEdit':
            if (input.file_path) {
              call.file = input.file_path;
              stats.filesEdited.push(input.file_path);
            }
            break;
          case 'Write':
            if (input.file_path) {
              call.file = input.file_path;
              stats.filesCreated.push(input.file_path);
            }
            break;
          case 'Bash':
            if (input.command) {
              call.command = input.command.substring(0, 200);
              stats.bashCommands.push(input.command.substring(0, 200));
            }
            break;
          case 'Grep':
            if (input.pattern) {
              call.pattern = input.pattern;
              stats.grepPatterns.push(`${input.pattern} in ${input.path ?? '.'}`);
            }
            break;
          case 'Glob':
            if (input.pattern) {
              call.pattern = input.pattern;
              stats.globPatterns.push(input.pattern);
            }
            break;
        }

        stats.toolCalls.push(call);
      }
    }

    stats.filesRead = [...new Set(stats.filesRead)];
    stats.filesEdited = [...new Set(stats.filesEdited)];
    stats.filesCreated = [...new Set(stats.filesCreated)];

    return stats;
  } catch {
    return null;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  try {
    const stdin = readFileSync(0, 'utf-8').trim();
    if (!stdin) process.exit(0);

    const payload = JSON.parse(stdin) as {
      stop_hook_active?: boolean;
      agent_type?: string;
      subagent_type?: string;
      agent_id?: string;
      last_assistant_message?: string;
      agent_transcript_path?: string;
      session_id?: string;
      cwd?: string;
    };

    if (payload.stop_hook_active) {
      log(LOG_FILE, `[SKIP] stop_hook_active`);
      process.exit(0);
    }

    const agentType = payload.agent_type ?? payload.subagent_type ?? '';
    const agentId = payload.agent_id ?? 'x';
    const output = payload.last_assistant_message ?? '';

    // Check retries
    const retries = getRetries(agentId);
    if (retries >= MAX_RETRIES) {
      log(LOG_FILE, `${agentType}:${agentId} max retries (${MAX_RETRIES}), allow`);
      clearRetries(agentId);
      process.exit(0);
    }

    // Parse transcript and save stats for PostToolUse to pick up
    if (payload.agent_transcript_path) {
      const transcriptStats = parseTranscript(payload.agent_transcript_path);
      if (transcriptStats) {
        if (!existsSync(STATS_DIR)) mkdirSync(STATS_DIR, { recursive: true });
        writeFileSync(join(STATS_DIR, `${agentId}.json`), JSON.stringify(transcriptStats));
        log(LOG_FILE, `[STATS] ${agentType}:${agentId} | tools=${transcriptStats.toolCalls.length} | read=${transcriptStats.filesRead.length} | edit=${transcriptStats.filesEdited.length} | bash=${transcriptStats.bashCommands.length}`);
      }
    }

    // Verify output quality
    const result = verify(agentType, output);
    const outputPreview = output.substring(0, 100).replace(/\n/g, ' ');

    if (result.pass) {
      log(LOG_FILE, `${agentType}:${agentId} PASS [${result.method}]${result.warning ? ` (${result.warning})` : ''}`);
      logEvent({
        event: 'verify',
        agent: agentType,
        id: agentId,
        result: 'pass',
        method: result.method,
        outputLen: output.length,
        outputPreview,
      });
      clearRetries(agentId);
      process.exit(0);
    }

    // Block with feedback
    setRetries(agentId, retries + 1);
    const feedback = (result.issues?.length ?? 0) > 0
      ? `Issues:\n- ${result.issues!.join('\n- ')}\n\nFix: ${result.suggestion}`
      : result.suggestion ?? 'Output incomplete';

    log(LOG_FILE, `${agentType}:${agentId} FAIL [${result.method}] (${retries + 1}/${MAX_RETRIES}): ${result.issues?.join(', ')}`);
    logEvent({
      event: 'verify',
      agent: agentType,
      id: agentId,
      result: 'fail',
      method: result.method,
      issues: result.issues,
      suggestion: result.suggestion,
      retry: retries + 1,
      outputLen: output.length,
      outputPreview,
    });

    console.log(JSON.stringify({
      decision: 'block',
      reason: `<system-reminder>\n[${retries + 1}/${MAX_RETRIES}] ${feedback}\n</system-reminder>`,
    }));
    process.exit(0);

  } catch (e: unknown) {
    log(LOG_FILE, `[ERROR] ${(e as Error).message}`);
    process.exit(0);
  }
}

main();
