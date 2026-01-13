# Registry Workflow

Manage the central knowledge registry - view systems, check gaps, update entries.

## Inputs

- **action**: `list` | `gaps` | `update` | `remove` (default: `list`)
- **system**: System name (required for `update` and `remove`)

## Registry Location

```
~/Documents/Knowledge/
├── registry.md              # Master index
├── cross-system/            # Relationship maps
│   ├── data-flows.md
│   └── dependencies.md
└── systems/                 # Per-system knowledge
    └── {system-name}/
        └── context.md
```

## Actions

### List (`list`)

Display all registered systems with status.

```markdown
# Knowledge Registry

| System | Path | Last Updated | Quality |
|--------|------|--------------|---------|
| web-terminal | ~/Documents/BONKbot/github/web-terminal | 2024-01-10 | Good |
| web-api | ~/Documents/BONKbot/github/web-api | 2024-01-08 | Needs Update |
| frontend | ~/Documents/BONKbot/github/frontend | - | Not Mapped |

## Cross-System Maps
- data-flows.md (last updated: 2024-01-09)
- dependencies.md (last updated: 2024-01-05)
```

### Gaps (`gaps`)

Analyze documentation quality across all systems.

```
For each registered system:
1. Check if ai.md exists
2. Validate against template checklist
3. Check freshness (modified date vs last discovery)
4. Identify missing sections

Output:
## Documentation Gaps Report

### Critical (No ai.md)
- frontend: No documentation exists
- pum3: No documentation exists

### Incomplete (Missing Sections)
- web-api: Missing Capabilities section, no cross-system context
- shared-lib: Missing Common Tasks, no extension points

### Stale (Potentially Outdated)
- web-terminal: ai.md older than recent code changes

### Recommendations
1. Run Discover on frontend (highest impact)
2. Update web-api capabilities section
3. Re-run Discover on web-terminal to refresh
```

### Update (`update`)

Update a system's registry entry.

```
1. Verify system exists in registry
2. Update metadata:
   - Last updated timestamp
   - Quality assessment
   - Notes/flags
3. Optionally trigger re-discovery
```

### Remove (`remove`)

Remove a system from the registry.

```
1. Confirm removal
2. Remove from registry.md
3. Optionally archive systems/{name}/ context
4. Update cross-system maps to remove references
```

## Registry Schema

### registry.md Format

```markdown
# Knowledge Registry

Central index of all mapped systems.

## Systems

### web-terminal
- **Path**: ~/Documents/BONKbot/github/web-terminal
- **Type**: Backend Service (Rust)
- **ai.md**: Yes
- **Last Discovered**: 2024-01-10
- **Quality**: Good
- **Notes**: Primary data backend

### web-api
- **Path**: ~/Documents/BONKbot/github/web-api
- **Type**: Backend Service (TypeScript)
- **ai.md**: Yes
- **Last Discovered**: 2024-01-08
- **Quality**: Needs Update
- **Notes**: User-facing API, auth, orders

### frontend
- **Path**: ~/Documents/BONKbot/github/frontend
- **Type**: Frontend (TypeScript/React)
- **ai.md**: No
- **Last Discovered**: Never
- **Quality**: Not Mapped
- **Notes**: Main user interface

## Quick Reference

| System | Primary Purpose | Key Interface |
|--------|-----------------|---------------|
| web-terminal | Market data | WebSocket, REST |
| web-api | User operations | REST API |
| frontend | User interface | Consumes APIs |
```

### Per-System Context (systems/{name}/context.md)

```markdown
# {System Name} - Synthesized Context

## Discovery Summary
- First discovered: {date}
- Last updated: {date}
- Discovery depth: {quick|standard|thorough}

## Key Learnings
[Notes accumulated from working with this system]

- Found that X pattern is used for Y
- The Z endpoint is the main integration point
- Watch out for: [gotcha]

## Frequently Accessed
[Files/paths accessed often when working here]

- `path/to/commonly/used/file.rs`
- `another/important/location/`

## Session History
[Pointer to relevant session logs if available]
```

## Output

- **list**: Formatted registry display
- **gaps**: Gap analysis report with recommendations
- **update**: Confirmation of update
- **remove**: Confirmation of removal

## Example Invocations

```
User: "Show me all mapped systems"
-> list action
-> Displays registry table

User: "Which repos need documentation?"
-> gaps action
-> Produces gap analysis report

User: "Update web-terminal as freshly documented"
-> update action on web-terminal
-> Updates timestamp and quality
```
