/**
 * Brainbrew DevKit - OpenCode Plugin
 * https://brainbrewlabs.github.io/brainbrew-devkit/guide/opencode
 *
 * Exports `id`, `info`, `hooks`, and `mcp` — loaded automatically by OpenCode
 * when installed as an npm package or placed in ~/.config/opencode/plugins/.
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RUNNER = join(__dirname, 'scripts', 'runner.cjs');
const PLUGIN_ROOT = __dirname;

function runBrainbrew(event, payload) {
  try {
    execSync(`node "${RUNNER}" ${event}`, {
      input: JSON.stringify(payload),
      encoding: 'utf-8',
      stdio: ['pipe', 'inherit', 'inherit'],
      timeout: 90000,
      env: { ...process.env, OPENCODE_PLUGIN_ROOT: PLUGIN_ROOT },
    });
  } catch {
    // Non-zero exit is handled by runner.cjs internally
  }
}

export const id = 'brainbrew';

export const info = {
  name: 'Brainbrew DevKit',
  description: 'Agent chains, skills, and workflow orchestration for OpenCode',
};

export const hooks = {
  postToolUse:   (payload) => runBrainbrew('PostToolUse',   payload),
  subagentStart: (payload) => runBrainbrew('SubagentStart', payload),
  subagentStop:  (payload) => runBrainbrew('SubagentStop',  payload),
  sessionStart:  (payload) => runBrainbrew('SessionStart',  payload),
  sessionEnd:    (payload) => runBrainbrew('SessionEnd',    payload),
};

export const mcp = {
  brainbrew: {
    type: 'local',
    command: ['node', join(__dirname, 'mcp', 'mcp-server.cjs')],
    environment: {
      OPENCODE_PLUGIN_ROOT: PLUGIN_ROOT,
    },
  },
};
