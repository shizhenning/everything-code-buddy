#!/usr/bin/env node
/**
 * Stop Hook - Run Observer Agent
 *
 * Automatically runs the Observer Agent at session end
 * to analyze observations and create instincts.
 *
 * Hook config (in settings.json):
 * {
 *   "hooks": {
 *     "Stop": [{
 *       "hooks": [{
 *         "type": "command",
 *         "command": "node .codebuddy/hooks/run-observer-on-stop.js",
 *         "async": true
 *       }]
 *     }]
 *   }
 * }
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ==========================================
// Path Configuration
// ==========================================

const PROJECT_DIR = process.env.CODEBUDDY_PROJECT_DIR || process.cwd();
const HOMUNCULUS_DIR = path.join(PROJECT_DIR, '.codebuddy', 'homunculus');
const OBSERVATIONS_FILE = path.join(HOMUNCULUS_DIR, 'observations.jsonl');
const CONFIG_FILE = path.join(HOMUNCULUS_DIR, 'config.json');
const OBSERVER_SCRIPT = path.join(PROJECT_DIR, 'agents', 'run-observer.js');

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
    observer: {
      enabled: true,
      min_observations_to_analyze: 20
    }
  };
}

// ==========================================
// Observation Count Check
// ==========================================

function getObservationCount() {
  try {
    if (!fs.existsSync(OBSERVATIONS_FILE)) {
      return 0;
    }

    const content = fs.readFileSync(OBSERVATIONS_FILE, 'utf-8');
    return content.trim().split('\n').filter(line => line.trim()).length;
  } catch (err) {
    return 0;
  }
}

// ==========================================
// Main Execution
// ==========================================

function main() {
  // Load config
  const config = loadConfig();

  // Check if observer is enabled
  if (!config.observer?.enabled) {
    process.exit(0);
  }

  // Get minimum observations required
  const minObservations = config.observer.min_observations_to_analyze || 20;

  // Count observations
  const observationCount = getObservationCount();

  // Only run if we have enough observations
  if (observationCount < minObservations) {
    process.exit(0);
  }

  // Check if observer script exists
  if (!fs.existsSync(OBSERVER_SCRIPT)) {
    process.exit(0);
  }

  // Run observer asynchronously (don't block session shutdown)
  const observerProcess = spawn('node', [OBSERVER_SCRIPT], {
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      CODEBUDDY_PROJECT_DIR: PROJECT_DIR
    }
  });

  // Detach from parent so it continues running
  observerProcess.unref();

  // Exit immediately (observer runs in background)
  process.exit(0);
}

// Run main function
try {
  main();
} catch (err) {
  // Silently ignore errors
  process.exit(0);
}
