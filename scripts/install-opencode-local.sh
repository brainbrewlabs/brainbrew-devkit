#!/bin/sh
# Local dev install of the brainbrew OpenCode plugin.
# Run this from the repo root: sh scripts/install-opencode-local.sh
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN_ROOT="$REPO_ROOT/plugin-opencode"
RUNNER="$PLUGIN_ROOT/scripts/runner.cjs"
MCP_SERVER="$PLUGIN_ROOT/mcp/mcp-server.cjs"

OC_CONFIG_DIR="$HOME/.config/opencode"
PLUGINS_DIR="$OC_CONFIG_DIR/plugins"
OC_CONFIG="$OC_CONFIG_DIR/opencode.json"

# ── 1. Validate build artifacts exist ─────────────────────────────────────────
if [ ! -f "$RUNNER" ]; then
  echo "Error: runner.cjs not found. Run 'npm run build' first."
  exit 1
fi
if [ ! -f "$MCP_SERVER" ]; then
  echo "Error: mcp-server.cjs not found. Run 'npm run build' first."
  exit 1
fi

# ── 2. Create OpenCode config directory ───────────────────────────────────────
mkdir -p "$PLUGINS_DIR"

# ── 3. Write the hook plugin file ─────────────────────────────────────────────
PLUGIN_FILE="$PLUGINS_DIR/brainbrew.js"
cat > "$PLUGIN_FILE" << PLUGIN_EOF
/**
 * Brainbrew DevKit - OpenCode Plugin
 * Installed from: $REPO_ROOT
 * Plugin root:    $PLUGIN_ROOT
 *
 * Invokes the brainbrew runner for each hook event via child_process.
 * To uninstall: delete this file and remove the 'brainbrew' MCP entry
 * from ~/.config/opencode/opencode.json
 */

import { execSync } from 'child_process';

const RUNNER = "$RUNNER";
const PLUGIN_ROOT = "$PLUGIN_ROOT";

function runBrainbrew(event, payload) {
  try {
    execSync(\`node "\${RUNNER}" \${event}\`, {
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

export const hooks = {
  postToolUse:   (payload) => runBrainbrew('PostToolUse',   payload),
  subagentStart: (payload) => runBrainbrew('SubagentStart', payload),
  subagentStop:  (payload) => runBrainbrew('SubagentStop',  payload),
  sessionStart:  (payload) => runBrainbrew('SessionStart',  payload),
  sessionEnd:    (payload) => runBrainbrew('SessionEnd',    payload),
};
PLUGIN_EOF

echo "  Created: $PLUGIN_FILE"

# ── 4. Register MCP server in opencode.json ───────────────────────────────────
if [ -f "$OC_CONFIG" ]; then
  # Merge brainbrew into existing config using node
  node -e "
const fs = require('fs');
const path = '$OC_CONFIG';
const mcp_server = '$MCP_SERVER';
const plugin_root = '$PLUGIN_ROOT';

let cfg = {};
try { cfg = JSON.parse(fs.readFileSync(path, 'utf-8')); } catch {}

cfg.mcp = cfg.mcp || {};
cfg.mcp.brainbrew = {
  type: 'local',
  command: ['node', mcp_server],
  environment: { OPENCODE_PLUGIN_ROOT: plugin_root }
};

fs.writeFileSync(path, JSON.stringify(cfg, null, 2));
console.log('  Updated: $OC_CONFIG');
"
else
  # Create new opencode.json
  node -e "
const fs = require('fs');
const path = '$OC_CONFIG';
const mcp_server = '$MCP_SERVER';
const plugin_root = '$PLUGIN_ROOT';

const cfg = {
  mcp: {
    brainbrew: {
      type: 'local',
      command: ['node', mcp_server],
      environment: { OPENCODE_PLUGIN_ROOT: plugin_root }
    }
  }
};

fs.writeFileSync(path, JSON.stringify(cfg, null, 2));
console.log('  Created: $OC_CONFIG');
"
fi

# ── 5. Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "Brainbrew installed for OpenCode!"
echo ""
echo "  Plugin root:  $PLUGIN_ROOT"
echo "  Hook plugin:  $PLUGIN_FILE"
echo "  MCP server:   $MCP_SERVER"
echo ""
echo "Optional — set routing model in ~/.config/opencode/opencode.json:"
echo '  "brainbrew": { "routingModel": "openai/gpt-4o-mini" }'
echo ""
echo "To set up a workflow in your project:"
echo '  Ask OpenCode: "set up a development workflow"'
echo "  Or call the MCP tool: template_bump(template: \"develop\")"
echo ""
echo "Restart OpenCode to load the plugin."
