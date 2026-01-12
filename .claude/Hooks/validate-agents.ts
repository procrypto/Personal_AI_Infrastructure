#!/usr/bin/env bun
/**
 * PAI Agent Validator
 *
 * Validates that all agents meet PAI structure requirements:
 * - Valid YAML frontmatter with name, description, model
 * - Model is valid (sonnet, opus, haiku)
 * - Permissions array exists and is valid
 * - Has mandatory session startup section
 * - Has voice announcement section
 *
 * Run: bun .claude/Hooks/validate-agents.ts
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { AGENTS_DIR } from './lib/pai-paths';

interface ValidationResult {
  agent: string;
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

const VALID_MODELS = ['sonnet', 'opus', 'haiku'];

interface AgentFrontmatter {
  name?: string;
  description?: string;
  model?: string;
  color?: string;
  voiceId?: string;
  permissions?: {
    allow?: string[];
  };
}

function parseYamlFrontmatter(content: string): AgentFrontmatter | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result: AgentFrontmatter = {};

  // Parse simple fields
  const nameMatch = yaml.match(/^name:\s*(.+)$/m);
  if (nameMatch) result.name = nameMatch[1].trim();

  const descMatch = yaml.match(/^description:\s*(.+)$/m);
  if (descMatch) result.description = descMatch[1].trim();

  const modelMatch = yaml.match(/^model:\s*(.+)$/m);
  if (modelMatch) result.model = modelMatch[1].trim();

  const colorMatch = yaml.match(/^color:\s*(.+)$/m);
  if (colorMatch) result.color = colorMatch[1].trim();

  const voiceMatch = yaml.match(/^voiceId:\s*(.+)$/m);
  if (voiceMatch) result.voiceId = voiceMatch[1].trim();

  // Parse permissions
  if (yaml.includes('permissions:')) {
    result.permissions = { allow: [] };
    const permLines = yaml.split('\n');
    let inAllow = false;

    for (const line of permLines) {
      if (line.includes('allow:')) {
        inAllow = true;
        continue;
      }
      if (inAllow && line.match(/^\s+-\s*"?([^"]+)"?/)) {
        const permMatch = line.match(/^\s+-\s*"?([^"]+)"?/);
        if (permMatch) {
          result.permissions.allow!.push(permMatch[1].replace(/"/g, ''));
        }
      }
      if (inAllow && !line.startsWith('    ') && !line.startsWith('\t') && line.trim() && !line.match(/^\s+-/)) {
        inAllow = false;
      }
    }
  }

  return result;
}

function validateAgent(agentPath: string): ValidationResult {
  const agentName = basename(agentPath, '.md');
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(agentPath)) {
    errors.push('Agent file not found');
    return { agent: agentName, status: 'fail', errors, warnings };
  }

  const content = readFileSync(agentPath, 'utf-8');

  // Parse YAML frontmatter
  const frontmatter = parseYamlFrontmatter(content);
  if (!frontmatter) {
    errors.push('Missing or invalid YAML frontmatter');
    return { agent: agentName, status: 'fail', errors, warnings };
  }

  // Validate required fields
  if (!frontmatter.name) {
    errors.push('Missing "name:" in frontmatter');
  }

  if (!frontmatter.description) {
    errors.push('Missing "description:" in frontmatter');
  } else if (frontmatter.description.length > 1024) {
    errors.push(`Description exceeds 1024 chars (${frontmatter.description.length})`);
  }

  if (!frontmatter.model) {
    errors.push('Missing "model:" in frontmatter');
  } else if (!VALID_MODELS.includes(frontmatter.model)) {
    errors.push(`Invalid model "${frontmatter.model}" (must be: ${VALID_MODELS.join(', ')})`);
  }

  // Check permissions
  if (!frontmatter.permissions || !frontmatter.permissions.allow) {
    warnings.push('No permissions.allow defined');
  } else if (frontmatter.permissions.allow.length === 0) {
    warnings.push('Empty permissions.allow array');
  }

  // Check for mandatory session startup section
  const hasSessionStartup = content.includes('MANDATORY FIRST ACTION') ||
                            content.includes('SESSION STARTUP') ||
                            content.includes('SESSION_STARTUP');
  if (!hasSessionStartup) {
    warnings.push('Missing mandatory session startup section');
  }

  // Check for voice announcement section
  const hasVoiceAnnouncement = content.includes('VOICE ANNOUNCEMENT') ||
                               content.includes('voice_enabled') ||
                               content.includes('localhost:8888');
  if (!hasVoiceAnnouncement) {
    warnings.push('Missing voice announcement section');
  }

  // Check for Core Identity section
  if (!content.includes('Core Identity') && !content.includes('## Core')) {
    warnings.push('Missing Core Identity section');
  }

  // Determine overall status
  let status: 'pass' | 'fail' | 'warn' = 'pass';
  if (errors.length > 0) {
    status = 'fail';
  } else if (warnings.length > 0) {
    status = 'warn';
  }

  return { agent: agentName, status, errors, warnings };
}

// Main execution
console.log(`\n${BOLD}PAI Agent Validator${RESET}\n`);
console.log('='.repeat(60));

// Find all agent files
const agentFiles = readdirSync(AGENTS_DIR)
  .filter(f => f.endsWith('.md') && !f.startsWith('.'))
  .map(f => join(AGENTS_DIR, f));

console.log(`\nValidating ${agentFiles.length} agents...\n`);

for (const agentPath of agentFiles) {
  const result = validateAgent(agentPath);
  results.push(result);
}

// Print results
let passCount = 0;
let failCount = 0;
let warnCount = 0;

for (const result of results) {
  const icon = result.status === 'pass' ? '✓' : result.status === 'warn' ? '⚠' : '✗';
  const color = result.status === 'pass' ? GREEN : result.status === 'warn' ? YELLOW : RED;

  console.log(`${color}${icon}${RESET} ${result.agent}`);

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
