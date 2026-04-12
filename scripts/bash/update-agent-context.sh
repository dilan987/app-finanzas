#!/usr/bin/env bash
# update-agent-context.sh - Update agent-specific context file from plan data
# Usage: ./scripts/bash/update-agent-context.sh <agent-type>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

AGENT_TYPE="${1:-claude}"

echo "Updating agent context for: $AGENT_TYPE"
echo "Agent context is managed via CLAUDE.md at project root."
echo "Manual additions should be placed between MANUAL ADDITIONS markers."
