/**
 * OpenSpec Artifact Finder - 三种查找方法实现
 * 
 * 提供三种查找OpenSpec工件的方法:
 * 1. 链接查找 (Link-based)
 * 2. 名称查找 (Name-based)
 * 3. 映射表查找 (Mapping table-based)
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * 方法1: 链接查找 - 从计划文件中的OpenSpec引用查找
 * @param {string} planPath - 计划文件路径
 * @returns {Promise<Object>} OpenSpec变更路径和元数据
 */
async function findByLink(planPath) {
  try {
    const planContent = await fs.readFile(planPath, 'utf-8');
    
    // 提取前向引用: **关联 OpenSpec 变更**: `openspec/changes/<name>/`
    const refMatch = planContent.match(/^\*\*关联 OpenSpec 变更\*\*:\s*`(openspec\/changes\/[^`]+?)`\s*$/m);
    
    if (!refMatch) {
      return { found: false, method: 'link', error: 'No OpenSpec reference found in plan' };
    }
    
    const relativePath = refMatch[1];
    const openspecPath = path.resolve(path.dirname(planPath), relativePath);
    
    // 验证路径存在
    try {
      await fs.access(openspecPath);
      return {
        found: true,
        method: 'link',
        path: openspecPath,
        relativePath,
        changeName: relativePath.replace(/^openspec\/changes\/|\/$/g, '')
      };
    } catch {
      return { found: false, method: 'link', error: `OpenSpec path not found: ${openspecPath}` };
    }
  } catch (error) {
    return { found: false, method: 'link', error: error.message };
  }
}

/**
 * 方法2: 名称查找 - 通过变更名称在openspec/changes目录中查找
 * @param {string} changeName - 变更名称
 * @param {string} basePath - 项目根目录路径 (默认: process.cwd())
 * @returns {Promise<Object>} OpenSpec变更路径和元数据
 */
async function findByName(changeName, basePath = process.cwd()) {
  try {
    const openspecDir = path.join(basePath, 'openspec', 'changes');
    
    // 检查目录是否存在
    try {
      await fs.access(openspecDir);
    } catch {
      return { found: false, method: 'name', error: `openspec/changes directory not found at ${openspecDir}` };
    }
    
    // 列出所有子目录
    const entries = await fs.readdir(openspecDir, { withFileTypes: true });
    const directories = entries.filter(entry => entry.isDirectory());
    
    // 尝试精确匹配
    const exactMatch = directories.find(dir => dir.name === changeName);
    if (exactMatch) {
      const openspecPath = path.join(openspecDir, exactMatch.name);
      return {
        found: true,
        method: 'name',
        path: openspecPath,
        relativePath: `openspec/changes/${exactMatch.name}/`,
        changeName: exactMatch.name
      };
    }
    
    // 尝试模糊匹配 (包含changeName或被changeName包含)
    const fuzzyMatches = directories.filter(dir => 
      dir.name.includes(changeName) || changeName.includes(dir.name)
    );
    
    if (fuzzyMatches.length === 1) {
      const openspecPath = path.join(openspecDir, fuzzyMatches[0].name);
      return {
        found: true,
        method: 'name',
        path: openspecPath,
        relativePath: `openspec/changes/${fuzzyMatches[0].name}/`,
        changeName: fuzzyMatches[0].name,
        note: `Fuzzy match: "${fuzzyMatches[0].name}" matches "${changeName}"`
      };
    } else if (fuzzyMatches.length > 1) {
      return {
        found: false,
        method: 'name',
        error: `Multiple matches found: ${fuzzyMatches.map(d => d.name).join(', ')}`,
        suggestions: fuzzyMatches.map(d => d.name)
      };
    }
    
    return { 
      found: false, 
      method: 'name', 
      error: `No OpenSpec change found with name: ${changeName}`,
      availableChanges: directories.map(d => d.name)
    };
  } catch (error) {
    return { found: false, method: 'name', error: error.message };
  }
}

/**
 * 方法3: 映射表查找 - 从.plan-mapping.md中查找
 * @param {string} planPath - 计划文件路径
 * @returns {Promise<Object>} OpenSpec变更路径和元数据
 */
async function findByMappingTable(planPath) {
  try {
    const planDir = path.dirname(planPath);
    
    // 1. 检查一对一映射表: .plan-mapping.md
    const oneToOneMappingPath = path.join(planDir, '.plan-mapping.md');
    try {
      await fs.access(oneToOneMappingPath);
      // 在一对一模式中,映射表在openspec目录中
      const mappingContent = await fs.readFile(oneToOneMappingPath, 'utf-8');
      
      // 从映射表提取变更路径 (如果包含完整路径)
      const pathMatch = mappingContent.match(/openspec\/changes\/[^|\s]+/);
      if (pathMatch) {
        const changePath = pathMatch[0];
        const openspecPath = path.resolve(planDir, changePath);
        
        try {
          await fs.access(openspecPath);
          return {
            found: true,
            method: 'mapping',
            path: openspecPath,
            relativePath: changePath,
            changeName: changePath.replace(/^openspec\/changes\/|\/$/g, ''),
            mappingType: 'one-to-one'
          };
        } catch {
          return { found: false, method: 'mapping', error: `Path from mapping table not found: ${openspecPath}` };
        }
      }
    } catch {
      // 一对一映射表不存在,继续检查一对多映射表
    }
    
    // 2. 检查一对多映射表: .plan-to-openspec-mapping.md
    const oneToManyMappingPath = path.join(planDir, '.plan-to-openspec-mapping.md');
    try {
      await fs.access(oneToManyMappingPath);
      const mappingContent = await fs.readFile(oneToManyMappingPath, 'utf-8');
      
      // 提取所有变更路径
      const pathMatches = mappingContent.match(/openspec\/changes\/[^|\s]+/g);
      if (pathMatches && pathMatches.length > 0) {
        const changes = pathMatches.map(changePath => {
          const openspecPath = path.resolve(planDir, changePath);
          return {
            path: openspecPath,
            relativePath: changePath,
            changeName: changePath.replace(/^openspec\/changes\/|\/$/g, '')
          };
        });
        
        return {
          found: true,
          method: 'mapping',
          mappingType: 'one-to-many',
          changes,
          count: changes.length
        };
      }
    } catch {
      return { found: false, method: 'mapping', error: 'No mapping table found (.plan-mapping.md or .plan-to-openspec-mapping.md)' };
    }
    
    return { found: false, method: 'mapping', error: 'Mapping table found but no valid paths extracted' };
  } catch (error) {
    return { found: false, method: 'mapping', error: error.message };
  }
}

/**
 * 智能查找 - 尝试所有三种方法,返回第一个成功的结果
 * @param {string} planPath - 计划文件路径
 * @param {string} changeName - 可选的变更名称(用于方法2)
 * @returns {Promise<Object>} 查找结果
 */
async function findOpenSpec(planPath, changeName = null) {
  const results = [];
  
  // 尝试方法1: 链接查找
  console.log('🔍 Method 1: Link-based search...');
  const linkResult = await findByLink(planPath);
  results.push(linkResult);
  if (linkResult.found) {
    console.log(`✅ Found via link: ${linkResult.relativePath}`);
    return linkResult;
  }
  
  // 尝试方法2: 名称查找 (如果提供了changeName)
  if (changeName) {
    console.log('🔍 Method 2: Name-based search...');
    const nameResult = await findByName(changeName);
    results.push(nameResult);
    if (nameResult.found) {
      console.log(`✅ Found via name: ${nameResult.relativePath}`);
      return nameResult;
    }
  }
  
  // 尝试方法3: 映射表查找
  console.log('🔍 Method 3: Mapping table search...');
  const mappingResult = await findByMappingTable(planPath);
  results.push(mappingResult);
  if (mappingResult.found) {
    console.log(`✅ Found via mapping table: ${mappingResult.mappingType}`);
    return mappingResult;
  }
  
  // 所有方法都失败,返回汇总结果
  return {
    found: false,
    method: 'none',
    error: 'All search methods failed',
    details: results
  };
}

/**
 * 加载OpenSpec工件
 * @param {string} openspecPath - OpenSpec变更目录路径
 * @returns {Promise<Object>} 加载的工件内容
 */
async function loadOpenSpecArtifacts(openspecPath) {
  const artifacts = {
    proposal: null,
    tasks: null,
    design: null,
    mapping: null,
    specs: {}
  };
  
  try {
    // 加载 proposal.md
    const proposalPath = path.join(openspecPath, 'proposal.md');
    try {
      artifacts.proposal = await fs.readFile(proposalPath, 'utf-8');
    } catch (error) {
      console.warn(`⚠️  Failed to load proposal.md: ${error.message}`);
    }
    
    // 加载 tasks.md
    const tasksPath = path.join(openspecPath, 'tasks.md');
    try {
      artifacts.tasks = await fs.readFile(tasksPath, 'utf-8');
    } catch (error) {
      console.warn(`⚠️  Failed to load tasks.md: ${error.message}`);
    }
    
    // 加载 design.md
    const designPath = path.join(openspecPath, 'design.md');
    try {
      artifacts.design = await fs.readFile(designPath, 'utf-8');
    } catch (error) {
      console.warn(`⚠️  Failed to load design.md: ${error.message}`);
    }
    
    // 加载 .plan-mapping.md
    const mappingPath = path.join(openspecPath, '.plan-mapping.md');
    try {
      artifacts.mapping = await fs.readFile(mappingPath, 'utf-8');
    } catch (error) {
      console.warn(`⚠️  Failed to load .plan-mapping.md: ${error.message}`);
    }
    
    // 加载 specs/ 目录
    const specsDir = path.join(openspecPath, 'specs');
    try {
      await fs.access(specsDir);
      const specEntries = await fs.readdir(specsDir, { withFileTypes: true });
      
      for (const entry of specEntries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          const specPath = path.join(specsDir, entry.name);
          artifacts.specs[entry.name] = await fs.readFile(specPath, 'utf-8');
        }
      }
    } catch {
      // specs 目录可能不存在或为空
    }
    
    return artifacts;
  } catch (error) {
    throw new Error(`Failed to load OpenSpec artifacts: ${error.message}`);
  }
}

// CLI 接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'find') {
    const planPath = args[1];
    const changeName = args[2];
    
    if (!planPath) {
      console.error('Usage: node openspec-finder.js find <plan-path> [change-name]');
      process.exit(1);
    }
    
    findOpenSpec(planPath, changeName)
      .then(result => {
        console.log('\n📋 Search Result:');
        console.log('═'.repeat(60));
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.found ? 0 : 1);
      })
      .catch(error => {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
      });
  } else if (command === 'load') {
    const openspecPath = args[1];
    
    if (!openspecPath) {
      console.error('Usage: node openspec-finder.js load <openspec-path>');
      process.exit(1);
    }
    
    loadOpenSpecArtifacts(openspecPath)
      .then(artifacts => {
        console.log('\n📦 Loaded Artifacts:');
        console.log('═'.repeat(60));
        console.log(`✅ proposal.md: ${artifacts.proposal ? 'Yes' : 'No'}`);
        console.log(`✅ tasks.md: ${artifacts.tasks ? 'Yes' : 'No'}`);
        console.log(`✅ design.md: ${artifacts.design ? 'Yes' : 'No'}`);
        console.log(`✅ .plan-mapping.md: ${artifacts.mapping ? 'Yes' : 'No'}`);
        console.log(`✅ specs/: ${Object.keys(artifacts.specs).length} files`);
        process.exit(0);
      })
      .catch(error => {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
      });
  } else {
    console.error('Usage:');
    console.error('  node openspec-finder.js find <plan-path> [change-name]');
    console.error('  node openspec-finder.js load <openspec-path>');
    process.exit(1);
  }
}

module.exports = {
  findByLink,
  findByName,
  findByMappingTable,
  findOpenSpec,
  loadOpenSpecArtifacts
};
