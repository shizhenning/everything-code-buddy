const fs = require('fs').promises;
const path = require('path');

async function validatePlanLinks(planPath) {
  const results = {
    valid: true,
    mode: null, // 'one-to-one' or 'one-to-many'
    errors: [],
    warnings: [],
    checks: []
  };

  try {
    // 0. 检测映射模式
    const planContent = await fs.readFile(planPath, 'utf-8');
    const openspecRefs = extractAllOpenSpecRefs(planContent);

    if (openspecRefs.length === 0) {
      results.valid = false;
      results.errors.push('No OpenSpec references found');
      return results;
    } else if (openspecRefs.length === 1) {
      results.mode = 'one-to-one';
      return validateOneToOneMapping(planPath, planContent, openspecRefs[0]);
    } else {
      results.mode = 'one-to-many';
      return validateOneToManyMapping(planPath, planContent, openspecRefs);
    }
  } catch (error) {
    results.valid = false;
    results.errors.push(`Validation error: ${error.message}`);
    return results;
  }
}

// 辅助函数: 提取所有 OpenSpec 引用
function extractAllOpenSpecRefs(planContent) {
  const refs = [];

  // 模式 1: 单一引用 - **关联 OpenSpec 变更**: `openspec/changes/<name>/`
  // 使用更严格的模式,避免误匹配
  const singleRefMatch = planContent.match(/^\*\*关联 OpenSpec 变更\*\*:\s*`(openspec\/changes\/[^`]+?)`\s*$/m);
  if (singleRefMatch) {
    refs.push({
      type: 'single',
      path: singleRefMatch[1],
      changeId: singleRefMatch[1].replace(/^openspec\/changes\/|\/$/g, '')
    });
    return refs;
  }

  // 模式 2: 多引用表格 - 从 .plan-to-openspec-mapping.md 中提取
  // 检查是否包含多个 OpenSpec 引用的表格格式
  const tablePattern = /\|\s*Change ID\s*\|\s*OpenSpec Path\s*\|/;
  if (tablePattern.test(planContent)) {
    // 提取表格中的变更信息
    const lines = planContent.split('\n');
    let inTable = false;

    for (const line of lines) {
      // 跳过表头和分隔行
      if (line.includes('Change ID') || line.match(/^\|[\s\-]+\|/)) {
        inTable = true;
        continue;
      }

      // 提取表格行
      if (inTable && line.startsWith('|') && line.endsWith('|')) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 3 && parts[1] && parts[2]) {
          refs.push({
            type: 'multi',
            changeId: parts[1],
            path: parts[2]
          });
        }
      }
    }
  }

  // 模式 3: 多个独立引用 - 检查多个 "**关联 OpenSpec 变更**" 模式
  // 使用更精确的模式,排除表头行
  const multiRefMatches = planContent.matchAll(/^\|\s*Change ID\s*\|\s*OpenSpec Path\s*\|[^\n]*\n((?:^\|\s*[^|\n]+\s*\|\s*openspec\/changes\/[^|\n]+\s*\|[^\n]*\n?)+)/gm);
  for (const match of multiRefMatches) {
    // 提取表格行
    const tableRows = match[1].split('\n').filter(row => row.trim());
    for (const row of tableRows) {
      const pathMatch = row.match(/openspec\/changes\/[^|\s]+/);
      if (pathMatch) {
        const path = pathMatch[0];
        refs.push({
          type: 'multi',
          changeId: path.replace(/^openspec\/changes\/|\/$/g, ''),
          path: path
        });
      }
    }
  }

  return refs;
}

async function validateOneToOneMapping(planPath, planContent, openspecRef) {
  const results = { mode: 'one-to-one', valid: true, errors: [], warnings: [], checks: [] };
  
  try {
    // 1. 验证工件是否存在
    
    // 2. 提取 OpenSpec 引用(使用更精确的模式)
    const openspecRefMatch = planContent.match(/^\*\*关联 OpenSpec 变更\*\*:\s*`(openspec\/changes\/[^`]+?)`\s*$/m);
    if (!openspecRefMatch) {
      results.valid = false;
      results.errors.push('No OpenSpec reference found in plan');
      return results;
    }
    
    const openspecPath = path.join(path.dirname(planPath), openspecRefMatch[1].replace('../', ''));
    results.checks.push({ name: 'Forward Reference', status: '✅', detail: 'OpenSpec reference exists' });
    
    // 3. 验证工件存在性
    const requiredArtifacts = ['proposal.md', 'specs/', 'design.md', 'tasks.md', '.plan-mapping.md'];
    const missingArtifacts = [];
    
    for (const artifact of requiredArtifacts) {
      const artifactPath = path.join(openspecPath, artifact);
      try {
        await fs.access(artifactPath);
        results.checks.push({ name: `Artifact: ${artifact}`, status: '✅', detail: 'File exists' });
      } catch {
        missingArtifacts.push(artifact);
        results.checks.push({ name: `Artifact: ${artifact}`, status: '❌', detail: 'File missing' });
      }
    }
    
    if (missingArtifacts.length > 0) {
      results.valid = false;
      results.errors.push(`Missing artifacts: ${missingArtifacts.join(', ')}`);
    }
    
    // 4. 验证后向引用
    const proposalPath = path.join(openspecPath, 'proposal.md');
    const proposalContent = await fs.readFile(proposalPath, 'utf-8');
    
    const backwardRefMatch = proposalContent.match(/\*\*原始计划\*\*:\s*`([^`]+)`/);
    if (backwardRefMatch) {
      const expectedPlanPath = backwardRefMatch[1];
      if (expectedPlanPath === planPath) {
        results.checks.push({ name: 'Backward Reference', status: '✅', detail: 'Links to correct plan' });
      } else {
        results.warnings.push(`Backward reference mismatch: expected ${planPath}, got ${expectedPlanPath}`);
      }
    } else {
      results.warnings.push('No backward reference found in proposal');
    }
    
    // 5. 验证映射表一致性
    const mappingPath = path.join(openspecPath, '.plan-mapping.md');
    const mappingContent = await fs.readFile(mappingPath, 'utf-8');
    
    // 检查任务映射是否有效
    const taskMappingMatches = mappingContent.match(/\| Step \d+:\s+[^|]+\|\s+T\d+-T\d+\|/g);
    if (taskMappingMatches && taskMappingMatches.length > 0) {
      results.checks.push({ name: 'Task Mapping', status: '✅', detail: `${taskMappingMatches.length} mappings found` });
    } else {
      results.warnings.push('No task mappings found in mapping table');
    }
    
    // 6. 验证链接完整性
    const linkMatches = planContent.match(/\[([^\]]+)\]\(([^)]+)\)/g);
    if (linkMatches && linkMatches.length >= 4) {
      results.checks.push({ name: 'Link Integrity', status: '✅', detail: `${linkMatches.length} links found` });
    } else {
      results.warnings.push('Insufficient links in plan document');
    }
    
  } catch (error) {
    results.valid = false;
    results.errors.push(`Validation error: ${error.message}`);
  }
  
  return results;
}

async function validateOneToManyMapping(planPath, planContent, openspecRefs) {
  const results = {
    mode: 'one-to-many',
    valid: true,
    errors: [],
    warnings: [],
    checks: [],
    changes: []
  };

  results.checks.push({
    name: 'Mapping Mode',
    status: '✅',
    detail: `One-to-Many: ${openspecRefs.length} OpenSpec changes detected`
  });

  // 1. 验证共享映射表是否存在
  const mappingPath = path.join(path.dirname(planPath), '.plan-to-openspec-mapping.md');
  try {
    await fs.access(mappingPath);
    results.checks.push({ name: 'Shared Mapping Table', status: '✅', detail: 'Exists' });
  } catch {
    results.valid = false;
    results.errors.push('Missing shared mapping table: .plan-to-openspec-mapping.md');
    return results;
  }

  // 2. 验证每个 OpenSpec 变更
  for (const ref of openspecRefs) {
    const changeResult = {
      changeId: ref.changeId,
      path: ref.path,
      valid: true,
      errors: [],
      warnings: []
    };

    const changePath = path.join(path.dirname(planPath), ref.path);

    // 2.1 验证工件存在性
    const requiredArtifacts = ['proposal.md', 'tasks.md'];
    const missingArtifacts = [];

    for (const artifact of requiredArtifacts) {
      const artifactPath = path.join(changePath, artifact);
      try {
        await fs.access(artifactPath);
      } catch {
        missingArtifacts.push(artifact);
        changeResult.valid = false;
        changeResult.errors.push(`Missing ${artifact}`);
      }
    }

    if (missingArtifacts.length > 0) {
      results.valid = false;
      results.errors.push(`Change ${ref.changeId}: Missing artifacts - ${missingArtifacts.join(', ')}`);
    } else {
      results.checks.push({ name: `Change ${ref.changeId}`, status: '✅', detail: 'All artifacts present' });
    }

    // 2.2 验证后向引用
    try {
      const proposalPath = path.join(changePath, 'proposal.md');
      const proposalContent = await fs.readFile(proposalPath, 'utf-8');
      if (proposalContent.includes('**原始计划**')) {
        const backwardRefMatch = proposalContent.match(/\*\*原始计划\*\*:\s*`([^`]+)`/);
        if (backwardRefMatch && backwardRefMatch[1] === planPath) {
          results.checks.push({ name: `Backward Ref (${ref.changeId})`, status: '✅', detail: 'Correct' });
        } else if (backwardRefMatch) {
          changeResult.warnings.push(`Backward reference mismatch: ${backwardRefMatch[1]}`);
        } else {
          changeResult.warnings.push('Original plan referenced but format unclear');
        }
      } else {
        changeResult.warnings.push('No backward reference in proposal');
      }
    } catch (error) {
      changeResult.errors.push(`Failed to verify backward reference: ${error.message}`);
    }

    results.changes.push(changeResult);
  }

  // 3. 验证步骤到变更的映射
  try {
    const mappingContent = await fs.readFile(mappingPath, 'utf-8');
    const stepMappingMatches = mappingContent.matchAll(/\|\s*\d+\s*\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*T\d+-T\d+\s*\|/g);
    const stepMappings = Array.from(stepMappingMatches);

    if (stepMappings.length > 0) {
      results.checks.push({
        name: 'Step to Change Mapping',
        status: '✅',
        detail: `${stepMappings.length} steps mapped to changes`
      });
    } else {
      results.warnings.push('No step mappings found in shared mapping table');
    }
  } catch (error) {
    results.warnings.push(`Failed to verify step mappings: ${error.message}`);
  }

  // 4. 验证跨变更依赖(如果有)
  try {
    const mappingContent = await fs.readFile(mappingPath, 'utf-8');
    if (mappingContent.includes('Cross-Change Dependencies')) {
      const depMatches = mappingContent.matchAll(/\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*✅\s*\|/g);
      const depCount = Array.from(depMatches).length;

      results.checks.push({
        name: 'Cross-Change Dependencies',
        status: '✅',
        detail: `${depCount} dependencies defined`
      });
    }
  } catch (error) {
    results.warnings.push(`Failed to verify cross-change dependencies: ${error.message}`);
  }

  return results;
}

// CLI 接口
if (require.main === module) {
  const planPath = process.argv[2];
  if (!planPath) {
    console.error('Usage: node validate-plan-links.js <plan-path>');
    process.exit(1);
  }
  
  validatePlanLinks(planPath)
    .then(results => {
      console.log('\n📋 Plan Link Validation Results');
      console.log('═'.repeat(50));
      
      results.checks.forEach(check => {
        console.log(`${check.status} ${check.name}: ${check.detail}`);
      });
      
      if (results.errors.length > 0) {
        console.log('\n❌ Errors:');
        results.errors.forEach(err => console.log(`  - ${err}`));
      }
      
      if (results.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        results.warnings.forEach(warn => console.log(`  - ${warn}`));
      }
      
      console.log('\n' + '═'.repeat(50));
      if (results.valid) {
        console.log('✅ All checks passed!');
        process.exit(0);
      } else {
        console.log('❌ Validation failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { validatePlanLinks };
