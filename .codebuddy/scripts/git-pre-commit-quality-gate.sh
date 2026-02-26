#!/bin/bash
# Git pre-commit hook for quality gate enforcement
# This hook prevents commits that fail quality assessment
#
# To install: Run .codebuddy/scripts/install-quality-hooks.sh
# To bypass: git commit --no-verify (not recommended)

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔍 Running Quality Gate Check...${NC}"

# Check if quality config exists
QUALITY_CONFIG=".codebuddy/quality-config.json"

if [ ! -f "$QUALITY_CONFIG" ]; then
    echo -e "${YELLOW}⚠️  Quality config not found. Skipping quality gate.${NC}"
    echo -e "${YELLOW}   Create .codebuddy/quality-config.json to enable.${NC}"
    exit 0
fi

# Read quality gate mode
MODE=$(node -e "const c=require('./$QUALITY_CONFIG'); console.log(c.qualityGate?.mode || 'off')")

if [ "$MODE" = "off" ]; then
    echo -e "${YELLOW}⚠️  Quality gate disabled. Skipping check.${NC}"
    exit 0
fi

# Check quality status file
QUALITY_STATUS=".codebuddy/quality-status.json"

if [ ! -f "$QUALITY_STATUS" ]; then
    if [ "$MODE" = "auto" ]; then
        echo -e "${RED}❌ ERROR: No quality assessment found${NC}"
        echo -e "${RED}   Current mode: auto (quality assessment required)${NC}"
        echo -e "${RED}   ${NC}"
        echo -e "${RED}   To fix:${NC}"
        echo -e "${RED}   1. Run: /execute <plan-file> (quality assessment will run automatically)${NC}"
        echo -e "${RED}   2. Or run: /quality-assess <plan-file>${NC}"
        exit 1
    else
        # Manual mode
        echo -e "${YELLOW}⚠️  Manual mode: No quality assessment found${NC}"
        echo -e "${YELLOW}   Recommended: Run /quality-assess <plan> before committing${NC}"
        exit 0
    fi
fi

# Read quality status
CAN_PROCEED=$(node -e "const s=require('./$QUALITY_STATUS'); console.log(s.canProceed === true ? 'true' : 'false')")
STATUS=$(node -e "const s=require('./$QUALITY_STATUS'); console.log(s.status || 'unknown')")
SCORE=$(node -e "const s=require('./$QUALITY_STATUS'); console.log(s.score || 0)")
TIMESTAMP=$(node -e "const s=require('./$QUALITY_STATUS'); console.log(s.timestamp || '')")

# Check if timestamp is valid
if [ -z "$TIMESTAMP" ] || [ "$TIMESTAMP" = "null" ] || [ "$TIMESTAMP" = "undefined" ]; then
    echo -e "${RED}❌ ERROR: Invalid quality assessment timestamp${NC}"
    echo -e "${RED}   Please re-run quality assessment${NC}"
    exit 1
fi

# Check freshness (within 24 hours)
ASSESSMENT_TIME=$(node -e "console.log(new Date('$TIMESTAMP').getTime())")
CURRENT_TIME=$(node -e "console.log(Date.now())")

# Check if date parsing succeeded
if [ -z "$ASSESSMENT_TIME" ] || [ "$ASSESSMENT_TIME" = "NaN" ]; then
    echo -e "${RED}❌ ERROR: Failed to parse assessment timestamp${NC}"
    echo -e "${RED}   Timestamp: $TIMESTAMP${NC}"
    echo -e "${RED}   Please re-run quality assessment${NC}"
    exit 1
fi

TIME_DIFF_HOURS=$(( (CURRENT_TIME - ASSESSMENT_TIME) / 1000 / 60 / 60 ))

if [ "$TIME_DIFF_HOURS" -gt 24 ]; then
    echo -e "${YELLOW}⚠️  Quality assessment expired ($TIME_DIFF_HOURS hours ago)${NC}"
    echo -e "${YELLOW}   Recommended: Re-run /quality-assess <plan>${NC}"
    # Don't block for expired assessments (user may be working on long-running feature)
    exit 0
fi

# Quality gate decision
if [ "$CAN_PROCEED" = "false" ]; then
    echo -e "${RED}❌ QUALITY GATE FAILED - Commit blocked${NC}"
    echo -e "${RED}   ${NC}"
    echo -e "${RED}   Status: $STATUS${NC}"
    echo -e "${RED}   Score: $SCORE/100${NC}"
    echo -e "${RED}   Assessment time: $TIMESTAMP${NC}"
    echo -e "${RED}   ${NC}"
    echo -e "${RED}   To fix:${NC}"
    echo -e "${RED}   1. Review quality report in .codebuddy/quality-trends.json${NC}"
    echo -e "${RED}   2. Fix the identified issues${NC}"
    echo -e "${RED}   3. Re-run: /quality-assess <plan>${NC}"
    echo -e "${RED}   4. Or use --force to bypass (not recommended)${NC}"
    echo -e "${RED}   ${NC}"
    echo -e "${RED}   To bypass this check (not recommended):${NC}"
    echo -e "${RED}   git commit --no-verify${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Quality gate passed${NC}"
    echo -e "${GREEN}   Status: $STATUS${NC}"
    echo -e "${GREEN}   Score: $SCORE/100${NC}"
    echo -e "${GREEN}   Assessment: $TIME_DIFF_HOURS hours ago${NC}"
    echo -e "${GREEN}   ${NC}"
    exit 0
fi
