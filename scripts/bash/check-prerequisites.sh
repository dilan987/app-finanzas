#!/usr/bin/env bash
# check-prerequisites.sh - Check prerequisites for SDD workflow
# Usage: ./scripts/bash/check-prerequisites.sh [--json] [--require-tasks] [--include-tasks] [--paths-only]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

JSON_MODE=false
REQUIRE_TASKS=false
INCLUDE_TASKS=false
PATHS_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --json) JSON_MODE=true ;;
    --require-tasks) REQUIRE_TASKS=true ;;
    --include-tasks) INCLUDE_TASKS=true ;;
    --paths-only) PATHS_ONLY=true ;;
  esac
done

# Read feature.json to get current feature directory
FEATURE_JSON="$PROJECT_ROOT/.specify/feature.json"
if [ ! -f "$FEATURE_JSON" ]; then
  echo "ERROR: No active feature found. Run /speckit.specify first." >&2
  exit 1
fi

FEATURE_DIR=$(python3 -c "import json; print(json.load(open('$FEATURE_JSON'))['feature_directory'])" 2>/dev/null || echo "")
if [ -z "$FEATURE_DIR" ]; then
  echo "ERROR: Could not read feature directory from $FEATURE_JSON" >&2
  exit 1
fi

# Make absolute
FEATURE_DIR="$PROJECT_ROOT/$FEATURE_DIR"

# Check required files
FEATURE_SPEC="$FEATURE_DIR/spec.md"
IMPL_PLAN="$FEATURE_DIR/plan.md"
TASKS="$FEATURE_DIR/tasks.md"

AVAILABLE_DOCS=()
[ -f "$FEATURE_SPEC" ] && AVAILABLE_DOCS+=("spec.md")
[ -f "$IMPL_PLAN" ] && AVAILABLE_DOCS+=("plan.md")
[ -f "$TASKS" ] && AVAILABLE_DOCS+=("tasks.md")
[ -f "$FEATURE_DIR/research.md" ] && AVAILABLE_DOCS+=("research.md")
[ -f "$FEATURE_DIR/data-model.md" ] && AVAILABLE_DOCS+=("data-model.md")
[ -d "$FEATURE_DIR/contracts" ] && AVAILABLE_DOCS+=("contracts/")
[ -f "$FEATURE_DIR/quickstart.md" ] && AVAILABLE_DOCS+=("quickstart.md")

if $REQUIRE_TASKS && [ ! -f "$TASKS" ]; then
  echo "ERROR: tasks.md not found. Run /speckit.tasks first." >&2
  exit 1
fi

# Get branch name
BRANCH=$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

if $JSON_MODE; then
  DOCS_JSON=$(printf '%s\n' "${AVAILABLE_DOCS[@]}" | python3 -c "import sys,json; print(json.dumps([l.strip() for l in sys.stdin]))")

  cat <<EOF
{
  "FEATURE_DIR": "$FEATURE_DIR",
  "FEATURE_SPEC": "$FEATURE_SPEC",
  "IMPL_PLAN": "$IMPL_PLAN",
  "TASKS": "$TASKS",
  "SPECS_DIR": "$PROJECT_ROOT/specs",
  "BRANCH": "$BRANCH",
  "AVAILABLE_DOCS": $DOCS_JSON
}
EOF
else
  echo "Feature Directory: $FEATURE_DIR"
  echo "Spec: $FEATURE_SPEC"
  echo "Plan: $IMPL_PLAN"
  echo "Tasks: $TASKS"
  echo "Branch: $BRANCH"
  echo "Available Docs: ${AVAILABLE_DOCS[*]}"
fi
