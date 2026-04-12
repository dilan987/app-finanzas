#!/usr/bin/env bash
# setup-plan.sh - Setup plan artifacts for a feature
# Usage: ./scripts/bash/setup-plan.sh [--json]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

JSON_MODE=false
for arg in "$@"; do
  case "$arg" in
    --json) JSON_MODE=true ;;
  esac
done

# Read feature.json
FEATURE_JSON="$PROJECT_ROOT/.specify/feature.json"
if [ ! -f "$FEATURE_JSON" ]; then
  echo "ERROR: No active feature found. Run /speckit.specify first." >&2
  exit 1
fi

FEATURE_DIR=$(python3 -c "import json; print(json.load(open('$FEATURE_JSON'))['feature_directory'])" 2>/dev/null || echo "")
FEATURE_DIR="$PROJECT_ROOT/$FEATURE_DIR"

FEATURE_SPEC="$FEATURE_DIR/spec.md"
IMPL_PLAN="$FEATURE_DIR/plan.md"

# Copy plan template if plan doesn't exist
if [ ! -f "$IMPL_PLAN" ]; then
  cp "$PROJECT_ROOT/.specify/templates/plan-template.md" "$IMPL_PLAN"
fi

# Create contracts directory
mkdir -p "$FEATURE_DIR/contracts"

BRANCH=$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

if $JSON_MODE; then
  cat <<EOF
{
  "FEATURE_SPEC": "$FEATURE_SPEC",
  "IMPL_PLAN": "$IMPL_PLAN",
  "SPECS_DIR": "$PROJECT_ROOT/specs",
  "BRANCH": "$BRANCH",
  "FEATURE_DIR": "$FEATURE_DIR"
}
EOF
else
  echo "Feature Spec: $FEATURE_SPEC"
  echo "Implementation Plan: $IMPL_PLAN"
  echo "Branch: $BRANCH"
fi
