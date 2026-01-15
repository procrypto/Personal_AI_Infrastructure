# Integration Verification Checklist

## Test Environment
- Project: GSD Auto-Advance (this project)
- Config: .planning/config.json
- Current mode: yolo

## Scenario 1: same_phase (yolo mode)
**Setup:** Execute a plan when more plans exist in phase
**Expected:** Auto-advances to next plan without prompting
**Verify:** Plan executes, auto-continues to next plan
**Result:** [ ] Pass / [ ] Fail

## Scenario 2: same_phase (interactive mode)
**Setup:** Change config to mode: "interactive", execute plan
**Expected:** Shows "Next Up" prompt, waits for user
**Verify:** Does NOT auto-execute, displays next plan info
**Result:** [ ] Pass / [ ] Fail

## Scenario 3: phase_complete (yolo mode, phase_transition=false)
**Setup:** Complete last plan in a phase
**Expected:** Prompts for phase transition (default behavior)
**Verify:** Shows phase complete message, offers /gsd:plan-phase
**Result:** [ ] Pass / [ ] Fail

## Scenario 4: milestone_complete
**Setup:** Complete last plan of last phase
**Expected:** Always prompts regardless of mode
**Verify:** Shows milestone complete message, offers /gsd:complete-milestone
**Result:** [ ] Pass / [ ] Fail

## Overall Status
- [ ] All scenarios pass
- [ ] No regressions from previous behavior
- [ ] Integration successful
