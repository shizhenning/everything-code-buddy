#!/usr/bin/env node
/**
 * Startup performance benchmark
 * Measures startup times and resource usage
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
  console.log('\n═══ Startup Performance Benchmark ═══\n');

  const results = [];

  // Benchmark 1: File reads (simulating plugin loading)
  results.push(runBenchmark('Read Plugin JSON', () => {
    const pluginPath = path.join(__dirname, '..', '..', '.codebuddy', 'plugin.json');
    return JSON.parse(fs.readFileSync(pluginPath, 'utf-8'));
  }));

  // Benchmark 2: Parse agent files
  results.push(runBenchmark('Read All Agents', () => {
    const agentsDir = path.join(__dirname, '..', '..', 'agents');
    const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
    return files.map(f => fs.readFileSync(path.join(agentsDir, f), 'utf-8'));
  }));

  // Benchmark 3: Parse command files
  results.push(runBenchmark('Read All Commands', () => {
    const commandsDir = path.join(__dirname, '..', '..', 'commands');
    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));
    return files.map(f => fs.readFileSync(path.join(commandsDir, f), 'utf-8'));
  }));

  // Benchmark 4: Path resolution
  results.push(runBenchmark('Path Resolution', () => {
    const paths = [];
    for (let i = 0; i < 100; i++) {
      paths.push(path.join('a', 'b', 'c', `${i}.txt`));
    }
    return paths;
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

  // Save results
  const timestamp = new Date().toISOString();
  const resultsWithTimestamp = {
    timestamp,
    platform: process.platform,
    nodeVersion: process.version,
    benchmarks: results
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
