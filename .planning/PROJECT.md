# GSD Auto-Advance

## What This Is

An enhancement to the GSD (Get Shit Done) planning system that automatically advances to the next plan after completing one, eliminating manual prompts within a phase while preserving decision points at phase transitions.

## Core Value

**Same-phase auto-advance** — When a plan completes, immediately start the next plan in the same phase without asking. No friction, no waiting, just continuous execution.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Auto-advance to next plan when current plan completes (same phase)
- [ ] Generate and commit PHASE-SUMMARY.md when phase completes
- [ ] Prompt user at phase transitions (configurable via config.json)
- [ ] `/gsd:advance` command for manual triggering
- [ ] Config schema extension for auto_advance settings
- [ ] Backward compatibility with existing `mode: "yolo"` behavior

### Out of Scope

- Milestone auto-complete — Always prompt at milestone completion (safety rail)
- UI/dashboard — No visual progress tracking in v1
- Cross-session persistence — Auto-advance state doesn't persist across /clear

## Context

**Existing GSD architecture:**
- `execute-phase.md` workflow handles plan execution with `offer_next` step (lines 1568-1713)
- `transition.md` handles phase transitions
- `config.json` controls gates and modes
- Current `yolo` mode already auto-advances but with less granular control

**Key integration points identified:**
- `offer_next` step in execute-phase.md — where auto-advance logic will hook in
- `config.json` template — add `auto_advance` section
- New `advance-work.md` workflow — centralized advancement logic

**Prior exploration:**
- Analyzed 155 session files showing frequent GSD navigation overhead
- Identified this as highest-impact automation opportunity

## Constraints

- **Backward compat**: Must not break existing `mode: "yolo"` or interactive workflows — existing users expect same behavior

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Smart defaults (auto within phase, prompt between) | Balances speed with intentional checkpoints | — Pending |
| Centralized advance-work.md workflow | Single source of truth for both manual and automatic triggers | — Pending |
| Phase summary as aggregation of plan summaries | Natural documentation checkpoint at phase boundary | — Pending |

---
*Last updated: 2026-01-14 after initialization*
