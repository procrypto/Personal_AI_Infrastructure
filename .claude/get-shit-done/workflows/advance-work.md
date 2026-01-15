<purpose>
Single source of truth for advancement logic after plan completion. Determines what happens next: execute another plan in the same phase, transition to a new phase, or complete the milestone.

Called by execute-phase.md after plan completion (offer_next step) and by /gsd:advance command for manual advancement.

**Key principle:** Advancement is scenario-based. Detect the scenario, route to the appropriate handler.
</purpose>

<required_reading>
**Read these files:**
1. `.planning/STATE.md` - Current position, accumulated context
2. `.planning/config.json` - Mode and gate settings
3. `.planning/ROADMAP.md` - Phase structure and progress
4. Current phase directory (`*-PLAN.md` and `*-SUMMARY.md` counts)
</required_reading>

<invocation>
## When This Workflow Runs

**Automatic invocation:**
- Called by execute-phase.md at the end of `offer_next` step
- Receives: `current_plan_path` (path to just-completed plan)
- Mode determined by config.json

**Manual invocation:**
```bash
/gsd:advance
```
- User wants to manually trigger advancement logic
- Reads current position from STATE.md
- Useful after manual plan completion or debugging

**Parameters:**
- `current_plan_path` (optional) - Path to the plan that just completed
  - If provided: Use this path to derive phase directory
  - If not provided: Parse current position from STATE.md

**Prerequisites:**
- STATE.md must exist with valid current position
- config.json must exist (defaults apply if missing)
- At least one SUMMARY.md must exist in current phase
</invocation>

<integration_points>
## Integration with GSD System

**Status:** Integration complete (Phase 05-01, 2026-01-15)

**Entry points (active):**
1. `execute-phase.md` → `offer_next` step → delegates to this workflow
2. `/gsd:advance` command → invokes this workflow directly

**Reads:**
- `.planning/STATE.md` - Current phase/plan position
- `.planning/config.json` - `mode`, `gates.execute_next_plan`, `gates.confirm_transition`
- `.planning/phases/XX-name/` - PLAN and SUMMARY file counts
- `.planning/ROADMAP.md` - Total phases in milestone

**Calls (based on scenario):**
- `create-phase-summary.md` - When phase is complete and `generate_phase_summary` is true
- `transition.md` - When phase is complete and moving to next phase

**Outputs:**
- **same_phase**: Executes next plan or prompts user
- **phase_complete**: Calls create-phase-summary.md, then transition.md
- **milestone_complete**: Calls create-phase-summary.md, prompts for milestone completion

**Flow diagram:**
```
execute-phase.md (plan complete)
    ↓
    └─→ offer_next step (delegates)
              ↓
        advance-work.md (this workflow)
              ↓
        [load_context] → [detect_scenario] → [route_by_scenario]
              ↓                                       ↓
              ↓                              ┌────────┴────────┐
              ↓                              ↓        ↓        ↓
              ↓                         same_phase  phase   milestone
              ↓                              ↓      complete  complete
              ↓                              ↓        ↓        ↓
              ↓                         execute    create-   create-
              ↓                         next plan  phase-    phase-
              ↓                         or prompt  summary   summary
              ↓                                      ↓        ↓
              ↓                                  transition  milestone
              ↓                                     .md      complete
              ↓                                              prompt
              └──────────────────────────────────────────────────┘
```

**Integration history:**
- Phase 05-01: execute-phase.md offer_next step now delegates to this workflow (replaced ~145 lines of inline logic)
</integration_points>

<error_handling>
## Error Conditions

**Missing STATE.md:**
```
Error: .planning/STATE.md not found.
Cannot determine current position for advancement.

Run /gsd:progress to see project state, or /gsd:new-project to initialize.
```
Action: Exit with error.

**Invalid current position:**
```
Error: Cannot parse current position from STATE.md.
Expected "Phase: X of Y" format in Current Position section.

Check .planning/STATE.md format.
```
Action: Exit with error.

**Phase directory not found:**
```
Error: Phase directory not found for phase [X].
Looking for: .planning/phases/[XX]-*/

Verify ROADMAP.md phase naming matches directory structure.
```
Action: Exit with error.

**No SUMMARY files found:**
```
Error: No completed plans found in phase [X].
Expected at least one *-SUMMARY.md in .planning/phases/[XX]-name/

Run /gsd:execute-plan to complete a plan first.
```
Action: Exit with error.

**Config parse error:**
```
Warning: Failed to parse .planning/config.json
[error details]

Using defaults: mode=interactive, all gates enabled.
```
Action: Continue with defaults (not fatal).

**ROADMAP.md missing:**
```
Error: .planning/ROADMAP.md not found.
Cannot determine total phases for milestone completion check.

Run /gsd:create-roadmap to create roadmap.
```
Action: Exit with error.
</error_handling>

<process>

<step name="load_context">
Load all required context for scenario detection.

**1. Read STATE.md:**
```bash
cat .planning/STATE.md 2>/dev/null
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
- `gates.execute_next_plan`: boolean
- `gates.confirm_transition`: boolean
- `auto_advance.generate_phase_summary`: boolean (default true)

**3. Derive phase directory:**
```bash
# If current_plan_path provided:
PHASE_DIR=$(dirname "$current_plan_path")

# Otherwise, find from STATE.md phase number:
PHASE_NUM=$(grep "Phase:" .planning/STATE.md | grep -oE '[0-9]+' | head -1)
PHASE_DIR=$(ls -d .planning/phases/${PHASE_NUM}-* 2>/dev/null | head -1)
```

**4. Count plans and summaries:**
```bash
PLAN_COUNT=$(ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null | wc -l | tr -d ' ')
SUMMARY_COUNT=$(ls "${PHASE_DIR}"/*-SUMMARY.md 2>/dev/null | grep -v "PHASE-SUMMARY" | wc -l | tr -d ' ')

echo "Plans: $PLAN_COUNT, Summaries: $SUMMARY_COUNT"
```

**Store in context:**
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
Determine which scenario applies based on plan/summary counts and phase position.

**Scenario Detection Logic:**

```bash
if [[ $SUMMARY_COUNT -lt $PLAN_COUNT ]]; then
  # More plans exist in this phase
  SCENARIO="same_phase"
  NEXT_PLAN_NUM=$(( SUMMARY_COUNT + 1 ))
  echo "Scenario: same_phase (plan $NEXT_PLAN_NUM of $PLAN_COUNT remaining)"

elif [[ $PHASE_NUM -lt $TOTAL_PHASES ]]; then
  # All plans complete, but more phases exist
  SCENARIO="phase_complete"
  NEXT_PHASE=$(( PHASE_NUM + 1 ))
  echo "Scenario: phase_complete (advancing to phase $NEXT_PHASE of $TOTAL_PHASES)"

else
  # All plans complete AND this is the last phase
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

**Edge Cases:**

- **Decimal phases (e.g., 01.1):** Use same logic; decimal phases have their own directory and count toward total
- **Skipped plans:** If user chose to skip plans, SUMMARY_COUNT may be less than expected — treat as same_phase
- **Manual SUMMARY deletion:** Recounts will detect missing summaries and route to same_phase
</step>

<step name="route_by_scenario">
Route to appropriate handler based on detected scenario.

**Placeholder for Phase 03-02 implementation.**

Each scenario will have its own handler step:
- `handle_same_phase` → Execute next plan or prompt user
- `handle_phase_complete` → Create phase summary, run transition
- `handle_milestone_complete` → Create phase summary, prompt for milestone completion

**Routing logic (to be implemented):**

```
switch(SCENARIO):
  case "same_phase":
    → Go to handle_same_phase step
  case "phase_complete":
    → Go to handle_phase_complete step
  case "milestone_complete":
    → Go to handle_milestone_complete step
```

**Mode behavior matrix (to be implemented in 03-02):**

| Scenario | yolo mode | interactive mode |
|----------|-----------|------------------|
| same_phase | Auto-execute next plan | Prompt user |
| phase_complete | Auto-transition | Prompt user |
| milestone_complete | Prompt user (always) | Prompt user |

Note: `milestone_complete` always prompts because completing a milestone is a significant decision.
</step>

<step name="handle_same_phase">
Handle advancement when more plans exist in current phase.

**Config check:**
```bash
# Read auto_advance.same_phase setting (default: true if not specified)
SAME_PHASE_SETTING=$(cat .planning/config.json 2>/dev/null | grep -A3 '"auto_advance"' | grep '"same_phase"' | grep -o 'true\|false')
SAME_PHASE=${SAME_PHASE_SETTING:-true}
```

**Find next plan:**
```bash
# Get list of all PLAN files
PLAN_FILES=$(ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null | sort)

# Find first PLAN without corresponding SUMMARY
for plan in $PLAN_FILES; do
  summary="${plan/-PLAN.md/-SUMMARY.md}"
  if [[ ! -f "$summary" ]]; then
    NEXT_PLAN="$plan"
    break
  fi
done

echo "Next plan: $NEXT_PLAN"
```

**Mode-aware behavior:**

**If same_phase is true (or default):**

- **YOLO mode:** Auto-execute next plan immediately
  ```
  ⚡ Auto-advancing: {phase}-{next-plan}-PLAN.md
  [Plan X of Y for Phase Z]

  Starting execution...
  ```
  Return: `{ action: "execute", plan_path: "$NEXT_PLAN" }`

  **Implementation:** Invoke execute-phase workflow with NEXT_PLAN path.

- **Interactive mode:** Show next plan info but wait for user
  ```
  Plan {phase}-{current-plan} complete.
  Summary: .planning/phases/XX-name/{phase}-{current-plan}-SUMMARY.md

  [X] of [Y] plans complete for Phase Z.

  ---

  ## ▶ Next Up

  **{phase}-{next-plan}: [Plan Name]** — [objective from next PLAN.md]

  `/gsd:execute-plan {path}`

  <sub>`/clear` first → fresh context window</sub>

  ---
  ```
  Return: `{ action: "prompt", next_plan: "$NEXT_PLAN" }`

**If same_phase is false:**

- **Always prompt regardless of mode** — User explicitly disabled auto-advance
  ```
  Plan {phase}-{current-plan} complete.

  Auto-advance disabled (config.json: auto_advance.same_phase = false)

  Next plan: {phase}-{next-plan}

  /gsd:execute-plan {path}
  ```
  Return: `{ action: "prompt", next_plan: "$NEXT_PLAN" }`

**Behavior matrix (same_phase scenario):**

| Config: same_phase | Mode: yolo | Mode: interactive |
|--------------------|------------|-------------------|
| true (default)     | Auto-execute | Prompt user |
| false              | Prompt user | Prompt user |

</step>

<step name="handle_phase_complete">
Handle advancement when all plans in current phase are complete but more phases exist.

**Step 1: Check if phase summary should be generated:**
```bash
# Read auto_advance.generate_phase_summary setting (default: true if not specified)
GEN_SUMMARY_SETTING=$(cat .planning/config.json 2>/dev/null | grep -A3 '"auto_advance"' | grep '"generate_phase_summary"' | grep -o 'true\|false')
GENERATE_PHASE_SUMMARY=${GEN_SUMMARY_SETTING:-true}
```

**Step 2: Generate phase summary if enabled:**
```bash
if [[ "$GENERATE_PHASE_SUMMARY" == "true" ]]; then
  echo "Generating phase summary..."
  # Invoke create-phase-summary.md workflow
  # This creates PHASE-SUMMARY.md and commits it
fi
```

**Implementation:** Call create-phase-summary.md workflow. This aggregates all plan summaries into PHASE-SUMMARY.md.

**Step 3: Check phase transition config:**
```bash
# Read auto_advance.phase_transition setting (default: false if not specified)
PHASE_TRANS_SETTING=$(cat .planning/config.json 2>/dev/null | grep -A3 '"auto_advance"' | grep '"phase_transition"' | grep -o 'true\|false')
PHASE_TRANSITION=${PHASE_TRANS_SETTING:-false}
```

**Step 4: Mode-aware behavior:**

**If phase_transition is true:**

- **YOLO mode:** Auto-invoke transition.md, then plan next phase
  ```
  Phase [X]: [Name] complete!

  ⚡ Auto-transitioning to Phase [X+1]: [Next Phase Name]

  Invoking transition workflow...
  ```
  Return: `{ action: "transition", next_phase: NEXT_PHASE }`

  **Implementation:** Invoke transition.md workflow, which updates ROADMAP.md, STATE.md, PROJECT.md, then offers to plan next phase.

- **Interactive mode:** Show phase complete, prompt for transition
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
  Return: `{ action: "prompt_transition", next_phase: NEXT_PHASE }`

**If phase_transition is false (default):**

- **Always prompt regardless of mode** — Phase boundaries are decision points
  ```
  ## ✓ Phase [X] Complete

  All [Y] plans finished.

  Phase transitions are decision points (config.json: auto_advance.phase_transition = false)

  ---

  ## ▶ Next Up

  **Phase [X+1]: [Name]** — [Goal from ROADMAP.md]

  `/gsd:plan-phase [X+1]`

  ---
  ```
  Return: `{ action: "prompt_transition", next_phase: NEXT_PHASE }`

**Behavior matrix (phase_complete scenario):**

| Config: phase_transition | Mode: yolo | Mode: interactive |
|--------------------------|------------|-------------------|
| true                     | Auto-transition | Prompt user |
| false (default)          | Prompt user | Prompt user |

**Flow documentation:**
```
advance-work.md (phase complete detected)
    ↓
[generate_phase_summary check]
    ↓ (if true)
create-phase-summary.md
    ↓
[phase_transition check]
    ↓ (if true AND yolo)
transition.md
    ↓ (otherwise)
Prompt user with options
```

</step>

<step name="handle_milestone_complete">
Handle advancement when all plans in current phase are complete AND this is the last phase in the milestone.

**SAFETY RAIL: Milestone completion ALWAYS prompts regardless of config or mode.**

Completing a milestone is a significant decision that should never be automated. This ensures:
- User reviews what was accomplished
- User consciously decides to archive and close the milestone
- Prevents accidental milestone closure

**Step 1: Generate phase summary (same as phase_complete):**
```bash
# Read auto_advance.generate_phase_summary setting (default: true if not specified)
GEN_SUMMARY_SETTING=$(cat .planning/config.json 2>/dev/null | grep -A3 '"auto_advance"' | grep '"generate_phase_summary"' | grep -o 'true\|false')
GENERATE_PHASE_SUMMARY=${GEN_SUMMARY_SETTING:-true}

if [[ "$GENERATE_PHASE_SUMMARY" == "true" ]]; then
  echo "Generating phase summary..."
  # Invoke create-phase-summary.md workflow
fi
```

**Step 2: Display milestone completion message (ALWAYS prompt):**
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

**Step 3: Return action:**
```
Return: { action: "milestone_complete" }
```

This action signals the caller (execute-phase.md or /gsd:advance) that the milestone is complete and the user should be prompted to run /gsd:complete-milestone.

**Behavior matrix (milestone_complete scenario):**

| Config setting | Mode: yolo | Mode: interactive |
|----------------|------------|-------------------|
| Any            | **Prompt user** | **Prompt user** |

**Note:** Unlike same_phase and phase_complete, milestone_complete has NO auto-advance option. This is intentional — milestone boundaries are always manual decisions.

**Error handling for milestone detection:**

If milestone detection fails (e.g., ROADMAP.md parse error, can't determine if last phase):
```bash
if [[ -z "$TOTAL_PHASES" ]] || [[ -z "$PHASE_NUM" ]]; then
  echo "Warning: Could not determine milestone completion status."
  echo "Falling back to phase_complete behavior."
  SCENARIO="phase_complete"
  # Route to handle_phase_complete instead
fi
```

This ensures graceful degradation — if we can't confirm it's the last phase, treat it as a regular phase completion.

</step>

</process>

<success_criteria>
Workflow ready when:

**Context Loading:**
- [ ] STATE.md loaded and parsed (phase position)
- [ ] config.json loaded (mode, auto_advance settings)
- [ ] Phase directory identified and plan/summary counts obtained
- [ ] ROADMAP.md loaded for total phase count

**Scenario Detection:**
- [ ] Scenario correctly identified: same_phase | phase_complete | milestone_complete
- [ ] Edge cases handled (decimal phases, skipped plans)

**Scenario Handling:**
- [ ] **same_phase:** Respects auto_advance.same_phase setting
  - yolo + true: Auto-execute next plan
  - yolo + false: Prompt user
  - interactive: Prompt user
- [ ] **phase_complete:** Respects auto_advance.phase_transition and generate_phase_summary
  - Calls create-phase-summary.md if generate_phase_summary is true
  - yolo + phase_transition true: Auto-transition
  - yolo + phase_transition false: Prompt user (default)
  - interactive: Prompt user
- [ ] **milestone_complete:** ALWAYS prompts (safety rail)
  - Generates phase summary if enabled
  - Never auto-advances regardless of mode or config
  - Prompts user to run /gsd:complete-milestone

**Error Handling:**
- [ ] Missing STATE.md: Error with recovery guidance
- [ ] Missing config.json: Falls back to defaults (interactive mode)
- [ ] Milestone detection failure: Falls back to phase_complete behavior
</success_criteria>
