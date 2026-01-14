# Layered Analysis Workflow

**For complex bugs that span multiple files, systems, or abstraction layers.**

## Workflow Activation

**When this workflow is invoked, do BOTH:**

1. **Call notification script:**
   ```bash
   ~/.claude/Tools/SkillWorkflowNotification LayeredAnalysis Debug
   ```

2. **Output to user:**
   ```
   Running the **LayeredAnalysis** workflow from the **Debug** skill...
   ```

---

## When to Use

Use LayeredAnalysis when:
- Bug crosses multiple files or modules
- Issue involves frontend + backend + database
- Error propagates through multiple layers
- Standard RootCause protocol hasn't isolated the issue
- Bug involves async operations across systems

## The Layered Approach

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYERED ANALYSIS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: LOGICAL FLOW                                      │
│  ├─ Map the execution path across files                     │
│  ├─ Identify decision points and branches                   │
│  └─ Verify preconditions at each step                       │
│                                                             │
│  Layer 2: STATE MANAGEMENT                                  │
│  ├─ Track data mutations through the flow                   │
│  ├─ Identify where state diverges from expected             │
│  └─ Check for race conditions in shared state               │
│                                                             │
│  Layer 3: EDGE CASES                                        │
│  ├─ Test boundary conditions                                │
│  ├─ Check null/undefined handling                           │
│  └─ Verify error path behavior                              │
│                                                             │
│  Layer 4: ERROR PROPAGATION                                 │
│  ├─ Trace error from origin to symptom                      │
│  ├─ Check for swallowed exceptions                          │
│  └─ Verify error transformations                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Process

### Layer 1: Logical Flow Analysis

**Goal:** Understand and verify the execution path.

**Steps:**

1. **Map the call chain**
   ```
   [Entry Point]
        ↓
   [Function A] → file1.ts:23
        ↓
   [Function B] → file2.ts:45
        ↓
   [Function C] → file3.ts:67  ← Somewhere here it breaks
        ↓
   [Expected Output]
   ```

2. **Document the contract at each step**
   ```markdown
   | Function | Input | Expected Output | Actual Output |
   |----------|-------|-----------------|---------------|
   | parseInput | raw string | ParsedData | ✓ Correct |
   | validate | ParsedData | ValidData | ✓ Correct |
   | transform | ValidData | Result | ✗ Returns null |
   ```

3. **Identify the divergence point**
   - Where does actual behavior diverge from expected?
   - What assumptions are violated?

4. **Check preconditions**
   ```typescript
   // Add assertions at function entry
   function transform(data: ValidData): Result {
     console.assert(data !== null, 'data should not be null')
     console.assert(data.field !== undefined, 'field required')
     // ...
   }
   ```

**Output:** Call chain map with identified divergence point.

---

### Layer 2: State Management Analysis

**Goal:** Track how data changes through the system.

**Steps:**

1. **Identify all state sources**
   - Local variables
   - Module-level state
   - Database
   - Cache (Redis, memory)
   - Session/cookies
   - External APIs

2. **Create state timeline**
   ```
   T0: Initial state
       user = { id: 1, name: 'Test' }

   T1: After fetchUser()
       user = { id: 1, name: 'Test', loaded: true }

   T2: After updateName()
       user = { id: 1, name: null }  ← UNEXPECTED

   T3: After render()
       ERROR: Cannot read property 'length' of null
   ```

3. **Check for mutation issues**
   - Unintended mutations (object reference sharing)
   - Missing immutability
   - Stale closures

4. **Check for race conditions**
   ```typescript
   // Potential race condition pattern
   async function loadAndUpdate() {
     const data = await fetch()  // Takes 100ms
     // Another call might modify state here
     setState(data)  // Overwrites concurrent update
   }
   ```

**Output:** State timeline showing where corruption occurs.

---

### Layer 3: Edge Case Analysis

**Goal:** Test boundaries and unusual conditions.

**Steps:**

1. **Identify boundary conditions**
   ```markdown
   | Parameter | Normal | Edge Cases |
   |-----------|--------|------------|
   | array | [1,2,3] | [], [null], [1000 items] |
   | string | "hello" | "", " ", null, "a".repeat(10000) |
   | number | 42 | 0, -1, Infinity, NaN |
   | object | {a:1} | {}, null, undefined |
   ```

2. **Test each edge case**
   ```typescript
   // Test with edge cases
   const edgeCases = [
     { input: [], expected: [] },
     { input: null, expected: null },
     { input: [null], expected: /* ??? */ },
   ]

   for (const { input, expected } of edgeCases) {
     const result = functionUnderTest(input)
     console.log(`Input: ${JSON.stringify(input)}, Result: ${result}`)
   }
   ```

3. **Check defensive coding**
   - Are there null checks where needed?
   - Are array bounds checked?
   - Are types validated at boundaries?

4. **Test error paths**
   - What happens when external service fails?
   - What happens when database times out?
   - What happens when validation fails?

**Output:** Table of edge case results, identified failing cases.

---

### Layer 4: Error Propagation Analysis

**Goal:** Trace errors from origin to visible symptom.

**Steps:**

1. **Find the error origin**
   ```
   Visible Error (what user sees):
     "Something went wrong"
          ↑
   Caught and transformed:
     try { ... } catch (e) { throw new Error("Something went wrong") }
          ↑
   Intermediate handler:
     .catch(e => logger.error(e))  // Swallowed!
          ↑
   Original error:
     TypeError: Cannot read property 'id' of undefined
          ↑
   ROOT CAUSE:
     user object was null due to failed database query
   ```

2. **Check for swallowed errors**
   ```typescript
   // Anti-pattern: swallowed error
   try {
     riskyOperation()
   } catch (e) {
     console.error(e)  // Logged but not re-thrown
   }
   // Code continues as if nothing happened
   ```

3. **Verify error context is preserved**
   - Is the original error message visible?
   - Is the stack trace preserved?
   - Is relevant context (user, request, etc.) included?

4. **Check error transformation chain**
   ```
   Original: DatabaseError("Connection refused")
        ↓ caught by
   Service: ServiceError("Failed to fetch user")
        ↓ caught by
   API: APIError("Internal server error")
        ↓ returned as
   Client: { error: "Something went wrong" }
   ```

**Output:** Error propagation chain with identified information loss.

---

## Specialized Analysis Modes

### Performance Analysis

When the bug is slowness rather than incorrectness:

```
1. MEASURE
   - Add timing to each layer
   - Identify where time is spent

2. ANALYZE COMPLEXITY
   | Operation | Expected | Actual | Data Size |
   |-----------|----------|--------|-----------|
   | Loop | O(n) | O(n²) | 1000 items |

3. IDENTIFY BOTTLENECKS
   - N+1 queries
   - Missing indexes
   - Synchronous I/O
   - Memory allocation in loops

4. VERIFY IMPROVEMENTS
   - Benchmark before and after
   - Test with production-scale data
```

### Integration Analysis

When the bug involves external services:

```
1. ISOLATE THE INTEGRATION POINT
   - Test external service directly
   - Mock external service, test internal logic

2. VERIFY REQUEST/RESPONSE
   - Log full request (headers, body)
   - Log full response
   - Compare to expected

3. CHECK ERROR HANDLING
   - What happens on timeout?
   - What happens on 4xx?
   - What happens on 5xx?

4. VERIFY RETRY/FALLBACK
   - Are retries working?
   - Is fallback triggered correctly?
```

### Async Analysis

When the bug involves concurrency:

```
1. MAP ASYNC OPERATIONS
   Promise.all([
     fetchA(),  // 100ms
     fetchB(),  // 200ms
     fetchC(),  // 150ms
   ])

2. CHECK ORDERING ASSUMPTIONS
   - Are operations order-dependent?
   - Is there implicit sequencing?

3. IDENTIFY RACE CONDITIONS
   - Shared mutable state
   - Missing locks/semaphores
   - Stale closures

4. VERIFY CLEANUP
   - Are promises always resolved/rejected?
   - Are timeouts cleared?
   - Are subscriptions unsubscribed?
```

---

## Output Format

After layered analysis, produce:

```markdown
## Layered Analysis Report

**Bug:** [Brief description]
**Symptom:** [What was observed]

### Analysis Summary

| Layer | Finding |
|-------|---------|
| Logical Flow | ✓ Correct until step 4 |
| State Management | ✗ Race condition in user state |
| Edge Cases | ✗ Null input not handled |
| Error Propagation | ✗ Error swallowed in middleware |

### Root Cause

[Description of actual root cause]

### Fix

[What needs to change]

### Regression Test

```typescript
[Test code that would catch this bug]
```

### Prevention

[How to prevent similar bugs in future]
```

---

## Integration with GSD

When using LayeredAnalysis during plan execution:

1. **Time box:** Max 60 minutes for layered analysis
2. **Checkpoint:** If analysis exceeds 30 min, report progress
3. **Documentation:** All findings go in SUMMARY.md debugging section
4. **Deviation rule:** Apply appropriate rule based on root cause type

```
⚠️ Complex bug requiring layered analysis

Layer 1 (Flow): ✓ Complete - path verified
Layer 2 (State): ✓ Complete - found race condition
Layer 3 (Edge): ⏳ In progress
Layer 4 (Error): ⏳ Pending

Current finding: Race condition between fetchUser and updateProfile
Recommendation: Add mutex/lock, continue analysis to verify
```
