---
name: Debug
description: Systematic debugging framework with 4-phase root cause process. USE WHEN task verification fails, tests fail, code doesn't work as expected, OR user says "debug", "why isn't this working", "fix this bug", "investigate error". Integrates with GSD execution for thorough debugging during development.
---

# Debug Skill

**Systematic debugging framework for thorough root cause analysis.**

## Quick Reference

```
/debug                    # Start debug session on current issue
/debug <file:line>        # Debug specific location
/debug --mode=performance # Use performance analysis mode
/debug --mode=logic       # Use logic bug analysis mode
```

## Core Framework: 4-Phase Root Cause Process

```
┌─────────────────────────────────────────────────────────────┐
│                    DEBUG PROTOCOL                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. REPRODUCE ──────────────────────────────────────────►  │
│     │ Isolate exact failure conditions                      │
│     │ Capture error state, inputs, environment              │
│     │ Create minimal reproduction case                      │
│     │                                                       │
│  2. HYPOTHESIZE ────────────────────────────────────────►  │
│     │ Form evidence-based theories (ranked by likelihood)   │
│     │ Identify what SHOULD happen vs what DOES happen       │
│     │ Map execution path to narrow scope                    │
│     │                                                       │
│  3. INVESTIGATE ────────────────────────────────────────►  │
│     │ Trace execution systematically                        │
│     │ Verify/eliminate hypotheses with evidence             │
│     │ Find ROOT cause, not just symptoms                    │
│     │                                                       │
│  4. FIX + VERIFY ───────────────────────────────────────►  │
│     │ Fix the root cause (not symptoms)                     │
│     │ Add regression test                                   │
│     │ Verify fix doesn't break other things                 │
│     │ Document the learning                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Workflow Routing

**When executing a workflow, do BOTH of these:**

1. **Call the notification script** (for observability tracking):
   ```bash
   ~/.claude/Tools/SkillWorkflowNotification WORKFLOWNAME Debug
   ```

2. **Output the text notification** (for user visibility):
   ```
   Running the **WorkflowName** workflow from the **Debug** skill...
   ```

| Workflow | Trigger | File |
|----------|---------|------|
| **RootCause** | "debug", verification fails, tests fail, "fix this bug" | `workflows/RootCause.md` |
| **LayeredAnalysis** | Complex multi-layer bug, spans multiple systems | `workflows/LayeredAnalysis.md` |

**Mode selection (passed to RootCause workflow):**
- `--mode=standard` (default) - General debugging
- `--mode=logic` - Wrong output, logic bugs
- `--mode=performance` - Slow execution, timeouts
- `--mode=integration` - API, database, external service issues

## Debug Modes

### Standard Mode (Default)
General-purpose debugging for most issues.

### Logic Mode (`--mode=logic`)
For bugs where code runs but produces wrong output.

**Layer-by-layer analysis:**
1. **Flow Analysis** - Trace logical execution path
2. **State Analysis** - Track variable mutations
3. **Edge Cases** - Test boundary conditions
4. **Error Propagation** - Follow error through call stack

### Performance Mode (`--mode=performance`)
For slow execution, memory issues, timeouts.

**Analysis steps:**
1. **Complexity Analysis** - Big-O of hot paths
2. **Bottleneck Identification** - Profile-based or inference
3. **Resource Analysis** - Memory, connections, file handles
4. **Optimization Candidates** - Ranked by impact

### Integration Mode (`--mode=integration`)
For API, database, external service issues.

**Analysis steps:**
1. **Request/Response Analysis** - Verify payloads
2. **Timing Analysis** - Race conditions, timeouts
3. **State Sync** - Verify data consistency
4. **Error Handling** - Check failure paths

## GSD Integration

### During Plan Execution

When a task's `<verify>` step fails, the debug protocol activates:

```
Task 3 verification failed:
  Expected: curl returns 200
  Actual: curl returns 500

┌─ DEBUG PROTOCOL ACTIVATED ─────────────────────────────┐
│                                                         │
│ Phase 1: REPRODUCE                                      │
│ - Running exact verification command again...           │
│ - Capturing full error response...                      │
│ - Checking server logs...                               │
│                                                         │
│ Phase 2: HYPOTHESIZE                                    │
│ 1. [HIGH] Missing environment variable                  │
│ 2. [MED] Database connection failed                     │
│ 3. [LOW] Code typo in route handler                     │
│                                                         │
│ Phase 3: INVESTIGATE                                    │
│ - Testing hypothesis 1...                               │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

### Integration with Deviation Rules

Debug findings map to GSD deviation rules:

| Debug Finding | GSD Deviation Rule | Action |
|---------------|-------------------|--------|
| Bug in existing code | Rule 1: Auto-fix bugs | Fix + document |
| Missing validation | Rule 2: Auto-add critical | Add + document |
| Missing dependency | Rule 3: Auto-fix blocking | Install + document |
| Architecture issue | Rule 4: Ask about architectural | Stop + ask user |
| Enhancement opportunity | Rule 5: Log non-critical | Log to ISSUES.md |

### Debug Documentation for SUMMARY.md

When debugging occurs during plan execution, capture learnings:

```markdown
## Debugging Sessions

### Debug 1: [Brief description]
- **Trigger:** Task [N] verification failed
- **Symptom:** [What was observed]
- **Root Cause:** [Actual cause found]
- **Fix:** [What was done]
- **Prevention:** [How to prevent recurrence]
- **Time spent:** [duration]
```

## Principles

### 1. Reproduce First
Never guess. Always reproduce the exact failure before investigating.

### 2. Hypothesize with Evidence
Rank hypotheses by likelihood. Test most likely first.

### 3. Find Root Cause, Not Symptoms
A symptom fix will break again. Root cause fixes are permanent.

### 4. Verify the Fix
Run the original failing case. Run related tests. Check for regressions.

### 5. Document the Learning
Future you (or Claude) will encounter similar issues. Capture the pattern.

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
|--------------|---------|---------|
| Shotgun debugging | Random changes hoping something works | Systematic hypothesis testing |
| Print statement flood | Too much noise, hard to analyze | Strategic logging at decision points |
| Fixing symptoms | Bug returns in different form | Trace to root cause |
| Skipping reproduction | Might fix wrong thing | Always reproduce first |
| No regression test | Same bug returns later | Add test proving fix works |

## Example Debug Session

```
User: The login endpoint returns 500

=== DEBUG PROTOCOL ===

Phase 1: REPRODUCE
$ curl -X POST localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

Response: {"error":"Internal Server Error"}
Server log: TypeError: Cannot read property 'compare' of undefined
             at /src/app/api/auth/login/route.ts:15

✓ Reproduced. Error at route.ts:15, 'compare' is undefined.

Phase 2: HYPOTHESIZE
1. [HIGH] bcrypt not imported or imported incorrectly
2. [MED] bcrypt.compare called on wrong object
3. [LOW] bcrypt package not installed

Phase 3: INVESTIGATE
Reading route.ts:15...

import bcrypt from 'bcrypt'  // Line 1
...
const match = await bcrypt.compare(password, user.password)  // Line 15

Checking import... bcrypt is default export but package uses named exports.
→ Hypothesis 1 CONFIRMED: Import syntax wrong

Phase 4: FIX + VERIFY
Fix: Change `import bcrypt from 'bcrypt'`
     to `import * as bcrypt from 'bcrypt'`

Verify:
$ curl -X POST localhost:3000/api/auth/login ...
Response: {"token":"eyJ..."}  ✓

Regression check:
$ npm test -- --grep "auth"
All 12 tests pass ✓

=== DEBUG COMPLETE ===

Root cause: Incorrect import syntax for bcrypt (CommonJS module)
Prevention: Add ESLint rule for import/named or use bcryptjs (ESM-native)
```

## Examples

**Example 1: Debug a failing test**
```
User: "The auth test is failing - can you debug it?"
→ Invokes RootCause workflow
→ Phase 1: Reproduces test failure, captures error output
→ Phase 2: Forms hypotheses (missing mock, wrong assertion, async issue)
→ Phase 3: Investigates top hypothesis, finds missing await
→ Phase 4: Fixes async issue, verifies test passes
→ Returns: Root cause explanation + fix + pattern learned
```

**Example 2: Debug during GSD plan execution**
```
[During /gsd:execute-plan]
Task 3 verification fails: curl returns 500 instead of 200
→ Debug protocol auto-activates
→ Reproduces error, checks server logs
→ Hypothesizes: missing env var, db connection, code bug
→ Finds root cause: DATABASE_URL not set in .env
→ Auto-fixes (deviation rule 3), continues execution
→ Documents in SUMMARY.md Debugging Sessions section
```

**Example 3: Complex multi-system bug**
```
User: "Login works locally but fails in production - no error message"
→ Invokes LayeredAnalysis workflow (complex, multi-layer)
→ Layer 1 (Flow): Maps auth flow across frontend → API → database
→ Layer 2 (State): Tracks token through the system
→ Layer 3 (Edge): Tests production-specific conditions
→ Layer 4 (Error): Finds swallowed exception in error boundary
→ Returns: Detailed analysis report with root cause + fix
```

**Example 4: Performance debugging**
```
User: "The dashboard is loading slowly"
→ Invokes RootCause workflow with --mode=performance
→ Measures load time, identifies slow components
→ Analyzes: N+1 queries, missing indexes, large payloads
→ Finds root cause: Fetching all users instead of paginated
→ Returns: Bottleneck analysis + optimization recommendation
```

## Related Documentation

- `~/.claude/Skills/Debug/workflows/RootCause.md` - Full 4-phase protocol
- `~/.claude/Skills/Debug/workflows/LayeredAnalysis.md` - Complex bug analysis
- `~/.claude/get-shit-done/workflows/execute-phase.md` - GSD integration
- `~/.claude/get-shit-done/references/tdd.md` - Test-first approach
