---
description: Start systematic debugging with 4-phase root cause analysis
argument-hint: "[description of issue] [--mode=standard|logic|performance|integration]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

<objective>
Invoke the Debug skill's RootCause workflow to systematically debug an issue.

Uses the 4-phase protocol:
1. REPRODUCE - Isolate exact failure
2. HYPOTHESIZE - Form ranked theories
3. INVESTIGATE - Find root cause
4. FIX + VERIFY - Fix and prevent regression
</objective>

<execution_context>
@~/.claude/Skills/Debug/SKILL.md
@~/.claude/Skills/Debug/workflows/RootCause.md
</execution_context>

<context>
Issue description: $ARGUMENTS

**Parse mode from arguments:**
- `--mode=logic` → Logic bug analysis (wrong output)
- `--mode=performance` → Performance analysis (slow execution)
- `--mode=integration` → Integration analysis (API/external services)
- Default → Standard debugging mode
</context>

<process>
1. **Workflow notification:**
   ```bash
   ~/.claude/Tools/SkillWorkflowNotification RootCause Debug
   ```
   Output: `Running the **RootCause** workflow from the **Debug** skill...`

2. **Parse the issue:**
   - Extract issue description from $ARGUMENTS
   - Identify mode flag if present
   - Determine if this is GSD context (check for .planning/)

3. **Execute 4-phase protocol:**
   Follow `~/.claude/Skills/Debug/workflows/RootCause.md`:

   **Phase 1: REPRODUCE**
   - Identify the failing command/test/behavior
   - Run it to capture exact error
   - Document failure state

   **Phase 2: HYPOTHESIZE**
   - Analyze error message and context
   - Form 2-3 ranked hypotheses
   - Identify most likely cause

   **Phase 3: INVESTIGATE**
   - Test hypotheses systematically
   - Use evidence to confirm/eliminate
   - Find ROOT cause, not symptom

   **Phase 4: FIX + VERIFY**
   - Implement targeted fix
   - Verify original issue resolved
   - Add regression test if applicable
   - Document the pattern learned

4. **Report results:**
   - Root cause found
   - Fix applied
   - Prevention strategy
   - Pattern for future reference
</process>

<mode_selection>
**Standard Mode (default):**
General-purpose debugging for most issues.

**Logic Mode (--mode=logic):**
For bugs where code runs but produces wrong output.
- Layer-by-layer analysis: Flow → State → Edge Cases → Error Propagation

**Performance Mode (--mode=performance):**
For slow execution, memory issues, timeouts.
- Complexity analysis, bottleneck identification, resource analysis

**Integration Mode (--mode=integration):**
For API, database, external service issues.
- Request/Response analysis, timing analysis, error handling verification
</mode_selection>

<complex_bug_escalation>
If the bug is complex (spans multiple systems, requires layered analysis):

Invoke LayeredAnalysis workflow instead:
```bash
~/.claude/Tools/SkillWorkflowNotification LayeredAnalysis Debug
```

Follow `~/.claude/Skills/Debug/workflows/LayeredAnalysis.md`
</complex_bug_escalation>

<time_boxing>
- Simple issues: 15 minutes max
- Complex issues: 30 minutes max
- Layered analysis: 60 minutes max

If time box exceeded, report findings and escalate to user.
</time_boxing>

<success_criteria>
- [ ] Issue reproduced and documented
- [ ] Root cause identified (not just symptom)
- [ ] Fix implemented and verified
- [ ] Regression test added (if applicable)
- [ ] Pattern documented for future reference
</success_criteria>
