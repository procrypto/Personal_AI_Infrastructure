#!/usr/bin/env bun
/**
 * PAI Test Suite Orchestrator
 *
 * Runs all PAI validators and produces a unified report.
 *
 * Usage:
 *   bun .claude/Hooks/pai-test.ts          # Run all tests
 *   bun .claude/Hooks/pai-test.ts --skills # Skills only
 *   bun .claude/Hooks/pai-test.ts --agents # Agents only
 *   bun .claude/Hooks/pai-test.ts --commands # Commands only
 *   bun .claude/Hooks/pai-test.ts --refs   # Cross-references only
 *   bun .claude/Hooks/pai-test.ts --quick  # Quick check (existing self-test)
 *   bun .claude/Hooks/pai-test.ts --help   # Show help
 */

import { spawn } from 'bun';
import { join } from 'path';
import { PAI_DIR, HOOKS_DIR } from './lib/pai-paths';

// ANSI color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

interface TestSuite {
  name: string;
  script: string;
  flag: string;
}

const suites: TestSuite[] = [
  { name: 'Skills', script: 'validate-skills.ts', flag: '--skills' },
  { name: 'Agents', script: 'validate-agents.ts', flag: '--agents' },
  { name: 'Commands', script: 'validate-commands.ts', flag: '--commands' },
  { name: 'Cross-References', script: 'validate-refs.ts', flag: '--refs' },
];

interface SuiteResult {
  name: string;
  passed: boolean;
  output: string;
  duration: number;
}

async function runValidator(suite: TestSuite): Promise<SuiteResult> {
  const scriptPath = join(HOOKS_DIR, suite.script);
  const startTime = Date.now();

  const proc = spawn({
    cmd: ['bun', scriptPath],
    cwd: process.cwd(),
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  return {
    name: suite.name,
    passed: exitCode === 0,
    output: stdout + stderr,
    duration: Date.now() - startTime,
  };
}

async function runQuickCheck(): Promise<SuiteResult> {
  const scriptPath = join(HOOKS_DIR, 'self-test.ts');
  const startTime = Date.now();

  const proc = spawn({
    cmd: ['bun', scriptPath],
    cwd: process.cwd(),
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  return {
    name: 'Quick Health Check',
    passed: exitCode === 0,
    output: stdout + stderr,
    duration: Date.now() - startTime,
  };
}

function printHelp(): void {
  console.log(`
${BOLD}PAI Test Suite${RESET}

Usage: bun .claude/Hooks/pai-test.ts [options]

Options:
  ${CYAN}--skills${RESET}    Run skill validation only
  ${CYAN}--agents${RESET}    Run agent validation only
  ${CYAN}--commands${RESET}  Run command validation only
  ${CYAN}--refs${RESET}      Run cross-reference validation only
  ${CYAN}--quick${RESET}     Run quick health check only (self-test.ts)
  ${CYAN}--verbose${RESET}   Show full output from each validator
  ${CYAN}--help${RESET}      Show this help message

Examples:
  bun .claude/Hooks/pai-test.ts             # Run all tests
  bun .claude/Hooks/pai-test.ts --skills    # Check skills only
  bun .claude/Hooks/pai-test.ts --verbose   # Show detailed output
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const verbose = args.includes('--verbose') || args.includes('-v');
  const quickOnly = args.includes('--quick');

  // Determine which suites to run
  let suitesToRun: TestSuite[] = [];

  if (quickOnly) {
    // Quick mode - just run self-test
    console.log(`\n${BOLD}${CYAN}PAI Quick Health Check${RESET}\n`);
    console.log('='.repeat(60));

    const result = await runQuickCheck();
    console.log(result.output);
    process.exit(result.passed ? 0 : 1);
  }

  // Check for specific suite flags
  const specificFlags = args.filter(a => suites.some(s => s.flag === a));
  if (specificFlags.length > 0) {
    suitesToRun = suites.filter(s => specificFlags.includes(s.flag));
  } else {
    suitesToRun = suites;
  }

  // Print header
  console.log(`\n${BOLD}${CYAN}╔═══════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║            PAI Test Suite                                  ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚═══════════════════════════════════════════════════════════╝${RESET}\n`);

  console.log(`${DIM}Running ${suitesToRun.length} test suite(s)...${RESET}\n`);

  // Run all validators
  const results: SuiteResult[] = [];

  for (const suite of suitesToRun) {
    process.stdout.write(`${DIM}Running ${suite.name}...${RESET}`);
    const result = await runValidator(suite);
    results.push(result);

    const icon = result.passed ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    const duration = `${DIM}(${result.duration}ms)${RESET}`;
    console.log(`\r${icon} ${suite.name} ${duration}                    `);

    if (verbose || !result.passed) {
      console.log();
      console.log(result.output);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n${BOLD}Summary:${RESET}`);
  console.log(`  ${GREEN}${passed} passed${RESET}`);
  if (failed > 0) {
    console.log(`  ${RED}${failed} failed${RESET}`);
  }
  console.log(`  ${DIM}Total time: ${totalDuration}ms${RESET}\n`);

  if (failed > 0) {
    console.log(`${RED}${BOLD}Some tests failed.${RESET} Run with --verbose for details.\n`);

    // Show which failed
    for (const result of results.filter(r => !r.passed)) {
      console.log(`  ${RED}✗${RESET} ${result.name}`);
    }
    console.log();

    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}All tests passed!${RESET} PAI is healthy.\n`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error(`${RED}Error:${RESET}`, err);
  process.exit(1);
});
