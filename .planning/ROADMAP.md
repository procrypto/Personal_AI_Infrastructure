# Roadmap: GSD Auto-Advance

## Overview

Enhance GSD to automatically advance between plans within a phase, generate phase summaries on completion, and provide manual advancement control. Preserves phase transition decision points while eliminating friction within phases.

## Domain Expertise

None (internal GSD workflow modification)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Config Schema** - Add auto_advance configuration to config.json template
- [x] **Phase 2: Phase Summary** - Create workflow to generate PHASE-SUMMARY.md from plan summaries
- [x] **Phase 3: Advance Logic** - Core auto-advance orchestration workflow
- [x] **Phase 4: Command Interface** - /gsd:advance manual command
- [ ] **Phase 5: Integration** - Hook auto-advance into execute-phase.md offer_next step (Next)

## Phase Details

### Phase 1: Config Schema
**Goal**: Add auto_advance configuration section to config.json template
**Depends on**: Nothing (first phase)
**Research**: Unlikely (internal config modification)
**Plans**: 1 plan

Plans:
- [x] 01-01: Add auto_advance schema to templates/config.json

### Phase 2: Phase Summary
**Goal**: Create workflow to aggregate plan summaries into PHASE-SUMMARY.md
**Depends on**: Phase 1
**Research**: Unlikely (markdown template work)
**Plans**: 2 plans

Plans:
- [x] 02-01: Define PHASE-SUMMARY.md format and aggregation logic
- [x] 02-02: Create create-phase-summary.md workflow

### Phase 3: Advance Logic
**Goal**: Core auto-advance orchestration handling all advancement scenarios
**Depends on**: Phase 2
**Research**: Unlikely (workflow orchestration)
**Plans**: 2 plans

Plans:
- [x] 03-01: Create advance-work.md workflow structure
- [x] 03-02: Implement same-phase, phase-transition, and milestone-complete logic

### Phase 4: Command Interface
**Goal**: /gsd:advance command for manual advancement triggering
**Depends on**: Phase 3
**Research**: Unlikely (command definition)
**Plans**: 1 plan

Plans:
- [x] 04-01: Create advance.md command in Commands/gsd/

### Phase 5: Integration
**Goal**: Hook auto-advance into execute-phase.md and ensure backward compatibility
**Depends on**: Phase 4
**Research**: Unlikely (modifying existing workflow)
**Plans**: 2 plans

Plans:
- [ ] 05-01: Modify execute-phase.md offer_next step to invoke advance-work.md
- [ ] 05-02: Test backward compatibility with yolo mode and interactive mode

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Config Schema | 1/1 | Complete | 2026-01-15 |
| 2. Phase Summary | 2/2 | Complete | 2026-01-15 |
| 3. Advance Logic | 2/2 | Complete | 2026-01-15 |
| 4. Command Interface | 1/1 | Complete | 2026-01-15 |
| 5. Integration | 0/2 | Not started | - |
