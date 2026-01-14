#!/usr/bin/env bun
/**
 * PAI Analytics ETL Pipeline
 *
 * Extracts data from JSONL event logs and loads into the analytics database.
 * Processes: sessions, tool usage, skill invocations, agent spawns, tool sequences
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";
import { createHash } from "crypto";
import { getAnalyticsDB, closeAnalyticsDB, type Session, type ToolUsage, type AgentSpawn } from "./db";

// Types for JSONL events
interface BaseEvent {
  source_app: string;
  session_id: string;
  hook_event_type: string;
  timestamp: number;
  timestamp_pst: string;
}

interface SessionStartEvent extends BaseEvent {
  hook_event_type: "SessionStart";
  payload: {
    session_id: string;
    transcript_path: string;
    cwd: string;
    source?: string;
  };
}

interface SessionEndEvent extends BaseEvent {
  hook_event_type: "SessionEnd";
  payload: {
    session_id: string;
    cwd: string;
  };
}

interface StopEvent extends BaseEvent {
  hook_event_type: "Stop";
  payload: {
    session_id: string;
    cwd: string;
  };
}

interface PreToolUseEvent extends BaseEvent {
  hook_event_type: "PreToolUse";
  payload: {
    session_id: string;
    tool_name: string;
    tool_input: Record<string, unknown>;
    tool_use_id: string;
    cwd: string;
  };
}

interface PostToolUseEvent extends BaseEvent {
  hook_event_type: "PostToolUse";
  payload: {
    session_id: string;
    tool_name: string;
    tool_input: Record<string, unknown>;
    tool_response: {
      stdout?: string;
      stderr?: string;
      error?: string;
      interrupted?: boolean;
    };
    tool_use_id: string;
    cwd: string;
  };
}

interface SubagentStopEvent extends BaseEvent {
  hook_event_type: "SubagentStop";
  payload: {
    session_id: string;
    agent_id: string;
    agent_transcript_path: string;
    cwd: string;
  };
  agent_instance_id?: string;
  agent_type?: string;
  parent_session_id?: string;
}

interface PreCompactEvent extends BaseEvent {
  hook_event_type: "PreCompact";
  payload: {
    session_id: string;
    cwd: string;
  };
}

type Event = SessionStartEvent | SessionEndEvent | StopEvent | PreToolUseEvent |
             PostToolUseEvent | SubagentStopEvent | PreCompactEvent;

// Configuration
const HISTORY_DIR = join(process.env.HOME || "", ".claude", "History", "Raw-Outputs");

/**
 * Parse a JSONL file and return events
 */
function parseJSONL(filePath: string): Event[] {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter(line => line.trim());
  const events: Event[] = [];

  for (const line of lines) {
    try {
      const event = JSON.parse(line) as Event;
      events.push(event);
    } catch (e) {
      // Skip malformed lines
      console.warn(`Skipping malformed line in ${filePath}`);
    }
  }

  return events;
}

/**
 * Extract project name from path
 */
function extractProjectName(projectPath: string | null): string | null {
  if (!projectPath) return null;
  const parts = projectPath.split("/");
  return parts[parts.length - 1] || null;
}

/**
 * Summarize tool input (truncate to reasonable length)
 */
function summarizeInput(toolName: string, input: Record<string, unknown>): string {
  const maxLength = 200;
  let summary = "";

  switch (toolName) {
    case "Bash":
      summary = String(input.command || "").slice(0, maxLength);
      break;
    case "Read":
      summary = String(input.file_path || "");
      break;
    case "Write":
    case "Edit":
      summary = String(input.file_path || "");
      break;
    case "Grep":
      summary = `${input.pattern || ""} in ${input.path || "."}`;
      break;
    case "Glob":
      summary = `${input.pattern || ""} in ${input.path || "."}`;
      break;
    case "Task":
      summary = String(input.description || input.prompt || "").slice(0, maxLength);
      break;
    case "TodoWrite":
      const todos = input.todos as Array<{ content: string }> | undefined;
      summary = todos ? `${todos.length} todos` : "todos";
      break;
    default:
      summary = JSON.stringify(input).slice(0, maxLength);
  }

  return summary.slice(0, maxLength);
}

/**
 * Check if tool response indicates an error
 */
function isToolError(toolName: string, response: PostToolUseEvent["payload"]["tool_response"]): boolean {
  if (response.error) return true;
  if (response.interrupted) return true;

  // Check for common error patterns in stderr
  if (response.stderr) {
    const stderr = response.stderr.toLowerCase();
    if (stderr.includes("error:") || stderr.includes("fatal:") ||
        stderr.includes("exception") || stderr.includes("failed")) {
      return true;
    }
  }

  return false;
}

/**
 * Extract agent type from agent ID or event
 */
function extractAgentType(event: SubagentStopEvent): string {
  if (event.agent_type) return event.agent_type;

  // Try to extract from agent_instance_id (e.g., "perplexity-researcher-1")
  if (event.agent_instance_id) {
    const parts = event.agent_instance_id.split("-");
    if (parts.length >= 2) {
      return parts.slice(0, -1).join("-");
    }
  }

  return "unknown";
}

/**
 * Process events for a single session
 */
function processSession(sessionId: string, events: Event[]): {
  session: Omit<Session, "created_at">;
  toolUsages: Omit<ToolUsage, "id">[];
  agentSpawns: Omit<AgentSpawn, "id">[];
  toolSequence: string[];
} {
  // Sort events by timestamp
  events.sort((a, b) => a.timestamp - b.timestamp);

  // Find session boundaries
  const startEvent = events.find(e => e.hook_event_type === "SessionStart") as SessionStartEvent | undefined;
  const endEvent = events.find(e => e.hook_event_type === "SessionEnd") as SessionEndEvent | undefined;
  const stopEvents = events.filter(e => e.hook_event_type === "Stop") as StopEvent[];

  // Session data
  const startTime = startEvent?.timestamp || events[0]?.timestamp || Date.now();
  const endTime = endEvent?.timestamp || stopEvents[stopEvents.length - 1]?.timestamp || null;
  const projectPath = startEvent?.payload?.cwd || null;

  // Count compactions
  const compactions = events.filter(e => e.hook_event_type === "PreCompact").length;

  // Process tool usage
  const toolUsages: Omit<ToolUsage, "id">[] = [];
  const toolSequence: string[] = [];
  const preToolEvents = new Map<string, PreToolUseEvent>();

  for (const event of events) {
    if (event.hook_event_type === "PreToolUse") {
      const preEvent = event as PreToolUseEvent;
      preToolEvents.set(preEvent.payload.tool_use_id, preEvent);
    } else if (event.hook_event_type === "PostToolUse") {
      const postEvent = event as PostToolUseEvent;
      const preEvent = preToolEvents.get(postEvent.payload.tool_use_id);

      const isError = isToolError(postEvent.payload.tool_name, postEvent.payload.tool_response);
      const duration = preEvent ? postEvent.timestamp - preEvent.timestamp : null;

      toolUsages.push({
        session_id: sessionId,
        tool_name: postEvent.payload.tool_name,
        tool_use_id: postEvent.payload.tool_use_id,
        timestamp: postEvent.timestamp,
        duration_ms: duration,
        success: !isError,
        error_message: isError ? (postEvent.payload.tool_response.error ||
                                  postEvent.payload.tool_response.stderr || null) : null,
        input_summary: summarizeInput(postEvent.payload.tool_name, postEvent.payload.tool_input)
      });

      toolSequence.push(postEvent.payload.tool_name);
    }
  }

  // Process agent spawns
  const agentSpawns: Omit<AgentSpawn, "id">[] = [];
  const subagentStops = events.filter(e => e.hook_event_type === "SubagentStop") as SubagentStopEvent[];

  for (const event of subagentStops) {
    agentSpawns.push({
      session_id: sessionId,
      agent_type: extractAgentType(event),
      agent_id: event.payload.agent_id,
      task_description: null, // Would need to parse from Task tool calls
      model: null, // Would need to parse from Task tool calls
      timestamp: event.timestamp,
      duration_ms: null, // Would need to track start time
      success: null // Would need to parse outcome
    });
  }

  // Build session object
  const session: Omit<Session, "created_at"> = {
    session_id: sessionId,
    start_time: startTime,
    end_time: endTime,
    duration_ms: endTime ? endTime - startTime : null,
    project_path: projectPath,
    project_name: extractProjectName(projectPath),
    success: null, // Would need more analysis to determine
    completion_quality: null,
    token_usage_estimate: null,
    context_compactions: compactions
  };

  return { session, toolUsages, agentSpawns, toolSequence };
}

/**
 * Generate a hash for a tool sequence
 */
function hashSequence(sequence: string[]): string {
  const hash = createHash("sha256");
  hash.update(sequence.join(","));
  return hash.digest("hex").slice(0, 16);
}

/**
 * Process a single JSONL file
 */
function processFile(filePath: string): { sessions: number; tools: number; agents: number } {
  const events = parseJSONL(filePath);
  const db = getAnalyticsDB();

  // Group events by session
  const sessionEvents = new Map<string, Event[]>();
  for (const event of events) {
    const sessionId = event.session_id;
    if (!sessionEvents.has(sessionId)) {
      sessionEvents.set(sessionId, []);
    }
    sessionEvents.get(sessionId)!.push(event);
  }

  let sessionsProcessed = 0;
  let toolsProcessed = 0;
  let agentsProcessed = 0;

  // Process each session
  for (const [sessionId, sessionEvts] of sessionEvents) {
    const { session, toolUsages, agentSpawns, toolSequence } = processSession(sessionId, sessionEvts);

    // Insert session
    db.insertSession(session);
    sessionsProcessed++;

    // Insert tool usages
    for (const usage of toolUsages) {
      db.insertToolUsage(usage);
      toolsProcessed++;
    }

    // Insert agent spawns
    for (const spawn of agentSpawns) {
      db.insertAgentSpawn(spawn);
      agentsProcessed++;
    }

    // Insert tool sequence (if meaningful)
    if (toolSequence.length >= 3) {
      // Extract 3-tool sliding windows
      for (let i = 0; i <= toolSequence.length - 3; i++) {
        const window = toolSequence.slice(i, i + 3);
        db.insertToolSequence({
          session_id: sessionId,
          sequence: JSON.stringify(window),
          sequence_hash: hashSequence(window),
          success: null, // Would need more context
          duration_ms: null,
          timestamp: session.start_time + i
        });
      }
    }
  }

  return { sessions: sessionsProcessed, tools: toolsProcessed, agents: agentsProcessed };
}

/**
 * Get all JSONL files in the history directory
 */
function getJSONLFiles(daysBack: number = 30): string[] {
  const files: string[] = [];
  const now = new Date();

  // Check each month directory
  for (let i = 0; i <= daysBack; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const monthDir = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthPath = join(HISTORY_DIR, monthDir);

    if (existsSync(monthPath)) {
      const monthFiles = readdirSync(monthPath)
        .filter(f => f.endsWith(".jsonl"))
        .map(f => join(monthPath, f));
      files.push(...monthFiles);
    }
  }

  return [...new Set(files)]; // Deduplicate
}

/**
 * Run ETL for specified date range
 */
export function runETL(daysBack: number = 30, verbose: boolean = true): {
  files: number;
  sessions: number;
  tools: number;
  agents: number;
} {
  const files = getJSONLFiles(daysBack);
  let totalSessions = 0;
  let totalTools = 0;
  let totalAgents = 0;

  if (verbose) {
    console.log(`Processing ${files.length} JSONL files...`);
  }

  for (const file of files) {
    if (verbose) {
      console.log(`  ${basename(file)}`);
    }
    try {
      const { sessions, tools, agents } = processFile(file);
      totalSessions += sessions;
      totalTools += tools;
      totalAgents += agents;
    } catch (e) {
      console.error(`Error processing ${file}:`, e);
    }
  }

  return {
    files: files.length,
    sessions: totalSessions,
    tools: totalTools,
    agents: totalAgents
  };
}

/**
 * Run ETL for a single day
 */
export function runETLForDate(date: Date, verbose: boolean = true): {
  file: string | null;
  sessions: number;
  tools: number;
  agents: number;
} {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const monthDir = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const filePath = join(HISTORY_DIR, monthDir, `${dateStr}_all-events.jsonl`);

  if (!existsSync(filePath)) {
    if (verbose) {
      console.log(`No file found for ${dateStr}`);
    }
    return { file: null, sessions: 0, tools: 0, agents: 0 };
  }

  if (verbose) {
    console.log(`Processing ${basename(filePath)}...`);
  }

  const { sessions, tools, agents } = processFile(filePath);
  return { file: filePath, sessions, tools, agents };
}

// CLI interface
if (import.meta.main) {
  const args = process.argv.slice(2);
  const command = args[0] || "run";

  switch (command) {
    case "run": {
      const days = parseInt(args[1] || "7", 10);
      console.log(`\nRunning ETL for last ${days} days...\n`);
      const result = runETL(days);
      console.log(`\nETL Complete:`);
      console.log(`  Files processed: ${result.files}`);
      console.log(`  Sessions: ${result.sessions}`);
      console.log(`  Tool usages: ${result.tools}`);
      console.log(`  Agent spawns: ${result.agents}`);
      break;
    }

    case "today": {
      console.log(`\nRunning ETL for today...\n`);
      const result = runETLForDate(new Date());
      console.log(`\nETL Complete:`);
      console.log(`  File: ${result.file || "none"}`);
      console.log(`  Sessions: ${result.sessions}`);
      console.log(`  Tool usages: ${result.tools}`);
      console.log(`  Agent spawns: ${result.agents}`);
      break;
    }

    case "stats": {
      const db = getAnalyticsDB();
      const tables = ["sessions", "tool_usage", "skill_invocations", "agent_spawns",
                      "judge_verdicts", "patterns", "user_feedback", "metrics", "tool_sequences"];
      console.log("\nDatabase Statistics:\n");
      for (const table of tables) {
        const count = db.query<{ count: number }>(`SELECT COUNT(*) as count FROM ${table}`)[0].count;
        console.log(`  ${table}: ${count} rows`);
      }
      break;
    }

    case "help":
    default:
      console.log(`
PAI Analytics ETL Pipeline

Usage:
  bun run etl-pipeline.ts run [days]     Process last N days (default: 7)
  bun run etl-pipeline.ts today          Process today's events only
  bun run etl-pipeline.ts stats          Show database statistics

Examples:
  bun run etl-pipeline.ts run 30         Process last 30 days
  bun run etl-pipeline.ts today          Process today only
`);
  }

  closeAnalyticsDB();
}
