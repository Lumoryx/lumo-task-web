#!/usr/bin/env node

/**
 * Claude Code Custom Command: /check-tests
 *
 * Comprehensive code quality check before submission:
 * - TypeScript type checking
 * - ESLint linting
 * - Unit tests
 * - Build verification
 *
 * Usage: /check-tests
 */

const { spawn } = require('child_process');
const path = require('path');

const projectRoot = process.cwd();

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
};

/**
 * Run a command and return exit code
 */
function runCommand(cwd, command, args = []) {
  return new Promise((resolve) => {
    console.log(`${colors.blue}▶${colors.reset} ${command} ${args.join(' ')}`);

    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      resolve(code);
    });

    child.on('error', () => {
      resolve(1);
    });
  });
}

/**
 * Main check sequence
 */
async function runChecks() {
  const checks = [
    {
      name: 'Frontend TypeScript Check',
      cwd: path.join(projectRoot, 'web-app'),
      command: 'npm',
      args: ['run', 'typecheck'],
    },
    {
      name: 'Frontend ESLint',
      cwd: path.join(projectRoot, 'web-app'),
      command: 'npm',
      args: ['run', 'lint'],
    },
    {
      name: 'Frontend Tests',
      cwd: path.join(projectRoot, 'web-app'),
      command: 'npm',
      args: ['test', '--', '--run'],
    },
    {
      name: 'Backend TypeScript Check',
      cwd: path.join(projectRoot, 'backend'),
      command: 'npm',
      args: ['run', 'typecheck'],
    },
    {
      name: 'Backend Tests',
      cwd: path.join(projectRoot, 'backend'),
      command: 'npm',
      args: ['test'],
    },
  ];

  const results = [];

  console.log(`${colors.bold}${colors.blue}🧪 Code Quality Check${colors.reset}\n`);

  for (const check of checks) {
    console.log(`${colors.bold}→ ${check.name}${colors.reset}`);
    const code = await runCommand(check.cwd, check.command, check.args);
    results.push({ name: check.name, passed: code === 0 });
    console.log('');
  }

  // Summary
  console.log(`${colors.bold}📊 Summary${colors.reset}`);
  console.log('-'.repeat(50));

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  results.forEach((r) => {
    const status = r.passed
      ? `${colors.green}✓ PASS${colors.reset}`
      : `${colors.red}✗ FAIL${colors.reset}`;
    console.log(`${status} ${r.name}`);
  });

  console.log('-'.repeat(50));

  if (passed === total) {
    console.log(
      `${colors.green}${colors.bold}✨ All checks passed! Ready to commit.${colors.reset}\n`
    );
    process.exit(0);
  } else {
    console.log(
      `${colors.red}${colors.bold}❌ ${total - passed} check(s) failed. Please fix before committing.${colors.reset}\n`
    );
    process.exit(1);
  }
}

runChecks().catch((err) => {
  console.error(`${colors.red}Error:${colors.reset}`, err.message);
  process.exit(1);
});
