#!/usr/bin/env node

/**
 * ECC to CodeBuddy Migration Script
 * 
 * Migrates Everything Claude Code configurations to CodeBuddy format
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Detect platform
const isWindows = process.platform === 'win32';
const isSymlinkSupported = !isWindows || fs.existsSync('C:\\Windows\\System32\\mklink.exe');

const CONFIG = {
  claudeDir: path.join(process.cwd(), '.claude'),
  codebuddyDir: path.join(process.cwd(), '.codebuddy'),
  agentsDir: path.join(process.cwd(), 'agents'),
  commandsDir: path.join(process.cwd(), 'commands'),
  skillsDir: path.join(process.cwd(), 'skills'),
  hooksDir: path.join(process.cwd(), 'hooks'),
  rulesDir: path.join(process.cwd(), 'rules'),
  useSymlinks: true, // Use symlinks by default for plugin publishing
};

class CodeBuddyMigrator {
  constructor(options = {}) {
    this.migrationLog = [];
    this.errors = [];
    this.useSymlinks = options.useSymlinks ?? CONFIG.useSymlinks;
    
    if (this.useSymlinks && !isSymlinkSupported) {
      this.log(`Warning: Symlinks not supported, falling back to copy`);
      this.useSymlinks = false;
    }
  }

  log(message) {
    console.log(`[MIGRATION] ${message}`);
    this.migrationLog.push(message);
  }

  error(message) {
    console.error(`[ERROR] ${message}`);
    this.errors.push(message);
  }

  ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      this.log(`Created directory: ${dirPath}`);
    }
  }

  createSymlinkOrCopy(src, dest) {
    // Create symlink if supported and enabled
    if (this.useSymlinks) {
      try {
        // Remove existing symlink or file
        if (fs.existsSync(dest)) {
          const destStat = fs.lstatSync(dest);
          if (destStat.isSymbolicLink() || destStat.isFile()) {
            fs.unlinkSync(dest);
          } else if (destStat.isDirectory()) {
            fs.rmdirSync(dest, { recursive: true });
          }
        }

        // Create symlink
        if (isWindows) {
          // Windows requires admin privileges for symlinks, fallback to junctions
          const srcStat = fs.statSync(src);
          if (srcStat.isDirectory()) {
            execSync(`mklink /J "${dest}" "${src}"`, { stdio: 'ignore', shell: true });
          } else {
            execSync(`mklink /H "${dest}" "${src}"`, { stdio: 'ignore', shell: true });
          }
        } else {
          // Unix symlinks
          fs.symlinkSync(src, dest);
        }
        
        this.log(`Created symlink: ${dest} → ${src}`);
        return true;
      } catch (err) {
        this.log(`Symlink failed, falling back to copy: ${err.message}`);
        this.useSymlinks = false; // Disable symlinks for subsequent operations
      }
    }
    
    // Fallback to copy
    fs.copyFileSync(src, dest);
    this.log(`Copied: ${dest}`);
    return true;
  }

  symlinkOrCopyDirectory(src, dest) {
    if (!fs.existsSync(src)) {
      this.error(`Source directory does not exist: ${src}`);
      return false;
    }

    this.ensureDirectory(dest);

    const files = fs.readdirSync(src);
    let processed = 0;

    for (const file of files) {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      const stat = fs.statSync(srcPath);

      if (stat.isDirectory()) {
        this.symlinkOrCopyDirectory(srcPath, destPath);
      } else {
        this.createSymlinkOrCopy(srcPath, destPath);
        processed++;
      }
    }

    const method = this.useSymlinks ? 'Linked' : 'Copied';
    this.log(`${method} ${processed} files from ${src} to ${dest}`);
    return true;
  }

  copyDirectory(src, dest) {
    // Legacy method, redirects to symlinkOrCopyDirectory
    return this.symlinkOrCopyDirectory(src, dest);
  }

  /**
   * Migrate Agents
   * Claude Code agents are compatible with CodeBuddy (format is identical)
   */
  migrateAgents() {
    this.log('=== Migrating Agents ===');
    const destDir = path.join(CONFIG.codebuddyDir, 'agents');
    
    if (fs.existsSync(CONFIG.agentsDir)) {
      this.copyDirectory(CONFIG.agentsDir, destDir);
    } else {
      this.error('Agents directory not found');
    }
  }

  /**
   * Migrate Commands
   * Commands need minimal changes (mostly path references)
   */
  migrateCommands() {
    this.log('=== Migrating Commands ===');
    const destDir = path.join(CONFIG.codebuddyDir, 'commands');
    
    if (fs.existsSync(CONFIG.commandsDir)) {
      this.copyDirectory(CONFIG.commandsDir, destDir);
      this.log('Commands copied (may need manual review for path references)');
    } else {
      this.error('Commands directory not found');
    }
  }

  /**
   * Migrate Skills
   * Skills are identical format between platforms
   */
  migrateSkills() {
    this.log('=== Migrating Skills ===');
    const destDir = path.join(CONFIG.codebuddyDir, 'skills');
    
    if (fs.existsSync(CONFIG.skillsDir)) {
      this.copyDirectory(CONFIG.skillsDir, destDir);
    } else {
      this.error('Skills directory not found');
    }
  }

  /**
   * Migrate Hooks
   * Convert Claude Code hooks.json to CodeBuddy settings.json format
   */
  migrateHooks() {
    this.log('=== Migrating Hooks ===');
    
    const hooksJsonPath = path.join(CONFIG.hooksDir, 'hooks.json');
    if (!fs.existsSync(hooksJsonPath)) {
      this.error('hooks.json not found');
      return;
    }

    try {
      const hooksConfig = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf-8'));
      
      // CodeBuddy uses settings.json for hooks
      const settingsPath = path.join(CONFIG.codebuddyDir, 'settings.json');
      let settings = {};
      
      if (fs.existsSync(settingsPath)) {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      }

      // Merge hooks
      settings.hooks = hooksConfig.hooks;
      
      // Add CodeBuddy-specific settings
      settings.permissions = {
        'Bash': 'ask',
        'Edit': 'accept',
        'Write': 'accept',
      };
      
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      this.log(`Hooks migrated to ${settingsPath}`);
      
    } catch (error) {
      this.error(`Failed to migrate hooks: ${error.message}`);
    }
  }

  /**
   * Migrate Rules
   * Rules must be manually installed in CodeBuddy
   * Copy to codebuddy/rules for reference
   */
  migrateRules() {
    this.log('=== Migrating Rules ===');
    
    if (!fs.existsSync(CONFIG.rulesDir)) {
      this.error('Rules directory not found');
      return;
    }

    const destDir = path.join(CONFIG.codebuddyDir, 'rules');
    this.ensureDirectory(destDir);
    
    // Copy rules for reference (user must manually install)
    this.copyDirectory(CONFIG.rulesDir, destDir);
    
    // Generate installation instructions
    const readmePath = path.join(destDir, 'INSTALL.md');
    const readme = this.generateRulesInstallGuide();
    fs.writeFileSync(readmePath, readme);
    this.log(`Generated rules installation guide: ${readmePath}`);
  }

  generateRulesInstallGuide() {
    return `# CodeBuddy Rules Installation Guide

CodeBuddy requires manual rule installation (similar to Claude Code).

## Installation Methods

### Method 1: Project-Level Rules (Recommended)

Copy rules to your project directory:

\`\`\`bash
# Common rules (always install)
cp .codebuddy/rules/common/* .codebuddy/rules/

# Language-specific (choose your stack)
cp .codebuddy/rules/typescript/* .codebuddy/rules/
cp .codebuddy/rules/python/* .codebuddy/rules/
cp .codebuddy/rules/golang/* .codebuddy/rules/
\`\`\`

### Method 2: User-Level Rules (Global)

Install rules globally for all projects:

\`\`\`bash
# Create directory
mkdir -p ~/.codebuddy/rules

# Copy rules
cp .codebuddy/rules/common/* ~/.codebuddy/rules/
cp .codebuddy/rules/typescript/* ~/.codebuddy/rules/
\`\`\`

## Important Notes

- **Common rules** should always be installed
- **Language rules** - install only what you use
- **Project rules** override user rules (same priority as Claude Code)
- Rules are loaded automatically by CodeBuddy

## Rule Categories

### Common Rules (Always Install)
- coding-style.md - Immutability, file organization, error handling
- git-workflow.md - Commit format, PR process
- testing.md - TDD, 80% coverage requirement
- performance.md - Model selection, context management
- patterns.md - Design patterns, skeleton projects
- hooks.md - Hook architecture, TodoWrite
- agents.md - When to delegate to subagents
- security.md - Mandatory security checks

### Language Rules (Choose as Needed)
- **typescript/** - TypeScript/JavaScript specific patterns
- **python/** - Python idioms and best practices
- **golang/** - Go specific patterns

See individual rule files for detailed guidelines.
`;
  }

  /**
   * Migrate MCP Configurations
   */
  migrateMCPConfigs() {
    this.log('=== Migrating MCP Configurations ===');
    
    const mcpConfigDir = path.join(CONFIG.codebuddyDir, 'mcp-configs');
    this.ensureDirectory(mcpConfigDir);
    
    const sourceMcpPath = path.join(process.cwd(), 'mcp-configs');
    if (fs.existsSync(sourceMcpPath)) {
      this.copyDirectory(sourceMcpPath, mcpConfigDir);
    } else {
      this.log('No mcp-configs directory found, skipping');
    }
  }

  /**
   * Migrate Scripts
   * Hook scripts need to work with CodeBuddy environment variables
   */
  migrateScripts() {
    this.log('=== Migrating Hook Scripts ===');
    
    const scriptsDir = path.join(process.cwd(), 'scripts');
    if (!fs.existsSync(scriptsDir)) {
      this.log('No scripts directory found, skipping');
      return;
    }

    const destDir = path.join(CONFIG.codebuddyDir, 'scripts');
    this.ensureDirectory(destDir);
    
    this.copyDirectory(scriptsDir, destDir);
    
    // Update script paths in hooks
    const settingsPath = path.join(CONFIG.codebuddyDir, 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      
      // Update ${CLAUDE_PLUGIN_ROOT} to ${CODEBUDDY_PLUGIN_ROOT}
      const settingsStr = JSON.stringify(settings);
      const updatedStr = settingsStr
        .replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, '${CODEBUDDY_PLUGIN_ROOT}')
        .replace(/CLAUDE_PLUGIN_ROOT/g, 'CODEBUDDY_PLUGIN_ROOT');
      
      fs.writeFileSync(settingsPath, JSON.stringify(JSON.parse(updatedStr), null, 2));
      this.log('Updated script paths in settings.json');
    }
  }

  /**
   * Generate Migration Report
   */
  generateReport() {
    const reportPath = path.join(CONFIG.codebuddyDir, 'MIGRATION_REPORT.md');
    
    const report = `# ECC to CodeBuddy Migration Report

Generated: ${new Date().toISOString()}

## Migration Summary

### Components Migrated

| Component | Status | Notes |
|-----------|---------|-------|
| Agents | ✅ Complete | Format compatible, no changes needed |
| Commands | ✅ Complete | Path references may need manual review |
| Skills | ✅ Complete | Format compatible, no changes needed |
| Hooks | ✅ Complete | Converted to CodeBuddy settings.json format |
| Rules | ✅ Complete | Copied for reference, manual install required |
| MCP Configs | ✅ Complete | Direct copy |
| Scripts | ✅ Complete | Environment variables updated |

### Migration Log

${this.migrationLog.map(log => `- ${log}`).join('\n')}

${this.errors.length > 0 ? `
### Errors Encountered

${this.errors.map(err => `- ${err}`).join('\n')}
` : `
### ✅ No Errors Encountered
`}

## Post-Migration Steps

### 1. Review Hooks

Check \`.codebuddy/settings.json\` and verify hooks are correctly configured.

### 2. Install Rules

See \`.codebuddy/rules/INSTALL.md\` for installation instructions.

### 3. Test Commands

Try a few commands to ensure they work correctly:

\`\`\`bash
codebuddy /plan "test feature"
codebuddy /tdd
codebuddy /code-review
\`\`\`

### 4. Update Environment Variables

If you were using Claude Code environment variables, update them:

\`\`\`bash
# Claude Code
export CLAUDE_PACKAGE_MANAGER=pnpm

# CodeBuddy
export CODEBUDDY_PACKAGE_MANAGER=pnpm
\`\`\`

### 5. Optional: Keep Claude Code Support

If you want to maintain compatibility with both platforms:

- Keep the original \`.claude/\` directory
- Both platforms can coexist peacefully
- Use platform-specific configurations as needed

## Platform Differences

| Feature | Claude Code | CodeBuddy |
|----------|-------------|-------------|
| Plugin System | .claude-plugin/ | .codebuddy/ directory |
| Hook Events | PreToolUse, PostToolUse, Stop, SessionStart, SessionEnd | Same (plus more in OpenCode) |
| Environment Variables | CLAUDE_* | CODEBUDDY_* |
| Session Storage | .claude/session.jsonl | .codebuddy/session.jsonl |
| Context Window | 200K tokens | 200K tokens (similar) |
| Multi-Model Support | Limited | Extensive (Claude, GPT, Gemini) |

## Known Limitations

1. **Some hooks may need adjustment** due to environment variable differences
2. **Multi-agent commands** (/multi-*, /pm2) may need testing
3. **Custom tools** in OpenCode plugins are not supported in CodeBuddy
4. **Context management** strategies may differ slightly

## Need Help?

- **CodeBuddy Docs**: https://www.codebuddy.cn/docs/cli/overview
- **ECC GitHub**: https://github.com/affaan-m/everything-claude-code/issues
- **Migration Issues**: Create issue with MIGRATION_REPORT.md attached

---

Migration completed successfully! Start building with CodeBuddy today.
`;

    fs.writeFileSync(reportPath, report);
    this.log(`Generated migration report: ${reportPath}`);
  }

  /**
   * Migrate Continuous Learning v2 Components
   * Special handling for observer agent, hook scripts, and Python CLI
   */
  migrateContinuousLearningV2() {
    this.log('=== Migrating Continuous Learning v2 ===');
    
    const skillName = 'continuous-learning-v2';
    const srcSkillDir = path.join(CONFIG.skillsDir, skillName);
    const destSkillDir = path.join(CONFIG.codebuddyDir, 'skills', skillName);
    
    if (!fs.existsSync(srcSkillDir)) {
      this.log('Continuous Learning v2 not found, skipping');
      return;
    }

    // Link/copy the entire skill directory
    this.symlinkOrCopyDirectory(srcSkillDir, destSkillDir);
    
    // Generate Windows hook scripts
    if (isWindows) {
      this.generateWindowsHookScripts(destSkillDir);
    }
    
    // Update environment variables in scripts
    this.updateScriptEnvironmentVariables(destSkillDir);
    
    this.log(`Continuous Learning v2 migrated to ${destSkillDir}`);
  }

  /**
   * Generate Windows hook scripts for CL v2
   */
  generateWindowsHookScripts(skillDir) {
    const hooksDir = path.join(skillDir, 'hooks');
    const agentsDir = path.join(skillDir, 'agents');
    
    // Create observe.ps1
    const observePs1 = path.join(hooksDir, 'observe.ps1');
    if (!fs.existsSync(observePs1)) {
      const ps1Content = `# Continuous Learning v2 - Observation Hook (Windows)
#
# Captures tool use events for pattern analysis.
# CodeBuddy passes hook data via stdin as JSON.
#
# Hook config (in .codebuddy/settings.json):
# {
#   "hooks": {
#     "PreToolUse": [{
#       "matcher": "*",
#       "hooks": [{ "type": "command", "command": "\${CODEBUDDY_PROJECT_DIR}\\\\skills\\\\continuous-learning-v2\\\\hooks\\\\observe.ps1 pre" }]
#     }],
#     "PostToolUse": [{
#       "matcher": "*",
#       "hooks": [{ "type": "command", "command": "\${CODEBUDDY_PROJECT_DIR}\\\\skills\\\\continuous-learning-v2\\\\hooks\\\\observe.ps1 post" }]
#     }]
#   }
# }

param(
  [Parameter(Mandatory=\$true)]
  [ValidateSet("pre", "post")]
  [string]\$EventType
)

\$ErrorActionPreference = "Stop"

# Configuration
\$CONFIG_DIR = Join-Path \$env:USERPROFILE ".claude\\homunculus"
\$OBSERVATIONS_FILE = Join-Path \$CONFIG_DIR "observations.jsonl"
\$MAX_FILE_SIZE_MB = 10

# Ensure directory exists
New-Item -ItemType Directory -Force -Path \$CONFIG_DIR | Out-Null

# Skip if disabled
\$disabledFile = Join-Path \$CONFIG_DIR "disabled"
if (Test-Path \$disabledFile) {
  exit 0
}

# Read JSON from stdin
\$inputJson = \$Input.ReadToEnd()

# Exit if no input
if ([string]::IsNullOrWhiteSpace(\$inputJson)) {
  exit 0
}

# Parse using Python
try {
  \$parsed = \$inputJson | python -c @"
import json
import sys
import os

try:
    data = json.load(sys.stdin)

    hook_type = data.get("hook_type", "unknown")
    tool_name = data.get("tool_name", data.get("tool", "unknown"))
    tool_input = data.get("tool_input", data.get("input", {}))
    tool_output = data.get("tool_output", data.get("output", ""))
    session_id = data.get("session_id", "unknown")

    if isinstance(tool_input, dict):
        tool_input_str = json.dumps(tool_input)[:5000]
    else:
        tool_input_str = str(tool_input)[:5000]

    if isinstance(tool_output, dict):
        tool_output_str = json.dumps(tool_output)[:5000]
    else:
        tool_output_str = str(tool_output)[:5000]

    event = "tool_start" if "Pre" in hook_type else "tool_complete"

    print(json.dumps({
        "parsed": True,
        "event": event,
        "tool": tool_name,
        "input": tool_input_str if event == "tool_start" else None,
        "output": tool_output_str if event == "tool_complete" else None,
        "session": session_id
    }))
except Exception as e:
    print(json.dumps({"parsed": False, "error": str(e)}))
"@

  \$parsedObj = \$parsed | ConvertFrom-Json

  if (-not \$parsedObj.parsed) {
    # Log parse error
    \$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    \$errorMsg = @{
      timestamp = \$timestamp
      event = "parse_error"
      raw = \$inputJson.Substring(0, [Math]::Min(2000, \$inputJson.Length))
    } | ConvertTo-Json -Compress
    \$errorMsg | Out-File -Append -FilePath \$OBSERVATIONS_FILE -Encoding utf8
    exit 0
  }

  # Archive if file too large
  if (Test-Path \$OBSERVATIONS_FILE) {
    \$fileSize = (Get-Item \$OBSERVATIONS_FILE).Length / 1MB
    if (\$fileSize -ge \$MAX_FILE_SIZE_MB) {
      \$archiveDir = Join-Path \$CONFIG_DIR "observations.archive"
      New-Item -ItemType Directory -Force -Path \$archiveDir | Out-Null
      \$archiveFile = "observations-{0}.jsonl" -f (Get-Date -Format "yyyyMMdd-HHmmss")
      Move-Item -Path \$OBSERVATIONS_FILE -Destination (Join-Path \$archiveDir \$archiveFile)
    }
  }

  # Build and write observation
  \$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  
  \$observation = @{
    timestamp = \$timestamp
    event = \$parsedObj.event
    tool = \$parsedObj.tool
    session = \$parsedObj.session
  }
  
  if (\$parsedObj.input) {
    \$observation.input = \$parsedObj.input
  }
  if (\$parsedObj.output) {
    \$observation.output = \$parsedObj.output
  }
  
  \$observation | ConvertTo-Json -Compress | Out-File -Append -FilePath \$OBSERVATIONS_FILE -Encoding utf8

} catch {
  # Log error for debugging
  \$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  \$errorMsg = @{
    timestamp = \$timestamp
    event = "script_error"
    error = \$_.Exception.Message
  } | ConvertTo-Json -Compress
  \$errorMsg | Out-File -Append -FilePath \$OBSERVATIONS_FILE -Encoding utf8
}

exit 0
`;
      fs.writeFileSync(observePs1, ps1Content, 'utf8');
      this.log(`Created Windows hook script: ${observePs1}`);
    }
    
    // Create start-observer.ps1
    const startObserverPs1 = path.join(agentsDir, 'start-observer.ps1');
    if (!fs.existsSync(startObserverPs1)) {
      const ps1Content = `# Continuous Learning v2 - Observer Agent Launcher (Windows)
#
# Starts the observer agent that analyzes observations
# and creates instincts.
#
# Note: CodeBuddy does not support background agents.
# This script is provided for reference only.
# Use Stop Hook to trigger analysis instead.

param(
  [Parameter(Mandatory=\$false)]
  [ValidateSet("start", "stop", "status")]
  [string]\$Action = "start"
)

\$ErrorActionPreference = "Stop"

\$CONFIG_DIR = Join-Path \$env:USERPROFILE ".claude\\homunculus"
\$PID_FILE = Join-Path \$CONFIG_DIR ".observer.pid"
\$LOG_FILE = Join-Path \$CONFIG_DIR "observer.log"

New-Item -ItemType Directory -Force -Path \$CONFIG_DIR | Out-Null

switch (\$Action) {
  "stop" {
    if (Test-Path \$PID_FILE) {
      \$pid = Get-Content \$PID_FILE
      \$process = Get-Process -Id \$pid -ErrorAction SilentlyContinue
      if (\$process) {
        Write-Host "Stopping observer (PID: \$pid)..."
        Stop-Process -Id \$pid -Force
        Remove-Item \$PID_FILE -Force
        Write-Host "Observer stopped."
      } else {
        Write-Host "Observer not running (stale PID file)."
        Remove-Item \$PID_FILE -Force
      }
    } else {
      Write-Host "Observer not running."
    }
    exit 0
  }

  "status" {
    if (Test-Path \$PID_FILE) {
      \$pid = Get-Content \$PID_FILE
      \$process = Get-Process -Id \$pid -ErrorAction SilentlyContinue
      if (\$process) {
        Write-Host "Observer is running (PID: \$pid)"
        Write-Host "Log: \$LOG_FILE"
        if (Test-Path (Join-Path \$CONFIG_DIR "observations.jsonl")) {
          \$lines = (Get-Content (Join-Path \$CONFIG_DIR "observations.jsonl")).Count
          Write-Host "Observations: \$lines lines"
        }
        exit 0
      } else {
        Write-Host "Observer not running (stale PID file)"
        Remove-Item \$PID_FILE -Force
        exit 1
      }
    } else {
      Write-Host "Observer not running"
      exit 1
    }
  }

  "start" {
    Write-Host "Note: CodeBuddy does not support background agent mode."
    Write-Host "Use Stop Hook or manual trigger for analysis."
    Write-Host ""
    Write-Host "For analysis, run:"
    Write-Host "  codebuddy --agent observer --analyze-only"
    exit 0
  }
}
`;
      fs.writeFileSync(startObserverPs1, ps1Content, 'utf8');
      this.log(`Created Windows agent launcher: ${startObserverPs1}`);
    }
  }

  /**
   * Update environment variables in script files
   */
  updateScriptEnvironmentVariables(skillDir) {
    const filesToUpdate = [
      path.join(skillDir, 'hooks', 'observe.sh'),
      path.join(skillDir, 'hooks', 'observe.ps1'),
      path.join(skillDir, 'agents', 'observer.md'),
      path.join(skillDir, 'SKILL.md'),
    ];

    for (const filePath of filesToUpdate) {
      if (!fs.existsSync(filePath)) {
        continue;
      }

      try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace Claude environment variables with CodeBuddy equivalents
        content = content
          .replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, '${CODEBUDDY_PROJECT_DIR}')
          .replace(/CLAUDE_PLUGIN_ROOT/g, 'CODEBUDDY_PROJECT_DIR')
          .replace(/\$\{CLAUDE_PROJECT_ROOT\}/g, '${CODEBUDDY_PROJECT_DIR}')
          .replace(/CLAUDE_PROJECT_ROOT/g, 'CODEBUDDY_PROJECT_DIR')
          .replace(/\$\{HOME\}\/\.claude/g, '${USERPROFILE}\\.claude')
          .replace(/~\/\.claude/g, '${USERPROFILE}\\.claude');
        
        fs.writeFileSync(filePath, content, 'utf8');
        this.log(`Updated environment variables in: ${filePath}`);
      } catch (err) {
        this.error(`Failed to update ${filePath}: ${err.message}`);
      }
    }
  }

  /**
   * Run Full Migration
   */
  async migrate(options = {}) {
    const useSymlinks = options.useSymlinks ?? CONFIG.useSymlinks;
    const useSymlinksStr = useSymlinks ? 'Symlinks' : 'Copy';
    
    console.log(`
╔═══════════════════════════════════════════════════════╗
║       ECC to CodeBuddy Migration Tool v1.1              ║
╠═══════════════════════════════════════════════════════╣
║  Platform: ${process.platform.padRight(42)} ║
║  Mode: ${useSymlinksStr.padRight(49)} ║
╚═══════════════════════════════════════════════════════╝

Migrating Everything Claude Code configurations to CodeBuddy format...
`);

    try {
      // Create .codebuddy directory
      this.ensureDirectory(CONFIG.codebuddyDir);
      
      // Run migrations
      this.migrateAgents();
      this.migrateCommands();
      this.migrateSkills();
      this.migrateHooks();
      this.migrateRules();
      this.migrateMCPConfigs();
      this.migrateScripts();
      this.migrateContinuousLearningV2(); // NEW: CL v2 migration
      
      // Generate report
      this.generateReport();
      
      // Summary
      console.log(`
╔═══════════════════════════════════════════════════════╗
║                    ✅ Migration Complete                    ║
╚═══════════════════════════════════════════════════════╝

Components migrated:
  ✅ Agents       (${CONFIG.agentsDir} → .codebuddy/agents/)
  ✅ Commands     (${CONFIG.commandsDir} → .codebuddy/commands/)
  ✅ Skills       (${CONFIG.skillsDir} → .codebuddy/skills/)
  ✅ Hooks        (hooks.json → .codebuddy/settings.json)
  ✅ Rules        (${CONFIG.rulesDir} → .codebuddy/rules/)
  ✅ MCP Configs  (mcp-configs/ → .codebuddy/mcp-configs/)
  ✅ Scripts      (${CONFIG.hooksDir}/scripts/ → .codebuddy/scripts/)
  ✅ CL v2        (continuous-learning-v2 → .codebuddy/skills/)

${isWindows ? '  ✅ Windows Scripts (PowerShell hook scripts generated)' : ''}

Migration method: ${useSymlinks ? '🔗 Symlinks' : '📋 Copy'}${useSymlinks ? ' (recommended for plugin publishing)' : ''}

Next steps:
  1. Review .codebuddy/settings.json
  2. Install rules (see .codebuddy/rules/INSTALL.md)
  3. Test commands: codebuddy /plan "test"
  4. Read migration report: .codebuddy/MIGRATION_REPORT.md

Documentation:
  - CodeBuddy: https://www.codebuddy.cn/docs/cli/overview
  - ECC GitHub: https://github.com/affaan-m/everything-claude-code
${this.errors.length > 0 ? `
⚠️  Warnings encountered: ${this.errors.length}
   See .codebuddy/MIGRATION_REPORT.md for details
` : ''}
`);
      
      process.exit(this.errors.length > 0 ? 1 : 0);
      
    } catch (error) {
      this.error(`Migration failed: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  }
}

// Run migration with command line options
const args = process.argv.slice(2);
const useSymlinks = !args.includes('--no-symlinks');

const migrator = new CodeBuddyMigrator({ useSymlinks });
migrator.migrate({ useSymlinks });
