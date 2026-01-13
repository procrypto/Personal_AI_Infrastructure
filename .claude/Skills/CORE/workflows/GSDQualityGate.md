# GSD + PAI Unified Quality Model

**Combines GSD deviation rules (execution-time) with PAI judge gates (output evaluation).**

---

## The Two Quality Layers

### Layer 1: GSD Deviation Rules (During Execution)

Applied WHILE executing plan tasks. Handles scope and blockers.

| Deviation Type | Action | Example |
|----------------|--------|---------|
| **Bugs discovered** | Auto-fix, document | Found null check missing → fix it |
| **Critical gaps** | Auto-add, document | Security vulnerability → add fix |
| **Blockers** | Auto-fix, document | Can't proceed without X → add X |
| **Architectural** | STOP, ask user | Major pattern change needed |
| **Enhancements** | Log to ISSUES.md, continue | Nice-to-have for later |

**Key principle:** Only architectural deviations stop execution.

### Layer 2: PAI Judge Gate (At Plan Completion)

Applied AFTER all tasks complete, BEFORE SUMMARY.md creation. Evaluates output quality.

**Priority failure modes for plan outputs:**
- **FM2:** Assertion without demonstration (claims without evidence)
- **FM4:** Confidence-calibration failures (stating uncertain things confidently)
- **FM7:** Confidence games (unverified claims presented as fact)

---

## Unified Quality Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PLAN EXECUTION                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Task 1                                                  ││
│  │  ├─ Execute                                             ││
│  │  ├─ [Deviation?] → Apply deviation rules               ││
│  │  ├─ Commit: feat(phase-plan): task-1                   ││
│  │  └─ Continue                                            ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Task 2                                                  ││
│  │  ├─ Execute                                             ││
│  │  ├─ [Deviation?] → Apply deviation rules               ││
│  │  ├─ Commit: feat(phase-plan): task-2                   ││
│  │  └─ Continue                                            ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ JUDGE GATE (before SUMMARY.md)                          ││
│  │                                                         ││
│  │  1. Evaluate plan outputs against FM2, FM4, FM7         ││
│  │  2. Check: Did implementation match plan intent?         ││
│  │  3. Check: Are claims in SUMMARY substantiated?          ││
│  │  4. Verdict: PASS / REVISE / REJECT                     ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                   │
│              ┌───────────┼───────────┐                       │
│              ▼           ▼           ▼                       │
│           PASS        REVISE      REJECT                     │
│              │           │           │                       │
│              ▼           ▼           ▼                       │
│         Create      Re-execute    Escalate                   │
│        SUMMARY.md   with fixes   to user                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Judge Gate Protocol for GSD Plans

### What to Evaluate

At plan completion, evaluate:

1. **Implementation vs Intent**
   - Did the code/output match what the plan specified?
   - Were task objectives achieved?

2. **SUMMARY.md Quality**
   - Are claims about what was built substantiated by code?
   - Is the summary specific (not generic)?
   - Does it describe WHAT was built AND WHY it works?

3. **Evidence Trail**
   - Can each commit be traced to a task?
   - Are deviation decisions documented?
   - Would someone reading the summary understand what happened?

### Verdict Actions

**PASS:**
```
→ Create SUMMARY.md with substantive content
→ Update STATE.md (position, decisions, issues)
→ Update ROADMAP.md (plan count, status)
→ Commit: docs(phase-plan): complete [plan-name]
→ Present completion to user
```

**REVISE:**
```
→ Identify specific weaknesses
→ Re-execute failing tasks (not entire plan)
→ Re-evaluate after fixes
→ Maximum 2 revision cycles
→ If still fails after 2 cycles → REJECT
```

**REJECT:**
```
→ This is equivalent to GSD's "ask about architectural"
→ Stop execution
→ Present issue to user:
   - What failed the quality check
   - Why the fundamental approach may need rethinking
   - Options for proceeding
→ User decides: reformulate plan, override gate, or abandon
```

---

## Quick Judge (Lightweight Check)

For plans with clear success criteria, use quick judge:

```
QUICK JUDGE (before SUMMARY.md):

1. Did all tasks complete successfully?
2. Do commits exist for each task?
3. Does implementation match plan intent?
4. Can SUMMARY claims be verified from code?

QUICK VERDICT: [OK | FULL_REVIEW]
- OK → Create SUMMARY.md
- FULL_REVIEW → Run full judge gate
```

---

## Integration Points

### In execute-plan.md

Add after all tasks complete, before SUMMARY creation:

```markdown
<step name="quality_gate">

**Before creating SUMMARY.md, apply quality gate:**

1. Read `${PAI_DIR}/Skills/CORE/workflows/GSDQualityGate.md`
2. Evaluate implementation against plan intent
3. Check evidence trail (commits, deviation docs)
4. Apply relevant failure modes (FM2, FM4, FM7)

**If PASS:** Continue to SUMMARY creation
**If REVISE:** Re-execute specific tasks, then re-evaluate (max 2 cycles)
**If REJECT:** Stop and present issue to user (like architectural deviation)

</step>
```

### In SUMMARY.md Template

Add quality gate result:

```markdown
## Quality Gate

**Verdict:** [PASS | PASS after revision | Overridden by user]
**Checks:**
- [ ] Implementation matches plan intent
- [ ] All claims substantiated by code
- [ ] Evidence trail complete
**Notes:** [Any quality observations]
```

---

## When to Skip the Gate

Gate can be skipped when:
- config.json mode is "yolo" AND plan has explicit "skip-quality-gate" flag
- User says "skip judge" or "no gate"
- Plan is purely mechanical (e.g., dependency updates, config changes)

Gate should NOT be skipped for:
- Feature implementation
- Architectural changes
- Any plan with decision checkpoints
- First plan in a new phase

---

## Calibration: What PASS Looks Like

**Good SUMMARY.md (PASS):**
```markdown
## What We Built

Implemented rate limiting middleware with sliding window algorithm.
Uses Redis for distributed state across instances.
Configured at 100 requests/minute per user, with burst allowance of 20.

## Key Implementation Details

- `RateLimiter` class in `src/middleware/rate-limit.ts`
- Uses `ioredis` for atomic increment operations
- Sliding window calculated via sorted sets with TTL
- Returns 429 with Retry-After header when limit exceeded

## Deviations

- Added connection pooling (wasn't in plan but needed for performance)
- Logged enhancement: IP-based limiting for unauthenticated requests

## Evidence

- Commit abc123: feat(03-01): add rate limiter middleware
- Commit def456: feat(03-01): integrate rate limiter with routes
- Test coverage: 94% on rate-limit.ts
```

**Bad SUMMARY.md (REJECT):**
```markdown
## What We Built

Added rate limiting to the API.

## Implementation

The rate limiter works well and prevents abuse.

## Notes

Everything went smoothly.
```

The second example fails FM3 (false comprehensiveness) and FM7 (no evidence) - it's generic and unsubstantiated.

---

## Related Documentation

- `${PAI_DIR}/Skills/CORE/judge.md` - Full judge framework
- `${PAI_DIR}/Skills/CORE/workflows/JudgeGate.md` - General judge gate
- `~/.claude/get-shit-done/references/principles.md` - GSD deviation rules
- `~/.claude/get-shit-done/workflows/execute-phase.md` - Execution workflow
