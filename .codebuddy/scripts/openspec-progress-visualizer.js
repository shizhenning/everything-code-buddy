#!/usr/bin/env node

/**
 * OpenSpec 进度可视化工具
 * 生成任务进度条、质量得分趋势图和可视化报告
 */

const fs = require('fs');
const path = require('path');

// 颜色代码
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

/**
 * 读取 tasks.md 文件并解析任务状态
 */
function parseTasksFile(tasksPath) {
  if (!fs.existsSync(tasksPath)) {
    console.error(`${COLORS.red}错误: tasks.md 文件不存在: ${tasksPath}${COLORS.reset}`);
    return null;
  }

  const content = fs.readFileSync(tasksPath, 'utf-8');
  const lines = content.split('\n');

  const tasks = {
    total: 0,
    completed: 0,
    pending: 0,
    byPriority: {
      P0: { total: 0, completed: 0 },
      P1: { total: 0, completed: 0 },
      P2: { total: 0, completed: 0 },
      P3: { total: 0, completed: 0 }
    },
    recent: []
  };

  let currentPriority = null;

  for (const line of lines) {
    // 检测优先级标题
    const priorityMatch = line.match(/^###\s+(P[0-3])/);
    if (priorityMatch) {
      currentPriority = priorityMatch[1];
      continue;
    }

    // 检测任务行
    const taskMatch = line.match(/^\s*-\s+\[([ x])\]\s+(.+)$/);
    if (taskMatch) {
      const isCompleted = taskMatch[1] === 'x';
      const taskText = taskMatch[2].trim();
      
      tasks.total++;
      if (isCompleted) {
        tasks.completed++;
      } else {
        tasks.pending++;
      }

      if (currentPriority && tasks.byPriority[currentPriority]) {
        tasks.byPriority[currentPriority].total++;
        if (isCompleted) {
          tasks.byPriority[currentPriority].completed++;
        }
      }

      // 保存最近的任务(最多5个)
      if (tasks.recent.length < 5) {
        tasks.recent.push({
          text: taskText,
          completed: isCompleted,
          priority: currentPriority || 'Unknown'
        });
      }
    }
  }

  return tasks;
}

/**
 * 生成进度条
 */
function generateProgressBar(percentage, width = 40) {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  
  let bar = '';
  bar += COLORS.green;
  bar += '█'.repeat(filled);
  bar += COLORS.gray;
  bar += '░'.repeat(empty);
  bar += COLORS.reset;
  
  return bar;
}

/**
 * 生成终端可视化报告
 */
function generateTerminalReport(changeName, tasks, qualityScores = null) {
  const percentage = tasks.total > 0 ? (tasks.completed / tasks.total) * 100 : 0;
  
  console.log(`\n${COLORS.cyan}╔════════════════════════════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.white}            OpenSpec 进度报告${COLORS.cyan}                         ║${COLORS.reset}`);
  console.log(`${COLORS.cyan}╠════════════════════════════════════════════════════════════╣${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.white}  变更名称:${COLORS.reset} ${changeName}`);
  console.log(`${COLORS.cyan}╠════════════════════════════════════════════════════════════╣${COLORS.reset}`);
  
  // 总体进度
  console.log(`${COLORS.cyan}║${COLORS.white}  📊 总体进度${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.reset}    ${generateProgressBar(percentage)} ${COLORS.white}${percentage.toFixed(1)}%${COLORS.reset} ${COLORS.gray}(${tasks.completed}/${tasks.total})${COLORS.reset}`);
  console.log(`${COLORS.cyan}╠════════════════════════════════════════════════════════════╣${COLORS.reset}`);
  
  // 按优先级分类
  console.log(`${COLORS.cyan}║${COLORS.white}  📋 按优先级分类${COLORS.reset}`);
  for (const priority of ['P0', 'P1', 'P2', 'P3']) {
    const p = tasks.byPriority[priority];
    if (p.total > 0) {
      const pPercentage = (p.completed / p.total) * 100;
      const color = priority === 'P0' ? COLORS.red : 
                   priority === 'P1' ? COLORS.yellow :
                   priority === 'P2' ? COLORS.blue : COLORS.gray;
      console.log(`${COLORS.cyan}║${COLORS.reset}    ${color}[${priority}]${COLORS.reset} ${generateProgressBar(pPercentage, 30)} ${pPercentage.toFixed(1)}% ${COLORS.gray}(${p.completed}/${p.total})${COLORS.reset}`);
    }
  }
  
  console.log(`${COLORS.cyan}╠════════════════════════════════════════════════════════════╣${COLORS.reset}`);
  
  // 最近任务
  console.log(`${COLORS.cyan}║${COLORS.white}  📝 最近任务${COLORS.reset}`);
  for (const task of tasks.recent) {
    const status = task.completed ? 
      `${COLORS.green}[✓]${COLORS.reset}` : 
      `${COLORS.gray}[ ]${COLORS.reset}`;
    const priorityColor = task.priority === 'P0' ? COLORS.red :
                         task.priority === 'P1' ? COLORS.yellow :
                         task.priority === 'P2' ? COLORS.blue : COLORS.gray;
    console.log(`${COLORS.cyan}║${COLORS.reset}    ${status} ${priorityColor}[${task.priority}]${COLORS.reset} ${task.text.substring(0, 50)}${task.text.length > 50 ? '...' : ''}`);
  }
  
  console.log(`${COLORS.cyan}╚════════════════════════════════════════════════════════════╝${COLORS.reset}\n`);
  
  // 质量得分
  if (qualityScores) {
    console.log(`${COLORS.cyan}┌──────────────────────────────────────────────────────────┐${COLORS.reset}`);
    console.log(`${COLORS.cyan}│${COLORS.white}  📈 质量得分${COLORS.cyan}                                                │${COLORS.reset}`);
    console.log(`${COLORS.cyan}├──────────────────────────────────────────────────────────┤${COLORS.reset}`);
    
    for (const [dimension, score] of Object.entries(qualityScores.scores)) {
      const percentage = score.percentage;
      const bar = generateProgressBar(percentage, 30);
      console.log(`${COLORS.cyan}│${COLORS.reset}  ${dimension.padEnd(18)} ${bar} ${COLORS.white}${score.value.toFixed(1)}${COLORS.reset}/${COLORS.gray}${score.max}${COLORS.reset}`);
    }
    
    console.log(`${COLORS.cyan}├──────────────────────────────────────────────────────────┤${COLORS.reset}`);
    console.log(`${COLORS.cyan}│${COLORS.white}  综合得分${COLORS.gray}: ${COLORS.white}${qualityScores.total.toFixed(1)}/100${COLORS.reset}${COLORS.cyan}                                        │${COLORS.reset}`);
    console.log(`${COLORS.cyan}└──────────────────────────────────────────────────────────┘${COLORS.reset}\n`);
  }
}

/**
 * 生成 HTML 可视化报告
 */
function generateHTMLReport(changeName, tasks, qualityScores = null, outputPath = null) {
  const percentage = tasks.total > 0 ? (tasks.completed / tasks.total) * 100 : 0;
  
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenSpec 进度报告 - ${changeName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header p {
      opacity: 0.9;
      font-size: 16px;
    }
    .content {
      padding: 30px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      font-size: 20px;
      margin-bottom: 15px;
      color: #333;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section h2 .icon {
      font-size: 24px;
    }
    .progress-container {
      background: #f0f0f0;
      border-radius: 10px;
      overflow: hidden;
      height: 30px;
      position: relative;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.5s ease;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 15px;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }
    .priority-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .priority-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      border-left: 4px solid;
    }
    .priority-card.P0 { border-color: #e74c3c; }
    .priority-card.P1 { border-color: #f39c12; }
    .priority-card.P2 { border-color: #3498db; }
    .priority-card.P3 { border-color: #95a5a6; }
    .priority-card h3 {
      font-size: 16px;
      margin-bottom: 10px;
      color: #333;
    }
    .priority-card .progress {
      background: #e9ecef;
      border-radius: 5px;
      height: 8px;
      overflow: hidden;
    }
    .priority-card .progress-bar {
      height: 100%;
    }
    .priority-card .stats {
      margin-top: 10px;
      font-size: 14px;
      color: #666;
    }
    .task-list {
      list-style: none;
    }
    .task-item {
      display: flex;
      align-items: center;
      padding: 12px;
      background: #f8f9fa;
      margin-bottom: 8px;
      border-radius: 6px;
    }
    .task-item.completed {
      opacity: 0.6;
    }
    .task-item .checkbox {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      margin-right: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .task-item.completed .checkbox {
      background: #667eea;
      color: white;
    }
    .task-item .priority {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 4px;
      margin-right: 10px;
      font-weight: bold;
    }
    .priority.P0 { background: #e74c3c; color: white; }
    .priority.P1 { background: #f39c12; color: white; }
    .priority.P2 { background: #3498db; color: white; }
    .priority.P3 { background: #95a5a6; color: white; }
    .task-item .text {
      flex: 1;
      color: #333;
    }
    .task-item.completed .text {
      text-decoration: line-through;
    }
    .quality-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    .quality-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
    }
    .quality-card h3 {
      font-size: 16px;
      margin-bottom: 15px;
      color: #333;
    }
    .quality-score {
      font-size: 36px;
      font-weight: bold;
      color: #667eea;
      text-align: center;
    }
    .quality-total {
      margin-top: 20px;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: white;
      text-align: center;
    }
    .quality-total h3 {
      font-size: 18px;
      margin-bottom: 10px;
    }
    .quality-total .score {
      font-size: 48px;
      font-weight: bold;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 OpenSpec 进度报告</h1>
      <p>${changeName}</p>
      <p style="margin-top: 10px; font-size: 14px;">生成时间: ${new Date().toLocaleString('zh-CN')}</p>
    </div>
    
    <div class="content">
      <!-- 总体进度 -->
      <div class="section">
        <h2><span class="icon">📊</span> 总体进度</h2>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${percentage}%;">${percentage.toFixed(1)}%</div>
        </div>
        <p style="margin-top: 10px; color: #666;">已完成 ${tasks.completed} / ${tasks.total} 个任务</p>
      </div>
      
      <!-- 按优先级分类 -->
      <div class="section">
        <h2><span class="icon">📋</span> 按优先级分类</h2>
        <div class="priority-grid">
          ${['P0', 'P1', 'P2', 'P3'].map(priority => {
            const p = tasks.byPriority[priority];
            if (p.total === 0) return '';
            const pPercentage = (p.completed / p.total) * 100;
            return `
              <div class="priority-card ${priority}">
                <h3>${priority} - ${priority === 'P0' ? '关键' : priority === 'P1' ? '重要' : priority === 'P2' ? '增强' : '可选'}</h3>
                <div class="progress">
                  <div class="progress-bar" style="width: ${pPercentage}%; background: ${priority === 'P0' ? '#e74c3c' : priority === 'P1' ? '#f39c12' : priority === 'P2' ? '#3498db' : '#95a5a6'};"></div>
                </div>
                <div class="stats">${p.completed} / ${p.total} 完成 (${pPercentage.toFixed(1)}%)</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <!-- 最近任务 -->
      <div class="section">
        <h2><span class="icon">📝</span> 最近任务</h2>
        <ul class="task-list">
          ${tasks.recent.map(task => `
            <li class="task-item ${task.completed ? 'completed' : ''}">
              <div class="checkbox">${task.completed ? '✓' : ''}</div>
              <span class="priority ${task.priority}">${task.priority}</span>
              <span class="text">${task.text}</span>
            </li>
          `).join('')}
        </ul>
      </div>
      
      ${qualityScores ? `
      <!-- 质量得分 -->
      <div class="section">
        <h2><span class="icon">📈</span> 质量得分</h2>
        <div class="quality-grid">
          ${Object.entries(qualityScores.scores).map(([dimension, score]) => `
            <div class="quality-card">
              <h3>${dimension}</h3>
              <div class="quality-score">${score.value.toFixed(1)}</div>
              <div class="progress" style="margin-top: 10px;">
                <div class="progress-bar" style="width: ${score.percentage}%;"></div>
              </div>
              <p style="margin-top: 10px; text-align: center; color: #666;">${score.percentage.toFixed(1)}%</p>
            </div>
          `).join('')}
        </div>
        <div class="quality-total">
          <h3>综合得分</h3>
          <div class="score">${qualityScores.total.toFixed(1)}<span style="font-size: 24px;">/100</span></div>
          <p style="margin-top: 10px;">${qualityScores.total >= 90 ? '✅ 优秀' : qualityScores.total >= 80 ? '⚠️ 良好' : qualityScores.total >= 70 ? '❌ 需要改进' : '❌ 拒绝'}</p>
        </div>
      </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p>由 OpenSpec 进度可视化工具生成</p>
    </div>
  </div>
</body>
</html>`;

  if (outputPath) {
    fs.writeFileSync(outputPath, html, 'utf-8');
    console.log(`${COLORS.green}✓ HTML 报告已生成: ${outputPath}${COLORS.reset}`);
  }
  
  return html;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`${COLORS.cyan}OpenSpec 进度可视化工具${COLORS.reset}\n`);
    console.log(`用法: ${COLORS.white}node openspec-progress-visualizer.js <change-name> [options]${COLORS.reset}\n`);
    console.log(`参数:`);
    console.log(`  ${COLORS.cyan}<change-name>${COLORS.reset}    OpenSpec 变更名称`);
    console.log(`\n选项:`);
    console.log(`  ${COLORS.cyan}--html${COLORS.reset}           生成 HTML 报告`);
    console.log(`  ${COLORS.cyan}--output <path>${COLORS.reset}  输出路径`);
    console.log(`\n示例:`);
    console.log(`  ${COLORS.gray}node openspec-progress-visualizer.js user-authentication${COLORS.reset}`);
    console.log(`  ${COLORS.gray}node openspec-progress-visualizer.js user-authentication --html${COLORS.reset}`);
    console.log(`  ${COLORS.gray}node openspec-progress-visualizer.js user-authentication --html --output ./report.html${COLORS.reset}`);
    process.exit(1);
  }
  
  const changeName = args[0];
  const tasksPath = path.join(process.cwd(), 'openspec', 'changes', changeName, 'tasks.md');
  
  // 解析任务
  const tasks = parseTasksFile(tasksPath);
  if (!tasks) {
    process.exit(1);
  }
  
  // 检查选项
  const generateHTML = args.includes('--html');
  const outputIndex = args.indexOf('--output');
  const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : null;
  
  // 生成终端报告
  console.log(`\n${COLORS.cyan}📊 正在生成进度报告...${COLORS.reset}\n`);
  generateTerminalReport(changeName, tasks);
  
  // 生成 HTML 报告
  if (generateHTML) {
    let htmlPath = outputPath;
    if (!htmlPath) {
      htmlPath = path.join(process.cwd(), 'openspec', 'changes', changeName, 'progress-report.html');
    }
    generateHTMLReport(changeName, tasks, null, htmlPath);
  }
  
  console.log(`${COLORS.green}✓ 报告生成完成!${COLORS.reset}\n`);
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  parseTasksFile,
  generateTerminalReport,
  generateHTMLReport
};
