#!/usr/bin/env node
/**
 * Fix hardcoded ~/.claude/ paths to use environment variable
 * Usage: node scripts/fix-hardcoded-paths.js
 */

const fs = require('fs');
const path = require('path');

const COMMANDS_DIR = path.join(__dirname, '..', 'commands');

// Path mappings for backward compatibility
const pathMappings = [
  // Continuous Learning v2
  { from: '~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py', to: '${CODEBUDDY_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py' },
  { from: '~/.claude/homunculus/instincts/personal/', to: '${CODEBUDDY_PROJECT_DIR}/.codebuddy/sessions/instincts/personal/' },
  { from: '~/.claude/homunculus/instincts/inherited/', to: '${CODEBUDDY_PLUGIN_ROOT}/sessions/instincts/inherited/' },
  { from: '~/.claude/homunculus/evolved/', to: '${CODEBUDDY_PLUGIN_ROOT}/sessions/evolved/' },
  { from: '~/.claude/homunculus/instincts/', to: '${CODEBUDDY_PLUGIN_ROOT}/sessions/instincts/' },

  // Checkpoints
  { from: '.claude/checkpoints.log', to: '${CODEBUDDY_PROJECT_DIR}/.codebuddy/checkpoints.log' },

  // Agents
  { from: '~/.claude/agents/', to: '${CODEBUDDY_PLUGIN_ROOT}/agents/' },
  { from: '~/.claude/agents/e2e-runner.md', to: '${CODEBUDDY_PLUGIN_ROOT}/agents/e2e-runner.md' },

  // Skills
  { from: '~/.claude/skills/learned/', to: '${CODEBUDDY_PROJECT_DIR}/.codebuddy/skills/' },
  { from: '~/.claude/skills/', to: '${CODEBUDDY_PLUGIN_ROOT}/skills/' },

  // Evals
  { from: '.claude/evals/', to: '${CODEBUDDY_PROJECT_DIR}/.codebuddy/evals/' },

  // Plans
  { from: '.claude/plan/', to: '${CODEBUDDY_PROJECT_DIR}/.codebuddy/plan/' },

  // CCG prompts
  { from: '~/.claude/.ccg/prompts/', to: '${CODEBUDDY_PLUGIN_ROOT}/.ccg/prompts/' },

  // Bin wrappers
  { from: '~/.claude/bin/codeagent-wrapper', to: '${CODEBUDDY_PLUGIN_ROOT}/bin/codeagent-wrapper' },

  // Generic fallback
  { from: '~/.claude/', to: '${CODEBUDDY_PLUGIN_ROOT}/' },
  { from: '.claude/', to: '${CODEBUDDY_PROJECT_DIR}/.codebuddy/' },
];

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  let newContent = content;

  for (const mapping of pathMappings) {
    if (newContent.includes(mapping.from)) {
      newContent = newContent.split(mapping.from).join(mapping.to);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    return true;
  }
  return false;
}

function main() {
  const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.md'));

  console.log(`\n🔧 Fixing hardcoded paths in ${files.length} command files...\n`);

  let modifiedCount = 0;
  for (const file of files) {
    const filePath = path.join(COMMANDS_DIR, file);
    if (fixFile(filePath)) {
      console.log(`✓ ${file}`);
      modifiedCount++;
    }
  }

  console.log(`\n✅ Modified ${modifiedCount} files`);
  console.log(`📋 Unmodified: ${files.length - modifiedCount} files\n`);
}

if (require.main === module) {
  main();
}

module.exports = { fixFile };
