#!/bin/bash
# YouTube OpenClaw/ClawdBot Daily Summary
# Run daily via cron or manually
#
# Usage:
#   ./youtube-summary.sh          # formatted text output
#   ./youtube-summary.sh --json   # JSON output
#   ./youtube-summary.sh --count 10  # top 10 instead of 5
#
# Cron example (daily at 9am):
#   0 9 * * * /Users/vi/.openclaw/workspace/scripts/youtube-summary.sh >> /Users/vi/.openclaw/workspace/logs/youtube-summary.log 2>&1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="$SCRIPT_DIR/youtube-openclaw-summary.js"

# Ensure Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Run the Node script with any passed arguments
exec node "$NODE_SCRIPT" "$@"
