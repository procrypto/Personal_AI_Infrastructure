---
description: View PAI analytics metrics and statistics
argument: --days N
---

# /learn metrics

View performance metrics from PAI's analytics system.

## Instructions

1. Query the analytics database at `~/.claude/Analytics/analytics.db`
2. Calculate metrics for the specified time period (default: 30 days)
3. Display tool usage, session stats, and agent performance

## Execution

```bash
cd ~/.claude/Analytics && bun -e "
import { getAnalyticsDB, closeAnalyticsDB } from './db.ts';

const days = 30;
const since = Date.now() - days * 24 * 60 * 60 * 1000;
const db = getAnalyticsDB();

console.log(\`\\n=== PAI Analytics Metrics (Last \${days} days) ===\\n\`);

// Tool usage
console.log('TOOL USAGE:');
const tools = db.query(\`
  SELECT tool_name,
         COUNT(*) as total,
         SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successes
  FROM tool_usage
  WHERE timestamp >= ?
  GROUP BY tool_name
  ORDER BY total DESC
  LIMIT 10
\`, [since]);

for (const t of tools) {
  const rate = t.total > 0 ? ((t.successes / t.total) * 100).toFixed(1) : 'N/A';
  console.log(\`  \${t.tool_name.padEnd(12)} \${String(t.total).padStart(5)} calls | \${rate}% success\`);
}

// Session stats
console.log('\\nSESSIONS:');
const sessions = db.query(\`
  SELECT COUNT(*) as total,
         AVG(duration_ms) as avg_duration,
         AVG(context_compactions) as avg_compactions
  FROM sessions
  WHERE start_time >= ?
\`, [since])[0];

const avgMin = sessions.avg_duration ? Math.round(sessions.avg_duration / 60000) : 0;
console.log(\`  Total: \${sessions.total} sessions\`);
console.log(\`  Avg Duration: \${avgMin} minutes\`);
console.log(\`  Avg Compactions: \${sessions.avg_compactions?.toFixed(1) || '0'}/session\`);

// Agent stats
console.log('\\nAGENTS:');
const agents = db.query(\`
  SELECT agent_type, COUNT(*) as total
  FROM agent_spawns
  WHERE timestamp >= ? AND agent_type != 'unknown'
  GROUP BY agent_type
  ORDER BY total DESC
  LIMIT 10
\`, [since]);

for (const a of agents) {
  console.log(\`  \${a.agent_type.padEnd(15)} \${a.total} spawns\`);
}

// Pattern summary
console.log('\\nPATTERNS:');
const patterns = db.query('SELECT type, COUNT(*) as count FROM patterns GROUP BY type');
for (const p of patterns) {
  console.log(\`  \${p.type.padEnd(12)} \${p.count} detected\`);
}

closeAnalyticsDB();
"
```
