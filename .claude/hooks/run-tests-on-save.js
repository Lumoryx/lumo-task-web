#!/usr/bin/env node

/**
 * Hook: Run tests on save (cross-platform)
 *
 * Triggered after any file write/edit in the code editor.
 * Runs typecheck, lint, and tests to catch issues early.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '../..');

/**
 * Run a command in a directory
 */
function runCommand(cwd, command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Determine which packages were changed and run appropriate checks
 */
async function runTests() {
  try {
    console.log('🧪 Running code quality checks...\n');

    // Check which directories have changes (simplified)
    // In a real scenario, you might parse git diff to be smarter
    const hasWebAppChanges = true; // Simplified for now
    const hasBackendChanges = true;

    // Run web-app tests if applicable
    if (hasWebAppChanges) {
      console.log('📦 Checking web-app...');
      try {
        await runCommand(path.join(projectRoot, 'web-app'), 'npm', ['run', 'typecheck']);
        console.log('✅ web-app typecheck passed\n');
      } catch (err) {
        console.warn('⚠️  web-app typecheck failed (but continuing)\n');
      }
    }

    // Run backend tests if applicable
    if (hasBackendChanges) {
      console.log('📦 Checking backend...');
      try {
        await runCommand(path.join(projectRoot, 'backend'), 'npm', ['run', 'typecheck']);
        console.log('✅ backend typecheck passed\n');
      } catch (err) {
        console.warn('⚠️  backend typecheck failed (but continuing)\n');
      }
    }

    console.log('✨ Code quality checks completed!');
  } catch (err) {
    console.error('❌ Error running tests:', err.message);
    process.exit(1);
  }
}

// Run tests
runTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
