# Git pre-commit hook for quality gate enforcement (PowerShell version)
# This hook prevents commits that fail quality assessment
#
# To install: Run .codebuddy/scripts/install-quality-hooks.ps1
# To bypass: git commit --no-verify (not recommended)

$ErrorActionPreference = "Stop"

# Color codes (PowerShell 7+) or fallback
if ($Host.Name -eq 'ConsoleHost') {
    $Red = "`e[31m"
    $Green = "`e[32m"
    $Yellow = "`e[33m"
    $NC = "`e[0m"
} else {
    $Red = ""
    $Green = ""
    $Yellow = ""
    $NC = ""
}

Write-Host "${Green}🔍 Running Quality Gate Check...${NC}"

# Check if quality config exists
$qualityConfig = ".codebuddy/quality-config.json"

if (-not (Test-Path $qualityConfig)) {
    Write-Host "${Yellow}⚠️  Quality config not found. Skipping quality gate.${NC}"
    Write-Host "${Yellow}   Create .codebuddy/quality-config.json to enable.${NC}"
    exit 0
}

# Read quality gate mode
try {
    $configJson = Get-Content $qualityConfig -Raw | ConvertFrom-Json
    $mode = if ($configJson.qualityGate.mode) { $configJson.qualityGate.mode } else { "off" }
} catch {
    Write-Host "${Red}❌ ERROR: Failed to read quality config${NC}"
    Write-Host "${Red}   $_${NC}"
    exit 1
}

if ($mode -eq "off") {
    Write-Host "${Yellow}⚠️  Quality gate disabled. Skipping check.${NC}"
    exit 0
}

# Check quality status file
$qualityStatus = ".codebuddy/quality-status.json"

if (-not (Test-Path $qualityStatus)) {
    if ($mode -eq "auto") {
        Write-Host "${Red}❌ ERROR: No quality assessment found${NC}"
        Write-Host "${RED}   Current mode: auto (quality assessment required)${NC}"
        Write-Host "${RED}   ${NC}"
        Write-Host "${RED}   To fix:${NC}"
        Write-Host "${RED}   1. Run: /execute <plan-file> (quality assessment will run automatically)${NC}"
        Write-Host "${RED}   2. Or run: /quality-assess <plan-file>${NC}"
        exit 1
    } else {
        # Manual mode
        Write-Host "${Yellow}⚠️  Manual mode: No quality assessment found${NC}"
        Write-Host "${YELLOW}   Recommended: Run /quality-assess <plan> before committing${NC}"
        exit 0
    }
}

# Read quality status
try {
    $statusJson = Get-Content $qualityStatus -Raw | ConvertFrom-Json
    $canProceed = if ($statusJson.canProceed -eq $true) { $true } else { $false }
    $status = if ($statusJson.status) { $statusJson.status } else { "unknown" }
    $score = if ($statusJson.score) { $statusJson.score } else { 0 }
    $timestamp = if ($statusJson.timestamp) { $statusJson.timestamp } else { $null }
} catch {
    Write-Host "${Red}❌ ERROR: Failed to read quality status${NC}"
    Write-Host "${RED}   $_${NC}"
    exit 1
}

# Check if timestamp is valid
if ([string]::IsNullOrWhiteSpace($timestamp) -or $timestamp -eq "null" -or $timestamp -eq "undefined") {
    Write-Host "${Red}❌ ERROR: Invalid quality assessment timestamp${NC}"
    Write-Host "${Red}   Please re-run quality assessment${NC}"
    exit 1
}

# Check freshness (within 24 hours)
try {
    $assessmentTime = [DateTime]::Parse($timestamp).ToUniversalTime()
    $currentTime = [DateTime]::UtcNow
    $timeDiffHours = ($currentTime - $assessmentTime).TotalHours
} catch {
    Write-Host "${Red}❌ ERROR: Failed to parse assessment timestamp${NC}"
    Write-Host "${RED}   Timestamp: $timestamp${NC}"
    Write-Host "${RED}   $_${NC}"
    Write-Host "${RED}   Please re-run quality assessment${NC}"
    exit 1
}

if ($timeDiffHours -gt 24) {
    Write-Host "${YELLOW}⚠️  Quality assessment expired ($([math]::Round($timeDiffHours)) hours ago)${NC}"
    Write-Host "${YELLOW}   Recommended: Re-run /quality-assess <plan>${NC}"
    # Don't block for expired assessments
    exit 0
}

# Quality gate decision
if (-not $canProceed) {
    Write-Host "${RED}❌ QUALITY GATE FAILED - Commit blocked${NC}"
    Write-Host "${RED}   ${NC}"
    Write-Host "${RED}   Status: $status${NC}"
    Write-Host "${RED}   Score: $score/100${NC}"
    Write-Host "${RED}   Assessment time: $timestamp${NC}"
    Write-Host "${RED}   ${NC}"
    Write-Host "${RED}   To fix:${NC}"
    Write-Host "${RED}   1. Review quality report in .codebuddy/quality-trends.json${NC}"
    Write-Host "${RED}   2. Fix the identified issues${NC}"
    Write-Host "${RED}   3. Re-run: /quality-assess <plan>${NC}"
    Write-Host "${RED}   4. Or use --force to bypass (not recommended)${NC}"
    Write-Host "${RED}   ${NC}"
    Write-Host "${RED}   To bypass this check (not recommended):${NC}"
    Write-Host "${RED}   git commit --no-verify${NC}"
    exit 1
} else {
    Write-Host "${Green}✅ Quality gate passed${NC}"
    Write-Host "${Green}   Status: $status${NC}"
    Write-Host "${Green}   Score: $score/100${NC}"
    Write-Host "${Green}   Assessment: $([math]::Round($timeDiffHours)) hours ago${NC}"
    Write-Host "${Green}   ${NC}"
    exit 0
}
