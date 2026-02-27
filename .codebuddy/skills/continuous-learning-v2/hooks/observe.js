const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const configDir = path.join(os.homedir(), '.codebuddy', 'homunculus');
const observationsFile = path.join(configDir, 'observations.jsonl');
const maxFileSizeMB = 10;

// Ensure directory exists
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Skip if disabled
const disabledFile = path.join(configDir, 'disabled');
if (fs.existsSync(disabledFile)) {
  process.exit(0);
}

// Read JSON from stdin
let inputData = '';
process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    // Exit if no input
    if (!inputData.trim()) {
      process.exit(0);
    }

    const data = JSON.parse(inputData);

    // Extract fields - Claude Code hook format
    const hookEvent = data.hook_event_name || data.hook_type || 'unknown';
    const toolName = data.tool_name || data.tool || 'unknown';
    const toolInput = data.tool_input || data.input || {};
    const toolResponse = data.tool_response || data.tool_output || data.output || '';
    const sessionId = data.session_id || 'unknown';

    // Truncate large inputs/outputs
    let inputStr = typeof toolInput === 'object'
      ? JSON.stringify(toolInput).slice(0, 5000)
      : String(toolInput).slice(0, 5000);

    let outputStr = typeof toolResponse === 'object'
      ? JSON.stringify(toolResponse).slice(0, 5000)
      : String(toolResponse).slice(0, 5000);

    // Determine event type
    const event = hookEvent.includes('Pre') ? 'tool_start' : 'tool_complete';

    // Archive if file too large
    if (fs.existsSync(observationsFile)) {
      const stats = fs.statSync(observationsFile);
      const fileSizeMB = stats.size / (1024 * 1024);
      if (fileSizeMB >= maxFileSizeMB) {
        const archiveDir = path.join(configDir, 'observations.archive');
        if (!fs.existsSync(archiveDir)) {
          fs.mkdirSync(archiveDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const archiveFile = path.join(archiveDir, `observations-${timestamp}.jsonl`);
        fs.renameSync(observationsFile, archiveFile);
      }
    }

    // Build and write observation
    const observation = {
      timestamp: new Date().toISOString(),
      event: event,
      tool: toolName,
      session: sessionId
    };

    if (event === 'tool_start') {
      observation.input = inputStr;
    } else {
      observation.output = outputStr;
    }

    const observationLine = JSON.stringify(observation) + '\n';
    fs.appendFileSync(observationsFile, observationLine);

    // Signal observer if running (skip on Windows - no signals)
    // observerPidFile is not used on Windows

  } catch (error) {
    // Fallback: log raw input for debugging
    const timestamp = new Date().toISOString();
    const errorLog = {
      timestamp: timestamp,
      event: 'parse_error',
      raw: inputData.slice(0, 2000),
      error: error.message
    };
    const errorLine = JSON.stringify(errorLog) + '\n';
    fs.appendFileSync(observationsFile, errorLine);
  }

  process.exit(0);
});
