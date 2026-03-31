#!/usr/bin/env node
"use strict";

// src/hooks/runner.ts
var import_fs3 = require("fs");
var import_path3 = require("path");
var import_child_process = require("child_process");

// src/utils/chain-resolver.ts
var import_fs2 = require("fs");
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
function getProjectConfigDir(cwd) {
  if ((0, import_fs.existsSync)((0, import_path.join)(cwd, ".opencode", "chain-config.yaml"))) return ".opencode";
  if ((0, import_fs.existsSync)((0, import_path.join)(cwd, ".claude", "chain-config.yaml"))) return ".claude";
  return getPlatform() === "opencode" ? ".opencode" : ".claude";
}

// src/utils/chain-resolver.ts
function resolveActiveChain(cwd) {
  const configDir = getProjectConfigDir(cwd);
  const pointerPath = (0, import_path2.join)(cwd, configDir, "chain-config.yaml");
  if (!(0, import_fs2.existsSync)(pointerPath)) return null;
  const content = (0, import_fs2.readFileSync)(pointerPath, "utf-8");
  if (/^(flow|hooks):/m.test(content)) {
    return { configPath: pointerPath, chainName: "default", isLegacy: true };
  }
  const activeMatch = content.match(/^active:\s*(.+)/m);
  if (!activeMatch) return null;
  const active = activeMatch[1].trim();
  const dirMatch = content.match(/^chains_dir:\s*(.+)/m);
  const chainsDir = dirMatch ? dirMatch[1].trim() : `${configDir}/chains/`;
  if (active.includes("..") || chainsDir.includes("..")) return null;
  const chainPath = (0, import_path2.join)(cwd, chainsDir, `${active}.yaml`);
  const resolvedPath = (0, import_path2.resolve)(chainPath);
  const expectedBase = (0, import_path2.resolve)((0, import_path2.join)(cwd, configDir));
  if (!resolvedPath.startsWith(expectedBase)) return null;
  if (!(0, import_fs2.existsSync)(chainPath)) return null;
  return { configPath: chainPath, chainName: active, isLegacy: false };
}
function readActiveChainContent(cwd) {
  const resolved = resolveActiveChain(cwd);
  if (!resolved) return null;
  return (0, import_fs2.readFileSync)(resolved.configPath, "utf-8");
}

// src/hooks/runner.ts
var PLUGIN_ROOT = process.env.OPENCODE_PLUGIN_ROOT || process.env.CLAUDE_PLUGIN_ROOT || (0, import_path3.dirname)((0, import_path3.dirname)(__filename));
var PLUGIN_SCRIPTS = (0, import_path3.join)(PLUGIN_ROOT, "scripts");
function parseYamlConfig(content) {
  const config = { hooks: {} };
  let currentEvent = "";
  for (const line of content.split("\n")) {
    const eventMatch = line.match(/^\s{2}(\S+):$/);
    if (eventMatch) {
      currentEvent = eventMatch[1];
      config.hooks[currentEvent] = [];
      continue;
    }
    const itemMatch = line.match(/^\s{4}-\s+(.+)/);
    if (itemMatch && currentEvent) {
      config.hooks[currentEvent].push(itemMatch[1]);
    }
  }
  return config;
}
function resolveScriptPath(script, cwd) {
  if (script.startsWith("plugin:")) {
    return (0, import_path3.join)(PLUGIN_SCRIPTS, script.replace("plugin:", ""));
  }
  if (script.startsWith("./") || script.startsWith("../")) {
    const configDir = getProjectConfigDir(cwd);
    return (0, import_path3.join)(cwd, configDir, "hooks", script.replace(/^\.\//, ""));
  }
  if (script.startsWith("/")) {
    return script;
  }
  return (0, import_path3.join)(PLUGIN_SCRIPTS, script);
}
var DEFAULT_PLUGIN_HOOKS = {
  SessionStart: ["session-start.cjs"],
  SessionEnd: ["session-end.cjs"]
};
function loadProjectHooks(event, cwd) {
  const hooks = [];
  const defaults = DEFAULT_PLUGIN_HOOKS[event] || [];
  hooks.push(...defaults.map((h) => (0, import_path3.join)(PLUGIN_SCRIPTS, h)));
  const chainContent = readActiveChainContent(cwd);
  if (chainContent) {
    const config = parseYamlConfig(chainContent);
    const projectHooks = (config.hooks[event] || []).map((h) => resolveScriptPath(h, cwd));
    hooks.push(...projectHooks);
  }
  return hooks;
}
function runHook(hookPath, stdin) {
  if (!(0, import_fs3.existsSync)(hookPath)) {
    console.error(`[runner] Hook not found: ${hookPath}`);
    return {};
  }
  try {
    const result = (0, import_child_process.execSync)(`node "${hookPath}"`, {
      input: stdin,
      encoding: "utf-8",
      timeout: 6e4,
      maxBuffer: 10 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"]
    });
    const trimmed = result.trim();
    if (trimmed) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.decision === "block") {
          return { output: trimmed, block: true };
        }
      } catch {
      }
      return { output: trimmed };
    }
  } catch (err) {
    const e = err;
    if (e.status === 2 && e.stdout) {
      return { output: e.stdout.trim(), exit2: true };
    }
    if (e.stderr) console.error(e.stderr);
  }
  return {};
}
function main() {
  const eventArg = process.argv[2];
  if (!eventArg) {
    console.error("Usage: runner.cjs <EventName>");
    process.exit(0);
  }
  let stdin = "";
  try {
    stdin = (0, import_fs3.readFileSync)(0, "utf-8").trim();
  } catch {
    process.exit(0);
  }
  if (!stdin) process.exit(0);
  let cwd = process.cwd();
  try {
    const payload = JSON.parse(stdin);
    if (payload.cwd) cwd = payload.cwd;
  } catch {
  }
  const hooks = loadProjectHooks(eventArg, cwd);
  if (hooks.length === 0) {
    process.exit(0);
  }
  for (const hookPath of hooks) {
    const result = runHook(hookPath, stdin);
    if (result.block) {
      console.log(result.output);
      process.exit(0);
    }
    if (result.exit2) {
      console.log(result.output);
      process.exit(2);
    }
    if (result.output) {
      console.log(result.output);
    }
  }
}
main();
