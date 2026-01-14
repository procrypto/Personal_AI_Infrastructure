# Judge Gate Workflow

**Quality gate that evaluates outputs against judge.md before delivery.**

This workflow can be inserted into any skill to enforce quality standards at the point of output.

---

## When to Use This Gate

Insert this gate workflow after generating substantive outputs:

| Skill | Gate After | Primary Failure Modes |
|-------|-----------|----------------------|
| **Research** | Research synthesis complete | FM2 (Assertion without demonstration), FM7 (Confidence games) |
| **StoryExplanation** | Narrative draft complete | FM1 (Dressed-up universals), FM3 (False comprehensiveness) |
| **Architect** | Design document complete | FM4 (Confidence-calibration), FM6 (Tiger-style mimicry) |
| **Engineer** | Implementation complete | FM7 (Confidence games), FM2 (Assertion without demonstration) |

---

## Gate Protocol

### Step 1: Identify Output Type

Determine which failure modes are most relevant:

```
OUTPUT_TYPE: [research | narrative | technical | implementation]

PRIORITY_FAILURE_MODES:
- research: FM2, FM7, FM4
- narrative: FM1, FM3, FM6
- technical: FM4, FM6, FM7
- implementation: FM7, FM2
```

### Step 2: Run Judge Evaluation

Apply judge.md evaluation framework to the generated output:

```
JUDGE GATE EVALUATION:

1. SURFACE VS SUBSTANCE CHECK:
   - Does this actually work, or does it just look right?
   - Count genuinely novel observations vs structurally-required sections
   - 10-second rule: Does value hit immediately?

2. SPECIFICITY TEST:
   - What in this output could ONLY come from deep engagement?
   - Replace proper nouns with [PERSON], [COMPANY], [CONTEXT]
   - If it still sounds meaningful, output is generic → REJECT

3. EVIDENCE GROUNDING:
   - Sample 2-3 factual claims
   - Trace each to primary source
   - Flag any claim ending at documentation/summary
   - "I read this in a docstring" = UNVERIFIED

4. FAILURE MODE SCAN:
   For each priority failure mode, check:
   - FM1: Would this "insight" surprise a thoughtful person?
   - FM2: "Show me the evidence that demonstrates this"
   - FM3: Count novel observations vs structural sections
   - FM4: Are uncertain things stated with confidence?
   - FM6: Does this describe WHAT happens or WHY it happens?
   - FM7: What is the primary source? Has it been verified?
```

### Step 3: Deliver Verdict

```
VERDICT: [PASS | REVISE | REJECT]

If PASS:
- Specific value articulated: [what makes this work]
- Confidence level: [high/medium]
- Proceed to delivery

If REVISE:
- Weaknesses: [cite failure modes]
- Required changes: [specific improvements]
- Approach sound: [yes/no]
- Return to generation with feedback

If REJECT:
- Failure mode(s): [which triggered rejection]
- Why unsalvageable: [fundamental approach issue]
- New approach needed: [what would need to be true]
- Reformulate from scratch
```

---

## Integration Pattern

### For Skills Using This Gate

Add to the skill's output phase:

```markdown
### Quality Gate (Before Delivery)

**After generating output, apply judge gate:**

1. Read `${PAI_DIR}/Skills/CORE/workflows/JudgeGate.md`
2. Execute gate protocol with output
3. If PASS → Deliver to user
4. If REVISE → Incorporate feedback, regenerate, re-evaluate
5. If REJECT → Reformulate approach, regenerate from new angle
6. Maximum 3 iterations before escalating to user

**Gate Bypass:** User can say "skip judge" or "just give me the output" to bypass gate.
```

### Example: Research Skill Integration

```markdown
## Final Output Phase

1. Generate research synthesis
2. **JUDGE GATE:**
   - Output type: research
   - Priority FM: FM2 (assertion), FM7 (confidence games), FM4 (calibration)
   - Run evaluation protocol
   - If not PASS, iterate or reformulate
3. Deliver to user (with verdict confidence level)
```

---

## Quick Judge (Lightweight Alternative)

For faster iteration, use quick judge (subset of full evaluation):

```
QUICK JUDGE:
1. FM1 check: Generic or specific?
2. FM4 check: Confidence calibrated?
3. FM7 check: Any unverified confident claims?
4. Compression test: Can this shrink 1/3 without losing substance?

QUICK VERDICT: [OK | FLAG]
- OK → Proceed
- FLAG → Run full judge gate
```

---

## Calibration Signals

### PASS Examples

**Research output:**
> "James treats process visibility as a defensive mechanism against institutional failure modes he's observed. Specifically: (1) async info flow reducing 'I didn't know' cascades, (2) documented decisions creating accountability anchors surviving personnel changes..."

**Why passes:** Specific mechanism, testable, describes WHY not just WHAT.

**Narrative output:**
> "In crisis contexts, sentence length drops 40%, directive density increases 3x, acknowledgment-seeking disappears. This maps to crisis = bandwidth constraint, so optimization shifts from 'ensure understanding' to 'ensure action.'"

**Why passes:** Quantitative, mechanistic, couldn't be written without analysis.

### REJECT Examples

**Research output:**
> "The company values innovation and customer focus."

**Why fails:** Generic, applies to any company, no evidence, no mechanism.

**Narrative output:**
> "He communicates differently in crisis situations, being more direct."

**Why fails:** Obvious (everyone does this), no specificity, pattern-naming without pattern-demonstrating.

---

## Anti-Patterns

**NEVER:**
- Pass work merely because no specific flaw found
- Accept confident assertions as evidence
- Pass generic insights because well-written
- Let comprehensiveness substitute for insight
- Assume documentation reflects implementation

**ALWAYS:**
- Articulate specific failure modes detected
- Distinguish fatal flaws (reject) from improvable weaknesses (revise)
- Actively probe for confidence games
- Demand mechanism, not just pattern
- Require specificity that proves understanding

---

## Workflow Files Reference

This gate workflow references:
- `${PAI_DIR}/Skills/CORE/judge.md` - Full judge framework
- Seven failure modes (FM1-FM7)
- Five reasoning patterns (RP1-RP5)
- Evidence verification protocol
- Verdict structure

---

**This gate ensures outputs meeting actual epistemic standards advance, while outputs performing competence without delivering value are caught and rejected.**
