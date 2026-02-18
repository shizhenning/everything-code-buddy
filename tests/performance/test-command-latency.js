#!/usr/bin/env node
/**
 * Command latency benchmark
 * Measures command execution times
 */

const path = require('path');
const fs = require('fs');

const PERFORMANCE_LOG = path.join(__dirname, '..', 'performance-results.json');

function runBenchmark(name, fn) {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  try {
    const result = fn();

    const endTime = Date.now();
    const endMemory = process.memoryUsage();

    return {
      name,
      success: true,
      duration: endTime - startTime,
      memory: {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        rss: endMemory.rss - startMemory.rss
      },
      result
    };
  } catch (error) {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();

    return {
      name,
      success: false,
      duration: endTime - startTime,
      memory: {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        rss: endMemory.rss - startMemory.rss
      },
      error: error.message
    };
  }
}

function main() {
  console.log('\n═══ Command Latency Benchmark ═══\n');

  const results = [];

  // Benchmark 1: Search file operations
  results.push(runBenchmark('Search File Operations', () => {
    const testDir = path.join(__dirname, '..', '..');
    const files = [];
    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          walk(path.join(dir, entry.name));
        } else if (entry.name.endsWith('.js')) {
          files.push(path.join(dir, entry.name));
        }
      }
    };
    walk(testDir);
    return files.length;
  }));

  // Benchmark 2: Read multiple files
  results.push(runBenchmark('Read Multiple Files', () => {
    const testDir = path.join(__dirname, '..', '..', 'commands');
    const files = fs.readdirSync(testDir).filter(f => f.endsWith('.md')).slice(0, 10);
    return files.map(f => fs.readFileSync(path.join(testDir, f), 'utf-8'));
  }));

  // Benchmark 3: String operations (parsing)
  results.push(runBenchmark('String Parsing Operations', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', '..', '.codebuddy', 'plugin.json'), 'utf-8');
    let count = 0;
    for (let i = 0; i < 1000; i++) {
      count += content.length;
    }
    return count;
  }));

  // Benchmark 4: Regular expression matching
  results.push(runBenchmark('Regex Matching', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', '..', '.codebuddy', 'plugin.json'), 'utf-8');
    const matches = content.match(/"[^"]+"/g) || [];
    return matches.length;
  }));

  // Display results
  console.log('Benchmark Results:\n');
  results.forEach(result => {
    const status = result.success ? '✓' : '✗';
    console.log(`${status} ${result.name}`);
    console.log(`  Duration: ${result.duration}ms`);
    console.log(`  Memory: ${(result.memory.heapUsed / 1024 / 1024).toFixed(2)} MB heap`);
    if (!result.success) {
      console.log(`  Error: ${result.error}`);
    }
    console.log('');
  });

  // Calculate averages
  const durations = results.filter(r => r.success).map(r => r.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

  console.log(`Average Duration: ${avgDuration.toFixed(2)}ms\n`);

  // Save results
  const timestamp = new Date().toISOString();
  const resultsWithTimestamp = {
    timestamp,
    type: 'command-latency',
    platform: process.platform,
    nodeVersion: process.version,
    benchmarks: results,
    averageDuration: avgDuration
  };

  let history = [];
  if (fs.existsSync(PERFORMANCE_LOG)) {
    history = JSON.parse(fs.readFileSync(PERFORMANCE_LOG, 'utf-8'));
  }
  history.push(resultsWithTimestamp);

  fs.writeFileSync(PERFORMANCE_LOG, JSON.stringify(history, null, 2));

  console.log(`Results saved to: ${PERFORMANCE_LOG}\n`);
  console.log('═══ Summary ═══');
  const successful = results.filter(r => r.success);
  console.log(`Passed: ${successful.length}/${results.length}`);

  process.exit(successful.length === results.length ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { runBenchmark };
