/**
 * Tests for validate-skills.ts
 *
 * Run: bun test .claude/Hooks/__tests__/validate-skills.test.ts
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Helper functions extracted for testing
function isTitleCase(str: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str);
}

function parseYamlFrontmatter(content: string): { name?: string; description?: string } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result: { name?: string; description?: string } = {};

  const nameMatch = yaml.match(/^name:\s*(.+)$/m);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
  }

  const descMatch = yaml.match(/^description:\s*(.+)$/m);
  if (descMatch) {
    result.description = descMatch[1].trim();
  }

  return result;
}

function extractWorkflowRefs(content: string): string[] {
  const refs: string[] = [];
  const tablePattern = /\|\s*\*?\*?(\w+)\*?\*?\s*\|[^|]+\|\s*`?workflows\/([^`|\s]+)`?\s*\|/g;
  let match;
  while ((match = tablePattern.exec(content)) !== null) {
    refs.push(match[2]);
  }
  return refs;
}

// Tests for isTitleCase
describe('isTitleCase', () => {
  test('accepts valid TitleCase names', () => {
    expect(isTitleCase('Research')).toBe(true);
    expect(isTitleCase('CreateCLI')).toBe(true);
    expect(isTitleCase('CORE')).toBe(true);
    expect(isTitleCase('Learn')).toBe(true);
    expect(isTitleCase('Observability')).toBe(true);
  });

  test('rejects lowercase names', () => {
    expect(isTitleCase('research')).toBe(false);
    expect(isTitleCase('createCli')).toBe(false);
  });

  test('rejects kebab-case names', () => {
    expect(isTitleCase('create-cli')).toBe(false);
    expect(isTitleCase('my-skill')).toBe(false);
  });

  test('rejects snake_case names', () => {
    expect(isTitleCase('create_cli')).toBe(false);
    expect(isTitleCase('MY_SKILL')).toBe(false);
  });

  test('accepts names with numbers', () => {
    expect(isTitleCase('Skill2')).toBe(true);
    expect(isTitleCase('V3Integration')).toBe(true);
  });
});

// Tests for parseYamlFrontmatter
describe('parseYamlFrontmatter', () => {
  test('parses valid frontmatter', () => {
    const content = `---
name: Research
description: Research skill. USE WHEN user wants research.
---

# Research Skill`;

    const result = parseYamlFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Research');
    expect(result?.description).toBe('Research skill. USE WHEN user wants research.');
  });

  test('returns null for missing frontmatter', () => {
    const content = `# No Frontmatter

This file has no YAML frontmatter.`;

    const result = parseYamlFrontmatter(content);
    expect(result).toBeNull();
  });

  test('handles missing name', () => {
    const content = `---
description: Some description. USE WHEN triggered.
---`;

    const result = parseYamlFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result?.name).toBeUndefined();
    expect(result?.description).toBe('Some description. USE WHEN triggered.');
  });

  test('handles missing description', () => {
    const content = `---
name: TestSkill
---`;

    const result = parseYamlFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result?.name).toBe('TestSkill');
    expect(result?.description).toBeUndefined();
  });
});

// Tests for extractWorkflowRefs
describe('extractWorkflowRefs', () => {
  test('extracts workflow references from routing table', () => {
    const content = `## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Create** | "create thing" | \`workflows/Create.md\` |
| **Update** | "update thing" | \`workflows/Update.md\` |`;

    const refs = extractWorkflowRefs(content);
    expect(refs).toContain('Create.md');
    expect(refs).toContain('Update.md');
    expect(refs.length).toBe(2);
  });

  test('handles table without backticks', () => {
    const content = `| **WorkflowOne** | "trigger" | workflows/WorkflowOne.md |`;

    const refs = extractWorkflowRefs(content);
    expect(refs).toContain('WorkflowOne.md');
  });

  test('returns empty array for content without routing table', () => {
    const content = `# Skill

No routing table here.`;

    const refs = extractWorkflowRefs(content);
    expect(refs.length).toBe(0);
  });
});

// Integration tests with temp directory
describe('skill validation integration', () => {
  const testDir = join(tmpdir(), 'pai-skill-tests-' + Date.now());
  const skillDir = join(testDir, 'TestSkill');

  // Setup test directory
  beforeAll(() => {
    mkdirSync(skillDir, { recursive: true });
    mkdirSync(join(skillDir, 'workflows'), { recursive: true });
    mkdirSync(join(skillDir, 'tools'), { recursive: true });
  });

  // Cleanup
  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test('valid skill structure passes validation checks', () => {
    const validSkillContent = `---
name: TestSkill
description: Test skill for validation. USE WHEN testing validation.
---

# TestSkill

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Create** | "create test" | \`workflows/Create.md\` |

## Examples

**Example 1: Create test**
\`\`\`
User: "Create a test"
-> Invokes Create workflow
\`\`\`

**Example 2: Another test**
\`\`\`
User: "Another test"
-> Does something
\`\`\`
`;

    writeFileSync(join(skillDir, 'SKILL.md'), validSkillContent);
    writeFileSync(join(skillDir, 'workflows', 'Create.md'), '# Create Workflow');

    // Parse and validate
    const frontmatter = parseYamlFrontmatter(validSkillContent);
    expect(frontmatter?.name).toBe('TestSkill');
    expect(isTitleCase(frontmatter?.name || '')).toBe(true);
    expect(frontmatter?.description?.includes('USE WHEN')).toBe(true);
    expect(validSkillContent.includes('## Workflow Routing')).toBe(true);
    expect(validSkillContent.includes('## Examples')).toBe(true);
    expect(existsSync(join(skillDir, 'tools'))).toBe(true);
  });

  test('detects missing USE WHEN keyword', () => {
    const invalidContent = `---
name: BadSkill
description: This description is missing the required keyword.
---`;

    const frontmatter = parseYamlFrontmatter(invalidContent);
    expect(frontmatter?.description?.includes('USE WHEN')).toBe(false);
  });

  test('detects non-TitleCase name', () => {
    const invalidContent = `---
name: badSkill
description: Test. USE WHEN testing.
---`;

    const frontmatter = parseYamlFrontmatter(invalidContent);
    expect(isTitleCase(frontmatter?.name || '')).toBe(false);
  });

  test('detects description over 1024 chars', () => {
    const longDescription = 'A'.repeat(1100) + '. USE WHEN testing.';
    const invalidContent = `---
name: TestSkill
description: ${longDescription}
---`;

    const frontmatter = parseYamlFrontmatter(invalidContent);
    expect((frontmatter?.description?.length || 0) > 1024).toBe(true);
  });
});
