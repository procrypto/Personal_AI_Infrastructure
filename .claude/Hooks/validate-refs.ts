#!/usr/bin/env bun
/**
 * PAI Cross-Reference Validator
 *
 * Scans all .md files in PAI for broken references:
 * - ${PAI_DIR}/path references
 * - ~/.claude/path references
 * - Skill-to-skill references
 *
 * Excludes:
 * - .planning/ references (GSD project-specific)
 * - $ARGUMENTS and other variables
 * - External URLs
 *
 * Run: bun .claude/Hooks/validate-refs.ts
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, basename, dirname, relative } from 'path';
import { homedir } from 'os';
import { PAI_DIR } from './lib/pai-paths';

interface BrokenRef {
  file: string;
  line: number;
  ref: string;
  resolved: string;
}

const brokenRefs: BrokenRef[] = [];
const validRefs: number[] = [];

// ANSI color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

// Patterns to ignore (not actual file references)
const IGNORE_PATTERNS = [
  /\.planning\//,           // GSD project-specific
  /\$ARGUMENTS/,            // Variable placeholder
  /\$\{[A-Z_]+\}/,          // Environment variables (not paths)
  /http[s]?:\/\//,          // URLs
  /localhost/,              // Local URLs
  /\[YOUR/,                 // Placeholder instructions
  /\[SPECIFIC/,             // Placeholder instructions
  /example\.com/,           // Example domains
  /path\/to\//,             // Example paths
  /\{[a-z_]+\}/,            // Template variables like {name}
  /YYYY-MM/,                // Date placeholders
  /\[domain/,               // Template syntax
  /\/\*/,                   // Glob patterns
  /\\\*/,                   // Escaped glob patterns
  /\*\*/,                   // Double glob patterns
  /\/path$/,                // Generic "/path" example
  /\.md`/,                  // Markdown with trailing backtick (code block)
  /\.md\*\*/,               // Markdown with glob
  /\/expertise\//,          // GSD expertise directory (optional/future feature)
];

function resolvePath(ref: string): string {
  let resolved = ref;

  // Handle ${PAI_DIR}
  if (resolved.includes('${PAI_DIR}')) {
    resolved = resolved.replace(/\$\{PAI_DIR\}/g, PAI_DIR);
  }

  // Handle ~/ for home directory
  if (resolved.startsWith('~/')) {
    resolved = join(homedir(), resolved.slice(2));
  }

  // Handle ~/.claude specifically
  if (resolved.startsWith('~/.claude')) {
    resolved = resolved.replace(/^~\/\.claude/, PAI_DIR);
  }

  return resolved;
}

function shouldIgnore(ref: string): boolean {
  return IGNORE_PATTERNS.some(pattern => pattern.test(ref));
}

function extractReferences(content: string): Array<{ ref: string; line: number }> {
  const refs: Array<{ ref: string; line: number }> = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Match ${PAI_DIR}/path patterns
    const paiDirPattern = /\$\{PAI_DIR\}\/[^\s`"'\)>\]]+/g;
    let match;
    while ((match = paiDirPattern.exec(line)) !== null) {
      const ref = match[0];
      if (!shouldIgnore(ref)) {
        refs.push({ ref, line: lineNum });
      }
    }

    // Match ~/.claude/path patterns
    const claudePattern = /~\/\.claude\/[^\s`"'\)>\]]+/g;
    while ((match = claudePattern.exec(line)) !== null) {
      const ref = match[0];
      if (!shouldIgnore(ref)) {
        refs.push({ ref, line: lineNum });
      }
    }

    // Match @~/path or @${PAI_DIR}/path (command file references)
    const atRefPattern = /@(~\/[^\s<>]+|\$\{PAI_DIR\}\/[^\s<>]+)/g;
    while ((match = atRefPattern.exec(line)) !== null) {
      const ref = match[1];
      if (!shouldIgnore(ref)) {
        refs.push({ ref, line: lineNum });
      }
    }
  }

  return refs;
}

function getAllMarkdownFiles(dir: string, files: string[] = []): string[] {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    if (entry.startsWith('.') || entry === 'node_modules') continue;

    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      getAllMarkdownFiles(fullPath, files);
    } else if (entry.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Main execution
console.log(`\n${BOLD}PAI Cross-Reference Validator${RESET}\n`);
console.log('='.repeat(60));

// Get all markdown files in PAI
const mdFiles = getAllMarkdownFiles(PAI_DIR);
console.log(`\nScanning ${mdFiles.length} markdown files...\n`);

let totalRefs = 0;

for (const file of mdFiles) {
  const content = readFileSync(file, 'utf-8');
  const refs = extractReferences(content);

  for (const { ref, line } of refs) {
    totalRefs++;
    const resolved = resolvePath(ref);

    // Clean up the resolved path (remove trailing punctuation)
    const cleanResolved = resolved.replace(/[\.,;:]+$/, '');

    if (!existsSync(cleanResolved)) {
      brokenRefs.push({
        file: relative(PAI_DIR, file),
        line,
        ref,
        resolved: cleanResolved
      });
    }
  }
}

// Print results
if (brokenRefs.length === 0) {
  console.log(`${GREEN}✓${RESET} All ${totalRefs} references are valid\n`);
} else {
  console.log(`${RED}Found ${brokenRefs.length} broken references:${RESET}\n`);

  // Group by file
  const byFile = new Map<string, BrokenRef[]>();
  for (const ref of brokenRefs) {
    const existing = byFile.get(ref.file) || [];
    existing.push(ref);
    byFile.set(ref.file, existing);
  }

  for (const [file, refs] of byFile) {
    console.log(`${DIM}${file}${RESET}`);
    for (const ref of refs) {
      console.log(`  ${RED}✗${RESET} Line ${ref.line}: ${ref.ref}`);
      console.log(`    ${DIM}→ ${ref.resolved}${RESET}`);
    }
    console.log();
  }
}

// Summary
console.log('='.repeat(60));
const validCount = totalRefs - brokenRefs.length;
console.log(`\n${BOLD}Summary:${RESET} ${GREEN}${validCount} valid${RESET}, ${RED}${brokenRefs.length} broken${RESET} (of ${totalRefs} total refs)\n`);

if (brokenRefs.length > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
