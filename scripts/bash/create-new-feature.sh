#!/usr/bin/env bash
# create-new-feature.sh - Create a new feature branch and spec directory
# Usage: ./scripts/bash/create-new-feature.sh <feature-name>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [ $# -lt 1 ]; then
  echo "Usage: $0 <feature-name>" >&2
  exit 1
fi

FEATURE_NAME="$1"

# Determine next sequential number
SPECS_DIR="$PROJECT_ROOT/specs"
mkdir -p "$SPECS_DIR"

NEXT_NUM=1
if ls -d "$SPECS_DIR"/[0-9][0-9][0-9]-* 2>/dev/null | head -1 > /dev/null 2>&1; then
  LAST_NUM=$(ls -d "$SPECS_DIR"/[0-9][0-9][0-9]-* 2>/dev/null | sort -r | head -1 | grep -o '[0-9]\{3\}' | head -1)
  NEXT_NUM=$((10#$LAST_NUM + 1))
fi

PADDED_NUM=$(printf "%03d" $NEXT_NUM)
FEATURE_DIR="specs/${PADDED_NUM}-${FEATURE_NAME}"
FULL_DIR="$PROJECT_ROOT/$FEATURE_DIR"

# Create feature directory
mkdir -p "$FULL_DIR/checklists"
mkdir -p "$FULL_DIR/contracts"

# Copy spec template
cp "$PROJECT_ROOT/.specify/templates/spec-template.md" "$FULL_DIR/spec.md"

# Update feature.json
cat > "$PROJECT_ROOT/.specify/feature.json" <<EOF
{
  "feature_directory": "$FEATURE_DIR"
}
EOF

# Create git branch
BRANCH_NAME="${PADDED_NUM}-${FEATURE_NAME}"
git -C "$PROJECT_ROOT" checkout -b "$BRANCH_NAME" 2>/dev/null || echo "Branch $BRANCH_NAME already exists or could not be created"

echo "Created feature: $FEATURE_DIR"
echo "Branch: $BRANCH_NAME"
echo "Spec: $FULL_DIR/spec.md"
