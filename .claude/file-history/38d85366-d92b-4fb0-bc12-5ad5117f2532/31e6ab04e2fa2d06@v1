# PAI Self-Test System

## Goal

Create a comprehensive test suite that validates all PAI components work correctly, catching regressions before they cause problems.

## Current State

PAI has some validation:
- `self-test.ts` - 10 core health checks
- `validate-docs.ts` - broken link detection
- `validate-protected.ts` - content integrity
- `security-validator.ts` - command security

**Gap:** No validation for skills, agents, commands, or cross-references.

## Implementation Plan

### Phase 1: Skill Validator (`validate-skills.ts`)

**Location:** `.claude/Hooks/validate-skills.ts`

**Validates for each skill:**
- [ ] YAML frontmatter is valid
- [ ] `name:` field exists and is TitleCase
- [ ] `description:` is single-line and < 1024 chars
- [ ] `description:` contains "USE WHEN" keyword
- [ ] Has `## Workflow Routing` section
- [ ] Has `## Examples` section with at least 2 examples
- [ ] `tools/` directory exists
- [ ] All workflows referenced in routing table exist
- [ ] All tool files referenced exist
- [ ] No `backups/` directory inside skill

**Output:** Pass/Warn/Fail with specific errors

### Phase 2: Agent Validator (`validate-agents.ts`)

**Location:** `.claude/Hooks/validate-agents.ts`

**Validates for each agent:**
- [ ] YAML frontmatter is valid
- [ ] Has required fields: name, description, model
- [ ] Model is valid (sonnet, opus, haiku)
- [ ] Permissions array is valid
- [ ] Has mandatory sections (session startup, voice announcement)

### Phase 3: Command Validator (`validate-commands.ts`)

**Location:** `.claude/Hooks/validate-commands.ts`

**Validates for each command:**
- [ ] File exists and is readable
- [ ] Valid markdown syntax
- [ ] If has YAML frontmatter, it's valid
- [ ] Referenced files (@path) exist

### Phase 4: Cross-Reference Validator (`validate-refs.ts`)

**Location:** `.claude/Hooks/validate-refs.ts`

**Scans all .md files for:**
- [ ] `${PAI_DIR}/path` references resolve to existing files
- [ ] `~/.claude/path` references resolve to existing files
- [ ] Skill-to-skill references are valid
- [ ] Template references exist

### Phase 5: Test Runner (`pai-test.ts`)

**Location:** `.claude/Hooks/pai-test.ts`

Orchestrates all validators:
```bash
./pai-test.ts              # Run all tests
./pai-test.ts --skills     # Skills only
./pai-test.ts --agents     # Agents only
./pai-test.ts --quick      # Fast subset
```

**Output format:**
```
PAI Self-Test Suite
==================

Skills (15 total)
  ✓ CORE - valid
  ✓ Research - valid
  ✗ Art - missing workflow: workflows/BadRef.md
  ⚠ Fabric - no tools/ directory (warning)

Agents (8 total)
  ✓ Engineer - valid
  ✓ Researcher - valid

Commands (22 total)
  ✓ gsd:new-project - valid
  ✓ paiupdate - valid

Cross-References
  ✓ 47 internal refs - all valid
  ✗ 2 broken refs found:
    - Skills/CORE/SKILL.md:42 → nonexistent.md

SUMMARY: 14 passed, 1 failed, 1 warning
```

### Files to Create

```
.claude/Hooks/
├── validate-skills.ts      # NEW - Skill validation
├── validate-agents.ts      # NEW - Agent validation
├── validate-commands.ts    # NEW - Command validation
├── validate-refs.ts        # NEW - Cross-reference validation
└── pai-test.ts            # NEW - Test orchestrator
```

### Verification

After implementation:
```bash
# Run full test suite
bun .claude/Hooks/pai-test.ts

# Should detect intentionally broken skill
echo "broken content" > .claude/Skills/TestBroken/SKILL.md
bun .claude/Hooks/pai-test.ts  # Should fail

# Clean up
rm -rf .claude/Skills/TestBroken
```

## Design Decisions

1. **TypeScript + Bun** - Matches existing hook patterns
2. **Exit codes** - 0 success, 1 failure (Unix convention)
3. **Colored output** - Green pass, yellow warn, red fail
4. **Modular** - Each validator standalone, orchestrator combines
5. **Fast** - Full suite should run in < 2 seconds
6. **Useful errors** - Show exactly what's wrong and where

## Scope

**In scope:**
- Static validation (file structure, syntax, references)
- Comprehensive skill/agent/command checks

**Out of scope (future):**
- Runtime integration tests (invoke workflows)
- Performance benchmarks
- API endpoint tests
