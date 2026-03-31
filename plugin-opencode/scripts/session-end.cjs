"use strict";

// src/hooks/session-end.ts
var import_fs4 = require("fs");

// src/memory/bus.ts
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

// src/memory/bus.ts
var GLOBAL_STORE_PATH = (0, import_path3.join)(CLAUDE_DIR, "memory", "bus.json");
function getProjectStorePath(cwd) {
  return (0, import_path3.join)(cwd, getProjectConfigDir(cwd), "memory", "bus.json");
}
function ensureDir(filePath) {
  const dir = (0, import_path3.dirname)(filePath);
  if (!(0, import_fs2.existsSync)(dir)) {
    (0, import_fs2.mkdirSync)(dir, { recursive: true });
  }
}
function loadStore(path) {
  if (!(0, import_fs2.existsSync)(path)) {
    return { version: 1, messages: [] };
  }
  try {
    return JSON.parse((0, import_fs2.readFileSync)(path, "utf-8"));
  } catch {
    return { version: 1, messages: [] };
  }
}
function saveStore(path, store) {
  ensureDir(path);
  (0, import_fs2.writeFileSync)(path, JSON.stringify(store, null, 2));
}
function clear(options = {}) {
  const path = options.global ? GLOBAL_STORE_PATH : getProjectStorePath(options.cwd || process.cwd());
  const store = loadStore(path);
  const before = store.messages.length;
  if (options.all) {
    store.messages = [];
  } else {
    store.messages = store.messages.filter((msg) => {
      if (options.target && msg.target === options.target) return false;
      if (options.agentType && msg.target === `agent:${options.agentType}`) return false;
      if (options.chainId && msg.chainId === options.chainId) return false;
      if (options.sessionId && msg.sessionId === options.sessionId) return false;
      if (options.persistence && msg.persistence === options.persistence) return false;
      return true;
    });
  }
  saveStore(path, store);
  return before - store.messages.length;
}
function clearSession(sessionId, cwd) {
  let cleared = 0;
  cleared += clear({ sessionId, cwd });
  cleared += clear({ persistence: "session", cwd });
  cleared += clear({ sessionId, global: true });
  cleared += clear({ persistence: "session", global: true });
  return cleared;
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

// src/hooks/session-end.ts
var import_path5 = require("path");
var LOG_FILE = (0, import_path5.join)(TMP_DIR, "session-end.log");
function main() {
  try {
    const stdin = (0, import_fs4.readFileSync)(0, "utf-8").trim();
    if (!stdin) process.exit(0);
    const p = JSON.parse(stdin);
    const sessionId = p.session_id ?? "";
    const cwd = p.cwd ?? process.cwd();
    if (!sessionId) {
      process.exit(0);
    }
    const cleared = clearSession(sessionId, cwd);
    log(LOG_FILE, `[SESSION END] ${sessionId} - Cleared ${cleared} messages`);
    process.exit(0);
  } catch (e) {
    console.error(`[session-end] ${e.message}`);
    process.exit(0);
  }
}
main();
