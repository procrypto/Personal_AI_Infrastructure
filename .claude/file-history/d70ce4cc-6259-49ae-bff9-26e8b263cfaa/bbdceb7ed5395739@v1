---
description: View Judge evaluation statistics
argument: --skill X --days N
---

# /learn judge

View Judge verdict statistics and failure mode distribution.

## Instructions

1. Query judge_verdicts table from `~/.claude/Analytics/analytics.db`
2. Calculate pass/revise/reject rates
3. Show failure mode distribution (FM1-FM7)
4. Break down by skill if available

## Execution

```bash
cd ~/.claude/Analytics && bun -e "
import { getAnalyticsDB, closeAnalyticsDB } from './db.ts';

const days = 30;
const since = Date.now() - days * 24 * 60 * 60 * 1000;
const db = getAnalyticsDB();

console.log(\`\\n=== Judge Statistics (Last \${days} days) ===\\n\`);

// Overall verdicts
const verdicts = db.query(\`
  SELECT
    COUNT(*) as total,
    SUM(CASE WHEN verdict = 'PASS' THEN 1 ELSE 0 END) as pass,
    SUM(CASE WHEN verdict = 'REVISE' THEN 1 ELSE 0 END) as revise,
    SUM(CASE WHEN verdict = 'REJECT' THEN 1 ELSE 0 END) as reject
  FROM judge_verdicts
  WHERE timestamp >= ?
\`, [since])[0];

if (verdicts.total === 0) {
  console.log('No Judge verdicts recorded yet.');
  console.log('Verdicts are captured when Judge evaluations complete.');
  process.exit(0);
}

console.log('VERDICTS:');
const pct = (n) => verdicts.total > 0 ? ((n / verdicts.total) * 100).toFixed(0) : 0;
console.log(\`  PASS:   \${verdicts.pass} (\${pct(verdicts.pass)}%)\`);
console.log(\`  REVISE: \${verdicts.revise} (\${pct(verdicts.revise)}%)\`);
console.log(\`  REJECT: \${verdicts.reject} (\${pct(verdicts.reject)}%)\`);

// Failure mode distribution
console.log('\\nFAILURE MODES:');
const fmRows = db.query(\`
  SELECT failure_modes FROM judge_verdicts
  WHERE failure_modes IS NOT NULL AND timestamp >= ?
\`, [since]);

const fmCounts = new Map();
for (const row of fmRows) {
  try {
    const modes = JSON.parse(row.failure_modes);
    for (const fm of modes) {
      fmCounts.set(fm, (fmCounts.get(fm) || 0) + 1);
    }
  } catch {}
}

const sorted = [...fmCounts.entries()].sort((a, b) => b[1] - a[1]);
if (sorted.length === 0) {
  console.log('  No failure modes recorded');
} else {
  for (const [fm, count] of sorted) {
    console.log(\`  \${fm}: \${count} occurrences\`);
  }
}

// By skill
console.log('\\nBY SKILL:');
const skills = db.query(\`
  SELECT skill_name,
         COUNT(*) as total,
         SUM(CASE WHEN verdict = 'PASS' THEN 1 ELSE 0 END) as pass
  FROM judge_verdicts
  WHERE skill_name IS NOT NULL AND timestamp >= ?
  GROUP BY skill_name
  ORDER BY total DESC
\`, [since]);

for (const s of skills) {
  const rate = s.total > 0 ? ((s.pass / s.total) * 100).toFixed(0) : 0;
  console.log(\`  \${s.skill_name}: \${rate}% pass rate (\${s.total} evaluations)\`);
}

closeAnalyticsDB();
"
```
