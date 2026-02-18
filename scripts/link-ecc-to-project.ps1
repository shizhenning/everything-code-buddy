# Script to link ECC directories to external project's .codebuddy folder
# Usage: .\link-ecc-to-project.ps1 -TargetProjectPath "D:\path\to\your\project"

param(
    [Parameter(Mandatory=$true, HelpMessage="Target project path")]
    [string]$TargetProjectPath
)

# Set current directory as project root
$project = Get-Location

# Validate project directories exist
$sourceDirs = @(
    "agents",
    "commands", 
    "skills",
    "rules",
    "scripts",
    "hooks"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ECC Directory Linking Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Source ECC Project: $project" -ForegroundColor Green
Write-Host "Target Project: $TargetProjectPath" -ForegroundColor Green
Write-Host ""

# Validate source directories exist
Write-Host "Validating source directories..." -ForegroundColor Yellow
foreach ($dir in $sourceDirs) {
    $sourcePath = Join-Path $project $dir
    if (-not (Test-Path $sourcePath)) {
        Write-Host "ERROR: Source directory not found: $sourcePath" -ForegroundColor Red
        exit 1
    }
}
Write-Host "All source directories validated." -ForegroundColor Green
Write-Host ""

# Validate target project exists
if (-not (Test-Path $TargetProjectPath)) {
    Write-Host "ERROR: Target project path does not exist: $TargetProjectPath" -ForegroundColor Red
    exit 1
}

# Create .codebuddy directory in target project
$codebuddyPath = Join-Path $TargetProjectPath ".codebuddy"
if (-not (Test-Path $codebuddyPath)) {
    Write-Host "Creating .codebuddy directory..." -ForegroundColor Yellow
    New-Item -Path $codebuddyPath -ItemType Directory -Force | Out-Null
    Write-Host "Created: $codebuddyPath" -ForegroundColor Green
} else {
    Write-Host ".codebuddy directory already exists: $codebuddyPath" -ForegroundColor Green
}
Write-Host ""

# Create links
Write-Host "Creating directory links..." -ForegroundColor Yellow
$linksCreated = 0
$linksSkipped = 0

foreach ($dir in $sourceDirs) {
    $sourcePath = Join-Path $project $dir
    $targetLinkPath = Join-Path $codebuddyPath $dir
    
    # Check if target already exists
    if (Test-Path $targetLinkPath) {
        $existing = Get-Item $targetLinkPath -Force
        if ($existing.LinkType -eq "Junction" -or $existing.LinkType -eq "SymbolicLink") {
            # Existing link, remove it
            Write-Host "  Removing existing link: ${dir}" -ForegroundColor DarkYellow
            Remove-Item -Path $targetLinkPath -Force -Recurse
        } else {
            # Regular directory exists, skip
            Write-Host "  SKIP: ${dir} - target already exists (not a link)" -ForegroundColor Yellow
            $linksSkipped++
            continue
        }
    }
    
    # Create junction point (works better than symlinks on Windows)
    try {
        New-Item -Path $targetLinkPath -ItemType Junction -Value $sourcePath -Force | Out-Null
        Write-Host "  [OK] Linked: ${dir}" -ForegroundColor Green
        $linksCreated++
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Host "  [ERROR] Failed to link ${dir}: ${errorMsg}" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Linking Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Links created: $linksCreated" -ForegroundColor Green
Write-Host "Links skipped: $linksSkipped" -ForegroundColor Yellow
Write-Host ""
Write-Host "Target location: $codebuddyPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: These are junction points. Changes in ECC will be reflected in target project." -ForegroundColor Cyan
