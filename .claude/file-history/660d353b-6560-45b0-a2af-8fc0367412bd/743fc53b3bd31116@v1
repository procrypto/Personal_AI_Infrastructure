# Changelog Template

**Instructions:** Follow Keep a Changelog format. Newest entries at top.

---

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- {unreleased_features}

### Changed

- {unreleased_changes}

### Fixed

- {unreleased_fixes}

## [{version}] - {date}

### Added

- {feature_description} ([#{issue_number}]({issue_url}))
- {feature_description}

### Changed

- {change_description}
- **BREAKING:** {breaking_change_description}

### Deprecated

- {deprecated_feature} - use {replacement} instead

### Removed

- {removed_feature}

### Fixed

- {bug_fix_description} ([#{issue_number}]({issue_url}))

### Security

- {security_fix_description}

---

## Version Guidelines

### When to increment versions

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Breaking changes | Major (X.0.0) | API signature changes |
| New features (backward compatible) | Minor (0.X.0) | New endpoint added |
| Bug fixes | Patch (0.0.X) | Fix null pointer |

### Commit to Category Mapping

| Commit Prefix | Category |
|---------------|----------|
| `feat:` | Added |
| `fix:` | Fixed |
| `docs:` | Changed |
| `style:` | Changed |
| `refactor:` | Changed |
| `perf:` | Changed |
| `test:` | Changed |
| `chore:` | Changed |
| `revert:` | Removed |
| `security:` | Security |
| `BREAKING CHANGE:` | Changed (highlight) |

### Entry Format

Good:
```markdown
- Add user authentication with JWT tokens ([#123](link))
- Fix memory leak in cache invalidation
- **BREAKING:** Rename `getUser()` to `fetchUser()`
```

Bad:
```markdown
- Updated stuff
- Fixed bug
- Changes
```

---

**Template Variables:**

| Variable | Description | Source |
|----------|-------------|--------|
| `{version}` | Semver version | git tag, user input |
| `{date}` | Release date | Current date, git tag date |
| `{feature_description}` | What was added | Commit message |
| `{issue_number}` | Related issue | Commit message parsing |
| `{issue_url}` | Link to issue | GitHub/GitLab URL |

---

[Unreleased]: {repo_url}/compare/v{latest_version}...HEAD
[{version}]: {repo_url}/compare/v{previous_version}...v{version}
