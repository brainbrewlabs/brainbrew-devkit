#!/usr/bin/env node
"use strict";

// src/hooks/codex-runner.ts
var import_fs = require("fs");
var import_path = require("path");
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
    return { runnerVersion: 1, eventCounts: {}, lastEvent: "", lastEventAt: "", lastCwd: "" };
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
    return { runnerVersion: 1, eventCounts: {}, lastEvent: "", lastEventAt: "", lastCwd: "" };
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
  const memoryDir = (0, import_path.join)(codexDir, "memory");
  if ((0, import_fs.existsSync)(codexDir) && isSymlink(codexDir)) return null;
  if ((0, import_fs.existsSync)(memoryDir) && isSymlink(memoryDir)) return null;
  (0, import_fs.mkdirSync)(memoryDir, { recursive: true });
  const realMemoryDir = (0, import_fs.realpathSync)(memoryDir);
  if (!isUnder(projectRoot, realMemoryDir)) return null;
  return memoryDir;
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
    const state = loadState(stateFile);
    state.runnerVersion = 1;
    state.eventCounts[eventName] = (state.eventCounts[eventName] ?? 0) + 1;
    state.lastEvent = eventName;
    state.lastEventAt = now;
    state.lastCwd = cwd;
    safeWriteJson(stateFile, state);
    safeAppendJsonLine((0, import_path.join)(memoryDir, "events.jsonl"), {
      event: eventName,
      at: now,
      cwd,
      session_id: payload.session_id,
      tool_name: payload.tool_name
    });
  } catch (err) {
    console.error(`[codex-runner] ${err.message}`);
  }
  process.exit(0);
}
main();
