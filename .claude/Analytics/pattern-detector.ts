#!/usr/bin/env bun
/**
 * PAI Pattern Detector
 *
 * Analyzes captured analytics data to identify success/failure patterns.
 * Generates patterns that can be used for context priming.
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { getAnalyticsDB, closeAnalyticsDB, type Pattern } from "./db";

// Configuration
const PATTERNS_DIR = join(dirname(import.meta.path), "patterns");
const MIN_SAMPLE_SIZE = 5; // Minimum observations before pattern is considered
const HIGH_CONFIDENCE_THRESHOLD = 0.8;
const MIN_CONFIDENCE_FOR_AUTO_APPLY = 0.8;
const MIN_SAMPLE_FOR_AUTO_APPLY = 10;

// Types
interface DetectedPattern {
  id: string;
  type: "success" | "failure" | "behavioral";
  category: string;
  name: string;
  trigger_conditions: Record<string, unknown>;
  observed_frequency: number;
  confidence_score: number | null;
  applicable_to: string[];
  first_observed: number | null;
  last_observed: number | null;
  success_rate: number | null;
  avg_duration_ms: number | null;
  sample_size: number;
  recommendation: string;
  auto_apply: boolean;
}

/**
 * Generate a pattern ID
 */
function generatePatternId(category: string, index: number): string {
  const prefix = category.slice(0, 3).toUpperCase();
  return `${prefix}-${String(index).padStart(3, "0")}`;
}

/**
 * Calculate confidence score based on sample size
 * Uses asymptotic function: 1 - 1/(1 + n/10)
 */
function calculateConfidence(sampleSize: number): number {
  return 1 - 1 / (1 + sampleSize / 10);
}

/**
 * Detect tool sequence patterns
 */
function detectToolSequencePatterns(db: ReturnType<typeof getAnalyticsDB>): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  let patternIndex = 1;

  // Get common tool sequences with success rates
  const sequences = db.query<{
    sequence: string;
    count: number;
    successRate: number | null;
  }>(`
    SELECT
      sequence,
      COUNT(*) as count,
      AVG(CASE WHEN success = 1 THEN 1.0 WHEN success = 0 THEN 0.0 ELSE NULL END) as successRate
    FROM tool_sequences
    GROUP BY sequence_hash
    HAVING count >= ?
    ORDER BY count DESC
    LIMIT 50
  `, [MIN_SAMPLE_SIZE]);

  for (const seq of sequences) {
    const tools = JSON.parse(seq.sequence) as string[];
    const confidence = calculateConfidence(seq.count);
    const successRate = seq.successRate;

    // Determine if this is a success or failure pattern
    let type: "success" | "failure" | "behavioral" = "behavioral";
    if (successRate !== null) {
      type = successRate >= 0.7 ? "success" : successRate <= 0.3 ? "failure" : "behavioral";
    }

    // Generate recommendation
    let recommendation = "";
    if (type === "success" && successRate !== null) {
      recommendation = `Use sequence ${tools.join(" → ")} - high success correlation`;
    } else if (type === "failure" && successRate !== null) {
      recommendation = `Avoid sequence ${tools.join(" → ")} - associated with failures`;
    } else {
      recommendation = `Common pattern: ${tools.join(" → ")}`;
    }

    patterns.push({
      id: generatePatternId("SEQ", patternIndex++),
      type,
      category: "tool_sequence",
      name: `Tool Sequence: ${tools.join(" → ")}`,
      trigger_conditions: { tools },
      observed_frequency: seq.count,
      confidence_score: confidence,
      applicable_to: [],
      first_observed: null,
      last_observed: null,
      success_rate: successRate,
      avg_duration_ms: null,
      sample_size: seq.count,
      recommendation,
      auto_apply: confidence >= MIN_CONFIDENCE_FOR_AUTO_APPLY && seq.count >= MIN_SAMPLE_FOR_AUTO_APPLY
    });
  }

  return patterns;
}

/**
 * Detect tool error patterns
 */
function detectToolErrorPatterns(db: ReturnType<typeof getAnalyticsDB>): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  let patternIndex = 1;

  // Get tools with error patterns
  const toolErrors = db.query<{
    tool_name: string;
    total: number;
    errors: number;
  }>(`
    SELECT
      tool_name,
      COUNT(*) as total,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as errors
    FROM tool_usage
    GROUP BY tool_name
    HAVING total >= ? AND errors > 0
    ORDER BY errors DESC
  `, [MIN_SAMPLE_SIZE]);

  for (const tool of toolErrors) {
    const errorRate = tool.errors / tool.total;
    const confidence = calculateConfidence(tool.total);

    // Only create pattern if error rate is notable
    if (errorRate < 0.05) continue;

    patterns.push({
      id: generatePatternId("ERR", patternIndex++),
      type: "failure",
      category: "tool_error",
      name: `${tool.tool_name} Error Rate`,
      trigger_conditions: { tool_name: tool.tool_name },
      observed_frequency: tool.errors,
      confidence_score: confidence,
      applicable_to: [`tool:${tool.tool_name}`],
      first_observed: null,
      last_observed: null,
      success_rate: 1 - errorRate,
      avg_duration_ms: null,
      sample_size: tool.total,
      recommendation: `${tool.tool_name} has ${(errorRate * 100).toFixed(1)}% error rate - verify inputs carefully`,
      auto_apply: false // Error patterns shouldn't auto-apply
    });
  }

  return patterns;
}

/**
 * Detect agent performance patterns
 */
function detectAgentPatterns(db: ReturnType<typeof getAnalyticsDB>): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  let patternIndex = 1;

  // Get agent performance by type
  const agents = db.query<{
    agent_type: string;
    total: number;
    successes: number;
    avgDuration: number | null;
  }>(`
    SELECT
      agent_type,
      COUNT(*) as total,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successes,
      AVG(duration_ms) as avgDuration
    FROM agent_spawns
    WHERE agent_type != 'unknown'
    GROUP BY agent_type
    HAVING total >= ?
    ORDER BY total DESC
  `, [MIN_SAMPLE_SIZE]);

  for (const agent of agents) {
    const successRate = agent.total > 0 ? agent.successes / agent.total : null;
    const confidence = calculateConfidence(agent.total);

    const type: "success" | "failure" | "behavioral" =
      successRate !== null && successRate >= 0.8 ? "success" :
      successRate !== null && successRate <= 0.3 ? "failure" : "behavioral";

    let recommendation = "";
    if (type === "success") {
      recommendation = `${agent.agent_type} agent is highly reliable - prefer for similar tasks`;
    } else if (type === "failure") {
      recommendation = `${agent.agent_type} agent has low success rate - consider alternatives`;
    } else {
      recommendation = `${agent.agent_type} agent: ${agent.total} uses tracked`;
    }

    patterns.push({
      id: generatePatternId("AGT", patternIndex++),
      type,
      category: "agent_performance",
      name: `Agent: ${agent.agent_type}`,
      trigger_conditions: { agent_type: agent.agent_type },
      observed_frequency: agent.total,
      confidence_score: confidence,
      applicable_to: [`agent:${agent.agent_type}`],
      first_observed: null,
      last_observed: null,
      success_rate: successRate,
      avg_duration_ms: agent.avgDuration,
      sample_size: agent.total,
      recommendation,
      auto_apply: type === "success" && confidence >= MIN_CONFIDENCE_FOR_AUTO_APPLY && agent.total >= MIN_SAMPLE_FOR_AUTO_APPLY
    });
  }

  return patterns;
}

/**
 * Detect project-based patterns
 */
function detectProjectPatterns(db: ReturnType<typeof getAnalyticsDB>): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  let patternIndex = 1;

  // Get project statistics
  const projects = db.query<{
    project_name: string;
    project_path: string;
    total_sessions: number;
    total_tools: number;
    avg_duration: number | null;
    compactions: number;
  }>(`
    SELECT
      s.project_name,
      s.project_path,
      COUNT(DISTINCT s.session_id) as total_sessions,
      COUNT(t.id) as total_tools,
      AVG(s.duration_ms) as avg_duration,
      SUM(s.context_compactions) as compactions
    FROM sessions s
    LEFT JOIN tool_usage t ON s.session_id = t.session_id
    WHERE s.project_name IS NOT NULL
    GROUP BY s.project_name
    HAVING total_sessions >= ?
    ORDER BY total_sessions DESC
    LIMIT 20
  `, [MIN_SAMPLE_SIZE]);

  for (const project of projects) {
    const confidence = calculateConfidence(project.total_sessions);

    // High compaction rate might indicate complex work
    const compactionRate = project.compactions / project.total_sessions;
    const isComplex = compactionRate > 0.5;

    let recommendation = "";
    if (isComplex) {
      recommendation = `${project.project_name}: Complex project - expect context compactions, break into smaller tasks`;
    } else {
      recommendation = `${project.project_name}: ${project.total_sessions} sessions tracked`;
    }

    patterns.push({
      id: generatePatternId("PRJ", patternIndex++),
      type: "behavioral",
      category: "project_context",
      name: `Project: ${project.project_name}`,
      trigger_conditions: { project_path: project.project_path },
      observed_frequency: project.total_sessions,
      confidence_score: confidence,
      applicable_to: [`project:${project.project_name}`],
      first_observed: null,
      last_observed: null,
      success_rate: null,
      avg_duration_ms: project.avg_duration,
      sample_size: project.total_sessions,
      recommendation,
      auto_apply: false
    });
  }

  return patterns;
}

/**
 * Detect session duration patterns
 */
function detectSessionPatterns(db: ReturnType<typeof getAnalyticsDB>): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  // Get session duration statistics
  const stats = db.query<{
    total: number;
    avg_duration: number;
    min_duration: number;
    max_duration: number;
    stddev: number;
  }>(`
    SELECT
      COUNT(*) as total,
      AVG(duration_ms) as avg_duration,
      MIN(duration_ms) as min_duration,
      MAX(duration_ms) as max_duration,
      SQRT(AVG(duration_ms * duration_ms) - AVG(duration_ms) * AVG(duration_ms)) as stddev
    FROM sessions
    WHERE duration_ms IS NOT NULL
  `)[0];

  if (stats.total >= MIN_SAMPLE_SIZE) {
    const confidence = calculateConfidence(stats.total);
    const avgMinutes = Math.round(stats.avg_duration / 60000);

    patterns.push({
      id: generatePatternId("DUR", 1),
      type: "behavioral",
      category: "session_duration",
      name: "Session Duration Baseline",
      trigger_conditions: {},
      observed_frequency: stats.total,
      confidence_score: confidence,
      applicable_to: [],
      first_observed: null,
      last_observed: null,
      success_rate: null,
      avg_duration_ms: stats.avg_duration,
      sample_size: stats.total,
      recommendation: `Average session: ${avgMinutes} minutes. Sessions significantly longer may indicate complexity or issues.`,
      auto_apply: false
    });
  }

  return patterns;
}

/**
 * Save pattern to JSON file
 */
function savePatternToFile(pattern: DetectedPattern): void {
  if (!existsSync(PATTERNS_DIR)) {
    mkdirSync(PATTERNS_DIR, { recursive: true });
  }

  const filePath = join(PATTERNS_DIR, `${pattern.id}.json`);
  writeFileSync(filePath, JSON.stringify(pattern, null, 2));
}

/**
 * Save pattern to database
 */
function savePatternToDb(db: ReturnType<typeof getAnalyticsDB>, pattern: DetectedPattern): void {
  db.insertPattern({
    id: pattern.id,
    type: pattern.type,
    category: pattern.category,
    name: pattern.name,
    trigger_conditions: JSON.stringify(pattern.trigger_conditions),
    observed_frequency: pattern.observed_frequency,
    confidence_score: pattern.confidence_score,
    applicable_to: JSON.stringify(pattern.applicable_to),
    first_observed: pattern.first_observed,
    last_observed: pattern.last_observed,
    success_rate: pattern.success_rate,
    avg_duration_ms: pattern.avg_duration_ms,
    sample_size: pattern.sample_size,
    recommendation: pattern.recommendation,
    auto_apply: pattern.auto_apply
  });
}

/**
 * Run all pattern detection
 */
export function detectAllPatterns(saveToFile: boolean = true, saveToDb: boolean = true): {
  total: number;
  byCategory: Record<string, number>;
  patterns: DetectedPattern[];
} {
  const db = getAnalyticsDB();
  const allPatterns: DetectedPattern[] = [];
  const byCategory: Record<string, number> = {};

  // Run all detectors
  const detectors = [
    { name: "tool_sequence", fn: detectToolSequencePatterns },
    { name: "tool_error", fn: detectToolErrorPatterns },
    { name: "agent_performance", fn: detectAgentPatterns },
    { name: "project_context", fn: detectProjectPatterns },
    { name: "session_duration", fn: detectSessionPatterns }
  ];

  for (const detector of detectors) {
    const patterns = detector.fn(db);
    byCategory[detector.name] = patterns.length;
    allPatterns.push(...patterns);
  }

  // Save patterns
  for (const pattern of allPatterns) {
    if (saveToFile) {
      savePatternToFile(pattern);
    }
    if (saveToDb) {
      savePatternToDb(db, pattern);
    }
  }

  return {
    total: allPatterns.length,
    byCategory,
    patterns: allPatterns
  };
}

/**
 * Get patterns for context priming
 */
export function getPatternsForPriming(projectPath: string | null = null): DetectedPattern[] {
  const db = getAnalyticsDB();

  // Get all auto-apply patterns
  const autoApply = db.getAutoApplyPatterns().map(p => ({
    ...p,
    trigger_conditions: JSON.parse(p.trigger_conditions),
    applicable_to: p.applicable_to ? JSON.parse(p.applicable_to) : []
  })) as DetectedPattern[];

  // Get project-specific patterns if applicable
  if (projectPath) {
    const projectPatterns = db.getPatternsForContext(projectPath, null).map(p => ({
      ...p,
      trigger_conditions: JSON.parse(p.trigger_conditions),
      applicable_to: p.applicable_to ? JSON.parse(p.applicable_to) : []
    })) as DetectedPattern[];

    // Merge and deduplicate
    const seen = new Set(autoApply.map(p => p.id));
    for (const p of projectPatterns) {
      if (!seen.has(p.id)) {
        autoApply.push(p);
        seen.add(p.id);
      }
    }
  }

  return autoApply;
}

// CLI interface
if (import.meta.main) {
  const args = process.argv.slice(2);
  const command = args[0] || "detect";

  switch (command) {
    case "detect": {
      console.log("\nRunning pattern detection...\n");
      const result = detectAllPatterns();
      console.log(`Detected ${result.total} patterns:`);
      for (const [category, count] of Object.entries(result.byCategory)) {
        console.log(`  ${category}: ${count}`);
      }
      console.log(`\nPatterns saved to: ${PATTERNS_DIR}`);
      break;
    }

    case "list": {
      const db = getAnalyticsDB();
      const patterns = db.query<Pattern>("SELECT * FROM patterns ORDER BY confidence_score DESC");
      console.log(`\n${patterns.length} patterns in database:\n`);
      for (const p of patterns.slice(0, 20)) {
        const conf = p.confidence_score ? `${(p.confidence_score * 100).toFixed(0)}%` : "N/A";
        const rate = p.success_rate !== null ? `${(p.success_rate * 100).toFixed(0)}%` : "N/A";
        console.log(`[${p.id}] ${p.name}`);
        console.log(`  Type: ${p.type} | Category: ${p.category}`);
        console.log(`  Confidence: ${conf} | Success Rate: ${rate} | Sample: ${p.sample_size}`);
        console.log(`  Auto-apply: ${p.auto_apply ? "Yes" : "No"}`);
        console.log(`  → ${p.recommendation}\n`);
      }
      break;
    }

    case "prime": {
      const projectPath = args[1] || process.cwd();
      const patterns = getPatternsForPriming(projectPath);
      console.log(`\nPatterns for context priming (${projectPath}):\n`);
      for (const p of patterns) {
        console.log(`[${p.id}] ${p.name}`);
        console.log(`  → ${p.recommendation}\n`);
      }
      break;
    }

    case "help":
    default:
      console.log(`
PAI Pattern Detector

Usage:
  bun run pattern-detector.ts detect     Run pattern detection on current data
  bun run pattern-detector.ts list       List all detected patterns
  bun run pattern-detector.ts prime [path]  Get patterns for context priming

Examples:
  bun run pattern-detector.ts detect
  bun run pattern-detector.ts list
  bun run pattern-detector.ts prime /path/to/project
`);
  }

  closeAnalyticsDB();
}
