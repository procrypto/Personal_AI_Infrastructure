---
name: SystemMap
description: Organizational technical memory system for rapid system comprehension. USE WHEN user wants to map a codebase, understand a system, create ai.md documentation, prime context for a repo, discover system capabilities, OR build organizational knowledge. Also USE WHEN user mentions system discovery, repo documentation, cross-system mapping, or capability analysis.
---

# SystemMap

Rapid system comprehension and organizational technical memory. Maps codebases, discovers capabilities, produces agent-centric documentation, and maintains cross-system knowledge.

## Authoritative Sources

- **ai.md Template:** `${PAI_DIR}/Skills/SystemMap/templates/AiMdTemplate.md`
- **Knowledge Registry:** `~/Documents/Knowledge/` (central organizational brain)

## Workflow Routing

**When executing a workflow, do BOTH of these:**

1. **Call the notification script** (for observability tracking):
   ```bash
   ~/.claude/Tools/SkillWorkflowNotification WORKFLOWNAME SystemMap
   ```

2. **Output the text notification** (for user visibility):
   ```
   Running the **WorkflowName** workflow from the **SystemMap** skill...
   ```

| Workflow | Trigger | File |
|----------|---------|------|
| **Discover** | "map this repo", "create ai.md", "document this system" | `workflows/Discover.md` |
| **Prime** | "prime me on", "load context for", "what does X do" | `workflows/Prime.md` |
| **Registry** | "show all systems", "update registry", "system gaps" | `workflows/Registry.md` |
| **CrossMap** | "how does X connect to Y", "system dependencies", "data flows" | `workflows/CrossMap.md` |

## Examples

**Example 1: Map a new repository**
```
User: "Map the web-terminal repo and create an ai.md"
-> Invokes Discover workflow
-> Explores codebase structure, configs, existing docs
-> Extracts capabilities, data sources, extension points
-> Produces draft ai.md following template
-> Registers system in central knowledge registry
```

**Example 2: Prime for working in a system**
```
User: "Prime me on the data API"
-> Invokes Prime workflow
-> Locates ai.md and related docs
-> Loads relevant context into working memory
-> Provides concise summary of capabilities and patterns
-> Ready to work with full context
```

**Example 3: Understand cross-system relationships**
```
User: "How does the frontend consume data from web-terminal?"
-> Invokes CrossMap workflow
-> Reads both systems' documentation
-> Maps data flows and interfaces
-> Produces relationship diagram
-> Identifies integration points
```

**Example 4: Find documentation gaps**
```
User: "Which repos are missing good documentation?"
-> Invokes Registry workflow
-> Scans registered systems
-> Evaluates ai.md quality against checklist
-> Reports gaps with specific recommendations
```

## Core Concepts

### The Knowledge Hierarchy

```
~/Documents/Knowledge/           # Central organizational brain
├── registry.md                  # Index of all known systems
├── cross-system/                # Cross-system maps and flows
│   ├── data-flows.md
│   └── service-dependencies.md
└── systems/                     # Per-system knowledge
    ├── web-terminal/
    │   └── context.md           # Extracted/synthesized knowledge
    └── frontend/
        └── context.md
```

### Per-Repo Documentation

Each repository maintains its own:
- `ai.md` - Agent-centric entry point (lives in repo)
- Linked detailed docs (backend spec, API docs, etc.)

### CRITICAL: Documentation Sync Rule

**When updating central context (`~/Documents/Knowledge/systems/*/context.md`), you MUST also update the corresponding repo's `ai.md` file.**

This is a mandatory sync - the two sources must stay consistent:

| Central Context | Repo Documentation |
|-----------------|-------------------|
| `~/Documents/Knowledge/systems/{system}/context.md` | `{repo_path}/ai.md` |

**Why this matters:**
- Central context is for cross-system analysis and PAI's organizational memory
- Repo ai.md is for agents working IN that repo who may not have access to central knowledge
- Discrepancies cause incorrect assumptions and wasted investigation time

**Sync checklist when updating context:**
1. Update central `context.md` with new findings
2. Locate the repo's `ai.md` file
3. Update relevant sections (especially Cross-System Context, capabilities, constraints)
4. Ensure verification dates match in both places

### Discovery vs Prime

- **Discover**: Deep exploration, produces artifacts, updates registry
- **Prime**: Quick context loading for immediate work

## Integration

### With GSD

SystemMap complements GSD workflows:
- Run `Discover` before `gsd:new-project` to understand existing codebase
- Use `Prime` before `gsd:plan-phase` to load relevant context
- Cross-reference knowledge registry in project planning

### With Research Agents

Discovery workflow can spawn research agents to:
- Fetch external API documentation
- Find relevant library patterns
- Investigate unfamiliar technologies

## Quality Gate (Judge Integration)

**Before delivering ai.md or system documentation, apply judge gate evaluation.**

### When Gate Applies
- ai.md generation complete (Discover workflow)
- Cross-system mapping complete (CrossMap workflow)
- Registry updates with new system entries
- Any substantive documentation output

### Gate Protocol
1. Read `${PAI_DIR}/Skills/CORE/workflows/JudgeGate.md`
2. Output type: `documentation`
3. Priority failure modes: FM2 (Assertion without demonstration), FM4 (Calibration), FM6 (Task completion)
4. Run evaluation protocol

### Critical Checks for SystemMap
- **FM2:** Every capability listed must be verified against actual code - "Show me the code that implements this capability"
- **FM4:** Don't overclaim - if a feature is partial or experimental, document it as such
- **FM6:** Verify ai.md sections actually match current codebase state (not stale)

### Spot-Check Protocol
Before delivering ai.md, verify at least:
1. One listed capability exists in code
2. Tech stack matches actual dependencies (package.json, go.mod, etc.)
3. Entry points listed are real files that exist

### Verdict Handling
- **PASS** → Deliver ai.md to user
- **REVISE** → Fix inaccuracies, verify against code, re-evaluate
- **REJECT** → Re-analyze codebase from scratch
- Maximum 2 iterations before delivering with caveats

### Gate Bypass
User can say "skip judge", "just give me the output", or "no gate" to bypass evaluation
