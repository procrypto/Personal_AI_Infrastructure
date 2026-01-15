<purpose>
Generate PHASE-SUMMARY.md at phase completion by aggregating all plan summaries into a single phase-level document.

Called by advance-work.md when `auto_advance.generate_phase_summary` is true. Produces aggregated documentation that links to individual plan summaries for details.
</purpose>

<required_reading>
**Read these files:**
1. ~/.claude/get-shit-done/templates/phase-summary.md
2. Current phase's *-SUMMARY.md files
3. .planning/STATE.md
4. .planning/config.json
</required_reading>

<invocation>
## When This Workflow Runs

**Automatic invocation:**
- Called by advance-work.md during phase completion
- Only runs when config.json has `auto_advance.generate_phase_summary: true`
- Executes after all plans in phase have SUMMARY.md files

**Manual invocation:**
```bash
# If you need to regenerate a phase summary
/gsd:create-phase-summary [phase-number]
```

**Prerequisites:**
- All plans in phase must have SUMMARY.md (workflow will error otherwise)
- STATE.md must exist with current position
</invocation>

<integration_points>
## Integration with GSD System

**Entry point:** Called by advance-work.md (Phase 3 of auto-advance milestone)

**Reads:**
- `.planning/STATE.md` - Current phase identification
- `.planning/config.json` - Check generate_phase_summary setting
- `.planning/phases/XX-name/*-SUMMARY.md` - All plan summaries to aggregate

**Writes:**
- `.planning/phases/XX-name/PHASE-SUMMARY.md` - Aggregated phase documentation

**Commits:**
- Message format: `docs(XX): complete phase summary`
- Staged files: PHASE-SUMMARY.md only

**Flow:**
```
execute-phase.md (last plan)
    → advance-work.md (checks config)
    → create-phase-summary.md (this workflow)
    → transition.md (advance to next phase)
```
</integration_points>

<error_handling>
## Error Conditions

**Missing plan summaries:**
```
Error: Cannot generate phase summary - missing plan summaries:
- 02-02-SUMMARY.md not found
- 02-03-SUMMARY.md not found

Run /gsd:execute-plan for remaining plans before generating phase summary.
```
Action: Exit with error, list missing files.

**Config disabled:**
```
Phase summary generation disabled (auto_advance.generate_phase_summary: false).
Skipping PHASE-SUMMARY.md creation.
```
Action: Exit silently (not an error condition).

**Parse errors:**
```
Error: Failed to parse frontmatter in 02-01-SUMMARY.md
[error details]

Fix the YAML frontmatter and retry.
```
Action: Report which file failed, exit with error.

**Phase directory not found:**
```
Error: Phase directory not found: .planning/phases/02-phase-summary/
Verify STATE.md has correct current position.
```
Action: Exit with error.
</error_handling>

<process>

<step name="check_config">
Read config.json and verify phase summary generation is enabled.

```bash
cat .planning/config.json 2>/dev/null
```

**Parse for:** `auto_advance.generate_phase_summary`

**If true or not present (default true):**
- Continue to identify_phase step

**If explicitly false:**
```
Phase summary generation disabled (auto_advance.generate_phase_summary: false).
Skipping PHASE-SUMMARY.md creation.
```
- Exit workflow (not an error)

</step>

<step name="identify_phase">
Get current phase from STATE.md and locate phase directory.

```bash
cat .planning/STATE.md 2>/dev/null
```

**Parse Current Position section for:**
- Phase number (X of total)
- Phase name

**Derive phase directory:**
```bash
# Find phase directory matching current phase number
PHASE_DIR=$(ls -d .planning/phases/${PHASE_NUM}-* 2>/dev/null | head -1)
```

**If phase directory not found:**
- Error with message about invalid STATE.md position

**List all summary files:**
```bash
ls "${PHASE_DIR}"/*-SUMMARY.md 2>/dev/null | sort
```

**Validate completeness:**
- Count PLAN.md files in directory
- Count SUMMARY.md files (excluding PHASE-SUMMARY.md)
- If counts don't match: Error with list of missing summaries

</step>

<step name="read_plan_summaries">
Read all plan summaries for the phase and parse frontmatter.

```bash
for summary in "${PHASE_DIR}"/*-SUMMARY.md; do
  # Skip PHASE-SUMMARY.md if it exists
  [[ "$summary" == *"PHASE-SUMMARY"* ]] && continue
  cat "$summary"
done
```

**For each summary, extract from frontmatter:**
- phase, plan, subsystem
- tags (array)
- requires, provides, affects
- tech-stack.added, tech-stack.patterns
- key-files.created, key-files.modified
- key-decisions (array)
- patterns-established (array)
- issues-created (array)
- duration, completed

**Extract from body:**
- One-liner (bold text after title)
- Performance section (started, completed timestamps)
- Accomplishments list
- Files Created/Modified
- Decisions Made
- Deviations Summary (counts)
- Issues section

**Store in structured format for aggregation.**

</step>

<step name="aggregate_data">
Aggregate data from all plan summaries using union rules.

**Union operations (deduplicate):**
```
aggregated_tags = union(plan1.tags, plan2.tags, ...)
aggregated_provides = union(plan1.provides, plan2.provides, ...)
aggregated_affects = union(plan1.affects, plan2.affects, ...)
aggregated_tech_added = union(plan1.tech-stack.added, ...)
aggregated_tech_patterns = union(plan1.tech-stack.patterns, ...)
aggregated_key_files_created = union(plan1.key-files.created, ...)
aggregated_key_files_modified = union(plan1.key-files.modified, ...)
aggregated_patterns = union(plan1.patterns-established, ...)
aggregated_issues = union(plan1.issues-created, ...)
```

**Concatenate operations (preserve all):**
```
all_decisions = concat(plan1.key-decisions, plan2.key-decisions, ...)
```

**Sum operations:**
```
total_duration = sum(plan1.duration, plan2.duration, ...)
total_files = count(unique(all_files_created + all_files_modified))
```

**Collect for table:**
```
plans_table = [
  { plan: "01", name: plan1.name, one_liner: plan1.one_liner, duration: plan1.duration },
  { plan: "02", name: plan2.name, one_liner: plan2.one_liner, duration: plan2.duration },
  ...
]
```

**Deviation aggregation:**
- Sum auto-fixed counts from each plan
- Sum deferred counts from each plan
- Note: Link to plan summaries for details

**Timing:**
- started: earliest plan start timestamp
- completed: latest plan end timestamp

</step>

<step name="generate_one_liner">
Create phase-level substantive summary that describes what the ENTIRE phase shipped.

**Rules:**
- Must be different from individual plan one-liners
- Must synthesize across all plans
- Must be substantive (not "Phase complete" or "All plans finished")
- Should tell someone what the whole phase accomplished

**Process:**
1. Review all plan one-liners
2. Identify the overarching theme/outcome
3. Synthesize into single statement that captures phase value

**Good examples:**
- "Auto-advance config schema, phase summary aggregation, and transition workflow integration"
- "User authentication with JWT, session management, and protected route middleware"

**Bad examples:**
- "Phase complete"
- "All plans finished"
- "Foundation work done"

</step>

<step name="write_phase_summary">
Create PHASE-SUMMARY.md using template and aggregated data.

**File path:** `.planning/phases/XX-name/PHASE-SUMMARY.md`

**Use template from:** `~/.claude/get-shit-done/templates/phase-summary.md`

**Populate frontmatter:**
```yaml
---
phase: XX-name
subsystem: [derived from plan subsystems or phase focus]
tags: [aggregated_tags]

requires:
  - phase: [from first plan's requires]
    provides: [what was needed]
provides:
  - [aggregated_provides]
affects: [aggregated_affects]

tech-stack:
  added: [aggregated_tech_added]
  patterns: [aggregated_tech_patterns]

key-files:
  created: [aggregated_key_files_created]
  modified: [aggregated_key_files_modified]

key-decisions:
  - "Decision 1"
  - "Decision 2"

patterns-established:
  - "Pattern 1: description"

issues-created: [aggregated_issues]

plans-completed: N
total-duration: Xmin
completed: YYYY-MM-DD
---
```

**Populate body sections:**
- Title with phase name
- Phase one-liner (from generate_one_liner)
- Performance metrics (aggregated)
- Plans Completed table
- Key Accomplishments (top 5-7, not exhaustive)
- Aggregated Decisions table
- Deviations Summary (counts + links)
- Issues Created This Phase
- Next Phase Readiness

**Write file:**
```bash
cat > "${PHASE_DIR}/PHASE-SUMMARY.md" << 'EOF'
[generated content]
EOF
```

</step>

<step name="git_commit">
Stage and commit the PHASE-SUMMARY.md.

```bash
# Stage only the phase summary
git add "${PHASE_DIR}/PHASE-SUMMARY.md"

# Verify staging
git status --short

# Commit
git commit -m "$(cat <<'EOF'
docs(XX): complete phase summary

Phase XX: [Phase Name]
- [N] plans aggregated
- Total duration: [Xmin]

PHASE-SUMMARY: .planning/phases/XX-name/PHASE-SUMMARY.md
EOF
)"
```

**Record commit hash for logging.**

</step>

</process>

<success_criteria>
Phase summary creation complete when:

- [ ] Config checked (generate_phase_summary enabled or default)
- [ ] Phase identified from STATE.md
- [ ] All plan summaries read and parsed
- [ ] Data aggregated using union/sum rules
- [ ] Phase one-liner generated (substantive, not generic)
- [ ] PHASE-SUMMARY.md created with full template
- [ ] Committed to git with docs(XX): complete phase summary
</success_criteria>
