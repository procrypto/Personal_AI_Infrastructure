---
description: Run analytics on session data
argument: --today --days N
---

# /learn analyze

Run or re-run ETL and pattern detection on session data.

## Instructions

1. Parse options to determine scope (today, N days, or specific session)
2. Run ETL pipeline to process JSONL events
3. Run pattern detector to identify patterns
4. Display summary of what was processed

## Execution

For analyzing today's data:
```bash
cd ~/.claude/Analytics && bun run etl-pipeline.ts today && bun run pattern-detector.ts detect
```

For analyzing last N days:
```bash
cd ~/.claude/Analytics && bun run etl-pipeline.ts run 7 && bun run pattern-detector.ts detect
```

## Output

After running, show:
1. Number of files processed
2. Sessions, tool usages, agent spawns extracted
3. Patterns detected by category
4. Database row counts
