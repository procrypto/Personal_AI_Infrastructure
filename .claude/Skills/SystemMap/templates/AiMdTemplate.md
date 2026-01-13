# ai.md Template

This is the canonical template for agent-centric documentation. Every repo should have an `ai.md` at its root that follows this structure.

---

## Template Structure

```markdown
# Context for [System Name]

Context and rules for Claude Code sessions working in this repository.

## Project Overview

[2-4 sentences describing what this system does, its primary purpose, and why it exists. Focus on the "what" and "why", not implementation details.]

[1-2 sentences on critical constraints or priorities (e.g., "Low latency and high throughput are of critical importance.")]

## Architecture

### Tech Stack

[List the primary technologies. For each, include a brief note on what role it plays.]

| Component | Technology | Purpose |
|-----------|------------|---------|
| [Layer] | [Tech] | [What it does in this system] |

### Services / Components

[If applicable, list the main services, containers, or deployable units.]

| Service | Purpose |
|---------|---------|
| `service-name` | [What it does] |

### Key Directories

```
directory-structure/
  showing/
    where-to-find/    # Important things
    and-what-they/    # Contain
```

## Capabilities

[What can this system DO? This section answers "what can we build with this" and "how would new things plug in".]

### Data Sources

| Source | Type | Access Pattern |
|--------|------|----------------|
| [Name] | [DB/API/Stream/etc] | [How to query/access] |

### APIs / Interfaces

| Interface | Type | Purpose |
|-----------|------|---------|
| [Name] | [REST/WS/NATS/etc] | [What it exposes] |

### Extension Points

[Where and how can this system be extended? What patterns exist for adding new functionality?]

- [Extension point 1: how to add X]
- [Extension point 2: how to integrate Y]

## Working in This Repo

### Standards & Conventions

[Coding standards, conventions, and expectations specific to this repo.]

- [Convention 1]
- [Convention 2]

### Common Tasks

[How to do the things people commonly need to do.]

#### Local Development

```bash
# How to set up and run locally
```

#### Finding Code

- [Thing to find]: `path/to/look`
- [Another thing]: `another/path`

### Things to Avoid

- [Anti-pattern 1]
- [Anti-pattern 2]

## Related Documentation

Reference the following files for additional details:

- [Doc Name](path/to/doc.md) - What it covers
- [Another Doc](path/to/another.md) - What it covers

## Cross-System Context

[If applicable, how does this system relate to other systems? What does it consume? What consumes it?]

### Upstream Dependencies

| System | What We Get |
|--------|-------------|
| [System] | [Data/service we consume] |

### Downstream Consumers

| System | What They Get |
|--------|---------------|
| [System] | [Data/service we provide] |
```

---

## Quality Checklist

A good ai.md should answer these questions:

### For Understanding
- [ ] What does this system do? (Project Overview)
- [ ] What technologies power it? (Tech Stack)
- [ ] How is it organized? (Key Directories)
- [ ] What can it do for us? (Capabilities)

### For Working
- [ ] How do I run it locally? (Common Tasks)
- [ ] Where do I find X? (Finding Code)
- [ ] What patterns should I follow? (Standards)
- [ ] What should I avoid? (Things to Avoid)

### For Extending
- [ ] How would new features plug in? (Extension Points)
- [ ] What data is available? (Data Sources)
- [ ] What interfaces exist? (APIs)
- [ ] How does this connect to other systems? (Cross-System Context)

### For Agents
- [ ] Can an agent be primed from this doc alone?
- [ ] Are links to deeper docs provided?
- [ ] Are patterns explicit enough to follow without ambiguity?

---

## Principles

1. **Entry Point, Not Encyclopedia** - ai.md is the door, not the library. Link to depth, don't duplicate.

2. **Capability-Oriented** - Focus on what the system CAN DO, not just what it IS.

3. **Agent-Readable** - Write for AI agents as primary consumers. Be explicit, structured, parseable.

4. **Living Document** - Update when the system changes. Reference canonical sources (code, configs) rather than duplicating.

5. **Cross-Reference, Don't Duplicate** - If it exists in code comments or another doc, link to it.
