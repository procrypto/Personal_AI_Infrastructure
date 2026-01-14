# Prime Workflow

Load context for a system into working memory for immediate productive work.

## Inputs

- **system**: System name or repo path (required)
- **focus**: Optional focus area (e.g., "API endpoints", "data layer", "authentication")

## Process

### Step 1: Locate Documentation

```
1. Check if system is in registry:
   ~/Documents/Knowledge/registry.md

2. Find ai.md:
   - If repo path given: {repo_path}/ai.md
   - If system name given: Look up in registry for path
   - Fallback: Search ~/Documents/ for matching repo

3. If no ai.md exists:
   -> Suggest running Discover workflow first
   -> Or proceed with available docs (README, etc.)
```

### Step 2: Load Core Context

```
1. Read ai.md completely

2. Based on focus area, load relevant linked docs:
   - General: Load first 2-3 linked docs
   - Specific focus: Load docs matching focus area

3. Load from knowledge registry:
   ~/Documents/Knowledge/systems/{system}/context.md
   (Contains synthesized knowledge from previous sessions)
```

### Step 3: Load Cross-System Context (if relevant)

```
If focus involves integration or data flows:
1. Load relevant cross-system maps
2. Identify upstream/downstream systems
3. Brief summary of connection points
```

### Step 4: Synthesize Brief

```
Produce a working context brief:

## {System Name} - Working Context

### What This Is
[1-2 sentence summary]

### Key Capabilities
- [Capability 1]
- [Capability 2]
- [Capability 3]

### Where to Find Things
- [Common thing]: `path/to/it`
- [Another thing]: `another/path`

### Patterns to Follow
- [Pattern 1]
- [Pattern 2]

### Current Focus: {focus area}
[If focus specified, relevant details for that area]

### Quick Links
- [Relevant doc 1]
- [Relevant doc 2]
```

## Focus Areas

Common focus areas and what to load:

| Focus | Load |
|-------|------|
| `api` / `endpoints` | API docs, route definitions, request/response schemas |
| `data` / `database` | Schema docs, storage layer, query patterns |
| `auth` / `security` | Auth flows, permission models, security docs |
| `deploy` / `ops` | Deployment runbooks, infrastructure docs |
| `frontend` / `ui` | Component structure, state management, styling |
| `integration` | Cross-system maps, API contracts, data flows |

## Output

1. **Context loaded** - Relevant documentation read into session
2. **Working brief** - Concise summary output to user
3. **Ready state** - Agent prepared to work in this system

## Example Invocations

### Basic Prime
```
User: "Prime me on web-terminal"

-> Locates web-terminal in registry
-> Reads ai.md and BACKEND_API_AND_DATA.md
-> Loads stored context from knowledge base

Output:
## web-terminal - Working Context

### What This Is
Rust-based real-time cryptocurrency market data backend.
Processes Solana blockchain events, serves via REST/WebSocket.

### Key Capabilities
- Real-time trade streaming
- OHLCV candlestick data
- Token market data aggregation
- Holder statistics

### Where to Find Things
- API endpoints: `bin/web-server/src/api/`
- NATS topics: `crates/primitives/src/nats/topics.rs`
- ClickHouse tables: `crates/storage/src/clickhouse/`

### Patterns to Follow
- Result<T, E> for all fallible operations
- Structured logging with tracing
- Performance-first (avoid allocations in hot paths)
```

### Focused Prime
```
User: "Prime me on web-terminal, focus on the WebSocket layer"

-> Loads ai.md
-> Deep loads WebSocket-related sections from BACKEND_API_AND_DATA.md
-> Includes NATS topic patterns, WS endpoint handlers

Output:
[Focused brief on WebSocket implementation details]
```

### Cross-System Prime
```
User: "Prime me on how frontend consumes web-terminal"

-> Loads both systems
-> Focuses on interface points
-> Shows data flow from web-terminal to frontend

Output:
[Brief focused on the integration between systems]
```

## Session Persistence

After priming:
- Context remains available for the session
- Follow-up questions don't require re-priming
- Agent can reference loaded docs without re-reading

## When to Re-Prime

- Switching to a different system
- Changing focus area significantly
- Starting a new session
- System documentation has been updated
