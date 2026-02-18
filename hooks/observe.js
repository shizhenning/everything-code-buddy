#!/usr/bin/env node
/**
 * Observation Hook - Node.js Version
 *
 * Captures tool use events for pattern analysis.
 * Cross-platform compatible version of observe.sh
 *
 * Hook config (in ~/.codebuddy/settings.json or .codebuddy/settings.json):
 * {
 *   "hooks": {
 *     "PreToolUse": [{
 *       "matcher": "*",
 *       "hooks": [{
 *         "type": "command",
 *         "command": "node .codebuddy/hooks/observe.js pre",
 *         "async": true
 *       }]
 *     }],
 *     "PostToolUse": [{
 *       "matcher": "*",
 *       "hooks": [{
 *         "type": "command",
 *         "command": "node .codebuddy/hooks/observe.js post",
 *         "async": true
 *       }]
 *     }]
 *   }
 * }
 */

const path = require('path');
const fs = require('fs');

// ==========================================
// Path Configuration
// ==========================================

const PROJECT_DIR = process.env.CODEBUDDY_PROJECT_DIR || process.cwd();
const HOMUNCULUS_DIR = path.join(PROJECT_DIR, '.codebuddy', 'homunculus');
const OBSERVATIONS_FILE = path.join(HOMUNCULUS_DIR, 'observations.jsonl');
const CONFIG_FILE = path.join(HOMUNCULUS_DIR, 'config.json');
const DISABLED_FILE = path.join(HOMUNCULUS_DIR, 'disabled');
const MAX_FILE_SIZE_MB = 10;

// ==========================================
// Utility Functions
// ==========================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function truncate(str, maxLen) {
  if (typeof str === 'string' && str.length > maxLen) {
    return str.substring(0, maxLen);
  }
  return str;
}

function toISOString() {
  return new Date().toISOString();
}

// ==========================================
// Configuration Loading
// ==========================================

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch (err) {
    // Ignore config errors
  }

  // Default config
  return {
    observation: {
      enabled: true,
      max_file_size_mb: 10,
      capture_tools: ['Edit', 'Write', 'Bash', 'Read', 'Grep', 'Glob'],
      ignore_tools: ['TodoWrite']
    }
  };
}

// ==========================================
// File Size Management
// ==========================================

function archiveIfTooLarge(filePath) {
  if (!fs.existsSync(filePath)) return false;

  const stats = fs.statSync(filePath);
  const sizeMB = stats.size / (1024 * 1024);

  const config = loadConfig();
  const maxSize = config.observation?.max_file_size_mb || MAX_FILE_SIZE_MB;

  if (sizeMB >= maxSize) {
    const archiveDir = path.join(HOMUNCULUS_DIR, 'observations.archive');
    ensureDir(archiveDir);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveFile = path.join(archiveDir, `observations-${timestamp}.jsonl`);

    fs.renameSync(filePath, archiveFile);
    return true;
  }

  return false;
}

// ==========================================
// Observation Processing
// ==========================================

function processObservation(hookType, inputJson) {
  // Check if disabled
  if (fs.existsSync(DISABLED_FILE)) {
    process.exit(0);
  }

  // Load config
  const config = loadConfig();
  if (!config.observation?.enabled) {
    process.exit(0);
  }

  // Parse input
  let hookData;
  try {
    hookData = JSON.parse(inputJson);
  } catch (err) {
    // Invalid JSON, skip
    process.exit(0);
  }

  // Extract fields from hook data
  const hookTypeField = hookData.hook_type || hookType;
  const toolName = hookData.tool_name || hookData.tool || 'unknown';
  const toolInput = hookData.tool_input || hookData.input || {};
  const toolOutput = hookData.tool_output || hookData.output || '';
  const sessionId = hookData.session_id || 'unknown';

  // Determine event type
  const isPreHook = hookTypeField.includes('Pre');
  const eventType = isPreHook ? 'tool_start' : 'tool_complete';

  // Build observation
  const observation = {
    timestamp: toISOString(),
    event: eventType,
    tool: toolName,
    session: sessionId
  };

  // Add input/output based on event type
  if (eventType === 'tool_start' && toolInput) {
    observation.input = truncate(JSON.stringify(toolInput), 5000);
  } else if (eventType === 'tool_complete' && toolOutput) {
    observation.output = truncate(
      typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput),
      5000
    );
  }

  // Ensure directory exists
  ensureDir(HOMUNCULUS_DIR);

  // Archive if too large
  archiveIfTooLarge(OBSERVATIONS_FILE);

  // Write observation
  const observationLine = JSON.stringify(observation) + '\n';
  fs.appendFileSync(OBSERVATIONS_FILE, observationLine, 'utf-8');

  // Note: We removed the observer triggering signal since observer
  // now runs via Stop Hook instead of background process
}

// ==========================================
// Main Execution
// ==========================================

function main() {
  // Get hook type from command line argument
  const hookType = process.argv[2] || 'unknown';

  // Read JSON from stdin (CodeBuddy hook format)
  let inputJson = '';
  try {
    inputJson = fs.readFileSync(0, 'utf-8');
  } catch (err) {
    // No input, exit silently
    process.exit(0);
  }

  // Skip if no input
  if (!inputJson || inputJson.trim().length === 0) {
    process.exit(0);
  }

  // Process the observation
  try {
    processObservation(hookType, inputJson);
  } catch (err) {
    // Silently ignore errors to avoid disrupting tool execution
    process.exit(0);
  }

  process.exit(0);
}

// Run main function
main();
