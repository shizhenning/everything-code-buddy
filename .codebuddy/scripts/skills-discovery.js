#!/usr/bin/env node
/**
 * Skills and Rules Discovery Utility
 * 
 * This utility scans available Skills and Rules and provides
 * structured information for agents to use when making recommendations.
 * 
 * Usage:
 *   node skills-discovery.js [--format json|markdown|table]
 *   node skills-discovery.js --search <keyword>
 *   node skills-discovery.js --list skills|rules
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const CODEBUDDY_DIR = '.codebuddy';
const SKILLS_DIR = path.join(CODEBUDDY_DIR, 'skills');
const RULES_DIR = path.join(CODEBUDDY_DIR, 'rules');

/**
 * Parse SKILL.md frontmatter
 */
function parseSkillMetadata(skillPath) {
  try {
    const content = fs.readFileSync(skillPath, 'utf-8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (!match) return null;
    
    const frontmatter = match[1];
    const metadata = {};
    
    // Parse YAML-like frontmatter
    frontmatter.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        metadata[key] = value;
      }
    });
    
    return {
      name: metadata.name || path.basename(path.dirname(skillPath)),
      description: metadata.description || 'No description',
      path: skillPath,
      relativePath: path.relative(process.cwd(), skillPath)
    };
  } catch (error) {
    return null;
  }
}

/**
 * Discover all Skills
 */
function discoverSkills() {
  const skillPattern = path.join(SKILLS_DIR, '*/SKILL.md');
  const skillFiles = glob.sync(skillPattern);
  
  return skillFiles
    .map(parseSkillMetadata)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Discover all Rules
 */
function discoverRules() {
  const rulePattern = path.join(RULES_DIR, '**/*.md');
  const ruleFiles = glob.sync(rulePattern);
  
  return ruleFiles
    .map(rulePath => {
      const relativePath = path.relative(process.cwd(), rulePath);
      const category = relativePath.split(path.sep)[2]; // common/python/golang/typescript
      const name = path.basename(rulePath, '.md');
      
      return {
        name: name,
        category: category,
        path: rulePath,
        relativePath: relativePath,
        description: inferRuleDescription(name, category)
      };
    })
    .filter(rule => !rule.name.startsWith('.'))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

/**
 * Infer rule description from name and category
 */
function inferRuleDescription(name, category) {
  const descriptions = {
    'coding-style': 'Coding style and conventions',
    'testing': 'Testing standards and requirements',
    'security': 'Security requirements and best practices',
    'performance': 'Performance guidelines',
    'patterns': 'Design patterns and architecture',
    'hooks': 'Automated hooks configuration',
    'git-workflow': 'Git workflow and commit conventions'
  };
  
  if (descriptions[name]) return descriptions[name];
  return `${category} - ${name}`;
}

/**
 * Search resources by keyword
 */
function searchResources(keyword, type = 'all') {
  const results = {
    skills: [],
    rules: []
  };
  
  const lowerKeyword = keyword.toLowerCase();
  
  if (type === 'all' || type === 'skills') {
    results.skills = discoverSkills().filter(skill =>
      skill.name.toLowerCase().includes(lowerKeyword) ||
      skill.description.toLowerCase().includes(lowerKeyword)
    );
  }
  
  if (type === 'all' || type === 'rules') {
    results.rules = discoverRules().filter(rule =>
      rule.name.toLowerCase().includes(lowerKeyword) ||
      rule.description.toLowerCase().includes(lowerKeyword) ||
      rule.category.toLowerCase().includes(lowerKeyword)
    );
  }
  
  return results;
}

/**
 * Map technology to relevant skills/rules
 */
function mapTechnologyToResources(technology) {
  const technologyMap = {
    // Languages
    'typescript': ['coding-standards', 'frontend-patterns'],
    'javascript': ['coding-standards', 'frontend-patterns'],
    'ts': ['coding-standards', 'frontend-patterns'],
    'js': ['coding-standards', 'frontend-patterns'],
    'python': ['python-patterns', 'python-testing', 'django-patterns', 'django-security'],
    'go': ['golang-patterns', 'golang-testing'],
    'golang': ['golang-patterns', 'golang-testing'],
    'java': ['java-coding-standards', 'springboot-patterns', 'jpa-patterns'],
    'c++': ['cpp-coding-standards', 'cpp-testing'],
    'cpp': ['cpp-coding-standards', 'cpp-testing'],
    'rust': [], // Missing
    'swift': ['swift-actor-persistence', 'swift-protocol-di-testing'],
    'c#': [], // Missing
    'csharp': [], // Missing
    
    // Frontend Frameworks
    'react': ['coding-standards', 'frontend-patterns'],
    'vue': [], // Missing
    'angular': [], // Missing
    'svelte': [], // Missing,
    'next.js': ['frontend-patterns'],
    'nuxt.js': [], // Missing
    
    // Backend Frameworks
    'express': ['coding-standards', 'backend-patterns'],
    'fastapi': [], // Missing
    'django': ['django-patterns', 'django-security', 'django-tdd', 'django-verification'],
    'flask': [], // Missing
    'rails': [], // Missing
    'spring': ['springboot-patterns', 'springboot-security', 'springboot-tdd'],
    'spring boot': ['springboot-patterns', 'springboot-security', 'springboot-tdd'],
    'asp.net': [], // Missing
    
    // Databases
    'postgresql': ['postgres-patterns'],
    'postgres': ['postgres-patterns'],
    'mysql': [], // Missing
    'mongodb': [], // Missing
    'redis': [], // Missing
    'sqlite': [], // Missing,
    'oracle': [], // Missing
    
    // Domains
    'api': ['api-design', 'backend-patterns'],
    'rest': ['api-design'],
    'graphql': [], // Missing
    'security': ['security-review', 'security-scan'],
    'auth': ['security-review'],
    'authentication': ['security-review'],
    'testing': ['tdd-workflow', 'e2e-testing'],
    'test': ['tdd-workflow', 'e2e-testing'],
    'deployment': ['deployment-patterns', 'docker-patterns'],
    'docker': ['docker-patterns'],
    'kubernetes': [], // Missing
    'ci/cd': ['deployment-patterns']
  };
  
  const normalizedTech = technology.toLowerCase().trim();
  const skillNames = technologyMap[normalizedTech] || [];
  
  const allSkills = discoverSkills();
  const allRules = discoverRules();
  
  return {
    skills: allSkills.filter(skill => skillNames.includes(skill.name)),
    rules: allRules.filter(rule => 
      rule.category === 'common' || 
      rule.category === normalizedTech.replace(' ', '') ||
      normalizedTech.includes(rule.category)
    ),
    missing: skillNames.filter(name => !allSkills.find(s => s.name === name))
  };
}

/**
 * Format output
 */
function formatOutput(data, format = 'markdown') {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    
    case 'table':
      return formatAsTable(data);
    
    case 'markdown':
    default:
      return formatAsMarkdown(data);
  }
}

function formatAsMarkdown(data) {
  let output = '';
  
  if (data.skills && data.skills.length > 0) {
    output += '## Skills\n\n';
    data.skills.forEach(skill => {
      output += `- **${skill.name}**\n`;
      output += `  - Description: ${skill.description}\n`;
      output += `  - Path: \`${skill.relativePath}\`\n\n`;
    });
  }
  
  if (data.rules && data.rules.length > 0) {
    output += '## Rules\n\n';
    data.rules.forEach(rule => {
      output += `- **${rule.name}** (${rule.category})\n`;
      output += `  - Description: ${rule.description}\n`;
      output += `  - Path: \`${rule.relativePath}\`\n\n`;
    });
  }
  
  if (data.missing && data.missing.length > 0) {
    output += '## Missing Skills\n\n';
    data.missing.forEach(name => {
      output += `- \`${name}\` - Not available\n\n`;
    });
  }
  
  return output || 'No resources found.';
}

function formatAsTable(data) {
  let output = '';
  
  if (data.skills && data.skills.length > 0) {
    output += '### Skills\n\n';
    output += '| Name | Description | Path |\n';
    output += '|------|-------------|------|\n';
    data.skills.forEach(skill => {
      output += `| ${skill.name} | ${skill.description} | \`${skill.relativePath}\` |\n`;
    });
    output += '\n';
  }
  
  if (data.rules && data.rules.length > 0) {
    output += '### Rules\n\n';
    output += | Name | Category | Description | Path |\n`;
    output += '|------|----------|-------------|------|\n';
    data.rules.forEach(rule => {
      output += `| ${rule.name} | ${rule.category} | ${rule.description} | \`${rule.relativePath}\` |\n`;
    });
    output += '\n';
  }
  
  return output || 'No resources found.';
}

/**
 * CLI
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === '--help' || command === '-h') {
    console.log(`
Skills and Rules Discovery Utility

Usage:
  node skills-discovery.js [command] [options]

Commands:
  (no args)          List all Skills and Rules
  --list skills      List all Skills only
  --list rules       List all Rules only
  --search <keyword> Search for Skills/Rules by keyword
  --map <tech>        Map technology to relevant resources
  --format <format>  Output format (json|markdown|table)

Examples:
  node skills-discovery.js
  node skills-discovery.js --list skills
  node skills-discovery.js --search "python"
  node skills-discovery.js --map "react"
  node skills-discovery.js --format json
`);
    process.exit(0);
  }
  
  let data = {};
  let format = 'markdown';
  
  // Parse format
  const formatIndex = args.indexOf('--format');
  if (formatIndex > -1 && args[formatIndex + 1]) {
    format = args[formatIndex + 1];
  }
  
  // Execute command
  switch (command) {
    case '--list':
      const type = args[1];
      if (type === 'skills') {
        data.skills = discoverSkills();
      } else if (type === 'rules') {
        data.rules = discoverRules();
      } else {
        data = { skills: discoverSkills(), rules: discoverRules() };
      }
      break;
    
    case '--search':
      const keyword = args[1];
      if (!keyword) {
        console.error('Error: --search requires a keyword');
        process.exit(1);
      }
      data = searchResources(keyword);
      break;
    
    case '--map':
      const tech = args[1];
      if (!tech) {
        console.error('Error: --map requires a technology name');
        process.exit(1);
      }
      data = mapTechnologyToResources(tech);
      break;
    
    default:
      // List all by default
      data = { skills: discoverSkills(), rules: discoverRules() };
  }
  
  console.log(formatOutput(data, format));
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for use as module
module.exports = {
  discoverSkills,
  discoverRules,
  searchResources,
  mapTechnologyToResources,
  parseSkillMetadata
};
