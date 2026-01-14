#!/usr/bin/env bun
/**
 * PAI Skill Validator
 *
 * Validates that all skills meet PAI structure requirements:
 * - Valid YAML frontmatter with name and description
 * - Description contains "USE WHEN" keyword
 * - Description is single-line and < 1024 chars
 * - Name is TitleCase
 * - Has Workflow Routing section
 * - Has Examples section
 * - Referenced workflow files exist
 * - tools/ directory exists
 * - No backups/ directory inside skill
 *
 * Run: bun .claude/Hooks/validate-skills.ts
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { PAI_DIR, SKILLS_DIR } from './lib/pai-paths';

interface ValidationResult {
  skill: string;
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
const DIM = '\x1b[2m';

function isTitleCase(str: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str);
}

function parseYamlFrontmatter(content: string): { name?: string; description?: string } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result: { name?: string; description?: string } = {};

  // Parse name (simple line match)
  const nameMatch = yaml.match(/^name:\s*(.+)$/m);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
  }

  // Parse description - must be single line
  const descMatch = yaml.match(/^description:\s*(.+)$/m);
  if (descMatch) {
    result.description = descMatch[1].trim();
  }

  return result;
}

function extractWorkflowRefs(content: string): string[] {
  const refs: string[] = [];

  // Match workflow routing table rows: | **Name** | "trigger" | `workflows/File.md` |
  const tablePattern = /\|\s*\*?\*?(\w+)\*?\*?\s*\|[^|]+\|\s*`?workflows\/([^`|\s]+)`?\s*\|/g;
  let match;
  while ((match = tablePattern.exec(content)) !== null) {
    refs.push(match[2]);
  }

  return refs;
}

function validateSkill(skillDir: string): ValidationResult {
  const skillName = basename(skillDir);
  const errors: string[] = [];
  const warnings: string[] = [];

  const skillMd = join(skillDir, 'SKILL.md');

  // Check SKILL.md exists
  if (!existsSync(skillMd)) {
    errors.push('Missing SKILL.md file');
    return { skill: skillName, status: 'fail', errors, warnings };
  }

  const content = readFileSync(skillMd, 'utf-8');

  // Parse YAML frontmatter
  const frontmatter = parseYamlFrontmatter(content);
  if (!frontmatter) {
    errors.push('Missing or invalid YAML frontmatter (must start with ---)');
  } else {
    // Validate name
    if (!frontmatter.name) {
      errors.push('Missing "name:" in frontmatter');
    } else if (!isTitleCase(frontmatter.name)) {
      errors.push(`Name "${frontmatter.name}" is not TitleCase`);
    }

    // Validate description
    if (!frontmatter.description) {
      errors.push('Missing "description:" in frontmatter');
    } else {
      if (frontmatter.description.length > 1024) {
        errors.push(`Description exceeds 1024 chars (${frontmatter.description.length})`);
      }
      if (!frontmatter.description.includes('USE WHEN')) {
        errors.push('Description missing "USE WHEN" keyword (required for Claude Code parsing)');
      }
      if (frontmatter.description.includes('\n')) {
        errors.push('Description must be single-line (no newlines)');
      }
    }
  }

  // Check for Workflow Routing section
  if (!content.includes('## Workflow Routing')) {
    warnings.push('Missing "## Workflow Routing" section');
  }

  // Check for Examples section
  if (!content.includes('## Examples')) {
    errors.push('Missing "## Examples" section (critical for skill activation)');
  } else {
    // Count examples
    const exampleCount = (content.match(/\*\*Example \d+:/g) || []).length;
    if (exampleCount < 2) {
      warnings.push(`Only ${exampleCount} example(s) found (recommend 2-3)`);
    }
  }

  // Check tools/ directory exists
  const toolsDir = join(skillDir, 'tools');
  if (!existsSync(toolsDir)) {
    warnings.push('Missing tools/ directory');
  }

  // Check for forbidden backups/ directory
  const backupsDir = join(skillDir, 'backups');
  if (existsSync(backupsDir)) {
    errors.push('Contains backups/ directory (violates PAI convention)');
  }

  // Check workflow references
  const workflowsDir = join(skillDir, 'workflows');
  if (existsSync(workflowsDir)) {
    const workflowRefs = extractWorkflowRefs(content);
    for (const ref of workflowRefs) {
      const workflowPath = join(workflowsDir, ref);
      if (!existsSync(workflowPath)) {
        errors.push(`Referenced workflow not found: workflows/${ref}`);
      }
    }
  }

  // Determine overall status
  let status: 'pass' | 'fail' | 'warn' = 'pass';
  if (errors.length > 0) {
    status = 'fail';
  } else if (warnings.length > 0) {
    status = 'warn';
  }

  return { skill: skillName, status, errors, warnings };
}

// Main execution
console.log(`\n${BOLD}PAI Skill Validator${RESET}\n`);
console.log('='.repeat(60));

// Find all skill directories
const skillDirs = readdirSync(SKILLS_DIR)
  .filter(f => {
    const fullPath = join(SKILLS_DIR, f);
    return statSync(fullPath).isDirectory() && !f.startsWith('.');
  })
  .map(f => join(SKILLS_DIR, f));

console.log(`\nValidating ${skillDirs.length} skills...\n`);

for (const skillDir of skillDirs) {
  const result = validateSkill(skillDir);
  results.push(result);
}

// Print results
let passCount = 0;
let failCount = 0;
let warnCount = 0;

for (const result of results) {
  const icon = result.status === 'pass' ? '✓' : result.status === 'warn' ? '⚠' : '✗';
  const color = result.status === 'pass' ? GREEN : result.status === 'warn' ? YELLOW : RED;

  console.log(`${color}${icon}${RESET} ${result.skill}`);

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
