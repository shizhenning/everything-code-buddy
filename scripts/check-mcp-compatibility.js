#!/usr/bin/env node
/**
 * Check MCP compatibility and provide alternatives
 * Analyzes MCP servers and suggests CodeBuddy native alternatives
 */

const fs = require('fs');
const path = require('path');

const MCP_CONFIG = path.join(__dirname, '..', 'mcp-configs', 'mcp-servers.json');
const ALTERNATIVES = {
  'github': {
    name: 'GitHub',
    native: false,
    alternative: 'GitHub CLI (gh) or GitHub Agent',
    priority: 'high'
  },
  'filesystem': {
    name: 'Filesystem',
    native: true,
    alternative: 'Read/Write/Grep/Glob tools (native)',
    priority: 'high'
  },
  'supabase': {
    name: 'Supabase',
    native: false,
    alternative: 'Database operations via API',
    priority: 'medium'
  },
  'memory': {
    name: 'Memory',
    native: true,
    alternative: 'update_memory tool (native)',
    priority: 'medium'
  },
  'sequential-thinking': {
    name: 'Sequential Thinking',
    native: false,
    alternative: 'Chain-of-thought prompting',
    priority: 'low'
  },
  'vercel': {
    name: 'Vercel',
    native: false,
    alternative: 'Manual Vercel CLI',
    priority: 'low'
  },
  'railway': {
    name: 'Railway',
    native: false,
    alternative: 'Manual Railway CLI',
    priority: 'low'
  },
  'cloudflare-docs': {
    name: 'Cloudflare Docs',
    native: false,
    alternative: 'WebFetch tool',
    priority: 'low'
  },
  'cloudflare-workers-builds': {
    name: 'Cloudflare Workers Builds',
    native: false,
    alternative: 'Manual Wrangler CLI',
    priority: 'low'
  },
  'cloudflare-workers-bindings': {
    name: 'Cloudflare Workers Bindings',
    native: false,
    alternative: 'Manual Wrangler CLI',
    priority: 'low'
  },
  'cloudflare-observability': {
    name: 'Cloudflare Observability',
    native: false,
    alternative: 'Manual Wrangler CLI',
    priority: 'low'
  },
  'clickhouse': {
    name: 'ClickHouse',
    native: false,
    alternative: 'Database Reviewer Agent + SQL queries',
    priority: 'low'
  },
  'context7': {
    name: 'Context7',
    native: false,
    alternative: 'RAG_search tool',
    priority: 'low'
  },
  'magic': {
    name: 'Magic UI',
    native: false,
    alternative: 'UI Component library skills',
    priority: 'low'
  },
  'firecrawl': {
    name: 'Firecrawl',
    native: false,
    alternative: 'WebFetch tool',
    priority: 'medium'
  }
};

function main() {
  console.log('\n═══ MCP Compatibility Check ═══\n');

  if (!fs.existsSync(MCP_CONFIG)) {
    console.log('✗ MCP config file not found');
    return;
  }

  const mcpConfig = JSON.parse(fs.readFileSync(MCP_CONFIG, 'utf-8'));
  const servers = mcpConfig.mcpServers || {};

  console.log(`Found ${Object.keys(servers).length} MCP servers\n`);

  let highPriority = 0;
  let mediumPriority = 0;
  let lowPriority = 0;

  // Group by priority
  const byPriority = {
    high: [],
    medium: [],
    low: []
  };

  for (const [name, config] of Object.entries(servers)) {
    // Get info by server name (not package)
    const info = ALTERNATIVES[name] || {
      name: name,
      native: false,
      alternative: 'No native alternative',
      priority: 'low'
    };

    byPriority[info.priority].push({
      name,
      ...info
    });
  }

  // Display results
  console.log('🔴 High Priority (Essential)');
  console.log('─'.repeat(60));
  highPriority = byPriority.high.length;
  for (const server of byPriority.high) {
    const status = server.native ? '✅' : '⚠️';
    console.log(`${status} ${server.name}`);
    console.log(`   Alternative: ${server.alternative}`);
    console.log('');
  }

  console.log('\n🟡 Medium Priority (Useful)');
  console.log('─'.repeat(60));
  mediumPriority = byPriority.medium.length;
  for (const server of byPriority.medium) {
    const status = server.native ? '✅' : '⚠️';
    console.log(`${status} ${server.name}`);
    console.log(`   Alternative: ${server.alternative}`);
    console.log('');
  }

  console.log('\n🟢 Low Priority (Optional)');
  console.log('─'.repeat(60));
  lowPriority = byPriority.low.length;
  for (const server of byPriority.low) {
    const status = server.native ? '✅' : '⚠️';
    console.log(`${status} ${server.name}`);
    console.log(`   Alternative: ${server.alternative}`);
    console.log('');
  }

  // Summary
  console.log('\n═══ Summary ═══');
  console.log(`Total Servers: ${Object.keys(servers).length}`);
  console.log(`High Priority: ${highPriority} (recommended to keep)`);
  console.log(`Medium Priority: ${mediumPriority} (use if needed)`);
  console.log(`Low Priority: ${lowPriority} (optional)`);
  console.log('');

  // Recommendation
  console.log('═══ Recommendation ═══');
  console.log(`
Enable only high priority MCP servers for best performance:
${byPriority.high.map(s => `  - ${s.name}`).join('\n')}

For medium/low priority, consider:
${byPriority.medium.map(s => `  - ${s.name}: ${s.alternative}`).join('\n')}
${byPriority.low.map(s => `  - ${s.name}: ${s.alternative}`).join('\n')}

Keep total enabled MCPs under 10 to preserve context window.
  `);
}

if (require.main === module) {
  main();
}

module.exports = { main };
