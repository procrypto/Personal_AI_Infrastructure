# Phase Summary Template

Template for `.planning/phases/XX-name/PHASE-SUMMARY.md` - aggregated phase completion documentation.

---

## File Template

```markdown
---
phase: XX-name
subsystem: [primary category based on phase focus]
tags: [union of all plan tags]

# Aggregated dependency graph
requires:
  - phase: [prior phase this depends on]
    provides: [what that phase built that this uses]
provides:
  - [union of all provides from plans in this phase]
affects: [union of all affects from plans in this phase]

# Tech tracking (aggregated from all plans)
tech-stack:
  added: [union of libraries/tools from all plans]
  patterns: [all architectural patterns established]

key-files:
  created: [important files created across all plans]
  modified: [important files modified across all plans]

key-decisions:
  - "Decision from plan 01"
  - "Decision from plan 02"

patterns-established:
  - "Pattern 1: description"
  - "Pattern 2: description"

issues-created: [all ISS-XXX from this phase]

# Metrics (aggregated)
plans-completed: N
total-duration: Xmin
completed: YYYY-MM-DD
---

# Phase [X]: [Name] Summary

**[Substantive one-liner describing what the ENTIRE phase shipped - NOT "phase complete"]**

## Performance

- **Plans completed:** [N] of [N]
- **Total duration:** [time] (e.g., 45 min, 2h 30m)
- **Started:** [ISO timestamp of first plan]
- **Completed:** [ISO timestamp of last plan]
- **Total files modified:** [count across all plans]

## Plans Completed

| Plan | Summary | Duration |
|------|---------|----------|
| 01: [Name] | [one-liner from plan summary] | Xmin |
| 02: [Name] | [one-liner from plan summary] | Xmin |

**Detail:** See individual plan summaries for full context:
- `.planning/phases/XX-name/XX-01-SUMMARY.md`
- `.planning/phases/XX-name/XX-02-SUMMARY.md`

## Key Accomplishments

[Top 5-7 outcomes across ALL plans - not exhaustive, highlight most important]

- [Most important outcome from the phase]
- [Second key accomplishment]
- [Third key accomplishment]
- [Fourth if applicable]
- [Fifth if applicable]

## Aggregated Decisions

[Decisions made across all plans that affect future work]

| Plan | Decision | Rationale |
|------|----------|-----------|
| 01 | [Decision] | [Why] |
| 02 | [Decision] | [Why] |

## Deviations Summary

[Aggregate deviation stats from all plans]

- **Total auto-fixed:** [N] (breakdown: X bugs, Y missing critical, Z blocking)
- **Total deferred:** [N] issues logged to ISSUES.md

See individual plan summaries for deviation details.

## Issues Created This Phase

[List issues created during this phase]

- ISS-XXX: [Brief description] (Plan XX-01)
- ISS-YYY: [Brief description] (Plan XX-02)

**Total:** [N] issues logged

## Next Phase Readiness

[What this phase delivered that next phase needs]

**Ready:**
- [Capability 1 available for next phase]
- [Capability 2 available for next phase]

**Concerns/Blockers:**
- [Any blockers for next phase, or "None"]

---
*Phase: XX-name*
*Completed: [date]*
*Plans: [N] completed*
```

## Aggregation Rules

When creating a PHASE-SUMMARY.md, aggregate data from individual plan summaries:

### Frontmatter Aggregation

| Field | Aggregation Rule |
|-------|------------------|
| `subsystem` | Primary category based on phase focus |
| `tags` | Union of all plan tags (deduplicated) |
| `provides` | Union of all plan provides |
| `affects` | Union of all plan affects |
| `tech-stack.added` | Union of all added libraries |
| `tech-stack.patterns` | All patterns from all plans |
| `key-files` | Important files from all plans |
| `key-decisions` | All decisions from all plans |
| `issues-created` | All ISS-XXX from all plans |

### Metrics Aggregation

| Metric | Aggregation Rule |
|--------|------------------|
| `plans-completed` | Count of plan summaries |
| `total-duration` | Sum of all plan durations |
| `completed` | Date of last plan completion |
| `total-files` | Count unique files across all plans |

### Content Aggregation

**Plans Completed table:**
- One row per plan
- Pull one-liner from each plan's SUMMARY.md
- Pull duration from each plan's Performance section

**Key Accomplishments:**
- Select top 5-7 accomplishments across all plans
- Prioritize by impact, not by plan order
- Do NOT list every accomplishment from every plan

**Decisions:**
- Aggregate all decisions from all plan summaries
- Include plan reference for traceability

**Deviations:**
- Sum counts from all plans
- Do NOT reproduce full deviation details (link to plan summaries)

## One-Liner Rules

The phase one-liner MUST be substantive and describe what the ENTIRE phase shipped:

**Good:**
- "Auto-advance config schema, phase summary aggregation, and transition workflow integration"
- "User authentication with JWT, session management, and protected route middleware"
- "Database models, API endpoints, and admin dashboard for user management"

**Bad:**
- "Phase complete"
- "All plans finished"
- "Foundation work done"

The one-liner should tell someone what the whole phase accomplished, not just that it's done.

## Distinction from Plan Summary

| Aspect | Plan Summary | Phase Summary |
|--------|--------------|---------------|
| Scope | Single plan | Entire phase |
| Detail | Full task-level detail | Aggregated highlights |
| Deviations | Full deviation documentation | Summary counts + links |
| Files | All files from this plan | Key files across phase |
| Purpose | Document individual work | Summarize phase outcome |

**Key principle:** Phase summary AGGREGATES and LINKS. It does not replace or duplicate plan summaries.

## When to Create

Phase summaries are created by the `create-phase-summary.md` workflow when:
1. All plans in a phase are complete (all have SUMMARY.md)
2. `config.json` has `auto_advance.generate_phase_summary: true`
3. User explicitly requests via command

## Workflow Integration

The phase summary is created during phase transition:
1. execute-phase.md completes last plan
2. create-phase-summary.md aggregates all plan summaries
3. transition.md advances to next phase
4. STATE.md updated with phase completion

## Example

```markdown
---
phase: 02-authentication
subsystem: auth
tags: [jwt, jose, bcrypt, middleware]

requires:
  - phase: 01-foundation
    provides: [database models, api structure]
provides:
  - jwt-authentication
  - session-management
  - protected-routes
affects: [user-features, admin-dashboard, api-security]

tech-stack:
  added: [jose, bcryptjs]
  patterns: [auth-middleware, token-refresh-rotation]

key-files:
  created: [src/lib/auth.ts, src/middleware.ts]
  modified: [src/app/api/login/route.ts]

key-decisions:
  - "JWT with 15min access / 7day refresh tokens"
  - "Pure-JS crypto for Edge runtime compatibility"

patterns-established:
  - "Auth middleware pattern for protected routes"
  - "Token refresh rotation on each request"

issues-created: [ISS-001, ISS-002]

plans-completed: 2
total-duration: 45min
completed: 2025-01-15
---

# Phase 2: Authentication Summary

**JWT auth with refresh rotation, bcrypt password hashing, and protected route middleware using Edge-compatible libraries**

## Performance

- **Plans completed:** 2 of 2
- **Total duration:** 45 min
- **Started:** 2025-01-15T10:00:00Z
- **Completed:** 2025-01-15T10:45:00Z
- **Total files modified:** 8

## Plans Completed

| Plan | Summary | Duration |
|------|---------|----------|
| 01: Auth Foundation | JWT tokens with jose library and refresh rotation | 25min |
| 02: Protected Routes | Middleware for route protection and session validation | 20min |

**Detail:** See individual plan summaries for full context:
- `.planning/phases/02-authentication/02-01-SUMMARY.md`
- `.planning/phases/02-authentication/02-02-SUMMARY.md`

## Key Accomplishments

- JWT authentication with access/refresh token rotation
- Password hashing with bcryptjs (Edge-compatible)
- Protected route middleware
- Session validation and automatic token refresh
- Logout with token revocation

## Aggregated Decisions

| Plan | Decision | Rationale |
|------|----------|-----------|
| 01 | jose over jsonwebtoken | ESM-native, Edge runtime compatible |
| 01 | 15min access / 7day refresh | Balance security and UX |
| 02 | Pure-JS bcryptjs | Native bcrypt incompatible with Edge |

## Deviations Summary

- **Total auto-fixed:** 3 (1 bug, 1 missing critical, 1 blocking)
- **Total deferred:** 2 issues logged to ISSUES.md

See individual plan summaries for deviation details.

## Issues Created This Phase

- ISS-001: Add rate limiting to login endpoint (Plan 02-01)
- ISS-002: Improve token refresh UX with auto-retry (Plan 02-02)

**Total:** 2 issues logged

## Next Phase Readiness

**Ready:**
- Auth foundation complete for feature development
- Protected routes available for all authenticated endpoints
- Session management ready for user-specific features

**Concerns/Blockers:**
- None

---
*Phase: 02-authentication*
*Completed: 2025-01-15*
*Plans: 2 completed*
```

## Guidelines

**When creating phase summaries:**
1. Read ALL plan summaries in the phase first
2. Aggregate frontmatter using union rules
3. Select key accomplishments (not exhaustive list)
4. Sum metrics from all plans
5. Link to plan summaries for details

**Do NOT:**
- Duplicate full deviation documentation (summarize + link)
- List every accomplishment from every plan
- Create phase summary before all plans complete
- Replace plan summaries with phase summary
