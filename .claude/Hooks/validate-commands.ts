#!/usr/bin/env bun
/**
 * PAI Command Validator
 *
 * Validates that all commands meet PAI structure requirements:
 * - File exists and is readable markdown
 * - If has YAML frontmatter, it's valid
 * - Referenced files (@path) exist
 * - Has meaningful content
 *
 * Run: bun .claude/Hooks/validate-commands.ts
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, basename, dirname } from 'path';
import { homedir } from 'os';
import { COMMANDS_DIR, PAI_DIR } from './lib/pai-paths';

interface ValidationResult {
  command: string;
  status: 'pass' | 'fail' | 'warn';
  errors: string[];
  warnings: string[];
}

const results: ValidationResult[] = [];

// ANSI color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function resolvePath(path: string): string {
  // Handle ~ for home directory
  if (path.startsWith('~/')) {
    return join(homedir(), path.slice(2));
  }
  // Handle ${PAI_DIR}
  if (path.includes('${PAI_DIR}')) {
    return path.replace('${PAI_DIR}', PAI_DIR);
  }
  return path;
}

function extractFileReferences(content: string): string[] {
  const refs: string[] = [];

  // Match @path/to/file patterns
  const atRefPattern = /@([~$][^\s<>]+|[./][^\s<>]+)/g;
  let match;
  while ((match = atRefPattern.exec(content)) !== null) {
    refs.push(match[1]);
  }

  return refs;
}

function parseYamlFrontmatter(content: string): { description?: string; allowedTools?: string[] } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result: { description?: string; allowedTools?: string[] } = {};

  const descMatch = yaml.match(/^description:\s*(.+)$/m);
  if (descMatch) {
    result.description = descMatch[1].trim();
  }

  // Parse allowed-tools
  if (yaml.includes('allowed-tools:')) {
    result.allowedTools = [];
    const lines = yaml.split('\n');
    let inAllowed = false;

    for (const line of lines) {
      if (line.includes('allowed-tools:')) {
        inAllowed = true;
        continue;
      }
      if (inAllowed && line.match(/^\s+-\s*(.+)/)) {
        const toolMatch = line.match(/^\s+-\s*(.+)/);
        if (toolMatch) {
          result.allowedTools.push(toolMatch[1].trim());
        }
      }
      if (inAllowed && !line.startsWith(' ') && !line.startsWith('\t') && line.trim() && !line.match(/^\s+-/)) {
        inAllowed = false;
      }
    }
  }

  return result;
}

function validateCommand(commandPath: string, commandName: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(commandPath)) {
    errors.push('Command file not found');
    return { command: commandName, status: 'fail', errors, warnings };
  }

  const content = readFileSync(commandPath, 'utf-8');

  // Check for empty file
  if (content.trim().length === 0) {
    errors.push('Command file is empty');
    return { command: commandName, status: 'fail', errors, warnings };
  }

  // Check minimum content length (should have some meaningful content)
  if (content.trim().length < 50) {
    warnings.push('Command content is very short (< 50 chars)');
  }

  // Parse YAML frontmatter if present
  if (content.startsWith('---')) {
    const frontmatter = parseYamlFrontmatter(content);
    if (!frontmatter) {
      errors.push('Invalid YAML frontmatter (starts with --- but fails to parse)');
    } else if (!frontmatter.description) {
      warnings.push('Missing "description:" in frontmatter');
    }
  }

  // Check file references
  const fileRefs = extractFileReferences(content);
  for (const ref of fileRefs) {
    const resolvedPath = resolvePath(ref);
    if (!existsSync(resolvedPath)) {
      warnings.push(`Referenced file not found: ${ref}`);
    }
  }

  // Determine overall status
  let status: 'pass' | 'fail' | 'warn' = 'pass';
  if (errors.length > 0) {
    status = 'fail';
  } else if (warnings.length > 0) {
    status = 'warn';
  }

  return { command: commandName, status, errors, warnings };
}

function getCommandFiles(dir: string, prefix: string = ''): Array<{ path: string; name: string }> {
  const files: Array<{ path: string; name: string }> = [];

  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (entry.startsWith('.')) continue;

    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Recurse into subdirectory with prefix (e.g., gsd:)
      const subFiles = getCommandFiles(fullPath, `${entry}:`);
      files.push(...subFiles);
    } else if (entry.endsWith('.md')) {
      const name = prefix + basename(entry, '.md');
      files.push({ path: fullPath, name });
    }
  }

  return files;
}

// Main execution
console.log(`\n${BOLD}PAI Command Validator${RESET}\n`);
console.log('='.repeat(60));

// Find all command files (including subdirectories)
const commandFiles = getCommandFiles(COMMANDS_DIR);

console.log(`\nValidating ${commandFiles.length} commands...\n`);

for (const { path, name } of commandFiles) {
  const result = validateCommand(path, name);
  results.push(result);
}

// Print results
let passCount = 0;
let failCount = 0;
let warnCount = 0;

for (const result of results) {
  const icon = result.status === 'pass' ? '✓' : result.status === 'warn' ? '⚠' : '✗';
  const color = result.status === 'pass' ? GREEN : result.status === 'warn' ? YELLOW : RED;

  console.log(`${color}${icon}${RESET} ${result.command}`);

  if (result.errors.length > 0) {
    for (const err of result.errors) {
      console.log(`  ${RED}└ ${err}${RESET}`);
    }
  }
  if (result.warnings.length > 0) {
    for (const warn of result.warnings) {
      console.log(`  ${YELLOW}└ ${warn}${RESET}`);
    }
  }

  if (result.status === 'pass') passCount++;
  else if (result.status === 'fail') failCount++;
  else warnCount++;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log(`\n${BOLD}Summary:${RESET} ${GREEN}${passCount} passed${RESET}, ${RED}${failCount} failed${RESET}, ${YELLOW}${warnCount} warnings${RESET}\n`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
