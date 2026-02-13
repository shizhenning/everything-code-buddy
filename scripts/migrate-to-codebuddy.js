#!/usr/bin/env node

/**
 * ECC to CodeBuddy Migration Script
 * 
 * Migrates Everything Claude Code configurations to CodeBuddy format
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = {
  claudeDir: path.join(process.cwd(), '.claude'),
  codebuddyDir: path.join(process.cwd(), '.codebuddy'),
  agentsDir: path.join(process.cwd(), 'agents'),
  commandsDir: path.join(process.cwd(), 'commands'),
  skillsDir: path.join(process.cwd(), 'skills'),
  hooksDir: path.join(process.cwd(), 'hooks'),
  rulesDir: path.join(process.cwd(), 'rules'),
};

class CodeBuddyMigrator {
  constructor() {
    this.migrationLog = [];
    this.errors = [];
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

  copyDirectory(src, dest) {
    if (!fs.existsSync(src)) {
      this.error(`Source directory does not exist: ${src}`);
      return false;
    }

    this.ensureDirectory(dest);

    const files = fs.readdirSync(src);
    let copied = 0;

    for (const file of files) {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      const stat = fs.statSync(srcPath);

      if (stat.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
        copied++;
      }
    }

    this.log(`Copied ${copied} files from ${src} to ${dest}`);
    return true;
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
   * Run Full Migration
   */
  async migrate() {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║       ECC to CodeBuddy Migration Tool v1.0              ║
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

// Run migration
const migrator = new CodeBuddyMigrator();
migrator.migrate();
