# Root Cause Analysis Workflow

**The 4-phase systematic debugging protocol.**

## Workflow Activation

**When this workflow is invoked, do BOTH:**

1. **Call notification script:**
   ```bash
   ~/.claude/Tools/SkillWorkflowNotification RootCause Debug
   ```

2. **Output to user:**
   ```
   Running the **RootCause** workflow from the **Debug** skill...
   ```

---

## Trigger Conditions

Use this workflow when:
- Task verification fails during GSD plan execution
- Tests fail unexpectedly
- Code produces wrong output
- User requests debugging assistance
- Runtime errors occur

## Process

### Phase 1: REPRODUCE

**Goal:** Isolate exact failure conditions and capture complete error state.

**Steps:**

1. **Capture the failure**
   ```bash
   # Run the exact failing command/test
   # Capture full output including stderr
   [command] 2>&1 | tee /tmp/debug-output.txt
   ```

2. **Document the state**
   - Error message (exact text)
   - Stack trace (if available)
   - Input that caused failure
   - Environment (node version, OS, env vars)
   - Recent changes (git diff, recent commits)

3. **Create minimal reproduction**
   - Strip away unrelated code
   - Identify smallest input that fails
   - Note: If can't reproduce, bug may be environment-specific

4. **Verify reproduction is consistent**
   ```bash
   # Run 3 times to confirm consistent failure
   for i in 1 2 3; do [failing-command]; done
   ```

**Output:** Clear, reproducible failure case with captured error state.

**If cannot reproduce:**
```
⚠️ Cannot reproduce failure
- Original error: [description]
- Attempted reproduction: [what was tried]
- Possible causes: Timing issue, environment difference, data state

Options:
1. Add logging to capture state on next occurrence
2. Review recent changes for suspicious modifications
3. Check for race conditions or timing dependencies
```

---

### Phase 2: HYPOTHESIZE

**Goal:** Form ranked, evidence-based theories about the cause.

**Steps:**

1. **Analyze the error**
   - What does the error message say?
   - Where in the code does it occur? (file:line)
   - What operation was being attempted?

2. **Map the execution path**
   ```
   Entry point → Function A → Function B → [ERROR HERE]
   ```

3. **Identify what SHOULD happen vs what DOES happen**
   | Expected | Actual |
   |----------|--------|
   | Returns user object | Returns undefined |
   | Status 200 | Status 500 |

4. **Generate hypotheses (ranked by likelihood)**
   ```
   Hypotheses:
   1. [HIGH] [Most likely cause based on error + context]
   2. [MED]  [Second most likely]
   3. [LOW]  [Less likely but possible]
   ```

**Ranking criteria:**
- **HIGH:** Error message directly points to this, or recent change in this area
- **MED:** Related to error area, requires investigation to confirm
- **LOW:** Possible but would require unusual circumstances

**Output:** 2-5 ranked hypotheses with reasoning.

---

### Phase 3: INVESTIGATE

**Goal:** Systematically verify or eliminate hypotheses to find root cause.

**Steps:**

1. **Test highest-ranked hypothesis first**
   ```
   Testing hypothesis 1: [description]

   Evidence check:
   - [Check 1]: [result]
   - [Check 2]: [result]

   Verdict: CONFIRMED / ELIMINATED
   ```

2. **Investigation techniques by bug type**

   **For undefined/null errors:**
   ```bash
   # Trace where the value comes from
   grep -n "variableName" src/**/*.ts
   # Check assignment points
   # Verify data flow
   ```

   **For wrong output:**
   ```
   # Add strategic logging at decision points
   console.log('[DEBUG] Input:', input)
   console.log('[DEBUG] After transform:', result)
   console.log('[DEBUG] Final output:', output)
   ```

   **For type errors:**
   ```bash
   # Check TypeScript types
   npx tsc --noEmit
   # Look for type mismatches
   ```

   **For async issues:**
   ```
   # Check for missing await
   # Look for race conditions
   # Verify promise chains
   ```

3. **Narrow the scope**
   - Binary search through code
   - Comment out sections to isolate
   - Add assertions to verify assumptions

4. **Find the ROOT cause**
   ```
   Symptom: Function returns undefined
   Direct cause: Variable not assigned
   Root cause: Missing await on async call ← FIX THIS
   ```

**Output:** Confirmed root cause with evidence.

**If investigation stalls:**
```
Investigation stalled after [N] hypotheses tested.

Findings so far:
- Eliminated: [list]
- Uncertain: [list]

Next steps:
1. Add comprehensive logging
2. Review git blame for recent changes
3. Check external dependencies
4. Ask for second opinion
```

---

### Phase 4: FIX + VERIFY

**Goal:** Fix root cause, prevent regression, document learning.

**Steps:**

1. **Implement the fix**
   - Fix the ROOT cause, not symptoms
   - Keep fix minimal and focused
   - Don't refactor unrelated code

2. **Add regression test**
   ```typescript
   // Test that proves the bug is fixed
   it('should handle [specific case that was failing]', () => {
     const result = functionThatWasBroken(inputThatCausedBug)
     expect(result).toBe(expectedOutput)
   })
   ```

3. **Verify the fix**
   ```bash
   # Run original failing case
   [original-failing-command]
   # Should now pass

   # Run related tests
   npm test -- --grep "[related-area]"

   # Run full test suite for regressions
   npm test
   ```

4. **Document the learning**
   ```markdown
   ## Debug Learning: [Brief title]

   **Symptom:** [What was observed]
   **Root Cause:** [Actual underlying issue]
   **Fix:** [What was changed]
   **Prevention:** [How to avoid in future]
   **Pattern:** [Generalizable lesson]
   ```

**Output:** Fixed code, regression test, documentation.

---

## Integration with GSD Deviation Rules

After debugging completes, apply appropriate deviation rule:

| Root Cause Type | GSD Rule | Action |
|-----------------|----------|--------|
| Bug in code | Rule 1: Auto-fix | Commit with fix |
| Missing validation | Rule 2: Auto-add critical | Add + commit |
| Missing dependency | Rule 3: Auto-fix blocking | Install + commit |
| Architecture issue | Rule 4: Ask architectural | Stop, present to user |
| Nice-to-have improvement | Rule 5: Log enhancement | Add to ISSUES.md |

---

## Debug Commit Format

When fixing bugs during GSD execution:

```bash
git commit -m "fix({phase}-{plan}): [brief description of fix]

Root cause: [what was actually wrong]
- [key change 1]
- [key change 2]

Adds regression test for [scenario]
"
```

---

## Time Boxing

Debug sessions should be time-boxed to prevent rabbit holes:

| Complexity | Time Box | Escalation |
|------------|----------|------------|
| Simple (obvious cause) | 15 min | Ask for help |
| Medium (requires investigation) | 30 min | Document findings, escalate |
| Complex (multi-system) | 60 min | Stop, create detailed report |

**If time box exceeded:**
```
⏱️ Debug time box exceeded (30 min)

Progress:
- Hypotheses tested: [list]
- Eliminated: [list]
- Best current theory: [description]

Recommendation:
1. [Continue with specific next step]
2. [Escalate to user with findings]
3. [Create ISSUES.md entry for later]
```

---

## Common Patterns

### Pattern: The Missing Await
```
Symptom: Variable is undefined or Promise object
Cause: Async function called without await
Fix: Add await keyword
Prevention: ESLint rule require-await, TypeScript strict mode
```

### Pattern: The Import Mismatch
```
Symptom: X is not a function / Cannot read property of undefined
Cause: CommonJS vs ESM import mismatch
Fix: Use correct import syntax for module type
Prevention: Check package.json "type" field, use consistent imports
```

### Pattern: The Silent Failure
```
Symptom: No error but wrong result
Cause: Caught exception that's swallowed
Fix: Re-throw or handle properly
Prevention: Never use empty catch blocks
```

### Pattern: The Race Condition
```
Symptom: Works sometimes, fails sometimes
Cause: Timing-dependent code without proper synchronization
Fix: Add proper await/locks/queuing
Prevention: Avoid shared mutable state, use async patterns correctly
```

### Pattern: The Environment Mismatch
```
Symptom: Works locally, fails in CI/production
Cause: Missing env var, different Node version, missing dependency
Fix: Align environments
Prevention: .env.example, engine field in package.json, CI parity
```
