/**
 * Inter-Agent Communication System
 * Message Bus for agent-to-agent, orchestrator-to-agent communication
 */

export type MessageTarget =
  | 'global'                    // All agents receive
  | 'next'                      // Next agent only (whoever it is)
  | `agent:${string}`           // Specific agent type (e.g., 'agent:implementer')
  | `chain:${string}`           // All agents in a chain (e.g., 'chain:devops')
  | `session:${string}`;        // Specific session

export type MessagePersistence =
  | 'permanent'   // Survives forever (learnings, preferences)
  | 'session'     // Cleared when session ends
  | 'chain'       // Cleared when chain completes
  | 'once';       // Consumed on first read (true queue)

export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Message {
  id: string;
  content: string;

  // Routing
  target: MessageTarget;

  // Lifecycle
  persistence: MessagePersistence;

  // Priority (urgent > high > normal > low)
  priority: MessagePriority;

  // Metadata
  createdAt: string;
  createdBy: string;  // 'user' | 'orchestrator' | 'agent:<name>' | 'hook:<name>'

  // Optional
  expiresAt?: string;
  tags?: string[];

  // Context
  chainId?: string;    // Which chain this belongs to
  sessionId?: string;  // Which session this belongs to
}

export interface MessageStore {
  version: number;
  messages: Message[];
}

// Filters for querying messages
export interface MessageFilter {
  target?: MessageTarget | MessageTarget[];
  agentType?: string;
  chainId?: string;
  sessionId?: string;
  persistence?: MessagePersistence;
  tags?: string[];
  includeExpired?: boolean;
}

// Result of consuming messages
export interface ConsumeResult {
  messages: Message[];
  consumed: number;  // Number of 'once' messages removed
}
