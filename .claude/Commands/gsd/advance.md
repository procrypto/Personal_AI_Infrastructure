---
description: Manually trigger advancement logic to determine next action after plan completion
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---

<objective>
Manually invoke advancement logic to determine what happens next after plan completion.

Useful when:
- Auto-advance didn't trigger (e.g., after manual plan completion)
- Debugging advancement flow
- Resuming work after interruption
- Checking what action is pending

This command implements the advance-work.md workflow directly, reading current position from STATE.md and routing to the appropriate scenario handler.
</objective>

<process>

<step name="verify">
**Verify prerequisites exist:**

```bash
# Check .planning/ exists
ls .planning/ 2>/dev/null || echo "NO_PLANNING_DIR"

# Check STATE.md readable
cat .planning/STATE.md 2>/dev/null | head -1 || echo "NO_STATE"

# Check at least one SUMMARY exists
ls .planning/phases/*/*.SUMMARY.md 2>/dev/null | head -1 || echo "NO_SUMMARIES"
```

**If no .planning/ directory:**
```
Error: No planning structure found.
Run /gsd:new-project to initialize a project.
```
Exit.

**If no STATE.md:**
```
Error: .planning/STATE.md not found.
Cannot determine current position for advancement.

Run /gsd:progress to see project state.
```
Exit.

**If no SUMMARY files:**
```
Error: No completed plans found.
Expected at least one *-SUMMARY.md in .planning/phases/

Run /gsd:execute-plan to complete a plan first.
```
Exit.
</step>

<step name="load_context">
**Load all required context for scenario detection:**

**1. Read STATE.md:**
```bash
cat .planning/STATE.md
```

Parse Current Position section:
- Phase number: `X` from "Phase: X of Y"
- Total phases: `Y` from "Phase: X of Y"
- Phase name: From "Phase: X of Y (Name)"

**2. Read config.json:**
```bash
cat .planning/config.json 2>/dev/null
```

Parse:
- `mode`: "yolo" | "interactive" | "custom"
- `auto_advance.same_phase`: boolean (default: true)
- `auto_advance.phase_transition`: boolean (default: false)
- `auto_advance.generate_phase_summary`: boolean (default: true)

**3. Derive phase directory:**
```bash
PHASE_NUM=$(grep "Phase:" .planning/STATE.md | grep -oE '[0-9]+' | head -1)
PHASE_DIR=$(ls -d .planning/phases/${PHASE_NUM}-* 2>/dev/null | head -1)
echo "Phase directory: $PHASE_DIR"
```

**4. Count plans and summaries:**
```bash
PLAN_COUNT=$(ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null | wc -l | tr -d ' ')
SUMMARY_COUNT=$(ls "${PHASE_DIR}"/*-SUMMARY.md 2>/dev/null | grep -v "PHASE-SUMMARY" | wc -l | tr -d ' ')

echo "Plans: $PLAN_COUNT, Summaries: $SUMMARY_COUNT"
```

**Store context:**
```
PHASE_NUM=[X]
TOTAL_PHASES=[Y]
PHASE_NAME=[name]
PHASE_DIR=[path]
PLAN_COUNT=[N]
SUMMARY_COUNT=[N]
MODE=[mode]
```
</step>

<step name="detect_scenario">
**Determine which scenario applies:**

```bash
if [[ $SUMMARY_COUNT -lt $PLAN_COUNT ]]; then
  SCENARIO="same_phase"
  NEXT_PLAN_NUM=$(( SUMMARY_COUNT + 1 ))
  echo "Scenario: same_phase (plan $NEXT_PLAN_NUM of $PLAN_COUNT remaining)"

elif [[ $PHASE_NUM -lt $TOTAL_PHASES ]]; then
  SCENARIO="phase_complete"
  NEXT_PHASE=$(( PHASE_NUM + 1 ))
  echo "Scenario: phase_complete (advancing to phase $NEXT_PHASE of $TOTAL_PHASES)"

else
  SCENARIO="milestone_complete"
  echo "Scenario: milestone_complete (all $TOTAL_PHASES phases done)"
fi
```

**Scenario Definitions:**

| Scenario | Condition | What It Means |
|----------|-----------|---------------|
| `same_phase` | SUMMARY_COUNT < PLAN_COUNT | More plans to execute in current phase |
| `phase_complete` | SUMMARY_COUNT == PLAN_COUNT AND PHASE_NUM < TOTAL_PHASES | Phase done, next phase exists |
| `milestone_complete` | SUMMARY_COUNT == PLAN_COUNT AND PHASE_NUM == TOTAL_PHASES | All phases done, milestone complete |
</step>

<step name="handle_same_phase">
**When more plans exist in current phase:**

**Find next plan:**
```bash
for plan in $(ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null | sort); do
  summary="${plan/-PLAN.md/-SUMMARY.md}"
  if [[ ! -f "$summary" ]]; then
    NEXT_PLAN="$plan"
    break
  fi
done
echo "Next plan: $NEXT_PLAN"
```

**Mode behavior:**

**YOLO mode + same_phase=true (default):**
```
⚡ Auto-advancing: [next-plan-path]
[Plan X of Y for Phase Z]

Starting execution...
```
Immediately invoke execute-phase workflow with NEXT_PLAN path.

**Interactive mode OR same_phase=false:**
```
[X] of [Y] plans complete for Phase [Z].

---

## ▶ Next Up

**{phase}-{next-plan}: [Plan Name]** — [objective from next PLAN.md]

`/gsd:execute-plan [path]`

<sub>`/clear` first → fresh context window</sub>

---
```
</step>

<step name="handle_phase_complete">
**When all plans in current phase are complete but more phases exist:**

**Step 1: Check phase summary generation:**
```bash
# If generate_phase_summary is true (default), invoke create-phase-summary workflow
```

**Step 2: Mode behavior:**

**YOLO mode + phase_transition=true:**
```
Phase [X]: [Name] complete!

⚡ Auto-transitioning to Phase [X+1]: [Next Phase Name]

Invoking transition workflow...
```

**Interactive mode OR phase_transition=false (default):**
```
## ✓ Phase [X] Complete

All [Y] plans finished.

---

## ▶ Next Up

**Phase [X+1]: [Name]** — [Goal from ROADMAP.md]

`/gsd:plan-phase [X+1]`

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- `/gsd:discuss-phase [X+1]` — gather context first
- `/gsd:research-phase [X+1]` — investigate unknowns

---
```
</step>

<step name="handle_milestone_complete">
**When all plans in current phase are complete AND this is the last phase:**

**SAFETY RAIL: Always prompts regardless of mode or config.**

```
🎉 MILESTONE COMPLETE!

Phase [X]: [Name] complete — all [Y] plans finished.

════════════════════════════════════════
All [N] phases complete!
This milestone is 100% done.
════════════════════════════════════════

---

## ▶ Next Up

**Complete Milestone** — archive and prepare for next

`/gsd:complete-milestone`

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- `/gsd:add-phase <description>` — add another phase before completing
- Review accomplishments before archiving

---
```

Note: Milestone completion NEVER auto-advances. This is intentional — milestone boundaries are always manual decisions.
</step>

</process>

<success_criteria>
- [ ] Current position determined from STATE.md
- [ ] Scenario correctly detected (same_phase | phase_complete | milestone_complete)
- [ ] Appropriate action offered based on scenario and mode
- [ ] YOLO mode respects auto_advance settings
- [ ] milestone_complete always prompts (safety rail)
</success_criteria>
