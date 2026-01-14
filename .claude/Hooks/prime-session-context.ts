#!/usr/bin/env bun
/**
 * PAI Session Context Primer Hook
 *
 * Runs at SessionStart to inject relevant patterns and learnings into the session.
 * Queries the analytics database for patterns applicable to the current project/context.
 *
 * Output is injected as a system reminder that appears in the session context.
 */

import { existsSync } from "fs";
import { join, basename } from "path";

// Import analytics
const ANALYTICS_DIR = join(process.env.HOME || "", ".claude", "Analytics");

// Types
interface HookPayload {
  session_id: string;
  transcript_path: string;
  cwd: string;
  source?: string;
}

interface Pattern {
  id: string;
  type: "success" | "failure" | "behavioral";
  category: string;
  name: string;
  recommendation: string;
  confidence_score: number | null;
  success_rate: number | null;
  sample_size: number;
}

/**
 * Get patterns for the current context from the analytics database
 */
async function getPatternsForContext(projectPath: string): Promise<Pattern[]> {
  const dbPath = join(ANALYTICS_DIR, "db.ts");
  if (!existsSync(dbPath)) {
    return [];
  }

  try {
    const { getAnalyticsDB, closeAnalyticsDB } = await import(dbPath);
    const db = getAnalyticsDB();

    // Get high-confidence patterns
    const patterns = db.query<Pattern>(`
      SELECT
        id, type, category, name, recommendation,
        confidence_score, success_rate, sample_size
      FROM patterns
      WHERE confidence_score >= 0.7 AND sample_size >= 5
      ORDER BY
        CASE type WHEN 'failure' THEN 0 WHEN 'success' THEN 1 ELSE 2 END,
        confidence_score DESC
      LIMIT 10
    `);

    // Get project-specific patterns if applicable
    const projectName = basename(projectPath);
    const projectPatterns = db.query<Pattern>(`
      SELECT
        id, type, category, name, recommendation,
        confidence_score, success_rate, sample_size
      FROM patterns
      WHERE applicable_to LIKE ?
      ORDER BY confidence_score DESC
      LIMIT 5
    `, [`%"project:${projectName}"%`]);

    closeAnalyticsDB();

    // Combine and deduplicate
    const allPatterns = [...patterns, ...projectPatterns];
    const seen = new Set<string>();
    return allPatterns.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  } catch (e) {
    // Analytics not available, that's OK
    return [];
  }
}

/**
 * Get Judge statistics if available
 */
async function getJudgeStats(): Promise<{ total: number; passRate: number; topFailureModes: string[] } | null> {
  const dbPath = join(ANALYTICS_DIR, "db.ts");
  if (!existsSync(dbPath)) {
    return null;
  }

  try {
    const { getAnalyticsDB, closeAnalyticsDB } = await import(dbPath);
    const db = getAnalyticsDB();

    const stats = db.query<{ total: number; pass: number }>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN verdict = 'PASS' THEN 1 ELSE 0 END) as pass
      FROM judge_verdicts
      WHERE timestamp >= ?
    `, [Date.now() - 30 * 24 * 60 * 60 * 1000])[0];

    if (!stats || stats.total === 0) {
      closeAnalyticsDB();
      return null;
    }

    // Get top failure modes
    const fmStats = db.query<{ failure_modes: string }>(`
      SELECT failure_modes
      FROM judge_verdicts
      WHERE failure_modes IS NOT NULL
        AND timestamp >= ?
    `, [Date.now() - 30 * 24 * 60 * 60 * 1000]);

    const fmCounts = new Map<string, number>();
    for (const row of fmStats) {
      try {
        const modes = JSON.parse(row.failure_modes) as string[];
        for (const fm of modes) {
          fmCounts.set(fm, (fmCounts.get(fm) || 0) + 1);
        }
      } catch {
        // Skip invalid JSON
      }
    }

    const topFMs = [...fmCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([fm]) => fm);

    closeAnalyticsDB();

    return {
      total: stats.total,
      passRate: stats.total > 0 ? stats.pass / stats.total : 0,
      topFailureModes: topFMs
    };
  } catch (e) {
    return null;
  }
}

/**
 * Format patterns for context output
 */
function formatContextPrimer(
  projectPath: string,
  patterns: Pattern[],
  judgeStats: { total: number; passRate: number; topFailureModes: string[] } | null
): string {
  const lines: string[] = [];

  lines.push("SESSION CONTEXT (Auto-Primed from Analytics):");
  lines.push("");
  lines.push(`PROJECT: ${basename(projectPath)}`);
  lines.push("");

  // Add Judge stats if available
  if (judgeStats && judgeStats.total >= 5) {
    lines.push("QUALITY METRICS (Last 30 days):");
    lines.push(`- Judge Pass Rate: ${(judgeStats.passRate * 100).toFixed(0)}%`);
    if (judgeStats.topFailureModes.length > 0) {
      lines.push(`- Top Failure Modes: ${judgeStats.topFailureModes.join(", ")}`);
    }
    lines.push("");
  }

  // Group patterns by type
  const failurePatterns = patterns.filter(p => p.type === "failure");
  const successPatterns = patterns.filter(p => p.type === "success");
  const behavioralPatterns = patterns.filter(p => p.type === "behavioral");

  // Failure patterns first (things to avoid)
  if (failurePatterns.length > 0) {
    lines.push("PATTERNS TO AVOID:");
    for (const p of failurePatterns.slice(0, 3)) {
      lines.push(`- [${p.id}] ${p.recommendation}`);
    }
    lines.push("");
  }

  // Success patterns (things to do)
  if (successPatterns.length > 0) {
    lines.push("RECOMMENDED APPROACHES:");
    for (const p of successPatterns.slice(0, 3)) {
      lines.push(`- [${p.id}] ${p.recommendation}`);
    }
    lines.push("");
  }

  // Behavioral patterns (context)
  if (behavioralPatterns.length > 0) {
    lines.push("OBSERVED PATTERNS:");
    for (const p of behavioralPatterns.slice(0, 3)) {
      const conf = p.confidence_score ? `${(p.confidence_score * 100).toFixed(0)}%` : "N/A";
      lines.push(`- [${p.id}] ${p.name} (confidence: ${conf})`);
    }
    lines.push("");
  }

  if (patterns.length === 0 && !judgeStats) {
    lines.push("No patterns detected yet. Analytics will build over time.");
    lines.push("");
  }

  lines.push("---");

  return lines.join("\n");
}

/**
 * Main hook function
 */
async function main(): Promise<void> {
  // Read hook payload from stdin
  let input = "";
  for await (const chunk of Bun.stdin.stream()) {
    input += new TextDecoder().decode(chunk);
  }

  let payload: HookPayload;
  try {
    payload = JSON.parse(input);
  } catch (e) {
    process.exit(0);
  }

  const { cwd } = payload;

  // Check if analytics database exists
  const dbPath = join(ANALYTICS_DIR, "analytics.db");
  if (!existsSync(dbPath)) {
    // Analytics not set up yet, skip priming
    process.exit(0);
  }

  // Get patterns for this context
  const patterns = await getPatternsForContext(cwd);
  const judgeStats = await getJudgeStats();

  // Only output if we have something to share
  if (patterns.length === 0 && !judgeStats) {
    process.exit(0);
  }

  // Format and output context primer
  const contextPrimer = formatContextPrimer(cwd, patterns, judgeStats);

  // Output as system-reminder format for Claude to see
  console.log(`<system-reminder>\n${contextPrimer}\n</system-reminder>`);

  process.exit(0);
}

main().catch(e => {
  console.error("[prime-session-context] Error:", e);
  process.exit(0);
});
