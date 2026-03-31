/**
 * Hook Payload Adapter
 *
 * Normalizes platform-specific hook payloads (Claude Code vs OpenCode) into
 * canonical internal shapes. Uses a defensive multi-variant mapping so the
 * code is resilient to unconfirmed OpenCode payload schema differences.
 *
 * Strategy: try Claude Code field names first, then OpenCode alternatives,
 * then safe defaults. This ensures backward compatibility while gracefully
 * handling OpenCode's different payload structure.
 */

export interface NormalizedPostToolUsePayload {
  subagent_type: string;
  agentId: string;
  totalTokens: number;
  totalDurationMs: number;
  totalToolUseCount: number;
  content: Array<{ type: string; text: string }>;
  transcript_path: string;
  session_id: string;
  cwd: string;
}

export interface NormalizedSubagentStartPayload {
  agent_type: string;
  agent_id: string;
  transcript_path: string;
  session_id: string;
}

export interface NormalizedSubagentStopPayload {
  stop_hook_active: boolean;
  agent_type: string;
  agent_id: string;
  last_assistant_message: string;
}

export function normalizePostToolUse(raw: unknown): NormalizedPostToolUsePayload {
  const p = (raw ?? {}) as Record<string, unknown>;

  // Claude Code: tool_input.subagent_type / OpenCode: flat subagent_type or agent_type
  const toolInput = (p.tool_input ?? p.toolInput ?? {}) as Record<string, unknown>;
  const toolResponse = (p.tool_response ?? p.toolResponse ?? p.result ?? {}) as Record<string, unknown>;

  return {
    subagent_type: (
      toolInput.subagent_type ??
      toolInput.subagentType ??
      p.subagent_type ??
      p.agent_type ??
      'agent'
    ) as string,

    agentId: (
      toolResponse.agentId ??
      toolResponse.agent_id ??
      p.agent_id ??
      p.agentId ??
      '?'
    ) as string,

    totalTokens: (
      toolResponse.totalTokens ??
      toolResponse.total_tokens ??
      p.total_tokens ??
      0
    ) as number,

    totalDurationMs: (
      toolResponse.totalDurationMs ??
      toolResponse.duration_ms ??
      p.duration_ms ??
      0
    ) as number,

    totalToolUseCount: (
      toolResponse.totalToolUseCount ??
      toolResponse.tool_use_count ??
      p.tool_use_count ??
      0
    ) as number,

    content: (
      toolResponse.content ??
      p.content ??
      []
    ) as Array<{ type: string; text: string }>,

    transcript_path: (
      p.transcript_path ??
      p.transcriptPath ??
      ''
    ) as string,

    session_id: (
      p.session_id ??
      p.sessionId ??
      ''
    ) as string,

    cwd: (p.cwd ?? process.cwd()) as string,
  };
}

export function normalizeSubagentStart(raw: unknown): NormalizedSubagentStartPayload {
  const p = (raw ?? {}) as Record<string, unknown>;

  return {
    agent_type: (p.agent_type ?? p.agentType ?? p.subagent_type ?? '') as string,
    agent_id: (p.agent_id ?? p.agentId ?? '') as string,
    transcript_path: (p.transcript_path ?? p.transcriptPath ?? '') as string,
    session_id: (p.session_id ?? p.sessionId ?? '') as string,
  };
}

export function normalizeSubagentStop(raw: unknown): NormalizedSubagentStopPayload {
  const p = (raw ?? {}) as Record<string, unknown>;

  return {
    stop_hook_active: (
      p.stop_hook_active ??
      p.stopHookActive ??
      false
    ) as boolean,

    agent_type: (
      p.agent_type ??
      p.subagent_type ??
      p.agentType ??
      ''
    ) as string,

    agent_id: (p.agent_id ?? p.agentId ?? 'x') as string,

    last_assistant_message: (
      p.last_assistant_message ??
      p.lastAssistantMessage ??
      p.output ??
      ''
    ) as string,
  };
}
