# GSD Auto-Advance

## Current State (v1.0 Shipped)

An enhancement to the GSD planning system that automatically advances to the next plan after completing one, eliminating manual prompts within a phase while preserving decision points at phase transitions.

**Shipped:** 2026-01-15
**Stats:** 5 phases, 8 plans, ~3,843 LOC

## Core Value

**Same-phase auto-advance** — When a plan completes, immediately start the next plan in the same phase without asking. No friction, no waiting, just continuous execution.

## Requirements

### Validated

- Auto-advance to next plan when current plan completes (same phase) — v1.0
- Generate and commit PHASE-SUMMARY.md when phase completes — v1.0
- Prompt user at phase transitions (configurable via config.json) — v1.0
- `/gsd:advance` command for manual triggering — v1.0
- Config schema extension for auto_advance settings — v1.0
- Backward compatibility with existing `mode: "yolo"` behavior — v1.0

### Active

(None — v1.0 complete, collecting feedback)

### Out of Scope

- Milestone auto-complete — Always prompt at milestone completion (safety rail)
- UI/dashboard — No visual progress tracking in v1
- Cross-session persistence — Auto-advance state doesn't persist across /clear

## Context

**Tech stack:**
- GSD workflow files in ~/.claude/get-shit-done/
- Commands in ~/.claude/commands/gsd/
- Config-driven behavior via config.json

**Key integration points:**
- execute-phase.md offer_next step delegates to advance-work.md
- create-phase-summary.md generates PHASE-SUMMARY.md at phase boundaries
- advance.md command for manual triggering

## Constraints

- **Backward compat**: Existing `mode: "yolo"` and interactive workflows work unchanged

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Smart defaults (auto within phase, prompt between) | Balances speed with intentional checkpoints | Good |
| Centralized advance-work.md workflow | Single source of truth for both manual and automatic triggers | Good |
| Phase summary as aggregation of plan summaries | Natural documentation checkpoint at phase boundary | Good |
| Milestone safety rail (always prompt) | Prevents accidental milestone completion | Good |
| Workflow delegation in execute-phase.md | Reduced complexity from ~145 to ~30 lines | Good |

---
*Last updated: 2026-01-15 after v1.0 milestone*
