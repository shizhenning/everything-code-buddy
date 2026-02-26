#!/usr/bin/env node
/**
 * CodeBuddy Hook: Quality Gate Enforcement
 *
 * This hook checks if quality gate has passed before allowing critical operations
 * such as git push, deployment, or other irreversible actions.
 *
 * Hook Types: PreToolUse (Bash commands)
 * Matchers: git push, npm publish, deployment commands
 */

const fs = require('fs');
const path = require('path');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
    try {
        const input = JSON.parse(data);
        const toolName = input.tool_name || '';
        const toolInput = input.tool_input || {};
        const command = toolInput.command || '';

        // Only check Bash commands
        if (toolName !== 'Bash') {
            console.log(data);
            return;
        }

        // Critical operations that require quality gate
        const criticalPatterns = [
            'git push',
            'git push --force',  // Dangerous, always block
            'npm publish',
            'npm publish --access public',
            'yarn publish',
            'pnpm publish',
            'bun publish',
            'yarn deploy',
            'vercel --prod',
            'netlify deploy --prod',
            'firebase deploy',
        ];

        // Check if command is critical
        const isCritical = criticalPatterns.some(pattern => command.includes(pattern));

        if (!isCritical) {
            console.log(data);
            return;
        }

        // Check quality config
        const qualityConfigPath = path.join(process.cwd(), '.codebuddy', 'quality-config.json');

        if (!fs.existsSync(qualityConfigPath)) {
            console.log(data);
            return; // No quality gate configured
        }

        const qualityConfig = JSON.parse(fs.readFileSync(qualityConfigPath, 'utf8'));
        const qualityGate = qualityConfig.qualityGate || {};

        // Skip if quality gate is disabled or in manual mode
        if (!qualityGate.enabled || qualityGate.mode === 'off') {
            console.log(data);
            return;
        }

        // Check quality status
        const qualityStatusPath = path.join(process.cwd(), '.codebuddy', 'quality-status.json');

        if (!fs.existsSync(qualityStatusPath)) {
            if (qualityGate.mode === 'auto') {
                console.error('[Quality Gate Hook] ❌ ERROR: No quality assessment found');
                console.error('[Quality Gate Hook]    Current mode: auto (quality assessment required)');
                console.error('[Quality Gate Hook]');
                console.error('[Quality Gate Hook]    To fix:');
                console.error('[Quality Gate Hook]    1. Run: /execute <plan-file> (quality assessment will run automatically)');
                console.error('[Quality Gate Hook]    2. Or run: /quality-assess <plan-file>');
                console.error('[Quality Gate Hook]');
                console.error('[Quality Gate Hook]    To bypass this hook (not recommended):');
                console.error('[Quality Gate Hook]    Set qualityGate.mode to "off" or "manual" in .codebuddy/quality-config.json');
                process.exit(2); // Block the command
            } else {
                console.log(data); // Manual mode, allow with warning
                return;
            }
        }

        const qualityStatus = JSON.parse(fs.readFileSync(qualityStatusPath, 'utf8'));
        const canProceed = qualityStatus.canProceed === true;
        const status = qualityStatus.status || 'unknown';
        const score = qualityStatus.score || 0;
        const timestamp = qualityStatus.timestamp || '';

        // Check if timestamp is valid
        if (!timestamp || timestamp === 'null' || timestamp === 'undefined') {
            console.error('[Quality Gate Hook] ❌ ERROR: Invalid quality assessment timestamp');
            console.error('[Quality Gate Hook]    Please re-run quality assessment');
            process.exit(2);
        }

        // Check freshness (within 24 hours)
        const assessmentTime = new Date(timestamp).getTime();
        const currentTime = Date.now();
        const timeDiffHours = (currentTime - assessmentTime) / (1000 * 60 * 60);

        if (timeDiffHours > 24) {
            console.error(`[Quality Gate Hook] ⚠️  Quality assessment expired (${Math.round(timeDiffHours)} hours ago)`);
            console.error('[Quality Gate Hook]    Recommended: Re-run /quality-assess <plan>');
            // Don't block for expired assessments
            console.log(data);
            return;
        }

        // Quality gate decision
        if (!canProceed) {
            console.error('[Quality Gate Hook] ❌ QUALITY GATE FAILED - Command blocked');
            console.error('[Quality Gate Hook]');
            console.error(`[Quality Gate Hook]    Status: ${status}`);
            console.error(`[Quality Gate Hook]    Score: ${score}/100`);
            console.error('[Quality Gate Hook]    Assessment time: ' + timestamp);
            console.error('[Quality Gate Hook]');
            console.error('[Quality Gate Hook]    To fix:');
            console.error('[Quality Gate Hook]    1. Review quality report in .codebuddy/quality-trends.json');
            console.error('[Quality Gate Hook]    2. Fix the identified issues');
            console.error('[Quality Gate Hook]    3. Re-run: /quality-assess <plan>');
            console.error('[Quality Gate Hook]    4. Or use --force to bypass (not recommended)');
            console.error('[Quality Gate Hook]');
            console.error('[Quality Gate Hook]    To bypass this hook:');
            console.error('[Quality Gate Hook]    Set qualityGate.mode to "off" in .codebuddy/quality-config.json');

            process.exit(2); // Block the command
        } else {
            console.error(`[Quality Gate Hook] ✅ Quality gate passed (Status: ${status}, Score: ${score}/100)`);
            console.log(data); // Allow the command
        }

    } catch (error) {
        // If any error occurs, allow the command to proceed
        // (don't block the user due to hook errors)
        console.log(data);
    }
});
