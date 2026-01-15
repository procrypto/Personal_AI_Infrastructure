---
phase: 03-advance-logic
plan: 01
subsystem: workflow
tags: [advance-work, scenario-detection, gsd-infrastructure]

requires:
  - phase: 02-phase-summary
    provides: create-phase-summary.md workflow pattern

provides:
  - advance-work.md structure with header sections
  - scenario detection logic (same_phase, phase_complete, milestone_complete)
  - integration documentation for execute-phase.md

affects: [execute-phase, transition, gsd-advance-command]

tech-stack:
  added: []
  patterns: [scenario-based-routing, mode-behavior-matrix]

key-files:
  created:
    - ~/.claude/get-shit-done/workflows/advance-work.md
  modified: []

key-decisions:
  - "Three scenarios: same_phase, phase_complete, milestone_complete"
  - "milestone_complete always prompts regardless of mode"

patterns-established:
  - "Scenario-based routing: detect → route → handle"
  - "Mode behavior matrix for yolo vs interactive"

issues-created: []

duration: 1min
completed: 2026-01-15

debugging:
  sessions: 0
  time-spent: 0min
  patterns: []
---

# Phase 3 Plan 1: Create advance-work.md Structure Summary

**Centralized advancement workflow with scenario detection logic for same_phase, phase_complete, and milestone_complete routing**

## Performance

- **Duration:** 1 min
- **Started:** 2026-01-15T16:29:15Z
- **Completed:** 2026-01-15T16:30:59Z
- **Tasks:** 2
- **Files modified:** 1 (created)

## Accomplishments

- Created advance-work.md with complete header structure (purpose, required_reading, invocation, integration_points, error_handling)
- Defined scenario detection logic with bash commands for counting PLAN/SUMMARY files
- Documented three scenarios: same_phase, phase_complete, milestone_complete
- Created flow diagram showing integration with execute-phase.md and transition.md
- Added mode behavior matrix placeholder for 03-02 implementation

## Task Commits

Note: advance-work.md is GSD infrastructure in ~/.claude/ (outside project repo). No project commits for this task.

1. **Task 1: Create advance-work.md with header sections** - Infrastructure file created
2. **Task 2: Define scenario detection logic** - Scenario logic added to same file

**Plan metadata:** See below

## Files Created/Modified

- `~/.claude/get-shit-done/workflows/advance-work.md` - Centralized advancement workflow with:
  - 5 header sections (purpose, required_reading, invocation, integration_points, error_handling)
  - 3 process steps (load_context, detect_scenario, route_by_scenario)
  - Scenario definitions table
  - Mode behavior matrix placeholder

## Decisions Made

- **Three-scenario model:** same_phase (more plans), phase_complete (next phase exists), milestone_complete (all done)
- **milestone_complete always prompts:** Even in yolo mode, completing a milestone is significant enough to require user confirmation
- **Placeholder for handlers:** route_by_scenario step is a placeholder for 03-02 to implement actual handler logic

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Debugging Sessions

None - all verifications passed on first attempt

## Quality Gate

**Verdict:** PASS

**Checks:**
- [x] Implementation matches plan intent
- [x] All sections documented
- [x] Scenario detection logic complete with bash commands
- [x] Integration with execute-phase.md and transition.md documented

**Notes:** This is a structure/documentation task. The workflow is ready for logic implementation in 03-02.

## Next Phase Readiness

- advance-work.md structure complete, ready for handler implementation
- 03-02 will implement handle_same_phase, handle_phase_complete, handle_milestone_complete steps
- Clear interface between detection (03-01) and handling (03-02)

---
*Phase: 03-advance-logic*
*Completed: 2026-01-15*
