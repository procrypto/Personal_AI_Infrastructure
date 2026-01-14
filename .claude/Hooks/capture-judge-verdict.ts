#!/usr/bin/env bun
/**
 * PAI Judge Verdict Capture Hook
 *
 * Extracts Judge verdicts from the transcript and stores in analytics database.
 * Triggered on Stop events to capture any Judge evaluations from the session.
 *
 * This hook looks for structured VERDICT output in the transcript and extracts:
 * - Verdict (PASS/REVISE/REJECT)
 * - Failure modes triggered (FM1-FM7)
 * - Quality scores
 * - Iteration count
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";

// Import analytics DB
const ANALYTICS_DIR = join(process.env.HOME || "", ".claude", "Analytics");

// Types
interface HookPayload {
  session_id: string;
  transcript_path: string;
  cwd: string;
}

interface JudgeVerdict {
  session_id: string;
  skill_name: string | null;
  verdict: "PASS" | "REVISE" | "REJECT";
  failure_modes: string[];
  specificity_score: number | null;
  evidence_grounding_score: number | null;
  iteration_count: number;
  timestamp: number;
  notes: string | null;
}

/**
 * Parse transcript to extract Judge verdicts
 */
function extractVerdicts(transcriptContent: string, sessionId: string): JudgeVerdict[] {
  const verdicts: JudgeVerdict[] = [];

  // Look for VERDICT patterns in the transcript
  // Format: VERDICT: PASS|REVISE|REJECT
  const verdictPattern = /VERDICT:\s*(PASS|REVISE|REJECT)/gi;

  // Also look for failure mode mentions
  const failureModePattern = /\b(FM[1-7])\b/gi;

  // Look for skill context (e.g., "Research skill", "StoryExplanation")
  const skillPattern = /(Research|StoryExplanation|Engineer|Debug|CORE|Art)\s+(?:skill|output|evaluation)/gi;

  // Parse transcript line by line for context
  const lines = transcriptContent.split("\n");
  let currentSkill: string | null = null;
  let currentFailureModes: string[] = [];
  let iterationCount = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for skill context
    const skillMatch = line.match(skillPattern);
    if (skillMatch) {
      currentSkill = skillMatch[0].split(/\s+/)[0];
    }

    // Check for failure modes
    const fmMatches = line.matchAll(failureModePattern);
    for (const match of fmMatches) {
      const fm = match[1].toUpperCase();
      if (!currentFailureModes.includes(fm)) {
        currentFailureModes.push(fm);
      }
    }

    // Check for iteration indicators
    if (/iteration\s*[:#]?\s*(\d+)/i.test(line)) {
      const iterMatch = line.match(/iteration\s*[:#]?\s*(\d+)/i);
      if (iterMatch) {
        iterationCount = Math.max(iterationCount, parseInt(iterMatch[1], 10));
      }
    }

    // Check for verdict
    const verdictMatch = line.match(verdictPattern);
    if (verdictMatch) {
      const verdict = verdictMatch[0].split(":")[1].trim().toUpperCase() as "PASS" | "REVISE" | "REJECT";

      // Look for surrounding context (nearby lines)
      const contextStart = Math.max(0, i - 10);
      const contextEnd = Math.min(lines.length, i + 10);
      const context = lines.slice(contextStart, contextEnd).join("\n");

      // Extract any additional failure modes from context
      const contextFmMatches = context.matchAll(failureModePattern);
      for (const match of contextFmMatches) {
        const fm = match[1].toUpperCase();
        if (!currentFailureModes.includes(fm)) {
          currentFailureModes.push(fm);
        }
      }

      // Try to extract scores if present
      let specificityScore: number | null = null;
      let evidenceScore: number | null = null;

      const specificityMatch = context.match(/specificity[_\s]*score[:\s]*([0-9.]+)/i);
      if (specificityMatch) {
        specificityScore = parseFloat(specificityMatch[1]);
      }

      const evidenceMatch = context.match(/evidence[_\s]*(?:grounding)?[_\s]*score[:\s]*([0-9.]+)/i);
      if (evidenceMatch) {
        evidenceScore = parseFloat(evidenceMatch[1]);
      }

      verdicts.push({
        session_id: sessionId,
        skill_name: currentSkill,
        verdict,
        failure_modes: [...currentFailureModes],
        specificity_score: specificityScore,
        evidence_grounding_score: evidenceScore,
        iteration_count: iterationCount,
        timestamp: Date.now(),
        notes: null
      });

      // Reset for next verdict
      currentFailureModes = [];
      iterationCount = 1;
    }
  }

  return verdicts;
}

/**
 * Save verdicts to analytics database
 */
async function saveVerdicts(verdicts: JudgeVerdict[]): Promise<void> {
  if (verdicts.length === 0) return;

  // Dynamically import the db module to avoid issues if analytics isn't set up
  try {
    const dbPath = join(ANALYTICS_DIR, "db.ts");
    if (!existsSync(dbPath)) {
      console.error("Analytics DB not found at", dbPath);
      return;
    }

    const { getAnalyticsDB, closeAnalyticsDB } = await import(dbPath);
    const db = getAnalyticsDB();

    for (const verdict of verdicts) {
      db.insertJudgeVerdict({
        session_id: verdict.session_id,
        skill_name: verdict.skill_name,
        verdict: verdict.verdict,
        failure_modes: JSON.stringify(verdict.failure_modes),
        specificity_score: verdict.specificity_score,
        evidence_grounding_score: verdict.evidence_grounding_score,
        iteration_count: verdict.iteration_count,
        timestamp: verdict.timestamp,
        notes: verdict.notes
      });
    }

    closeAnalyticsDB();
  } catch (e) {
    console.error("Error saving verdicts to analytics:", e);
  }
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
    // Not valid JSON, likely empty or malformed
    process.exit(0);
  }

  const { session_id, transcript_path } = payload;

  // Check if transcript exists
  if (!transcript_path || !existsSync(transcript_path)) {
    process.exit(0);
  }

  // Read transcript
  let transcriptContent: string;
  try {
    transcriptContent = readFileSync(transcript_path, "utf-8");
  } catch (e) {
    console.error("Error reading transcript:", e);
    process.exit(0);
  }

  // Extract verdicts
  const verdicts = extractVerdicts(transcriptContent, session_id);

  // Log if we found any
  if (verdicts.length > 0) {
    console.log(`[capture-judge-verdict] Found ${verdicts.length} verdict(s)`);
    for (const v of verdicts) {
      console.log(`  ${v.verdict}: ${v.skill_name || "unknown"} [${v.failure_modes.join(", ") || "no FMs"}]`);
    }
  }

  // Save to analytics
  await saveVerdicts(verdicts);

  process.exit(0);
}

main().catch(e => {
  console.error("[capture-judge-verdict] Error:", e);
  process.exit(0);
});
