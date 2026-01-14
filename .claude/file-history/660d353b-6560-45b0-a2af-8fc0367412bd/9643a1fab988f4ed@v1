# Sync Workflow

**Detect and fix documentation drift.**

## When to Use

- Docs feel outdated
- After significant code changes
- Regular maintenance check
- User says "sync docs" or "docs are outdated"

## What is Doc Drift?

Documentation drift occurs when:
- Code changes but docs don't update
- Examples no longer work
- API endpoints are added/removed without doc updates
- Configuration options change

## Process

### Step 1: Inventory Documentation

```bash
# Find all documentation files
find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*"
```

**Track:**
- README.md
- API.md / docs/api.md
- CHANGELOG.md
- Any docs/ directory content
- Inline code comments (optional)

### Step 2: Analyze Each Document

For each doc file:

```
1. Parse document structure
2. Identify claims about code:
   - File paths mentioned
   - Function/class names
   - CLI commands
   - API endpoints
   - Configuration options
3. Verify each claim against current code
4. Track discrepancies
```

### Step 3: Generate Drift Report

```markdown
# Documentation Drift Report

Generated: 2024-01-15

## README.md

### Issues Found: 3

1. **Line 45:** References `config.json` but file is now `config.yaml`
   - Severity: High
   - Fix: Update filename reference

2. **Line 78:** Example uses deprecated `--verbose` flag
   - Severity: Medium
   - Fix: Update to `--log-level=debug`

3. **Line 112:** Missing new `--format` option
   - Severity: Low
   - Fix: Add documentation for new option

## API.md

### Issues Found: 2

1. **Endpoint Missing:** POST /api/v2/users not documented
   - Severity: High
   - Fix: Add endpoint documentation

2. **Response Changed:** GET /api/users returns different schema
   - Severity: High
   - Fix: Update response example

## Summary

| Document | Issues | High | Medium | Low |
|----------|--------|------|--------|-----|
| README.md | 3 | 1 | 1 | 1 |
| API.md | 2 | 2 | 0 | 0 |
| **Total** | **5** | **3** | **1** | **1** |
```

### Step 4: Offer Fixes

For each issue, offer:

1. **Auto-fix** - DocGen can update automatically
2. **Manual fix** - Requires human judgment
3. **Ignore** - Not a real issue (false positive)

```
Issue 1: References `config.json` but file is now `config.yaml`

Options:
  [1] Auto-fix: Replace "config.json" with "config.yaml"
  [2] Manual: Open file for editing
  [3] Ignore: Mark as intentional

Choice:
```

### Step 5: Apply Fixes

For auto-fixes:
```
1. Make the change
2. Show diff
3. Confirm before saving
```

### Step 6: Report Results

```
Documentation Sync Complete

Fixed: 4 issues
  - README.md: 3 auto-fixed
  - API.md: 1 auto-fixed

Remaining: 1 issue (requires manual review)
  - API.md line 89: Complex schema change

Next steps:
  1. Review changes: git diff
  2. Manual fix: edit API.md line 89
  3. Commit: git commit -am "docs: sync documentation with code"
```

## Drift Detection Methods

| Check | Method |
|-------|--------|
| File references | Verify paths exist |
| Function names | Grep for definitions |
| CLI flags | Parse --help output |
| API endpoints | Compare to route definitions |
| Config options | Compare to schema/defaults |
| Version numbers | Compare to package.json |
| Dependencies | Compare to package.json |

## Automation

Can be run as pre-commit hook:

```bash
# .husky/pre-commit
bun ~/.claude/Skills/DocGen/tools/check-drift.ts
```

Or as CI check:

```yaml
# .github/workflows/docs.yml
- name: Check documentation drift
  run: bun ~/.claude/Skills/DocGen/tools/check-drift.ts --ci
```

## Quality Checks

- [ ] All file references valid
- [ ] All code examples run
- [ ] All CLI flags exist
- [ ] All API endpoints documented
- [ ] Version numbers match
