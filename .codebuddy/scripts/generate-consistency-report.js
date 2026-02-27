const fs = require('fs').promises;
const path = require('path');

async function generateConsistencyReport(openspecPath) {
  const report = {
    timestamp: new Date().toISOString(),
    openspecPath,
    checks: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    }
  };

  try {
    // 检查 1: 映射表存在性
    const mappingPath = path.join(openspecPath, '.plan-mapping.md');
    try {
      await fs.access(mappingPath);
      report.checks.push({ name: 'Mapping Table', status: '✅', detail: 'Exists and accessible' });
      report.summary.total++;
      report.summary.passed++;
    } catch {
      report.checks.push({ name: 'Mapping Table', status: '❌', detail: 'Missing' });
      report.summary.total++;
      report.summary.failed++;
    }

    // 检查 2: 后向引用完整性
    const proposalPath = path.join(openspecPath, 'proposal.md');
    const proposalContent = await fs.readFile(proposalPath, 'utf-8');
    if (proposalContent.includes('**原始计划**')) {
      report.checks.push({ name: 'Backward Reference', status: '✅', detail: 'Original plan referenced' });
      report.summary.total++;
      report.summary.passed++;
    } else {
      report.checks.push({ name: 'Backward Reference', status: '❌', detail: 'No reference found' });
      report.summary.total++;
      report.summary.failed++;
    }

    // 检查 3: 任务映射完整性
    const tasksPath = path.join(openspecPath, 'tasks.md');
    const tasksContent = await fs.readFile(tasksPath, 'utf-8');
    const taskCount = (tasksContent.match(/^\-\s+\[[ x]\]\s+\*\*[T]\d+:/gm) || []).length;
    
    if (taskCount > 0) {
      report.checks.push({ name: 'Task Mapping', status: '✅', detail: `${taskCount} tasks mapped` });
      report.summary.total++;
      report.summary.passed++;
    } else {
      report.checks.push({ name: 'Task Mapping', status: '❌', detail: 'No tasks found' });
      report.summary.total++;
      report.summary.failed++;
    }

    // 检查 4: 需求覆盖率 (注意: specs 在全局目录)
    // 修正路径错误:使用项目根目录的全局规格目录
    const globalSpecsDir = path.join(process.cwd(), 'openspec/specs');
    let specCount = 0;
    try {
      const specDirs = await fs.readdir(globalSpecsDir);
      const changeName = path.basename(openspecPath);
      // 查找与变更相关的 spec 目录
      for (const dir of specDirs) {
        if (dir.includes(changeName) || changeName.includes(dir)) {
          const stat = await fs.stat(path.join(globalSpecsDir, dir));
          if (stat.isDirectory()) {
            specCount++;
          }
        }
      }
    } catch {
      // specs 目录可能不存在
    }
    
    if (specCount > 0) {
      report.checks.push({ name: 'Requirement Coverage', status: '✅', detail: `${specCount} related specs found in global specs/` });
      report.summary.total++;
      report.summary.passed++;
    } else {
      report.checks.push({ name: 'Requirement Coverage', status: '⚠️', detail: 'No related specs found (specs managed in openspec/specs/)' });
      report.summary.total++;
      report.summary.warnings++;
    }

    // 检查 5: 链接同步状态
    const mappingContent = await fs.readFile(mappingPath, 'utf-8');
    const lastSyncMatch = mappingContent.match(/\| Last Sync \| ([^|]+) \|/);
    if (lastSyncMatch) {
      const lastSyncDate = new Date(lastSyncMatch[1].trim());
      const daysSinceSync = Math.floor((new Date() - lastSyncDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceSync <= 7) {
        report.checks.push({ name: 'Link Sync', status: '✅', detail: `Last sync: ${daysSinceSync} days ago` });
        report.summary.total++;
        report.summary.passed++;
      } else {
        report.checks.push({ name: 'Link Sync', status: '⚠️', detail: `Last sync: ${daysSinceSync} days ago (stale)` });
        report.summary.total++;
        report.summary.warnings++;
      }
    } else {
      report.checks.push({ name: 'Link Sync', status: '⚠️', detail: 'No sync timestamp found' });
      report.summary.total++;
      report.summary.warnings++;
    }

  } catch (error) {
    report.checks.push({ name: 'Error', status: '❌', detail: error.message });
    report.summary.total++;
    report.summary.failed++;
  }

  return report;
}

function formatReport(report) {
  const lines = [];
  
  lines.push('# Consistency Report');
  lines.push('');
  lines.push(`**Generated**: ${report.timestamp}`);
  lines.push(`**Path**: ${report.openspecPath}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Checks | ${report.summary.total} |`);
  lines.push(`| Passed | ${report.summary.passed} |`);
  lines.push(`| Failed | ${report.summary.failed} |`);
  lines.push(`| Warnings | ${report.summary.warnings} |`);
  lines.push('');
  lines.push('## Checks');
  lines.push('');
  
  report.checks.forEach(check => {
    lines.push(`- ${check.status} **${check.name}**: ${check.detail}`);
  });
  
  return lines.join('\n');
}

// CLI 接口 - 支持一对一和一对多模式
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // 检查是否是一对多模式
  const oneToManyIndex = args.indexOf('--one-to-many');
  if (oneToManyIndex !== -1) {
    // 一对多模式: node generate-consistency-report.js --one-to-many <mapping-file> <plan-file>
    const mappingPath = args[oneToManyIndex + 1];
    const planPath = args[oneToManyIndex + 2];
    
    if (!mappingPath || !planPath) {
      console.error('Usage: node generate-consistency-report.js --one-to-many <mapping-file> <plan-file>');
      process.exit(1);
    }
    
    // 动态导入一对多报告生成函数(避免循环依赖)
    const { generateOneToManyConsistencyReport, formatOneToManyReport } = require('./generate-consistency-report-onetomany');
    
    generateOneToManyConsistencyReport(mappingPath, planPath)
      .then(report => {
        const formatted = formatOneToManyReport(report);
        console.log(formatted);
        
        // 保存报告到映射表所在目录
        const reportDir = path.dirname(mappingPath);
        const reportPath = path.join(reportDir, '.consistency-report.md');
        return fs.writeFile(reportPath, formatted).then(() => reportPath);
      })
      .then((reportPath) => {
        console.log(`\n✅ Report saved to ${reportPath}`);
        process.exit(0);
      })
      .catch(error => {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
      });
  } else {
    // 一对一模式: node generate-consistency-report.js <openspec-path>
    const openspecPath = args[0];
    if (!openspecPath) {
      console.error('Usage: node generate-consistency-report.js <openspec-path>');
      console.error('   or: node generate-consistency-report.js --one-to-many <mapping-file> <plan-file>');
      process.exit(1);
    }
    
    generateConsistencyReport(openspecPath)
      .then(report => {
        const formatted = formatReport(report);
        console.log(formatted);
        
        // 保存报告
        const reportPath = path.join(openspecPath, '.consistency-report.md');
        return fs.writeFile(reportPath, formatted).then(() => reportPath);
      })
      .then((reportPath) => {
        console.log(`\n✅ Report saved to ${reportPath}`);
        process.exit(0);
      })
      .catch(error => {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
      });
  }
}

module.exports = { generateConsistencyReport };
