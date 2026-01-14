# PAI Integration Reference

**How GSD integrates with PAI (Personal AI Infrastructure).**

---

## Overview

GSD handles project STRUCTURE (what to do, when).
PAI handles EXECUTION quality (how to do it well).

Together they provide:
- Hierarchical planning (GSD)
- Quality evaluation (PAI Judge)
- Capability invocation (PAI Skills)
- Context persistence (GSD STATE + PAI History)

---

## Unified Quality Model

### Two Layers

**Layer 1: GSD Deviation Rules (during execution)**
- Auto-fix bugs
- Auto-add critical gaps
- Auto-fix blockers
- Ask about architectural changes
- Log enhancements to ISSUES.md

**Layer 2: PAI Judge Gate (at plan completion)**
- FM2: Assertion without demonstration
- FM4: Confidence-calibration failures
- FM7: Confidence games (unverified claims)

### Flow

```
Task 1 → [deviations?] → commit
Task 2 → [deviations?] → commit
...
All tasks complete
         ↓
    JUDGE GATE
         ↓
    ┌────┴────┐
  PASS      REVISE/REJECT
    ↓           ↓
SUMMARY.md   Fix issues or
             escalate to user
```

---

## Invoking PAI Skills from Plans

Plans can reference PAI skills when appropriate:

```markdown
## Tasks

1. **Research authentication patterns**
   - Use PAI Research skill to investigate OAuth2 vs JWT tradeoffs
   - Document findings in CONTEXT.md
   - [ ] Research complete with evidence

2. **Implement authentication**
   - Follow PAI Engineer best practices
   - Apply judge gate before completing
   - [ ] Implementation passes quality check
```

---

## Context Bridging

### At Session Start

When PAI detects `.planning/STATE.md`:
1. Load project position (current phase, plan)
2. Load key decisions and open issues
3. Load recent session context
4. Suggest `/gsd:progress` or `/gsd:resume-work`

### At Plan Completion

Update both systems:
1. **GSD:** STATE.md (position, decisions, issues)
2. **PAI:** History (if significant learnings)

---

## Quality Gate in execute-plan

Add to execute-plan.md after all tasks complete:

```xml
<step name="quality_gate">

Before creating SUMMARY.md, apply quality gate:

1. Check: Did implementation match plan intent?
2. Check: Are claims substantiated by commits?
3. Check: Is evidence trail complete?
4. Apply FM2, FM4, FM7 checks

**Verdict:**
- PASS → Create SUMMARY.md
- REVISE → Re-execute failing tasks (max 2 cycles)
- REJECT → Escalate to user (like architectural deviation)

Reference: ${PAI_DIR}/Skills/CORE/workflows/GSDQualityGate.md

</step>
```

---

## Agent Delegation

GSD's subagent execution can use PAI's specialized agents:

| Task Type | GSD Approach | PAI Enhancement |
|-----------|--------------|-----------------|
| Research | Generic subagent | Use `researcher` agent type |
| Implementation | Generic subagent | Use `engineer` agent type |
| Architecture | Ask user | Use `architect` agent type |

Example in plan:
```markdown
## Tasks

1. **Research deployment options**
   - Subagent: researcher
   - Model: sonnet (good balance)
```

---

## When to Use What

**Use GSD commands when:**
- Starting new project → `/gsd:new-project`
- Creating phases → `/gsd:create-roadmap`
- Planning work → `/gsd:plan-phase`
- Executing plans → `/gsd:execute-plan`
- Checking progress → `/gsd:progress`

**Use PAI skills when:**
- Need specialized capability (Research, Art, etc.)
- Want quality evaluation (Judge)
- Ad-hoc tasks outside project scope

**Use both when:**
- Plan tasks need skill capabilities
- Plan completion needs quality verification
- Complex work benefits from both structure and quality

---

## Files Reference

**GSD Files:**
- `.planning/PROJECT.md` - Project vision
- `.planning/ROADMAP.md` - Phase breakdown
- `.planning/STATE.md` - Project memory
- `.planning/phases/XX-name/XX-YY-PLAN.md` - Execution plans

**PAI Files:**
- `${PAI_DIR}/Skills/CORE/judge.md` - Quality framework
- `${PAI_DIR}/Skills/CORE/workflows/GSDQualityGate.md` - Unified quality model
- `${PAI_DIR}/History/` - Permanent learnings

---

## Quick Reference

```
SESSION START:
├─ PAI loads CORE context (via hook)
├─ Check for .planning/STATE.md
└─ If found: Load GSD project context

PLAN EXECUTION:
├─ Execute tasks sequentially
├─ Apply deviation rules per task
├─ Commit per task
└─ JUDGE GATE before SUMMARY

JUDGE VERDICTS:
├─ PASS → Complete normally
├─ REVISE → Fix and re-evaluate
└─ REJECT → Escalate to user

SESSION END:
├─ Update STATE.md (GSD)
└─ Capture to History if significant (PAI)
```
