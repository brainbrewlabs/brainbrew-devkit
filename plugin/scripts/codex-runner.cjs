#!/usr/bin/env node
"use strict";

// src/hooks/codex-runner.ts
var import_fs = require("fs");
var import_path = require("path");
var STATE_DIR = (0, import_path.join)(".codex", "brainbrew");
var LEGACY_STATE_DIR = (0, import_path.join)(".codex", "memory");
var DEFAULT_PENDING_GATES = ["plan-review", "code-review", "security-review", "test"];
function readStdin() {
  try {
    return (0, import_fs.readFileSync)(0, "utf-8").trim();
  } catch {
    return "";
  }
}
function readPayload(stdin) {
  if (!stdin) return {};
  try {
    const parsed = JSON.parse(stdin);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function loadState(stateFile) {
  if (!(0, import_fs.existsSync)(stateFile)) {
    return { runnerVersion: 2, eventCounts: {}, lastEvent: "", lastEventAt: "", lastCwd: "", stateDir: STATE_DIR };
  }
  try {
    const parsed = JSON.parse((0, import_fs.readFileSync)(stateFile, "utf-8"));
    if (!parsed || typeof parsed !== "object" || !parsed.eventCounts) throw new Error("invalid state");
    return parsed;
  } catch {
    const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    try {
      (0, import_fs.renameSync)(stateFile, (0, import_path.join)((0, import_path.dirname)(stateFile), `workflow-state.corrupt-${stamp}.json`));
    } catch {
    }
    return { runnerVersion: 2, eventCounts: {}, lastEvent: "", lastEventAt: "", lastCwd: "", stateDir: STATE_DIR };
  }
}
function isSymlink(path) {
  try {
    return (0, import_fs.lstatSync)(path).isSymbolicLink();
  } catch {
    return false;
  }
}
function isUnder(parent, child) {
  return child === parent || child.startsWith(`${parent}/`);
}
function prepareMemoryDir(cwd) {
  const projectRoot = (0, import_fs.realpathSync)(cwd);
  const codexDir = (0, import_path.join)(cwd, ".codex");
  const memoryDir = (0, import_path.join)(cwd, STATE_DIR);
  if ((0, import_fs.existsSync)(codexDir) && isSymlink(codexDir)) return null;
  if ((0, import_fs.existsSync)(memoryDir) && isSymlink(memoryDir)) return null;
  (0, import_fs.mkdirSync)(memoryDir, { recursive: true });
  const realMemoryDir = (0, import_fs.realpathSync)(memoryDir);
  if (!isUnder(projectRoot, realMemoryDir)) return null;
  return memoryDir;
}
function readLegacyState(cwd) {
  const legacyDir = (0, import_path.join)(cwd, LEGACY_STATE_DIR);
  const legacyFile = (0, import_path.join)(legacyDir, "workflow-state.json");
  if (!(0, import_fs.existsSync)(legacyFile) || isSymlink(legacyDir) || isSymlink(legacyFile)) return null;
  try {
    const parsed = JSON.parse((0, import_fs.readFileSync)(legacyFile, "utf-8"));
    if (!parsed || typeof parsed !== "object" || !parsed.eventCounts) return null;
    return parsed;
  } catch {
    return null;
  }
}
function safeWriteJson(filePath, value) {
  if ((0, import_fs.existsSync)(filePath) && isSymlink(filePath)) return;
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  (0, import_fs.writeFileSync)(tmpPath, JSON.stringify(value, null, 2) + "\n", { flag: "wx" });
  (0, import_fs.renameSync)(tmpPath, filePath);
}
function safeAppendJsonLine(filePath, value) {
  if ((0, import_fs.existsSync)(filePath) && isSymlink(filePath)) return;
  (0, import_fs.appendFileSync)(filePath, JSON.stringify(value) + "\n");
}
function getPayloadText(payload) {
  const candidates = [
    payload.prompt,
    payload.user_prompt,
    payload.input,
    payload.message,
    payload.text
  ];
  return candidates.find((value) => typeof value === "string" && value.trim().length > 0)?.trim() ?? "";
}
function detectWorkflow(prompt) {
  const lower = prompt.toLowerCase();
  const explicit = lower.match(/brainbrew(?:\s+codex)?\s+(?:workflow|chain|recipe)\s+([a-z0-9_-]+)/);
  if (explicit?.[1]) return explicit[1];
  const slash = lower.match(/\/brainbrew[:_-](?:workflow|chain-run)\s+([a-z0-9_-]+)/);
  if (slash?.[1]) return slash[1];
  const template = lower.match(/\b(develop|review|docs|devops|research|skill-dev|support|data|moderation|marketing)\s+(?:workflow|chain|recipe)\b/);
  if (template?.[1]) return template[1];
  if (lower.includes("brainbrew") && (lower.includes("workflow") || lower.includes("chain") || lower.includes("recipe"))) {
    return "unspecified";
  }
  return null;
}
function inferStepFromTool(toolName) {
  const lower = toolName.toLowerCase();
  if (lower.includes("spawn_agent") || lower.includes("agent") || lower.includes("task")) return "delegation";
  if (lower.includes("apply_patch") || lower.includes("edit") || lower.includes("write")) return "implementation";
  if (lower.includes("exec") || lower.includes("bash")) return "verification";
  return null;
}
function updateWorkflowState(state, eventName, payload, now) {
  const prompt = getPayloadText(payload);
  if (eventName === "UserPromptSubmit" && prompt) {
    const workflowName = detectWorkflow(prompt);
    if (workflowName) {
      state.activeWorkflow = {
        name: workflowName,
        status: "running",
        currentStep: "planning",
        startedAt: now,
        updatedAt: now,
        lastPrompt: prompt.slice(0, 500),
        pendingGates: [...DEFAULT_PENDING_GATES]
      };
      return;
    }
  }
  const workflow = state.activeWorkflow;
  if (!workflow || workflow.status !== "running") return;
  workflow.updatedAt = now;
  if (prompt) workflow.lastPrompt = prompt.slice(0, 500);
  const toolName = typeof payload.tool_name === "string" ? payload.tool_name : typeof payload.tool === "string" ? payload.tool : "";
  if (toolName) {
    workflow.lastTool = toolName;
    const inferredStep = inferStepFromTool(toolName);
    if (inferredStep) workflow.currentStep = inferredStep;
  }
  const lowerPrompt = prompt.toLowerCase();
  const completedGates = [
    ["plan-review", ["plan reviewed", "plan approved", "reviewed the plan"]],
    ["code-review", ["code review passed", "review complete", "reviewed the diff"]],
    ["security-review", ["security review passed", "security scan passed", "no security issues"]],
    ["test", ["tests pass", "test passed", "verification passed", "build passed"]]
  ];
  for (const [gate, markers] of completedGates) {
    if (markers.some((marker) => lowerPrompt.includes(marker))) {
      workflow.pendingGates = workflow.pendingGates.filter((item) => item !== gate);
    }
  }
  if (workflow.pendingGates.length === 0) {
    workflow.status = "completed";
    workflow.currentStep = "completed";
  }
}
function warnIfWorkflowIncomplete(state) {
  const workflow = state.activeWorkflow;
  if (!workflow || workflow.status !== "running" || workflow.pendingGates.length === 0) return;
  console.error(`[brainbrew-codex] Workflow "${workflow.name}" is still advisory-running. Pending gates: ${workflow.pendingGates.join(", ")}.`);
}
function main() {
  const eventName = process.argv[2] ?? "unknown";
  const stdin = readStdin();
  const payload = readPayload(stdin);
  const cwd = typeof payload.cwd === "string" && payload.cwd ? (0, import_path.resolve)(payload.cwd) : process.cwd();
  try {
    if (!(0, import_fs.existsSync)(cwd) || !(0, import_fs.statSync)(cwd).isDirectory()) process.exit(0);
    const memoryDir = prepareMemoryDir(cwd);
    if (!memoryDir) process.exit(0);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const stateFile = (0, import_path.join)(memoryDir, "workflow-state.json");
    const state = (0, import_fs.existsSync)(stateFile) ? loadState(stateFile) : readLegacyState(cwd) ?? loadState(stateFile);
    state.runnerVersion = 2;
    state.stateDir = STATE_DIR;
    if (!state.legacyStateDir && (0, import_fs.existsSync)((0, import_path.join)(cwd, LEGACY_STATE_DIR, "workflow-state.json"))) {
      state.legacyStateDir = LEGACY_STATE_DIR;
    }
    state.eventCounts[eventName] = (state.eventCounts[eventName] ?? 0) + 1;
    state.lastEvent = eventName;
    state.lastEventAt = now;
    state.lastCwd = cwd;
    updateWorkflowState(state, eventName, payload, now);
    safeWriteJson(stateFile, state);
    safeAppendJsonLine((0, import_path.join)(memoryDir, "events.jsonl"), {
      event: eventName,
      at: now,
      cwd,
      session_id: payload.session_id,
      tool_name: payload.tool_name,
      workflow: state.activeWorkflow?.name,
      workflow_step: state.activeWorkflow?.currentStep
    });
    if (eventName === "Stop") warnIfWorkflowIncomplete(state);
  } catch (err) {
    console.error(`[codex-runner] ${err.message}`);
  }
  process.exit(0);
}
main();
