# Readme Workflow

**Generate or update README.md for a project.**

## When to Use

- Project has no README.md
- README.md is outdated or incomplete
- User explicitly requests README update

## Process

### Step 1: Load Context

```
1. Call SystemMap:Prime to load codebase context
2. Read existing README.md if present
3. Identify project type and tech stack
```

### Step 2: Analyze Current State

**If README exists:**
- Parse into sections
- Identify which sections are outdated
- Note custom sections to preserve

**If README missing:**
- Full generation needed

### Step 3: Gather Information

Extract from codebase:

| Section | Source |
|---------|--------|
| Title | package.json name, directory name |
| Description | package.json description, ai.md |
| Installation | Package manager detection, install scripts |
| Usage | Main entry point, CLI help, examples/ |
| Configuration | .env.example, config files |
| API | Route files, OpenAPI spec |
| Contributing | CONTRIBUTING.md, .github/ |
| License | LICENSE file |

### Step 4: Generate/Update

**Load template:** `templates/ReadmeTemplate.md`

**Fill sections:**

```markdown
# {project_name}

{badges if configured}

{description from package.json or ai.md}

## Installation

{detected installation steps}

## Usage

{basic usage examples from entry points}

## Configuration

{environment variables and options}

## API Reference

{link to API.md if exists, or brief overview}

## Contributing

{from CONTRIBUTING.md or standard text}

## License

{from LICENSE file}
```

### Step 5: Preserve Custom Content

If updating existing README:
- Keep custom sections not in template
- Preserve user-added badges
- Maintain custom formatting choices

### Step 6: Write and Report

```
1. Write README.md
2. Show diff if updating
3. Report completion
```

## Quality Checks

- [ ] Title matches project name
- [ ] Description is meaningful (not placeholder)
- [ ] Installation steps are accurate
- [ ] At least one usage example
- [ ] All links are valid
- [ ] License matches LICENSE file

## Template Reference

Uses: `templates/ReadmeTemplate.md`
