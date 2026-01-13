# Generate Workflow

**Main entry point for documentation generation.**

Orchestrates the creation of all human-facing documentation by leveraging SystemMap for codebase understanding.

## Prerequisites

- SystemMap skill must be available
- Repository should have code to document

## Process

### Step 1: Verify SystemMap Structure (GATE)

**CRITICAL: DocGen requires ai.md context to generate accurate documentation.**

```bash
# Check for ai.md
ls -la ai.md 2>/dev/null
```

**Decision Tree:**

```
ai.md exists?
├── YES → Read ai.md, proceed to Step 2
└── NO → STOP. Run SystemMap:Discover first.
         "No ai.md found. Running SystemMap:Discover to analyze codebase..."
         After SystemMap completes → Continue to Step 2
```

**Why this is a hard gate:**
- ai.md provides project context (purpose, tech stack, architecture)
- Without it, DocGen would need to re-analyze the entire codebase
- SystemMap:Discover is optimized for this - DocGen should not duplicate it
- Ensures consistency between AI context and human documentation

### Step 2: Load Context from ai.md

```
Read ai.md and extract:
```

**What we need from ai.md:**
- Project purpose and description (## Project Overview)
- Tech stack (## Architecture / ### Tech Stack)
- Entry points and main functionality (## Capabilities)
- API endpoints (## API Endpoints or ## Capabilities)
- Configuration options (## Working in This Repo)
- Dependencies (## Architecture)

**If ai.md is incomplete:**
- Note missing sections
- Fall back to direct code analysis for those sections only
- Recommend updating ai.md after DocGen completes

### Step 3: Audit Existing Documentation

Scan for existing docs:

```bash
# Check for existing documentation
ls -la README.md CHANGELOG.md API.md docs/ 2>/dev/null
```

**Assess each doc:**
- Does it exist?
- When was it last modified?
- Is it comprehensive or stub?
- Does it match current code?

**Output:** Documentation gap analysis

### Step 4: Determine What to Generate

Based on audit, determine actions:

| Doc | Status | Action |
|-----|--------|--------|
| README.md | Missing | Generate from template |
| README.md | Outdated | Update specific sections |
| README.md | Current | Skip |
| API.md | Missing + has API | Generate |
| API.md | Missing + no API | Skip |
| CHANGELOG.md | Missing | Generate from git history |

**Present plan to user for approval before generating.**

### Step 5: Generate Documentation

For each doc to generate/update:

**README.md:**
```
1. Load templates/ReadmeTemplate.md
2. Fill sections from codebase context:
   - Title: from package.json/pyproject.toml name
   - Description: from ai.md or package description
   - Installation: from detected package manager
   - Usage: from main entry points
   - Configuration: from env files, config schemas
   - Contributing: standard or from existing CONTRIBUTING.md
3. Preserve any existing custom sections
4. Write README.md
```

**API.md:**
```
1. Load templates/ApiDocsTemplate.md
2. Scan for API definitions:
   - Express/Fastify routes
   - OpenAPI/Swagger specs
   - GraphQL schemas
   - tRPC routers
3. Extract for each endpoint:
   - Method + path
   - Description
   - Parameters (path, query, body)
   - Response format
   - Auth requirements
4. Generate examples (curl, fetch)
5. Write API.md
```

**CHANGELOG.md:**
```
1. Load templates/ChangelogTemplate.md
2. Analyze git history:
   - Find last tag/release
   - Categorize commits since then
   - Group by type (feat, fix, breaking, etc.)
3. Generate changelog entry
4. Prepend to existing CHANGELOG.md or create new
```

### Step 6: Update ai.md with Documentation References

**CRITICAL: Always update ai.md to reflect generated documentation.**

```
1. Check if ai.md exists:
   - If exists → Update "Related Documentation" section
   - If missing → Run SystemMap:Discover to create it

2. Update ai.md with documentation references:
   - Add/update "Generated Documentation" subsection
   - List all docs created: README.md, API.md, CHANGELOG.md
   - Include brief descriptions for each

3. Ensure ai.md references are bidirectional:
   - ai.md → references README.md, API.md, CHANGELOG.md
   - README.md → can reference ai.md for AI agent context
```

**Why this matters:**
- ai.md is the AI agent's context file - must reflect current documentation state
- Prevents documentation drift between human docs and AI context
- Ensures future Claude Code sessions see accurate documentation index

### Step 7: Verify and Report

After generation:

```
1. Verify files were written
2. Run basic quality checks:
   - No empty required sections
   - Links are valid (internal)
   - Code examples have syntax highlighting
3. Report what was created/updated
4. Suggest next steps (review, commit)
```

## Output Format

```
Documentation Generation Complete

Created:
  - README.md (new)
  - API.md (new)

Updated:
  - CHANGELOG.md (added v1.2.0 entry)
  - ai.md (added documentation references)

Skipped:
  - CONTRIBUTING.md (already current)

Next steps:
  1. Review generated documentation
  2. Run: git diff README.md API.md CHANGELOG.md ai.md
  3. Commit: git add -A && git commit -m "docs: generate project documentation"
```

## Error Handling

| Issue | Resolution |
|-------|------------|
| No ai.md exists | Run SystemMap:Discover to create it before generating docs |
| ai.md missing Related Documentation | Add the section with generated doc references |
| Can't detect project type | Ask user for clarification |
| API detection fails | Ask user to point to route files |
| Git history unavailable | Skip changelog, note in output |

## User Approval Gates

**Gate 1:** After Step 4 (before generating)
- Show what will be generated/updated
- Allow user to modify plan

**Gate 2:** After Step 5 (before writing)
- Show preview of generated content
- Allow user to request changes

## Integration Points

- **SystemMap:Prime** - Context loading
- **SystemMap:Discover** - Full codebase analysis if needed
- **GSD** - Can be called as part of project setup
