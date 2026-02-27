/**
 * 简化同步工具
 * 解决文档维护负担问题
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * 从计划文件中提取关键信息
 */
async function extractPlanInfo(planPath) {
    try {
        const content = await fs.readFile(planPath, 'utf8');
        
        // 提取目标（Goal）
        const goalMatch = content.match(/##\s*Goal\s*\n([^#]*)/i);
        const goal = goalMatch ? goalMatch[1].trim() : '未定义目标';
        
        // 提取范围（Scope）
        const scopeMatch = content.match(/##\s*Scope\s*\n([^#]*)/i);
        const scope = scopeMatch ? scopeMatch[1].trim() : '未定义范围';
        
        // 提取主要任务（第一个任务列表）
        const tasksMatch = content.match(/-\s*\[.\]\s*(.+?)\n/g);
        const mainTasks = tasksMatch ? tasksMatch.slice(0, 3).map(t => t.replace(/^-\s*\[.\]\s*/, '').trim()) : [];
        
        return {
            goal,
            scope,
            mainTasks,
            planPath
        };
    } catch (error) {
        console.error(`读取计划文件失败: ${planPath}`, error.message);
        return null;
    }
}

/**
 * 生成简化版proposal.md
 */
async function generateSimpleProposal(planInfo, outputPath) {
    const { goal, scope, mainTasks, planPath } = planInfo;
    
    const proposalContent = `# ${path.basename(outputPath, path.extname(outputPath))}

**原始计划**: ${planPath}
**创建时间**: ${new Date().toISOString()}
**状态**: 进行中

## 目标
${goal}

## 范围
${scope}

## 主要任务
${mainTasks.map(task => `- [ ] ${task}`).join('\n')}

## 链接
- **前向引用**: ${planPath}
- **后向引用**: ${outputPath}

---
*此文件由简化同步工具自动生成*
`;

    await fs.writeFile(outputPath, proposalContent, 'utf8');
    return proposalContent;
}

/**
 * 生成简化版tasks.md
 */
async function generateSimpleTasks(planInfo, outputPath) {
    const { mainTasks } = planInfo;
    
    // 将主要任务拆解为更细粒度的子任务
    const tasks = mainTasks.map((task, index) => {
        const taskId = `T${index + 1}`;
        
        // 根据任务内容自动生成子任务
        let subtasks = [];
        
        if (task.toLowerCase().includes('create') || task.toLowerCase().includes('implement')) {
            subtasks = [
                '创建必要文件',
                '编写核心逻辑',
                '添加基础测试'
            ];
        } else if (task.toLowerCase().includes('integrate') || task.toLowerCase().includes('connect')) {
            subtasks = [
                '更新配置文件',
                '修改相关组件',
                '测试集成点'
            ];
        } else if (task.toLowerCase().includes('test')) {
            subtasks = [
                '编写测试用例',
                '执行测试',
                '修复发现的问题'
            ];
        } else {
            // 默认子任务
            subtasks = [
                '分析需求',
                '实现功能',
                '验证结果'
            ];
        }
        
        return {
            id: taskId,
            description: task,
            subtasks
        };
    });
    
    const tasksContent = `# 任务清单

${tasks.map(task => `## ${task.id}: ${task.description}

${task.subtasks.map((subtask, subIndex) => 
    `- [ ] **${task.id}.${subIndex + 1}:** ${subtask}`
).join('\n')}

`).join('\n')}

## 完成标准
- [ ] 所有核心功能可用
- [ ] 测试通过
- [ ] 文档完整

---
*此文件由简化同步工具自动生成*
`;

    await fs.writeFile(outputPath, tasksContent, 'utf8');
    return tasksContent;
}

/**
 * 同步OpenSpec工件
 */
async function syncOpenSpecArtifacts(planPath, openspecDir) {
    try {
        // 确保目录存在
        await fs.mkdir(openspecDir, { recursive: true });
        
        // 提取计划信息
        const planInfo = await extractPlanInfo(planPath);
        if (!planInfo) {
            throw new Error('无法提取计划信息');
        }
        
        // 生成proposal.md
        const proposalPath = path.join(openspecDir, 'proposal.md');
        await generateSimpleProposal(planInfo, proposalPath);
        
        // 生成tasks.md
        const tasksPath = path.join(openspecDir, 'tasks.md');
        await generateSimpleTasks(planInfo, tasksPath);
        
        // 创建链接文件
        const linksPath = path.join(openspecDir, '.links.md');
        const linksContent = `# 链接信息

**前向引用**: ${planPath}
**后向引用**: ${proposalPath}

**同步时间**: ${new Date().toISOString()}
**同步状态**: 成功
`;
        
        await fs.writeFile(linksPath, linksContent, 'utf8');
        
        return {
            success: true,
            files: {
                proposal: proposalPath,
                tasks: tasksPath,
                links: linksPath
            },
            planInfo
        };
        
    } catch (error) {
        console.error('同步失败:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 检查同步状态
 */
async function checkSyncStatus(openspecDir) {
    const requiredFiles = ['proposal.md', 'tasks.md'];
    const status = {};
    
    for (const file of requiredFiles) {
        const filePath = path.join(openspecDir, file);
        try {
            await fs.access(filePath);
            const stats = await fs.stat(filePath);
            status[file] = {
                exists: true,
                mtime: stats.mtime,
                size: stats.size
            };
        } catch {
            status[file] = { exists: false };
        }
    }
    
    const allExist = requiredFiles.every(file => status[file].exists);
    
    return {
        synced: allExist,
        files: status,
        message: allExist ? '同步完成' : '文件不完整'
    };
}

/**
 * 更新计划文件中的OpenSpec引用
 */
async function updatePlanReference(planPath, openspecPath) {
    try {
        const content = await fs.readFile(planPath, 'utf8');
        
        // 检查是否已有OpenSpec引用
        const openspecRefRegex = /##\s*OpenSpec\s*Reference\s*\n([^#]*)/i;
        
        let updatedContent;
        
        if (openspecRefRegex.test(content)) {
            // 更新现有引用
            updatedContent = content.replace(openspecRefRegex, 
                `## OpenSpec Reference\n\n**关联OpenSpec**: ${openspecPath}\n**同步时间**: ${new Date().toISOString()}`
            );
        } else {
            // 添加新引用
            updatedContent = content + `\n\n## OpenSpec Reference\n\n**关联OpenSpec**: ${openspecPath}\n**同步时间**: ${new Date().toISOString()}`;
        }
        
        await fs.writeFile(planPath, updatedContent, 'utf8');
        return true;
        
    } catch (error) {
        console.error('更新计划引用失败:', error.message);
        return false;
    }
}

// 命令行接口
if (require.main === module) {
    const args = process.argv.slice(2);
    
    async function main() {
        if (args.length === 0 || args[0] === 'help') {
            console.log('用法:');
            console.log('  node simple-sync.js sync <plan-path> <openspec-dir>');
            console.log('  node simple-sync.js status <openspec-dir>');
            console.log('  node simple-sync.js update-ref <plan-path> <openspec-path>');
            console.log('');
            console.log('示例:');
            console.log('  node simple-sync.js sync .codebuddy/plan/user-auth.md openspec/changes/user-auth');
            console.log('  node simple-sync.js status openspec/changes/user-auth');
            return;
        }
        
        const command = args[0];
        
        switch (command) {
            case 'sync':
                if (args.length < 3) {
                    console.error('错误: 需要提供计划路径和OpenSpec目录');
                    process.exit(1);
                }
                
                const result = await syncOpenSpecArtifacts(args[1], args[2]);
                
                if (result.success) {
                    console.log('✅ 同步成功');
                    console.log(`📄 Proposal: ${result.files.proposal}`);
                    console.log(`📋 Tasks: ${result.files.tasks}`);
                    console.log(`🔗 Links: ${result.files.links}`);
                } else {
                    console.error('❌ 同步失败:', result.error);
                    process.exit(1);
                }
                break;
                
            case 'status':
                if (args.length < 2) {
                    console.error('错误: 需要提供OpenSpec目录');
                    process.exit(1);
                }
                
                const status = await checkSyncStatus(args[1]);
                console.log(`状态: ${status.message}`);
                console.log('文件状态:');
                
                Object.entries(status.files).forEach(([file, info]) => {
                    const icon = info.exists ? '✅' : '❌';
                    const details = info.exists ? 
                        ` (${info.size} bytes, ${info.mtime.toLocaleString()})` : '';
                    console.log(`  ${icon} ${file}${details}`);
                });
                break;
                
            case 'update-ref':
                if (args.length < 3) {
                    console.error('错误: 需要提供计划路径和OpenSpec路径');
                    process.exit(1);
                }
                
                const updated = await updatePlanReference(args[1], args[2]);
                console.log(updated ? '✅ 引用更新成功' : '❌ 引用更新失败');
                break;
                
            default:
                console.error(`未知命令: ${command}`);
                process.exit(1);
        }
    }
    
    main().catch(error => {
        console.error('执行失败:', error.message);
        process.exit(1);
    });
}

module.exports = {
    extractPlanInfo,
    generateSimpleProposal,
    generateSimpleTasks,
    syncOpenSpecArtifacts,
    checkSyncStatus,
    updatePlanReference
};