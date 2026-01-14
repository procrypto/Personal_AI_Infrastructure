-- PAI Self-Learning Analytics Schema
-- Created: 2026-01-12
-- Purpose: Track patterns, metrics, and learnings from PAI sessions

-- Sessions: Track each Claude Code session
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  start_time INTEGER NOT NULL,           -- Unix timestamp ms
  end_time INTEGER,                       -- Unix timestamp ms (null if ongoing)
  duration_ms INTEGER,                    -- Computed from start/end
  project_path TEXT,                      -- cwd at session start
  project_name TEXT,                      -- Extracted from path
  success BOOLEAN,                        -- Did session complete successfully?
  completion_quality TEXT,                -- 'high', 'medium', 'low', 'failed'
  token_usage_estimate INTEGER,           -- Rough token count
  context_compactions INTEGER DEFAULT 0,  -- Number of compaction events
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- Tool Usage: Track every tool invocation
CREATE TABLE IF NOT EXISTS tool_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,                -- 'Bash', 'Edit', 'Read', etc.
  tool_use_id TEXT,                       -- Claude's tool_use_id
  timestamp INTEGER NOT NULL,             -- Unix timestamp ms
  duration_ms INTEGER,                    -- Time to complete (if available)
  success BOOLEAN NOT NULL DEFAULT 1,     -- Did the tool succeed?
  error_message TEXT,                     -- Error if failed
  input_summary TEXT,                     -- Brief summary of input (truncated)
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Skill Invocations: Track when skills are used
CREATE TABLE IF NOT EXISTS skill_invocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,               -- 'Research', 'Engineer', etc.
  workflow_name TEXT,                     -- Specific workflow if applicable
  timestamp INTEGER NOT NULL,
  duration_ms INTEGER,
  success BOOLEAN,
  quality_score REAL,                     -- 0-1 if evaluated
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Agent Spawns: Track Task tool delegations
CREATE TABLE IF NOT EXISTS agent_spawns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,               -- 'Explore', 'Plan', 'Engineer', etc.
  agent_id TEXT,                          -- Claude's agent ID
  task_description TEXT,                  -- The prompt/description
  model TEXT,                             -- 'opus', 'sonnet', 'haiku'
  timestamp INTEGER NOT NULL,
  duration_ms INTEGER,
  success BOOLEAN,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Judge Verdicts: Track quality evaluations
CREATE TABLE IF NOT EXISTS judge_verdicts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  skill_name TEXT,                        -- Which skill was being judged
  verdict TEXT NOT NULL,                  -- 'PASS', 'REVISE', 'REJECT'
  failure_modes TEXT,                     -- JSON array: ["FM1", "FM7"]
  specificity_score REAL,                 -- 0-1
  evidence_grounding_score REAL,          -- 0-1
  iteration_count INTEGER DEFAULT 1,      -- How many revisions
  timestamp INTEGER NOT NULL,
  notes TEXT,                             -- Additional context
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Patterns: Detected success/failure patterns
CREATE TABLE IF NOT EXISTS patterns (
  id TEXT PRIMARY KEY,                    -- 'P-001', 'P-042', etc.
  type TEXT NOT NULL,                     -- 'success', 'failure', 'behavioral'
  category TEXT NOT NULL,                 -- 'tool_sequence', 'judge_verdict', etc.
  name TEXT NOT NULL,                     -- Human-readable name
  trigger_conditions TEXT NOT NULL,       -- JSON: {"skill": "Research", "failure_mode": "FM7"}
  observed_frequency INTEGER DEFAULT 0,   -- How many times seen
  confidence_score REAL,                  -- 0-1, based on sample size
  applicable_to TEXT,                     -- JSON array: ["skill:Research", "project:X"]
  first_observed INTEGER,                 -- Unix timestamp ms
  last_observed INTEGER,                  -- Unix timestamp ms
  success_rate REAL,                      -- 0-1
  avg_duration_ms INTEGER,
  sample_size INTEGER DEFAULT 0,
  recommendation TEXT,                    -- Actionable insight
  auto_apply BOOLEAN DEFAULT 0,           -- Auto-prime in context?
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- User Feedback: Corrections and satisfaction signals
CREATE TABLE IF NOT EXISTS user_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  feedback_type TEXT NOT NULL,            -- 'correction', 'approval', 'rejection'
  target_type TEXT,                       -- 'skill', 'agent', 'pattern', 'output'
  target_id TEXT,                         -- ID of the target
  feedback_data TEXT,                     -- JSON with details
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Metrics: Aggregated performance metrics
CREATE TABLE IF NOT EXISTS metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_type TEXT NOT NULL,              -- 'skill_success_rate', 'tool_error_rate', etc.
  metric_name TEXT NOT NULL,              -- Specific metric identifier
  metric_value REAL NOT NULL,
  context TEXT,                           -- JSON: {"skill": "Research", "project": "X"}
  period_start INTEGER NOT NULL,          -- Unix timestamp ms
  period_end INTEGER NOT NULL,            -- Unix timestamp ms
  sample_size INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- Tool Sequences: Track common tool patterns
CREATE TABLE IF NOT EXISTS tool_sequences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  sequence TEXT NOT NULL,                 -- JSON array: ["Read", "Grep", "Edit"]
  sequence_hash TEXT NOT NULL,            -- Hash for grouping identical sequences
  success BOOLEAN,
  duration_ms INTEGER,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_path);
CREATE INDEX IF NOT EXISTS idx_sessions_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_quality ON sessions(completion_quality);

CREATE INDEX IF NOT EXISTS idx_tool_usage_tool ON tool_usage(tool_name);
CREATE INDEX IF NOT EXISTS idx_tool_usage_session ON tool_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_success ON tool_usage(success);

CREATE INDEX IF NOT EXISTS idx_skill_invocations_skill ON skill_invocations(skill_name);
CREATE INDEX IF NOT EXISTS idx_skill_invocations_session ON skill_invocations(session_id);

CREATE INDEX IF NOT EXISTS idx_agent_spawns_type ON agent_spawns(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_spawns_session ON agent_spawns(session_id);

CREATE INDEX IF NOT EXISTS idx_judge_verdicts_skill ON judge_verdicts(skill_name);
CREATE INDEX IF NOT EXISTS idx_judge_verdicts_verdict ON judge_verdicts(verdict);
CREATE INDEX IF NOT EXISTS idx_judge_verdicts_session ON judge_verdicts(session_id);

CREATE INDEX IF NOT EXISTS idx_patterns_category ON patterns(category);
CREATE INDEX IF NOT EXISTS idx_patterns_type ON patterns(type);
CREATE INDEX IF NOT EXISTS idx_patterns_confidence ON patterns(confidence_score);

CREATE INDEX IF NOT EXISTS idx_metrics_type ON metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_period ON metrics(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_tool_sequences_hash ON tool_sequences(sequence_hash);
CREATE INDEX IF NOT EXISTS idx_tool_sequences_session ON tool_sequences(session_id);
