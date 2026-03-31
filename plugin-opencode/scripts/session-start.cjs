"use strict";

// src/hooks/session-start.ts
var import_fs3 = require("fs");

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

// src/hooks/session-start.ts
function hasTeamNodes(cwd) {
  const content = readActiveChainContent(cwd);
  if (!content) return false;
  return /^\s+type:\s*team/m.test(content);
}
function main() {
  try {
    const stdin = (0, import_fs3.readFileSync)(0, "utf-8").trim();
    if (!stdin) process.exit(0);
    const p = JSON.parse(stdin);
    const cwd = p.cwd ?? process.cwd();
    if (!hasTeamNodes(cwd)) {
      process.exit(0);
    }
    const context = `## Agent Team Protocol

This chain uses **agent team** nodes. When a MANDATORY NEXT STEP says "AGENT TEAM", follow this workflow:

### Step 1: Create Team
\`\`\`
TeamCreate(team_name: "<team-node-name>", description: "<purpose>")
\`\`\`

### Step 2: Spawn Teammates
For each teammate listed in the instruction, spawn via Agent tool with \`team_name\` and \`name\`:
\`\`\`
Agent(subagent_type: "<agent-type>", team_name: "<team-name>", name: "<teammate-name>", prompt: "<teammate prompt>")
\`\`\`
Spawn ALL teammates \u2014 they run in parallel.

### Step 3: Wait & Synthesize
- Teammates send messages when done \u2014 these arrive automatically
- Wait for ALL teammates to finish
- Synthesize results from all teammates into a single assessment

### Step 4: Shutdown & Route
Send shutdown to each teammate:
\`\`\`
SendMessage(to: "<teammate-name>", message: { type: "shutdown_request" })
\`\`\`
Then clean up:
\`\`\`
TeamDelete()
\`\`\`
Then continue the chain based on routing rules provided in the MANDATORY NEXT STEP.

### Key Rules
- **DO NOT** use Agent(run_in_background) for team nodes \u2014 use TeamCreate + Agent(team_name)
- **DO NOT** skip TeamDelete after team completes
- **DO NOT** proceed until ALL teammates have reported back
- Teammates can message each other via SendMessage \u2014 they self-coordinate
- If a teammate goes idle, send it a message to wake it up`;
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: `<system-reminder>
${context}
</system-reminder>`
      }
    }));
    process.exit(2);
  } catch (e) {
    console.error(`[session-start] ${e.message}`);
    process.exit(0);
  }
}
main();
