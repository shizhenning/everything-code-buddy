const fs = require('fs').promises;
const path = require('path');

async function generateOneToManyConsistencyReport(mappingPath, planPath) {
  const report = {
    timestamp: new Date().toISOString(),
    mappingType: 'one-to-many',
    planPath,
    checks: [],
    changes: [],
    summary: {
      totalChanges: 0,
      completedChanges: 0,
      totalSteps: 0,
      completedSteps: 0,
      crossChangeDeps: 0
    }
  };

  try {
    // 1. 读取共享映射表
    const mappingContent = await fs.readFile(mappingPath, 'utf-8');

    // 2. 提取变更信息
    const changeSection = extractTableSection(mappingContent, 'OpenSpec Changes Mapping');
    const changes = parseChangeTable(changeSection);

    report.summary.totalChanges = changes.length;
    report.changes = changes;

    // 3. 检查每个变更
    for (const change of changes) {
      const changePath = path.join(path.dirname(mappingPath), change.path);

      // 3.1 验证工件完整性
      const artifactCheck = await verifyChangeArtifacts(changePath);
      change.artifactCheck = artifactCheck;
      report.checks.push({
        name: `Artifacts (${change.changeId})`,
        status: artifactCheck.valid ? '✅' : '❌',
        detail: `${artifactCheck.present}/${artifactCheck.total} artifacts present`
      });

      // 3.2 统计完成状态
      if (change.status === '✅') {
        report.summary.completedChanges++;
      }

      // 3.3 读取任务并统计
      try {
        const tasksPath = path.join(changePath, 'tasks.md');
        const tasksContent = await fs.readFile(tasksPath, 'utf-8');

        const totalTasks = (tasksContent.match(/^\-\s+\[[ x]\]\s+/gm) || []).length;
        const completedTasks = (tasksContent.match(/^\-\s+\[x\]\s+/gm) || []).length;

        change.tasks = { total: totalTasks, completed: completedTasks };
        report.summary.totalSteps += totalTasks;
        report.summary.completedSteps += completedTasks;
      } catch {
        change.tasks = { total: 0, completed: 0 };
      }
    }

    // 4. 检查跨变更依赖
    const depSection = extractTableSection(mappingContent, 'Cross-Change Dependencies');
    const deps = parseDependencyTable(depSection);
    report.summary.crossChangeDeps = deps.length;

    report.checks.push({
      name: 'Cross-Change Dependencies',
      status: '✅',
      detail: `${deps.length} dependencies defined`
    });

    // 5. 验证依赖完整性
    for (const dep of deps) {
      const sourceChange = findChangeById(changes, dep.sourceChangeId);
      const targetChange = findChangeById(changes, dep.targetChangeId);

      if (!sourceChange || !targetChange) {
        report.checks.push({
          name: `Dependency Check (${dep.source})`,
          status: '⚠️',
          detail: 'Referenced change not found'
        });
      }
    }

  } catch (error) {
    report.checks.push({
      name: 'Error',
      status: '❌',
      detail: error.message
    });
  }

  return report;
}

function extractTableSection(content, tableName) {
  const lines = content.split('\n');
  const startIdx = lines.findIndex(line => line.includes(tableName));

  if (startIdx === -1) return '';

  let endIdx = startIdx + 1;
  while (endIdx < lines.length && lines[endIdx].trim() !== '' && !lines[endIdx].startsWith('##')) {
    endIdx++;
  }

  return lines.slice(startIdx, endIdx).join('\n');
}

function parseChangeTable(tableContent) {
  const changes = [];
  const lines = tableContent.split('\n');

  for (const line of lines) {
    if (!line.startsWith('|') || line.includes('Change ID')) continue;

    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 5) {
      changes.push({
        changeId: parts[1],
        path: parts[2],
        status: parts[3],
        lastSync: parts[4]
      });
    }
  }

  return changes;
}

function parseDependencyTable(tableContent) {
  const deps = [];
  const lines = tableContent.split('\n');

  for (const line of lines) {
    if (!line.startsWith('|') || line.includes('Source')) continue;

    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 4) {
      // 从 "change-id (T5)" 格式提取 changeId
      const sourceMatch = parts[1].match(/^([a-z-]+)/);
      const targetMatch = parts[2].match(/^([a-z-]+)/);

      if (sourceMatch && targetMatch) {
        deps.push({
          source: parts[1],
          target: parts[2],
          type: parts[3],
          status: parts[4],
          sourceChangeId: sourceMatch[1],
          targetChangeId: targetMatch[1]
        });
      }
    }
  }

  return deps;
}

function findChangeById(changes, changeId) {
  return changes.find(c => c.changeId === changeId);
}

async function verifyChangeArtifacts(changePath) {
  const artifacts = ['proposal.md', 'tasks.md', 'specs/', 'design.md'];
  const result = { valid: true, present: 0, total: artifacts.length, missing: [] };

  for (const artifact of artifacts) {
    try {
      await fs.access(path.join(changePath, artifact));
      result.present++;
    } catch {
      result.valid = false;
      result.missing.push(artifact);
    }
  }

  return result;
}

function formatOneToManyReport(report) {
  const lines = [];

  lines.push('# One-to-Many Consistency Report');
  lines.push('');
  lines.push(`**Generated**: ${report.timestamp}`);
  lines.push(`**Plan**: ${report.planPath}`);
  lines.push(`**Mapping Type**: ${report.mappingType}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Changes | ${report.summary.totalChanges} |`);
  lines.push(`| Completed Changes | ${report.summary.completedChanges} (${Math.round(report.summary.completedChanges / report.summary.totalChanges * 100)}%) |`);
  lines.push(`| Total Steps | ${report.summary.totalSteps} |`);
  lines.push(`| Completed Steps | ${report.summary.completedSteps} (${Math.round(report.summary.completedSteps / report.summary.totalSteps * 100)}%) |`);
  lines.push(`| Cross-Change Dependencies | ${report.summary.crossChangeDeps} |`);
  lines.push('');
  lines.push('## Change Details');
  lines.push('');

  for (const change of report.changes) {
    lines.push(`### ${change.changeId}`);
    lines.push('');
    lines.push(`| Field | Value |`);
    lines.push(`|-------|-------|`);
    lines.push(`| Path | ${change.path} |`);
    lines.push(`| Status | ${change.status} |`);
    lines.push(`| Tasks | ${change.tasks.completed}/${change.tasks.total} |`);
    lines.push(`| Last Sync | ${change.lastSync} |`);
    lines.push('');

    if (change.artifactCheck && change.artifactCheck.missing.length > 0) {
      lines.push(`**Missing Artifacts**: ${change.artifactCheck.missing.join(', ')}`);
      lines.push('');
    }
  }

  lines.push('## Checks');
  lines.push('');

  report.checks.forEach(check => {
    lines.push(`- ${check.status} **${check.name}**: ${check.detail}`);
  });

  return lines.join('\n');
}

module.exports = {
  generateOneToManyConsistencyReport,
  formatOneToManyReport
};
