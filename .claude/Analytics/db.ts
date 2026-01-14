#!/usr/bin/env bun
/**
 * PAI Analytics Database Wrapper
 *
 * Provides typed access to the analytics SQLite database.
 * Uses bun:sqlite for native performance.
 */

import { Database } from "bun:sqlite";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";

// Database location
const ANALYTICS_DIR = dirname(import.meta.path);
const DB_PATH = join(ANALYTICS_DIR, "analytics.db");
const SCHEMA_PATH = join(ANALYTICS_DIR, "schema.sql");

// Types
export interface Session {
  session_id: string;
  start_time: number;
  end_time: number | null;
  duration_ms: number | null;
  project_path: string | null;
  project_name: string | null;
  success: boolean | null;
  completion_quality: "high" | "medium" | "low" | "failed" | null;
  token_usage_estimate: number | null;
  context_compactions: number;
  created_at: number;
}

export interface ToolUsage {
  id: number;
  session_id: string;
  tool_name: string;
  tool_use_id: string | null;
  timestamp: number;
  duration_ms: number | null;
  success: boolean;
  error_message: string | null;
  input_summary: string | null;
}

export interface SkillInvocation {
  id: number;
  session_id: string;
  skill_name: string;
  workflow_name: string | null;
  timestamp: number;
  duration_ms: number | null;
  success: boolean | null;
  quality_score: number | null;
}

export interface AgentSpawn {
  id: number;
  session_id: string;
  agent_type: string;
  agent_id: string | null;
  task_description: string | null;
  model: "opus" | "sonnet" | "haiku" | null;
  timestamp: number;
  duration_ms: number | null;
  success: boolean | null;
}

export interface JudgeVerdict {
  id: number;
  session_id: string;
  skill_name: string | null;
  verdict: "PASS" | "REVISE" | "REJECT";
  failure_modes: string | null; // JSON array
  specificity_score: number | null;
  evidence_grounding_score: number | null;
  iteration_count: number;
  timestamp: number;
  notes: string | null;
}

export interface Pattern {
  id: string;
  type: "success" | "failure" | "behavioral";
  category: string;
  name: string;
  trigger_conditions: string; // JSON
  observed_frequency: number;
  confidence_score: number | null;
  applicable_to: string | null; // JSON array
  first_observed: number | null;
  last_observed: number | null;
  success_rate: number | null;
  avg_duration_ms: number | null;
  sample_size: number;
  recommendation: string | null;
  auto_apply: boolean;
  created_at: number;
  updated_at: number;
}

export interface UserFeedback {
  id: number;
  session_id: string | null;
  feedback_type: "correction" | "approval" | "rejection";
  target_type: string | null;
  target_id: string | null;
  feedback_data: string | null; // JSON
  timestamp: number;
}

export interface Metric {
  id: number;
  metric_type: string;
  metric_name: string;
  metric_value: number;
  context: string | null; // JSON
  period_start: number;
  period_end: number;
  sample_size: number;
  created_at: number;
}

export interface ToolSequence {
  id: number;
  session_id: string;
  sequence: string; // JSON array
  sequence_hash: string;
  success: boolean | null;
  duration_ms: number | null;
  timestamp: number;
}

/**
 * Analytics Database class
 */
export class AnalyticsDB {
  private db: Database;

  constructor(dbPath: string = DB_PATH) {
    const isNew = !existsSync(dbPath);
    this.db = new Database(dbPath, { create: true });

    // Enable WAL mode for better concurrent access
    this.db.run("PRAGMA journal_mode = WAL");
    this.db.run("PRAGMA synchronous = NORMAL");

    // Initialize schema if new database
    if (isNew) {
      this.initializeSchema();
    }
  }

  /**
   * Initialize database with schema
   */
  private initializeSchema(): void {
    if (!existsSync(SCHEMA_PATH)) {
      throw new Error(`Schema file not found: ${SCHEMA_PATH}`);
    }
    const schema = readFileSync(SCHEMA_PATH, "utf-8");
    this.db.run(schema);
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.db.close();
  }

  // ========== Sessions ==========

  insertSession(session: Omit<Session, "created_at">): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO sessions
      (session_id, start_time, end_time, duration_ms, project_path, project_name,
       success, completion_quality, token_usage_estimate, context_compactions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      session.session_id,
      session.start_time,
      session.end_time,
      session.duration_ms,
      session.project_path,
      session.project_name,
      session.success ? 1 : 0,
      session.completion_quality,
      session.token_usage_estimate,
      session.context_compactions
    );
  }

  getSession(sessionId: string): Session | null {
    const stmt = this.db.prepare("SELECT * FROM sessions WHERE session_id = ?");
    return stmt.get(sessionId) as Session | null;
  }

  getRecentSessions(limit: number = 100): Session[] {
    const stmt = this.db.prepare(
      "SELECT * FROM sessions ORDER BY start_time DESC LIMIT ?"
    );
    return stmt.all(limit) as Session[];
  }

  getSessionsByProject(projectPath: string, limit: number = 50): Session[] {
    const stmt = this.db.prepare(
      "SELECT * FROM sessions WHERE project_path = ? ORDER BY start_time DESC LIMIT ?"
    );
    return stmt.all(projectPath, limit) as Session[];
  }

  // ========== Tool Usage ==========

  insertToolUsage(usage: Omit<ToolUsage, "id">): number {
    const stmt = this.db.prepare(`
      INSERT INTO tool_usage
      (session_id, tool_name, tool_use_id, timestamp, duration_ms, success, error_message, input_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      usage.session_id,
      usage.tool_name,
      usage.tool_use_id,
      usage.timestamp,
      usage.duration_ms,
      usage.success ? 1 : 0,
      usage.error_message,
      usage.input_summary
    );
    return Number(result.lastInsertRowid);
  }

  getToolUsageBySession(sessionId: string): ToolUsage[] {
    const stmt = this.db.prepare(
      "SELECT * FROM tool_usage WHERE session_id = ? ORDER BY timestamp"
    );
    return stmt.all(sessionId) as ToolUsage[];
  }

  getToolErrorRate(toolName: string, days: number = 30): { total: number; errors: number; rate: number } {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as errors
      FROM tool_usage
      WHERE tool_name = ? AND timestamp >= ?
    `);
    const result = stmt.get(toolName, since) as { total: number; errors: number };
    return {
      ...result,
      rate: result.total > 0 ? result.errors / result.total : 0
    };
  }

  // ========== Skill Invocations ==========

  insertSkillInvocation(invocation: Omit<SkillInvocation, "id">): number {
    const stmt = this.db.prepare(`
      INSERT INTO skill_invocations
      (session_id, skill_name, workflow_name, timestamp, duration_ms, success, quality_score)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      invocation.session_id,
      invocation.skill_name,
      invocation.workflow_name,
      invocation.timestamp,
      invocation.duration_ms,
      invocation.success === null ? null : invocation.success ? 1 : 0,
      invocation.quality_score
    );
    return Number(result.lastInsertRowid);
  }

  getSkillSuccessRate(skillName: string, days: number = 30): { total: number; successes: number; rate: number } {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successes
      FROM skill_invocations
      WHERE skill_name = ? AND timestamp >= ? AND success IS NOT NULL
    `);
    const result = stmt.get(skillName, since) as { total: number; successes: number };
    return {
      ...result,
      rate: result.total > 0 ? result.successes / result.total : 0
    };
  }

  // ========== Agent Spawns ==========

  insertAgentSpawn(spawn: Omit<AgentSpawn, "id">): number {
    const stmt = this.db.prepare(`
      INSERT INTO agent_spawns
      (session_id, agent_type, agent_id, task_description, model, timestamp, duration_ms, success)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      spawn.session_id,
      spawn.agent_type,
      spawn.agent_id,
      spawn.task_description,
      spawn.model,
      spawn.timestamp,
      spawn.duration_ms,
      spawn.success === null ? null : spawn.success ? 1 : 0
    );
    return Number(result.lastInsertRowid);
  }

  getAgentPerformance(agentType: string, days: number = 30): { total: number; successes: number; avgDuration: number } {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successes,
        AVG(duration_ms) as avgDuration
      FROM agent_spawns
      WHERE agent_type = ? AND timestamp >= ?
    `);
    return stmt.get(agentType, since) as { total: number; successes: number; avgDuration: number };
  }

  // ========== Judge Verdicts ==========

  insertJudgeVerdict(verdict: Omit<JudgeVerdict, "id">): number {
    const stmt = this.db.prepare(`
      INSERT INTO judge_verdicts
      (session_id, skill_name, verdict, failure_modes, specificity_score,
       evidence_grounding_score, iteration_count, timestamp, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      verdict.session_id,
      verdict.skill_name,
      verdict.verdict,
      verdict.failure_modes,
      verdict.specificity_score,
      verdict.evidence_grounding_score,
      verdict.iteration_count,
      verdict.timestamp,
      verdict.notes
    );
    return Number(result.lastInsertRowid);
  }

  getJudgePassRate(skillName: string | null = null, days: number = 30): {
    total: number;
    pass: number;
    revise: number;
    reject: number;
    passRate: number;
  } {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const whereClause = skillName
      ? "WHERE skill_name = ? AND timestamp >= ?"
      : "WHERE timestamp >= ?";
    const params = skillName ? [skillName, since] : [since];

    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN verdict = 'PASS' THEN 1 ELSE 0 END) as pass,
        SUM(CASE WHEN verdict = 'REVISE' THEN 1 ELSE 0 END) as revise,
        SUM(CASE WHEN verdict = 'REJECT' THEN 1 ELSE 0 END) as reject
      FROM judge_verdicts
      ${whereClause}
    `);
    const result = stmt.get(...params) as { total: number; pass: number; revise: number; reject: number };
    return {
      ...result,
      passRate: result.total > 0 ? result.pass / result.total : 0
    };
  }

  getFailureModeDistribution(skillName: string | null = null, days: number = 30): Map<string, number> {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const whereClause = skillName
      ? "WHERE skill_name = ? AND timestamp >= ? AND failure_modes IS NOT NULL"
      : "WHERE timestamp >= ? AND failure_modes IS NOT NULL";
    const params = skillName ? [skillName, since] : [since];

    const stmt = this.db.prepare(`
      SELECT failure_modes FROM judge_verdicts ${whereClause}
    `);
    const rows = stmt.all(...params) as { failure_modes: string }[];

    const distribution = new Map<string, number>();
    for (const row of rows) {
      try {
        const modes = JSON.parse(row.failure_modes) as string[];
        for (const mode of modes) {
          distribution.set(mode, (distribution.get(mode) || 0) + 1);
        }
      } catch {
        // Skip invalid JSON
      }
    }
    return distribution;
  }

  // ========== Patterns ==========

  insertPattern(pattern: Omit<Pattern, "created_at" | "updated_at">): void {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO patterns
      (id, type, category, name, trigger_conditions, observed_frequency, confidence_score,
       applicable_to, first_observed, last_observed, success_rate, avg_duration_ms,
       sample_size, recommendation, auto_apply, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      pattern.id,
      pattern.type,
      pattern.category,
      pattern.name,
      pattern.trigger_conditions,
      pattern.observed_frequency,
      pattern.confidence_score,
      pattern.applicable_to,
      pattern.first_observed,
      pattern.last_observed,
      pattern.success_rate,
      pattern.avg_duration_ms,
      pattern.sample_size,
      pattern.recommendation,
      pattern.auto_apply ? 1 : 0,
      now,
      now
    );
  }

  getPattern(id: string): Pattern | null {
    const stmt = this.db.prepare("SELECT * FROM patterns WHERE id = ?");
    return stmt.get(id) as Pattern | null;
  }

  getPatternsByType(type: "success" | "failure" | "behavioral"): Pattern[] {
    const stmt = this.db.prepare(
      "SELECT * FROM patterns WHERE type = ? ORDER BY confidence_score DESC"
    );
    return stmt.all(type) as Pattern[];
  }

  getAutoApplyPatterns(): Pattern[] {
    const stmt = this.db.prepare(
      "SELECT * FROM patterns WHERE auto_apply = 1 AND confidence_score >= 0.8 ORDER BY confidence_score DESC"
    );
    return stmt.all() as Pattern[];
  }

  getPatternsForContext(projectPath: string | null, skillName: string | null): Pattern[] {
    // Get patterns applicable to this context
    const patterns: Pattern[] = [];

    // Get all auto-apply patterns
    const autoApply = this.getAutoApplyPatterns();
    patterns.push(...autoApply);

    // Get patterns specific to project
    if (projectPath) {
      const stmt = this.db.prepare(
        "SELECT * FROM patterns WHERE applicable_to LIKE ? AND confidence_score >= 0.7"
      );
      const projectPatterns = stmt.all(`%"project:${projectPath}"%`) as Pattern[];
      patterns.push(...projectPatterns);
    }

    // Get patterns specific to skill
    if (skillName) {
      const stmt = this.db.prepare(
        "SELECT * FROM patterns WHERE applicable_to LIKE ? AND confidence_score >= 0.7"
      );
      const skillPatterns = stmt.all(`%"skill:${skillName}"%`) as Pattern[];
      patterns.push(...skillPatterns);
    }

    // Deduplicate by id
    const seen = new Set<string>();
    return patterns.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }

  updatePatternObservation(id: string, success: boolean): void {
    const pattern = this.getPattern(id);
    if (!pattern) return;

    const newSampleSize = pattern.sample_size + 1;
    const successCount = (pattern.success_rate || 0) * pattern.sample_size + (success ? 1 : 0);
    const newSuccessRate = successCount / newSampleSize;

    // Confidence increases with sample size (asymptotic to 1)
    const newConfidence = 1 - (1 / (1 + newSampleSize / 10));

    const stmt = this.db.prepare(`
      UPDATE patterns SET
        observed_frequency = observed_frequency + 1,
        last_observed = ?,
        sample_size = ?,
        success_rate = ?,
        confidence_score = ?,
        auto_apply = ?,
        updated_at = ?
      WHERE id = ?
    `);
    stmt.run(
      Date.now(),
      newSampleSize,
      newSuccessRate,
      newConfidence,
      newConfidence >= 0.8 && newSampleSize >= 10 ? 1 : 0,
      Date.now(),
      id
    );
  }

  // ========== Tool Sequences ==========

  insertToolSequence(sequence: Omit<ToolSequence, "id">): number {
    const stmt = this.db.prepare(`
      INSERT INTO tool_sequences
      (session_id, sequence, sequence_hash, success, duration_ms, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      sequence.session_id,
      sequence.sequence,
      sequence.sequence_hash,
      sequence.success === null ? null : sequence.success ? 1 : 0,
      sequence.duration_ms,
      sequence.timestamp
    );
    return Number(result.lastInsertRowid);
  }

  getCommonToolSequences(limit: number = 20): { sequence: string; count: number; successRate: number }[] {
    const stmt = this.db.prepare(`
      SELECT
        sequence,
        COUNT(*) as count,
        AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) as successRate
      FROM tool_sequences
      GROUP BY sequence_hash
      HAVING count >= 3
      ORDER BY count DESC
      LIMIT ?
    `);
    return stmt.all(limit) as { sequence: string; count: number; successRate: number }[];
  }

  // ========== Metrics ==========

  insertMetric(metric: Omit<Metric, "id" | "created_at">): number {
    const stmt = this.db.prepare(`
      INSERT INTO metrics
      (metric_type, metric_name, metric_value, context, period_start, period_end, sample_size)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      metric.metric_type,
      metric.metric_name,
      metric.metric_value,
      metric.context,
      metric.period_start,
      metric.period_end,
      metric.sample_size
    );
    return Number(result.lastInsertRowid);
  }

  getMetricTrend(metricType: string, metricName: string, periods: number = 10): Metric[] {
    const stmt = this.db.prepare(`
      SELECT * FROM metrics
      WHERE metric_type = ? AND metric_name = ?
      ORDER BY period_end DESC
      LIMIT ?
    `);
    return stmt.all(metricType, metricName, periods) as Metric[];
  }

  // ========== User Feedback ==========

  insertUserFeedback(feedback: Omit<UserFeedback, "id">): number {
    const stmt = this.db.prepare(`
      INSERT INTO user_feedback
      (session_id, feedback_type, target_type, target_id, feedback_data, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      feedback.session_id,
      feedback.feedback_type,
      feedback.target_type,
      feedback.target_id,
      feedback.feedback_data,
      feedback.timestamp
    );
    return Number(result.lastInsertRowid);
  }

  // ========== Raw Queries ==========

  /**
   * Run a raw SQL query (for custom analytics)
   */
  query<T = unknown>(sql: string, params: unknown[] = []): T[] {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  /**
   * Run a raw SQL statement (for updates/inserts)
   */
  run(sql: string, params: unknown[] = []): void {
    const stmt = this.db.prepare(sql);
    stmt.run(...params);
  }
}

// Singleton instance
let instance: AnalyticsDB | null = null;

/**
 * Get the analytics database instance
 */
export function getAnalyticsDB(): AnalyticsDB {
  if (!instance) {
    instance = new AnalyticsDB();
  }
  return instance;
}

/**
 * Close the analytics database
 */
export function closeAnalyticsDB(): void {
  if (instance) {
    instance.close();
    instance = null;
  }
}

// CLI: Initialize database if run directly
if (import.meta.main) {
  console.log("Initializing PAI Analytics database...");
  const db = getAnalyticsDB();
  console.log(`Database created at: ${DB_PATH}`);

  // Show table counts
  const tables = ["sessions", "tool_usage", "skill_invocations", "agent_spawns",
                  "judge_verdicts", "patterns", "user_feedback", "metrics", "tool_sequences"];
  for (const table of tables) {
    const count = db.query<{ count: number }>(`SELECT COUNT(*) as count FROM ${table}`)[0].count;
    console.log(`  ${table}: ${count} rows`);
  }

  closeAnalyticsDB();
  console.log("Done.");
}
