#!/usr/bin/env node
/**
 * Observer Agent - Node.js Implementation
 *
 * Runs on Stop Hook or manual command to analyze session observations
 * and create instincts from detected patterns.
 *
 * Usage:
 *   node .codebuddy/agents/observer/run-observer.js
 *   node .codebuddy/agents/observer/run-observer.js --min-observations 50
 *   node .codebuddy/agents/observer/run-observer.js --verbose
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// ==========================================
// Path Configuration (CodeBuddy Standards)
// ==========================================

const PROJECT_DIR = process.env.CODEBUDDY_PROJECT_DIR || process.cwd();
const HOMUNCULUS_DIR = path.join(PROJECT_DIR, '.codebuddy', 'homunculus');
const OBSERVATIONS_FILE = path.join(HOMUNCULUS_DIR, 'observations.jsonl');
const CONFIG_FILE = path.join(HOMUNCULUS_DIR, 'config.json');
const INSTINCTS_DIR = path.join(HOMUNCULUS_DIR, 'instincts', 'personal');
const PID_FILE = path.join(HOMUNCULUS_DIR, '.observer.pid');

// ==========================================
// Default Configuration
// ==========================================

const DEFAULT_CONFIG = {
  observer: {
    enabled: true,
    model: 'haiku',
    min_observations_to_analyze: 20,
    patterns_to_detect: [
      'user_corrections',
      'error_resolutions',
      'repeated_workflows',
      'tool_preferences',
      'file_patterns'
    ]
  },
  instincts: {
    personal_path: '.codebuddy/homunculus/instincts/personal/',
    min_confidence: 0.3,
    auto_approve_threshold: 0.7
  },
  observation: {
    enabled: true,
    max_file_size_mb: 10
  }
};

// ==========================================
// CLI Arguments
// ==========================================

const args = process.argv.slice(2);
const options = {
  minObservations: null,
  verbose: false,
  dryRun: false,
  help: false
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--min-observations' && args[i + 1]) {
    options.minObservations = parseInt(args[i + 1], 10);
    i++;
  } else if (arg === '--verbose' || arg === '-v') {
    options.verbose = true;
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg === '--help' || arg === '-h') {
    options.help = true;
  }
}

if (options.help) {
  console.log(`
Observer Agent - Pattern Analysis for CodeBuddy

Usage:
  node run-observer.js [options]

Options:
  --min-observations N    Minimum observations required to run (default: from config)
  --verbose, -v         Enable verbose output
  --dry-run              Analyze but don't write instincts
  --help, -h            Show this help

Examples:
  node run-observer.js
  node run-observer.js --verbose
  node run-observer.js --min-observations 50
  node run-observer.js --dry-run

Environment Variables:
  CODEBUDDY_PROJECT_DIR  Project root directory (default: cwd)
`);
  process.exit(0);
}

// ==========================================
// Utility Functions
// ==========================================

function log(message, level = 'info') {
  const prefix = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '✗',
    debug: '▸'
  }[level];

  if (level === 'debug' && !options.verbose) return;
  console.log(`${prefix} ${message}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    return null;
  }
}

function writeFile(filePath, content) {
  if (options.dryRun) {
    log(`[DRY-RUN] Would write: ${filePath}`, 'debug');
    return;
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}

function parseJson(content, defaultVal) {
  try {
    return JSON.parse(content);
  } catch (err) {
    return defaultVal;
  }
}

// ==========================================
// Configuration Loading
// ==========================================

function loadConfig() {
  const configContent = readFile(CONFIG_FILE);
  const config = configContent ? parseJson(configContent, {}) : {};
  return { ...DEFAULT_CONFIG, ...config };
}

// ==========================================
// Observation Loading
// ==========================================

function loadObservations() {
  const content = readFile(OBSERVATIONS_FILE);
  if (!content) {
    log('No observations file found', 'warning');
    return [];
  }

  const lines = content.trim().split('\n').filter(line => line.trim());
  const observations = [];

  for (const line of lines) {
    try {
      observations.push(JSON.parse(line));
    } catch (err) {
      log(`Failed to parse observation: ${line.substring(0, 50)}...`, 'debug');
    }
  }

  return observations;
}

// ==========================================
// Pattern Detection
// ==========================================

function detectPatterns(observations, config) {
  const patterns = {
    userCorrections: [],
    errorResolutions: [],
    repeatedWorkflows: [],
    toolPreferences: [],
    filePatterns: []
  };

  const patternsToDetect = config.observer.patterns_to_detect || [];

  log(`Analyzing ${observations.length} observations...`, 'info');

  // Detect user corrections
  if (patternsToDetect.includes('user_corrections')) {
    patterns.userCorrections = detectUserCorrections(observations);
  }

  // Detect error resolutions
  if (patternsToDetect.includes('error_resolutions')) {
    patterns.errorResolutions = detectErrorResolutions(observations);
  }

  // Detect repeated workflows
  if (patternsToDetect.includes('repeated_workflows')) {
    patterns.repeatedWorkflows = detectRepeatedWorkflows(observations);
  }

  // Detect tool preferences
  if (patternsToDetect.includes('tool_preferences')) {
    patterns.toolPreferences = detectToolPreferences(observations);
  }

  // Detect file patterns
  if (patternsToDetect.includes('file_patterns')) {
    patterns.filePatterns = detectFilePatterns(observations);
  }

  return patterns;
}

function detectUserCorrections(observations) {
  // Look for undo/redo patterns or error-followed-by-fix
  const corrections = [];

  for (let i = 0; i < observations.length - 1; i++) {
    const current = observations[i];
    const next = observations[i + 1];

    if (current.event === 'tool_complete' && next.event === 'tool_start') {
      // If same tool called again quickly on same file, might be correction
      if (current.tool === next.tool && isRelatedInput(current, next)) {
        corrections.push({
          type: 'user_correction',
          tool: current.tool,
          evidence: 'Rapid re-execution',
          count: 1
        });
      }
    }
  }

  return corrections;
}

function detectErrorResolutions(observations) {
  const resolutions = [];
  const toolErrors = new Map();

  // Track errors and their fixes
  for (let obs of observations) {
    if (obs.event === 'tool_complete' && obs.output) {
      const outputStr = JSON.stringify(obs.output).toLowerCase();
      if (outputStr.includes('error') || outputStr.includes('failed')) {
        const key = obs.tool;
        if (!toolErrors.has(key)) {
          toolErrors.set(key, []);
        }
        toolErrors.get(key).push(obs);
      }
    }
  }

  return resolutions;
}

function detectRepeatedWorkflows(observations) {
  const workflows = new Map();

  // Extract sequences of 3+ consecutive tools
  for (let i = 0; i < observations.length - 2; i++) {
    if (observations[i].event !== 'tool_start') continue;

    const sequence = [];
    for (let j = i; j < Math.min(i + 5, observations.length); j++) {
      if (observations[j].event === 'tool_start') {
        sequence.push(observations[j].tool);
      } else if (observations[j].event === 'tool_complete') {
        // Continue collecting
      } else {
        break;
      }
    }

    if (sequence.length >= 2) {
      const key = sequence.join(' → ');
      workflows.set(key, (workflows.get(key) || 0) + 1);
    }
  }

  // Filter to only frequent workflows (3+ occurrences)
  return Array.from(workflows.entries())
    .filter(([_, count]) => count >= 3)
    .map(([workflow, count]) => ({
      type: 'repeated_workflow',
      workflow,
      count
    }));
}

function detectToolPreferences(observations) {
  const toolUsage = new Map();

  for (const obs of observations) {
    if (obs.event === 'tool_start') {
      const tool = obs.tool;
      toolUsage.set(tool, (toolUsage.get(tool) || 0) + 1);
    }
  }

  return Array.from(toolUsage.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tool, count]) => ({
      tool,
      count,
      percentage: ((count / observations.length) * 100).toFixed(1)
    }));
}

function detectFilePatterns(observations) {
  const filePatterns = new Map();

  for (const obs of observations) {
    if (obs.input) {
      const filePath = extractFilePath(obs.input);
      if (filePath) {
        const ext = path.extname(filePath);
        const dir = path.dirname(filePath).split('/').pop() || path.dirname(filePath).split('\\').pop();

        if (ext) {
          filePatterns.set(ext, (filePatterns.get(ext) || 0) + 1);
        }
      }
    }
  }

  return Array.from(filePatterns.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([ext, count]) => ({ ext, count }));
}

function extractFilePath(input) {
  if (typeof input === 'string') {
    const match = input.match(/["']([^"']+\.[a-z]+)["']/i);
    return match ? match[1] : null;
  } else if (input.filePath) {
    return input.filePath;
  }
  return null;
}

function isRelatedInput(obs1, obs2) {
  // Simplified check - in real implementation would be more sophisticated
  return JSON.stringify(obs1.input || '').length > 0;
}

// ==========================================
// Instinct Generation
// ==========================================

function generateInstincts(patterns, config) {
  const instincts = [];
  const minConfidence = config.instincts.min_confidence;

  // Generate from repeated workflows
  for (const pattern of patterns.repeatedWorkflows) {
    if (pattern.count >= 3) {
      const confidence = Math.min(0.3 + (pattern.count * 0.05), 0.9);
      if (confidence >= minConfidence) {
        instincts.push({
          id: `workflow-${pattern.workflow.replace(/[^a-z0-9]/g, '-')}`,
          trigger: `when working with ${pattern.workflow.split(' → ')[0]}`,
          confidence,
          domain: 'workflow',
          source: 'session-observation',
          pattern
        });
      }
    }
  }

  return instincts;
}

function writeInstinct(instinct, instinctsDir) {
  const fileName = `${instinct.id}.md`;
  const filePath = path.join(instinctsDir, fileName);

  const content = `---
id: ${instinct.id}
trigger: "${instinct.trigger}"
confidence: ${instinct.confidence.toFixed(2)}
domain: "${instinct.domain}"
source: "${instinct.source}"
---

# ${toTitleCase(instinct.id.replace(/-/g, ' '))}

## Action
${instinct.pattern ? generateActionFromPattern(instinct.pattern) : 'Generated from session observations'}

## Evidence
- Observed ${instinct.pattern?.count || 0} times in current session
- Source: ${instinct.source}
- Last updated: ${new Date().toISOString().split('T')[0]}
`;

  writeFile(filePath, content);
  log(`Created instinct: ${fileName}`, 'success');
}

function toTitleCase(str) {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

function generateActionFromPattern(pattern) {
  if (pattern.workflow) {
    return `Follow this workflow: ${pattern.workflow}`;
  }
  return 'Follow the detected pattern from observations';
}

// ==========================================
// Main Execution
// ==========================================

function main() {
  console.log('');
  console.log('═════════════════════════════════════════');
  console.log('     Observer Agent - Pattern Analysis');
  console.log('═════════════════════════════════════════');
  console.log('');

  // Ensure directories exist
  ensureDir(HOMUNCULUS_DIR);
  ensureDir(INSTINCTS_DIR);

  // Load configuration
  const config = loadConfig();
  log(`Observer enabled: ${config.observer.enabled}`, 'info');

  if (!config.observer.enabled) {
    log('Observer is disabled in config', 'warning');
    process.exit(0);
  }

  // Load observations
  const observations = loadObservations();
  log(`Loaded ${observations.length} observations`, 'info');

  // Check minimum observations
  const minObs = options.minObservations || config.observer.min_observations_to_analyze;
  if (observations.length < minObs) {
    log(`Insufficient observations (${observations.length} < ${minObs})`, 'warning');
    process.exit(0);
  }

  // Detect patterns
  const patterns = detectPatterns(observations, config);

  log(`Found ${patterns.repeatedWorkflows.length} repeated workflows`, 'info');
  log(`Found ${patterns.toolPreferences.length} tool preferences`, 'info');

  // Generate instincts
  const instincts = generateInstincts(patterns, config);
  log(`Generated ${instincts.length} instinct candidates`, 'info');

  // Write instincts
  for (const instinct of instincts) {
    if (!options.dryRun) {
      writeInstinct(instinct, INSTINCTS_DIR);
    } else {
      log(`[DRY-RUN] Would create: ${instinct.id}.md`, 'debug');
    }
  }

  console.log('');
  console.log('═════════════════════════════════════════');
  console.log(`Analysis complete: ${instincts.length} instincts ${options.dryRun ? '(dry-run)' : 'created'}`);
  console.log('═════════════════════════════════════════');
  console.log('');
}

// Run main function
try {
  main();
  process.exit(0);
} catch (err) {
  console.error('');
  console.error('✗ Error running observer:');
  console.error(err.message);
  if (options.verbose) {
    console.error(err.stack);
  }
  process.exit(1);
}
