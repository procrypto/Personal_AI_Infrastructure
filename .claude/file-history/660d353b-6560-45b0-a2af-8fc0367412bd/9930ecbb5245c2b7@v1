# Changelog Workflow

**Generate changelog entries from git history.**

## When to Use

- Preparing a release
- CHANGELOG.md is missing or outdated
- User requests "generate changelog"

## Format

Follows [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Vulnerability fixes

## [1.0.0] - 2024-01-15

### Added
- Initial release
```

## Process

### Step 1: Analyze Git History

```bash
# Find last tag
git describe --tags --abbrev=0 2>/dev/null || echo "No tags"

# Get commits since last tag (or all if no tags)
git log --oneline ${last_tag}..HEAD
```

### Step 2: Categorize Commits

Parse commit messages using conventional commits:

| Prefix | Category |
|--------|----------|
| `feat:` | Added |
| `fix:` | Fixed |
| `docs:` | Changed (documentation) |
| `refactor:` | Changed |
| `perf:` | Changed (performance) |
| `test:` | Changed (testing) |
| `chore:` | Changed (maintenance) |
| `BREAKING CHANGE:` | Changed (breaking) |
| `security:` | Security |
| `deprecate:` | Deprecated |
| `remove:` | Removed |

**For non-conventional commits:**
- Analyze commit message content
- Ask user to categorize if unclear

### Step 3: Generate Entry

**Determine version:**
- If user specified: use that
- If has breaking changes: bump major
- If has features: bump minor
- If only fixes: bump patch

**Generate entry:**

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- feat: Add user authentication (#123)
- feat: Add dark mode support

### Fixed
- fix: Resolve memory leak in cache (#456)
- fix: Correct timezone handling

### Changed
- refactor: Simplify database queries
- BREAKING: Rename `getUser` to `fetchUser`
```

### Step 4: Handle Existing Changelog

**If CHANGELOG.md exists:**
```
1. Read existing content
2. Find insertion point (after ## [Unreleased] or at top)
3. Insert new entry
4. Update [Unreleased] link
```

**If no CHANGELOG.md:**
```
1. Load templates/ChangelogTemplate.md
2. Generate full file with history
```

### Step 5: Write and Report

```
1. Write CHANGELOG.md
2. Show generated entry
3. Suggest version tag command
```

## Output Example

```
Changelog Updated

Version: 1.2.0
Date: 2024-01-15

Changes included:
  Added: 3 features
  Fixed: 5 bugs
  Changed: 2 improvements

Suggested next steps:
  git add CHANGELOG.md
  git commit -m "docs: update changelog for v1.2.0"
  git tag -a v1.2.0 -m "Release v1.2.0"
```

## Options

| Option | Description |
|--------|-------------|
| `--version X.Y.Z` | Specify version explicitly |
| `--since TAG` | Generate from specific tag |
| `--unreleased` | Only update Unreleased section |
| `--dry-run` | Show what would be generated |

## Quality Checks

- [ ] Version follows semver
- [ ] Date is correct
- [ ] All significant commits included
- [ ] Breaking changes highlighted
- [ ] Links to issues/PRs where applicable

## Template Reference

Uses: `templates/ChangelogTemplate.md`
