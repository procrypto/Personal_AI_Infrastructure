# PAI Self-Learning System - Pattern Learning Implementation Plan

## Overview

Build a self-learning system focused on **Pattern Learning** - detecting what works/fails and auto-improving workflows through analytics and feedback loops.

**Storage:** Hybrid (local SQLite + JSON pattern files, optional cloud enhancement)
**Surfacing:** Both automatic context priming at session start AND on-demand commands

## Why This Design

**Why SQLite?**
- Already available on macOS (no dependencies)
- bun:sqlite is native and fast
- Queryable with SQL (aggregations, joins, trends)
- Single-file database, easy backup/restore
- JSON pattern files complement it for human-readable, git-trackable patterns

**Why not JSON-only?**
- Aggregation queries (e.g., "FM7 rate by skill") require iteration
- Trend analysis over time requires parsing all files
- SQLite handles this efficiently with indices

**Verified:** JSONL event structure confirmed - events contain `tool_name`, `tool_input`, `tool_response`, `session_id`, `timestamp`. ETL design is grounded in actual data.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  DATA COLLECTION (Existing)                                  │
│  capture-all-events.ts → ~/.claude/History/Raw-Outputs/     │
└─────────────────────────────┬───────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  ANALYTICS PROCESSING (New)                                  │
│  ETL Pipeline → Pattern Detector → Insight Generator        │
└─────────────────────────────┬───────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  STORAGE (New)                                               │
│  SQLite DB (analytics.db) + JSON Pattern Files              │
└─────────────────────────────┬───────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  SURFACING (New)                                             │
│  SessionStart Hook (auto-prime) + CLI Commands (/patterns)  │
└─────────────────────────────┬───────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  FEEDBACK LOOP (New)                                         │
│  Judge Integration → Learning Engine → Skill Updates        │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Foundation
**Create:**
- `~/.claude/Analytics/` directory structure
- `~/.claude/Analytics/schema.sql` - SQLite schema
- `~/.claude/Analytics/db.ts` - Database wrapper (bun:sqlite)
- `~/.claude/Analytics/etl-pipeline.ts` - JSONL → structured data

**Tables:** sessions, tool_usage, skill_invocations, agent_spawns, judge_verdicts, patterns, user_feedback, metrics

### Phase 2: Pattern Detection
**Create:**
- `~/.claude/Analytics/pattern-detector.ts` - Pattern identification algorithms
- `~/.claude/Analytics/patterns/` - JSON pattern storage (git-trackable)

**Detect:**
- Success patterns (tool sequences that work)
- Failure patterns (Judge rejection triggers by failure mode)
- Behavioral patterns (user preferences, project context)

### Phase 3: Judge Integration
**Create:**
- `~/.claude/Hooks/capture-judge-verdict.ts` - Extract CAPTURE from verdicts

**Modify:**
- `~/.claude/Skills/CORE/judge.md` - Add structured CAPTURE field to verdict format

**Track:** FM1-FM7 failure mode frequency per skill, revision counts, quality scores

### Phase 4: Context Priming
**Create:**
- `~/.claude/Hooks/prime-session-context.ts` - Auto-load patterns at session start
- `~/.claude/Analytics/context-builder.ts` - Build relevant context messages

**Logic:**
1. Detect project from cwd
2. Query patterns DB for relevant insights
3. Build context: recent successes, failure modes to avoid, skill learnings
4. Inject via system message at SessionStart

### Phase 5: CLI Commands
**Create Skill:** `~/.claude/Skills/Learn/`

**Commands:**
- `/learn patterns [--skill X]` - View detected patterns
- `/learn metrics [--days N]` - View success/failure rates
- `/learn recall [topic]` - Find relevant past learnings
- `/learn trends [--weeks N]` - View improvement over time
- `/learn analyze [--session ID]` - Manual analysis trigger

### Phase 6: Self-Improvement Loop
**Create:**
- `~/.claude/Analytics/skill-optimizer.ts` - Generate skill improvement proposals
- `~/.claude/Analytics/proposals/` - Pending skill updates

**Workflow:**
1. Pattern detector identifies high failure rate
2. Generate proposal with specific fix
3. User reviews via `/learn proposals`
4. Apply with `/learn apply [proposal-id]`
5. Monitor impact, validate improvement

## Key Files to Create

| File | Purpose |
|------|---------|
| `Analytics/schema.sql` | SQLite database schema |
| `Analytics/db.ts` | Database connection wrapper |
| `Analytics/etl-pipeline.ts` | Transform JSONL to structured data |
| `Analytics/pattern-detector.ts` | Identify success/failure patterns |
| `Hooks/capture-judge-verdict.ts` | Extract Judge CAPTURE data |
| `Hooks/prime-session-context.ts` | Auto-load patterns at session start |
| `Skills/Learn/SKILL.md` | Learning skill with CLI commands |

## Key Files to Modify

| File | Change |
|------|--------|
| `Skills/CORE/judge.md` | Add CAPTURE field to verdict structure |
| `settings.json` | Add new hooks to SessionStart, SessionEnd |
| `Hooks/capture-session-summary.ts` | Trigger ETL after session |

## SQLite Schema (Core Tables)

```sql
CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  start_time INTEGER, end_time INTEGER, duration_ms INTEGER,
  project_path TEXT, success BOOLEAN, completion_quality TEXT
);

CREATE TABLE judge_verdicts (
  id INTEGER PRIMARY KEY, session_id TEXT, skill_name TEXT,
  verdict TEXT, failure_modes TEXT, iteration_count INTEGER,
  timestamp INTEGER
);

CREATE TABLE patterns (
  id TEXT PRIMARY KEY, type TEXT, category TEXT,
  trigger_conditions TEXT, confidence_score REAL,
  success_rate REAL, sample_size INTEGER,
  recommendation TEXT, auto_apply BOOLEAN
);
```

## Pattern Example

```json
{
  "id": "P-042",
  "type": "failure",
  "category": "judge_verdict",
  "name": "Research FM7 - Unverified Claims",
  "trigger_conditions": { "skill": "Research", "failure_mode": "FM7" },
  "confidence_score": null,  // Calculated from sample_size, not fabricated
  "success_rate": null,      // Measured from actual data
  "sample_size": 0,          // Increments as events are captured
  "recommendation": "Always trace claims to primary source before stating confidently",
  "auto_apply": false        // Only true when confidence_score > 0.8 AND sample_size > 10
}
```

**Note:** Numbers in patterns are computed from actual data, never fabricated. Confidence requires sufficient sample size.

## Context Priming Output (Example)

```
SESSION CONTEXT (Auto-Primed):

PROJECT: token-analysis-autopilot
LEARNINGS:
- Research skill: FM7 is most common failure mode → trace claims to source
- Engineer agent: Test-first approach correlates with fewer revisions
- Tool sequence: Read → Grep → Edit is common success pattern

PATTERNS TO APPLY:
- [P-001] Run bun test after TypeScript changes (high success correlation)
- [P-042] Verify data structures before claims (learned from past FM7 rejections)
```

**Note:** Context priming shows qualitative patterns, not fabricated percentages. Actual metrics come from measured data.

## Success Metrics

**Methodology:** Measure baseline first (Phase 1), then track delta over time. No arbitrary targets.

| Metric | What We Measure | How |
|--------|-----------------|-----|
| **Judge Pass Rate** | % of outputs that pass on first attempt, by skill | Count verdicts in `judge_verdicts` table |
| **Failure Mode Distribution** | Which FM1-FM7 trigger most often, by skill | Aggregate `failure_modes` column |
| **Time-to-Completion** | Session duration by task type | `end_time - start_time` in `sessions` |
| **Tool Error Rate** | % of tool calls that fail | `success = false` in `tool_usage` |
| **Revision Count** | Average iterations before PASS | `iteration_count` in `judge_verdicts` |

**Success = Measurable improvement vs baseline.** Specific targets set after baseline is established.

## Verification Plan

1. **Phase 1:** Run ETL on existing JSONL files, verify data extraction
2. **Phase 2:** Generate patterns from historical data, manually validate accuracy
3. **Phase 3:** Test Judge capture on sample verdicts, confirm FM tracking
4. **Phase 4:** Test context priming, verify relevant patterns surface
5. **Phase 5:** Test all CLI commands, verify query results
6. **End-to-end:** Run 10 sessions with system active, measure baseline metrics

## Tech Stack

- **Runtime:** bun (PAI standard)
- **Database:** SQLite via bun:sqlite
- **Storage:** JSON files for patterns (git-trackable)
- **Hooks:** TypeScript (existing infrastructure)
