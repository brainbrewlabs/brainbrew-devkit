#!/bin/sh
# Creates symlinks in plugin-opencode/ pointing to shared content in plugin/.
# Run once after cloning or installing: npm run setup
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN_OC="$REPO_ROOT/plugin-opencode"

mkdir -p "$PLUGIN_OC/hooks"

cd "$PLUGIN_OC"

# Symlink shared content directories from plugin/
ln -sfn ../plugin/config config
ln -sfn ../plugin/skills skills
ln -sfn ../plugin/agents agents
ln -sfn ../plugin/AGENTS.md AGENTS.md

echo "plugin-opencode symlinks created:"
echo "  plugin-opencode/config  -> plugin/config"
echo "  plugin-opencode/skills  -> plugin/skills"
echo "  plugin-opencode/agents  -> plugin/agents"
echo "  plugin-opencode/AGENTS.md -> plugin/AGENTS.md"
