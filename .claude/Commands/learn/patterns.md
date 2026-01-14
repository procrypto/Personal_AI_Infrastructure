---
description: View detected patterns from PAI analytics
argument: --skill X --type Y --limit N
---

# /learn patterns

View patterns detected by PAI's self-learning system.

## Instructions

1. Query the analytics database at `~/.claude/Analytics/analytics.db`
2. Filter patterns based on provided options:
   - `--skill <name>`: Filter by skill name (Research, Engineer, etc.)
   - `--type <type>`: Filter by pattern type (success, failure, behavioral)
   - `--limit <n>`: Number of patterns to show (default: 20)
3. Format and display results grouped by type

## Execution

Run the following to get patterns:

```bash
cd ~/.claude/Analytics && bun run pattern-detector.ts list
```

Or query directly:

```bash
cd ~/.claude/Analytics && bun -e "
import { getAnalyticsDB, closeAnalyticsDB } from './db.ts';

const db = getAnalyticsDB();
const patterns = db.query(\`
  SELECT id, type, category, name, recommendation,
         confidence_score, success_rate, sample_size
  FROM patterns
  ORDER BY
    CASE type WHEN 'failure' THEN 0 WHEN 'success' THEN 1 ELSE 2 END,
    confidence_score DESC
  LIMIT 20
\`);

console.log('\\n=== PAI Detected Patterns ===\\n');

const byType = { failure: [], success: [], behavioral: [] };
for (const p of patterns) {
  byType[p.type]?.push(p);
}

if (byType.failure.length > 0) {
  console.log('FAILURE PATTERNS (to avoid):');
  for (const p of byType.failure) {
    console.log(\`  [\${p.id}] \${p.name}\`);
    console.log(\`    → \${p.recommendation}\`);
    console.log(\`    Confidence: \${p.confidence_score ? (p.confidence_score * 100).toFixed(0) + '%' : 'N/A'} | Sample: \${p.sample_size}\\n\`);
  }
}

if (byType.success.length > 0) {
  console.log('SUCCESS PATTERNS (recommended):');
  for (const p of byType.success) {
    console.log(\`  [\${p.id}] \${p.name}\`);
    console.log(\`    → \${p.recommendation}\`);
    console.log(\`    Confidence: \${p.confidence_score ? (p.confidence_score * 100).toFixed(0) + '%' : 'N/A'} | Sample: \${p.sample_size}\\n\`);
  }
}

if (byType.behavioral.length > 0) {
  console.log('BEHAVIORAL PATTERNS (context):');
  for (const p of byType.behavioral.slice(0, 10)) {
    console.log(\`  [\${p.id}] \${p.name}\`);
    console.log(\`    → \${p.recommendation}\`);
    console.log(\`    Confidence: \${p.confidence_score ? (p.confidence_score * 100).toFixed(0) + '%' : 'N/A'} | Sample: \${p.sample_size}\\n\`);
  }
}

closeAnalyticsDB();
"
```

## Output Format

Present patterns grouped by type:

1. **FAILURE PATTERNS** (things to avoid) - Red/warning emphasis
2. **SUCCESS PATTERNS** (recommended approaches) - Green/positive emphasis
3. **BEHAVIORAL PATTERNS** (context/information) - Neutral

For each pattern show:
- Pattern ID (e.g., [SEQ-001])
- Pattern name
- Recommendation
- Confidence score and sample size
