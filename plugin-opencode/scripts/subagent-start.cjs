"use strict";

// src/hooks/subagent-start.ts
var import_fs5 = require("fs");

// src/utils/state.ts
var import_fs2 = require("fs");
var import_path3 = require("path");

// src/utils/paths.ts
var import_os2 = require("os");
var import_path2 = require("path");

// src/utils/platform.ts
var import_os = require("os");
var import_fs = require("fs");
var import_path = require("path");
var _platform = null;
function detectPlatform() {
  const override = process.env.BRAINBREW_PLATFORM;
  if (override === "opencode") return "opencode";
  if (override === "claude") return "claude";
  if (process.env.OPENCODE_PLUGIN_ROOT || process.env.OPENCODE) return "opencode";
  if (process.env.CLAUDE_PLUGIN_ROOT || process.env.CLAUDECODE) return "claude";
  const home = (0, import_os.homedir)();
  const opencodeDir = (0, import_path.join)(home, ".config", "opencode");
  const claudeDir = (0, import_path.join)(home, ".claude");
  if ((0, import_fs.existsSync)(opencodeDir) && !(0, import_fs.existsSync)(claudeDir)) return "opencode";
  return "claude";
}
function getPlatform() {
  if (_platform === null) {
    _platform = detectPlatform();
  }
  return _platform;
}
function getBaseDir() {
  const home = (0, import_os.homedir)();
  return getPlatform() === "opencode" ? (0, import_path.join)(home, ".config", "opencode") : (0, import_path.join)(home, ".claude");
}
function getProjectConfigDir(cwd) {
  if ((0, import_fs.existsSync)((0, import_path.join)(cwd, ".opencode", "chain-config.yaml"))) return ".opencode";
  if ((0, import_fs.existsSync)((0, import_path.join)(cwd, ".claude", "chain-config.yaml"))) return ".claude";
  return getPlatform() === "opencode" ? ".opencode" : ".claude";
}

// src/utils/paths.ts
var HOME = (0, import_os2.homedir)();
var BASE = getBaseDir();
var CLAUDE_DIR = BASE;
var CHAINS_DIR = (0, import_path2.join)(BASE, "chains");
var BACKUP_DIR = (0, import_path2.join)(CHAINS_DIR, ".backup");
var AGENTS_DIR = (0, import_path2.join)(BASE, "agents");
var SKILLS_DIR = (0, import_path2.join)(BASE, "skills");
var HOOKS_DIR = (0, import_path2.join)(BASE, "hooks", "chains");
var CUSTOM_HOOKS_DIR = (0, import_path2.join)(HOOKS_DIR, "custom");
var TMP_DIR = (0, import_path2.join)(BASE, "tmp");
var PROJECTS_DIR = (0, import_path2.join)(BASE, "projects");
var SETTINGS_FILE = (0, import_path2.join)(BASE, "settings.json");
var CHAIN_CONFIG_FILE = (0, import_path2.join)(HOOKS_DIR, "chain-config.json");
var VERIFICATION_RULES_FILE = (0, import_path2.join)(HOOKS_DIR, "verification-rules.json");
var HOOKS_CONFIG_FILE = (0, import_path2.join)(HOOKS_DIR, "hooks-config.yaml");
var CHAIN_EVENTS_LOG = (0, import_path2.join)(TMP_DIR, "chain-events.jsonl");

// src/utils/state.ts
var STATE_DIR = (0, import_path3.join)(TMP_DIR, "chain-state");
function statePath(sessionId) {
  return (0, import_path3.join)(STATE_DIR, `${sessionId}.json`);
}
function getState(sessionId) {
  if (!sessionId) return null;
  const file = statePath(sessionId);
  if (!(0, import_fs2.existsSync)(file)) return null;
  try {
    return JSON.parse((0, import_fs2.readFileSync)(file, "utf-8"));
  } catch {
    return null;
  }
}

// src/utils/payload-adapter.ts
function normalizeSubagentStart(raw) {
  const p = raw ?? {};
  return {
    agent_type: p.agent_type ?? p.agentType ?? p.subagent_type ?? "",
    agent_id: p.agent_id ?? p.agentId ?? "",
    transcript_path: p.transcript_path ?? p.transcriptPath ?? "",
    session_id: p.session_id ?? p.sessionId ?? ""
  };
}

// src/utils/logger.ts
var import_fs3 = require("fs");
var import_path4 = require("path");
function log(file, msg) {
  const dir = (0, import_path4.dirname)(file);
  if (!(0, import_fs3.existsSync)(dir)) (0, import_fs3.mkdirSync)(dir, { recursive: true });
  (0, import_fs3.appendFileSync)(file, `${(/* @__PURE__ */ new Date()).toISOString()} ${msg}
`);
}
function logEvent(data) {
  const dir = (0, import_path4.dirname)(CHAIN_EVENTS_LOG);
  if (!(0, import_fs3.existsSync)(dir)) (0, import_fs3.mkdirSync)(dir, { recursive: true });
  const entry = { ts: (/* @__PURE__ */ new Date()).toISOString(), ...data };
  (0, import_fs3.appendFileSync)(CHAIN_EVENTS_LOG, JSON.stringify(entry) + "\n");
}

// src/memory/bus.ts
var import_fs4 = require("fs");
var import_path5 = require("path");
var GLOBAL_STORE_PATH = (0, import_path5.join)(CLAUDE_DIR, "memory", "bus.json");
function getProjectStorePath(cwd) {
  return (0, import_path5.join)(cwd, getProjectConfigDir(cwd), "memory", "bus.json");
}
function ensureDir(filePath) {
  const dir = (0, import_path5.dirname)(filePath);
  if (!(0, import_fs4.existsSync)(dir)) {
    (0, import_fs4.mkdirSync)(dir, { recursive: true });
  }
}
function loadStore(path) {
  if (!(0, import_fs4.existsSync)(path)) {
    return { version: 1, messages: [] };
  }
  try {
    return JSON.parse((0, import_fs4.readFileSync)(path, "utf-8"));
  } catch {
    return { version: 1, messages: [] };
  }
}
function saveStore(path, store) {
  ensureDir(path);
  (0, import_fs4.writeFileSync)(path, JSON.stringify(store, null, 2));
}
var PRIORITY_ORDER = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1
};
function subscribe(agentType, options = {}) {
  const cwd = options.cwd || process.cwd();
  const projectPath = getProjectStorePath(cwd);
  const projectStore = loadStore(projectPath);
  const globalStore = loadStore(GLOBAL_STORE_PATH);
  const allMessages = [...globalStore.messages, ...projectStore.messages];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const relevant = allMessages.filter((msg) => {
    if (msg.expiresAt && msg.expiresAt < now) return false;
    if (msg.target === "global") return true;
    if (msg.target === "next") return true;
    if (msg.target === `agent:${agentType}`) return true;
    if (options.chainId && msg.target === `chain:${options.chainId}`) return true;
    if (options.sessionId && msg.target === `session:${options.sessionId}`) return true;
    return false;
  });
  relevant.sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]);
  const toConsume = relevant.filter(
    (msg) => msg.persistence === "once" || msg.target === "next"
  );
  const consumeIds = new Set(toConsume.map((m) => m.id));
  if (consumeIds.size > 0) {
    projectStore.messages = projectStore.messages.filter((m) => !consumeIds.has(m.id));
    globalStore.messages = globalStore.messages.filter((m) => !consumeIds.has(m.id));
    saveStore(projectPath, projectStore);
    saveStore(GLOBAL_STORE_PATH, globalStore);
  }
  return {
    messages: relevant,
    consumed: consumeIds.size
  };
}
function sanitizeContent(content) {
  return content.replace(/^#+/gm, "").replace(/\n+/g, " ").slice(0, 500);
}
function formatForContext(messages) {
  if (messages.length === 0) return "";
  const priorityGroups = {
    urgent: [],
    high: [],
    normal: [],
    low: []
  };
  messages.forEach((m) => priorityGroups[m.priority].push(m));
  let output = "## Injected Context (Memory Bus)\n\n";
  if (priorityGroups.urgent.length > 0) {
    output += "### \u26A0\uFE0F URGENT\n";
    priorityGroups.urgent.forEach((m) => {
      output += `- ${sanitizeContent(m.content)}
`;
    });
    output += "\n";
  }
  if (priorityGroups.high.length > 0) {
    output += "### High Priority\n";
    priorityGroups.high.forEach((m) => {
      output += `- ${sanitizeContent(m.content)}
`;
    });
    output += "\n";
  }
  const normalAndLow = [...priorityGroups.normal, ...priorityGroups.low];
  if (normalAndLow.length > 0) {
    output += "### Context\n";
    normalAndLow.forEach((m) => {
      output += `- ${sanitizeContent(m.content)}
`;
    });
  }
  return output.trim();
}

// src/hooks/subagent-start.ts
var import_path6 = require("path");
var LOG_FILE = (0, import_path6.join)(TMP_DIR, "subagent-start.log");
var CONFIG = { agents: {} };
try {
  CONFIG = JSON.parse((0, import_fs5.readFileSync)(CHAIN_CONFIG_FILE, "utf-8"));
} catch {
  try {
    const oldRules = JSON.parse((0, import_fs5.readFileSync)(VERIFICATION_RULES_FILE, "utf-8"));
    for (const [type, rule] of Object.entries(oldRules)) {
      CONFIG.agents[type] = { chainNext: rule.chainNext };
    }
  } catch {
  }
}
function getAgentConfig(type) {
  return CONFIG.agents[type.toLowerCase()] ?? {};
}
function main() {
  try {
    const stdin = (0, import_fs5.readFileSync)(0, "utf-8").trim();
    if (!stdin) process.exit(0);
    const p = normalizeSubagentStart(JSON.parse(stdin));
    const type = p.agent_type;
    const id = p.agent_id;
    const transcriptPath = p.transcript_path;
    const sessionId = p.session_id;
    log(LOG_FILE, `START ${type}:${id}`);
    logEvent({ event: "start", agent: type, id, session: sessionId });
    const agentConfig = getAgentConfig(type);
    const chainNext = agentConfig.chainNext;
    const instructions = agentConfig.instructions ?? "";
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
    if (type.toLowerCase() === "git-manager") {
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
    try {
      const { messages, consumed } = subscribe(type, {
        sessionId,
        chainId: state?.currentChain,
        cwd: process.cwd()
      });
      if (messages.length > 0) {
        const busContext = formatForContext(messages);
        context += `
${busContext}
`;
        log(LOG_FILE, `[BUS] Injected ${messages.length} messages (consumed: ${consumed})`);
      }
    } catch (e) {
      log(LOG_FILE, `[BUS] Error: ${e.message}`);
    }
    if (state?.activeTeam) {
      const team = state.activeTeam;
      const myTeammate = team.teammates.find((t) => t.agent === type.toLowerCase());
      if (myTeammate) {
        context += `
## Team Context
You are part of the **${team.name}** team.
Your role: **${myTeammate.name}**
Other teammates: ${team.teammates.filter((t) => t.name !== myTeammate.name).map((t) => t.name).join(", ")}

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
    if (state?.previousAgents?.length) {
      const prev = state.previousAgents[state.previousAgents.length - 1];
      context += `
## Previous Agent Output
- Agent: ${prev.type}
- Summary: ${prev.outputSummary ?? "N/A"}
- Output: ${prev.outputPath ?? "N/A"}
`;
    }
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SubagentStart",
        additionalContext: `<system-reminder>
${context.trim()}
</system-reminder>`
      }
    }));
    process.exit(0);
  } catch (e) {
    console.error(`[subagent-start] ${e.message}`);
    process.exit(0);
  }
}
main();
