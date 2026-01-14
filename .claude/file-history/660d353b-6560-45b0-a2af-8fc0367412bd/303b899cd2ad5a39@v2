---
name: DocGen
description: Human-facing documentation generator. Auto-generates README, API docs, and changelogs from code. Leverages SystemMap for codebase understanding. USE WHEN user says "generate docs", "update README", "create API documentation", "generate changelog", OR wants human-readable documentation from code.
---

# DocGen

**Human-facing documentation generator that leverages SystemMap for codebase understanding.**

Generates and maintains documentation for humans (developers, users, contributors) by analyzing code and producing structured, readable documentation artifacts.

## Key Principle: Hybrid Architecture

DocGen does NOT duplicate codebase discovery. Instead:

1. **Calls SystemMap:Prime** to load codebase context
2. **Transforms context** into human-readable documentation
3. **Maintains sync** between code and docs

This ensures consistent understanding across AI docs (`ai.md`) and human docs (`README.md`).

## Workflow Routing

**When executing a workflow, do BOTH of these:**

1. **Call the notification script** (for observability tracking):
   ```bash
   ~/.claude/Tools/SkillWorkflowNotification WORKFLOWNAME DocGen
   ```

2. **Output the text notification** (for user visibility):
   ```
   Running the **WorkflowName** workflow from the **DocGen** skill...
   ```

| Workflow | Trigger | File |
|----------|---------|------|
| **Generate** | "generate docs", "create documentation" | `workflows/Generate.md` |
| **Readme** | "update README", "generate README" | `workflows/Readme.md` |
| **ApiDocs** | "generate API docs", "document the API" | `workflows/ApiDocs.md` |
| **Changelog** | "generate changelog", "what changed" | `workflows/Changelog.md` |
| **Sync** | "sync docs", "docs are outdated" | `workflows/Sync.md` |

## Examples

**Example 1: Generate all documentation for a project**
```
User: "Generate docs for this project"
-> Invokes Generate workflow
-> Calls SystemMap:Prime to load codebase context
-> Analyzes what docs exist vs what's needed
-> Generates README.md, API.md as needed
-> Reports what was created/updated
```

**Example 2: Update README after changes**
```
User: "Update the README to reflect recent changes"
-> Invokes Readme workflow
-> Loads current README.md
-> Calls SystemMap:Prime for current codebase state
-> Identifies sections needing updates
-> Proposes changes for approval
-> Updates README.md
```

**Example 3: Generate API documentation**
```
User: "Document the REST API"
-> Invokes ApiDocs workflow
-> Scans for route definitions, controllers, handlers
-> Extracts endpoints, methods, parameters, responses
-> Generates structured API.md with examples
-> Includes request/response schemas
```

**Example 4: Generate changelog from commits**
```
User: "Generate a changelog for the last release"
-> Invokes Changelog workflow
-> Analyzes git history since last tag
-> Categorizes commits (features, fixes, breaking changes)
-> Generates CHANGELOG.md entry
-> Follows Keep a Changelog format
```

## Document Types

### README.md
- Project overview and purpose
- Installation instructions
- Quick start / usage examples
- Configuration options
- Contributing guidelines
- License

**Template:** `templates/ReadmeTemplate.md`

### API.md
- Endpoint documentation
- Request/response formats
- Authentication requirements
- Error codes
- Usage examples with curl/code

**Template:** `templates/ApiDocsTemplate.md`

### CHANGELOG.md
- Version history
- Features added
- Bugs fixed
- Breaking changes
- Migration guides

**Template:** `templates/ChangelogTemplate.md`

## Integration with SystemMap

DocGen depends on SystemMap for codebase understanding:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   DocGen    │────>│  SystemMap  │────>│   ai.md     │
│  (human     │     │  :Prime     │     │  (context)  │
│   docs)     │     └─────────────┘     └─────────────┘
└─────────────┘
       │
       v
┌─────────────┐
│  README.md  │
│  API.md     │
│ CHANGELOG   │
└─────────────┘
```

**Workflow:**
1. DocGen receives "generate docs" request
2. Calls SystemMap:Prime to understand codebase
3. Uses loaded context to generate human docs
4. Ensures consistency with ai.md understanding

## Quality Standards

Generated documentation must:

- [ ] Be accurate to current code state
- [ ] Include working examples
- [ ] Follow project's existing doc style (if present)
- [ ] Be readable by target audience (devs, users, etc.)
- [ ] Include dates/versions for freshness tracking

## Configuration

DocGen respects project-level configuration in `.docgen.json` (optional):

```json
{
  "readme": {
    "sections": ["overview", "install", "usage", "api", "contributing"],
    "badges": true
  },
  "api": {
    "format": "markdown",
    "includeExamples": true,
    "groupBy": "resource"
  },
  "changelog": {
    "format": "keepachangelog",
    "unreleased": true
  }
}
```

## Quality Gate (Judge Integration)

**Before delivering generated documentation, apply judge gate evaluation.**

### When Gate Applies
- README.md generation complete
- API.md generation complete
- CHANGELOG.md generation complete
- Any substantive documentation output

### Gate Protocol
1. Read `${PAI_DIR}/Skills/CORE/workflows/JudgeGate.md`
2. Output type: `documentation`
3. Priority failure modes: FM2 (Assertion without demonstration), FM4 (Calibration), FM6 (Task completion verification)
4. Run evaluation protocol

### Critical Checks for Documentation
- **FM2:** Every documented feature must exist in code - "Show me the code that implements this documented feature"
- **FM4:** Don't overclaim capabilities - if a feature is partial, document it as partial
- **FM6:** Verify documentation actually matches current codebase state

### Verdict Handling
- **PASS** → Deliver documentation to user
- **REVISE** → Fix inaccuracies, verify against code, re-evaluate
- **REJECT** → Re-analyze codebase, regenerate from scratch
- Maximum 2 iterations before delivering with caveats

### Gate Bypass
User can say "skip judge", "just give me the output", or "no gate" to bypass evaluation

---

## Files

| File | Purpose |
|------|---------|
| `workflows/Generate.md` | Main entry point, orchestrates doc generation |
| `workflows/Readme.md` | README-specific generation |
| `workflows/ApiDocs.md` | API documentation generation |
| `workflows/Changelog.md` | Changelog generation from git |
| `workflows/Sync.md` | Detect and fix doc drift |
| `templates/ReadmeTemplate.md` | README structure template |
| `templates/ApiDocsTemplate.md` | API docs structure template |
| `templates/ChangelogTemplate.md` | Changelog structure template |
