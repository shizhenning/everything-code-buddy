#!/bin/bash
# Install quality gate hooks for Git
# This script sets up pre-commit hooks to enforce quality gates

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Installing Quality Gate Hooks...${NC}"

# Check if .git exists
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ ERROR: .git directory not found${NC}"
    echo -e "${RED}   Are you in a Git repository?${NC}"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Source hook location
HOOK_SOURCE=".codebuddy/scripts/git-pre-commit-quality-gate.sh"
HOOK_TARGET=".git/hooks/pre-commit"

# Check if source hook exists
if [ ! -f "$HOOK_SOURCE" ]; then
    echo -e "${RED}❌ ERROR: Hook source not found${NC}"
    echo -e "${RED}   Expected: $HOOK_SOURCE${NC}"
    exit 1
fi

# Check if hook already exists
if [ -f "$HOOK_TARGET" ]; then
    echo -e "${YELLOW}⚠️  Pre-commit hook already exists${NC}"
    read -p "Overwrite? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}   Skipping hook installation${NC}"
        exit 0
    fi
fi

# Copy hook from .codebuddy/scripts to .git/hooks
cp "$HOOK_SOURCE" "$HOOK_TARGET"

# Make hook executable
chmod +x "$HOOK_TARGET"

echo -e "${GREEN}✅ Pre-commit hook installed${NC}"
echo -e "${GREEN}   Source: $HOOK_SOURCE${NC}"
echo -e "${GREEN}   Target: $HOOK_TARGET${NC}"
echo -e "${GREEN}   ${NC}"

# Test hook
echo -e "${YELLOW}🧪 Testing hook...${NC}"
if bash -c "git commit --dry-run" 2>&1 | grep -q "Quality Gate Check"; then
    echo -e "${GREEN}✅ Hook test passed${NC}"
else
    echo -e "${YELLOW}⚠️  Hook test warning (may be normal)${NC}"
fi

echo -e "${GREEN}   ${NC}"
echo -e "${GREEN}📝 Usage:${NC}"
echo -e "${GREEN}   - Normal commit: git commit -m 'message'${NC}"
echo -e "${GREEN}   - Bypass hook:  git commit --no-verify -m 'message'${NC}"
echo -e "${GREEN}   ${NC}"
echo -e "${GREEN}✨ Installation complete!${NC}"
