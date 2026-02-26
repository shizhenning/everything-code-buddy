# Install quality gate hooks for Git (PowerShell version)
# This script sets up pre-commit hooks to enforce quality gates

$ErrorActionPreference = "Stop"

# Color codes
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$NC = "`e[0m"

Write-Host "${Green}🚀 Installing Quality Gate Hooks...${NC}"

# Check if .git exists
if (-not (Test-Path ".git")) {
    Write-Host "${Red}❌ ERROR: .git directory not found${NC}"
    Write-Host "${Red}   Are you in a Git repository?${NC}"
    exit 1
}

# Create hooks directory if it doesn't exist
New-Item -ItemType Directory -Force -Path ".git/hooks" | Out-Null

# Hook source and target
$hookSource = ".codebuddy/scripts/git-pre-commit-quality-gate.ps1"
$hookTarget = ".git/hooks/pre-commit"

# Check if source hook exists
if (-not (Test-Path $hookSource)) {
    Write-Host "${Red}❌ ERROR: Hook source not found${NC}"
    Write-Host "${RED}   Expected: $hookSource${NC}"
    exit 1
}

# Check if hook already exists
if (Test-Path $hookTarget) {
    Write-Host "${Yellow}⚠️  Pre-commit hook already exists${NC}"
    $overwrite = Read-Host "Overwrite? [y/N]"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "${Yellow}   Skipping hook installation${NC}"
        exit 0
    }
}

# Copy PowerShell hook from .codebuddy/scripts to .git/hooks
Copy-Item $hookSource $hookTarget -Force

# On Windows, create a wrapper that calls PowerShell
$wrapperContent = @"
#!/bin/bash
# Wrapper to call PowerShell pre-commit hook

if command -v pwsh &> /dev/null; then
    pwsh -ExecutionPolicy Bypass -File .git/hooks/pre-commit.ps1
    exit `$?
elif command -v powershell &> /dev/null; then
    powershell -ExecutionPolicy Bypass -File .git/hooks/pre-commit.ps1
    exit `$?
else
    echo "Error: Neither pwsh nor powershell found"
    exit 1
fi
"@

# Save wrapper for Git to call
$wrapperPath = ".git/hooks/pre-commit.sh"
Set-Content -Path $wrapperPath -Value $wrapperContent -NoNewline

Write-Host "${Green}✅ Pre-commit hook installed${NC}"
Write-Host "${Green}   Source: $hookSource${NC}"
Write-Host "${Green}   Target: $hookTarget${NC}"
Write-Host "${Green}   ${NC}"

# Check Git configuration
$gitHooksPath = git config --get core.hooksPath
if ($gitHooksPath) {
    Write-Host "${Yellow}ℹ️  Git hooks path configured: $gitHooksPath${NC}"
}

Write-Host "${Green}📝 Usage:${NC}"
Write-Host "${Green}   - Normal commit: git commit -m 'message'${NC}"
Write-Host "${Green}   - Bypass hook:  git commit --no-verify -m 'message'${NC}"
Write-Host "${Green}   ${NC}"
Write-Host "${Green}✨ Installation complete!${NC}"
