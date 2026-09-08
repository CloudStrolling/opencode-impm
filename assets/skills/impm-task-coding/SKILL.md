---
name: impm-task-coding
description: Step blueprint for a single coding task (context→cs→ws→dbd→api→testcase→code→writetest→runtest); executed directly by the PM in the phase-wave concurrent dispatch of impm-coding, complying with the version directory write conflict avoidance rules.
---

# impm-task-coding Skill

## Trigger Words
- Coding task
- Execute task
- Task coding

## When to Use
Use when impm-coding (PM) determines that a task is executable (no prerequisite tasks or all prerequisites are "completed") and includes it in a concurrent batch, and the task's coding development needs to be completed following the standard step sequence. This skill describes the **single-task** step blueprint; the PM executes it in impm-coding following the "phase-wave" model: within the same phase, it concurrently dispatches the corresponding sub-step subagents for multiple tasks in the batch; this skill defines the step order of each task and the subagent types and write-conflict avoidance rules of each phase.

## Execution Role
This skill is executed (orchestrated) by the Project Manager (main Agent, PM), loading this skill with the Skill tool for execution. The internal sub-steps dispatch the corresponding subagents for execution per the "General Dispatch Requirements" below; the PM only dispatches, checks, and decides. **No TM role is introduced**: impm-coding directly dispatches sub-step subagents concurrently for each task in the batch following this skill's phase order.

## General Dispatch Requirements (all sub-steps of this skill must comply)
1. Launch method: each sub-step launches the corresponding subagent with the task tool (subagent_type must exactly match the reference table below) to execute the corresponding skill; the PM must not execute concrete work instead of a subagent (the only exception: steps marked "executed directly by the PM" in the reference table).
2. The task prompt must carry the following context (none may be missing): the absolute path of the project root (projectRoot), the project abbreviation ({Project Abbreviation}), the current version ({Current Version}), the verbatim user input $ARGUMENTS (including any file paths the user mentioned), the skill name (requiring the subagent to load the skill with the Skill tool before executing), and the task ID ({Task ID}).
3. Task prompt template (fill in for each sub-step as follows):
   "Execute impm's {skill name} skill as the {subagent Chinese name} (subagent_type={x}); first load the {skill name} skill with the Skill tool; required context: project root={absolute path}, project abbreviation={abbreviation}, current version={version}, user input={verbatim}, task ID={taskId}; note: this sub-step may run in parallel with the same-phase sub-steps of other tasks; when writing to shared documents in the version directory, comply with the "version directory write conflict avoidance" rules (read the latest first, merge, write back with expectedBase, retry on conflict); after completing all operations per the skill's execution steps, return: the list of output file paths and the progress status of {skill name} in version_progress.md; important: this sub-task's scope is limited to this skill itself; you must end immediately and return the result after completing all operations; you must not continue to subsequent phases, subsequent tasks, or wait for further instructions on your own (subsequent dispatch is the PM's responsibility)."
4. Completion check: after each subagent returns, verify that the output files exist, the content is correct, and version_progress.md has been recorded (with {Task ID} prefix); only proceed to the next phase after everything is correct.
5. Order discipline: the phases within a task strictly follow their order; no skipping, no reordering, no merging; when any sub-step fails, first locate the cause, fall back and redo if necessary, and never bypass it. **Parallelism between phases within a task is forbidden** (parallelism only happens between tasks, scheduled uniformly by impm-coding).

### Sub-step subagent reference table (impm-task-coding single-task phase sequence)
| Phase | Skill Name | subagent_type | Description |
|----|----|----|----|
| 1 | impm-task-coding-context | tl | Collect requirement context and write task directory context.md |
| 2 | impm-task-coding-cs | cs | Query existing code and write task directory cs.md |
| 3 | impm-task-coding-ws | ws | Query online materials and write task directory ws.md |
| 4 | impm-task-coding-dbd | dba | Database design changes (automatically skipped when the project needs no database or there are no changes) |
| 5 | impm-task-coding-api | tl | API design changes (skipped for non-frontend/backend-separated projects or non-backend tasks) |
| 6 | impm-task-coding-testcase | te | Write test cases and merge them into the version test case document |
| 7 | impm-task-coding-code | sse/fee/bee | Coding implementation (by task taskType: common→sse, frontend→fee, backend→bee) |
| 8 | impm-task-coding-writetest | te | Write unit test functions, API test scripts, and functional/UI test records |
| 9 | impm-task-coding-runtest | te | Run all tests and merge the test results |

## Version Directory Write Conflict Avoidance (all sub-steps of this skill must comply)
When multiple tasks code in parallel, tasks write content to the version directory, causing concurrent write conflicts. **All places with write conflicts and their avoidance rules are as follows**:

| Conflict point (file) | Writer | Concurrent conflict | Avoidance rule |
|----|----|----|----|
| version_progress.md | Subagents of each task phase (impm_progress action=add) | Concurrent "read-modify-write" may lose progress rows | The progress status must carry the {Task ID} prefix (e.g., {Task ID}-completed), which naturally distinguishes rows; impm_progress de-duplicates idempotently for identical (stepName, status); the tool-layer file write lock ensures concurrent runs do not lose rows |
| {Project Abbreviation}-testcase-v{Current Version}.md | testcase / runtest phases | Multiple tasks overwrite concurrently | Before writing, use impm_doc_reader (docType=testcase, target=version) to read the latest full text; append/merge this task's cases onto the latest content, then write back with impm_doc_writer using expectedBase=<the read full text>; if a concurrent conflict error is returned (the file has been modified by others), re-read, merge, and write again; re-read to verify after writing |
| {Project Abbreviation}-dbd-v{Current Version}.md / .sql | dbd phase | Multiple tasks overwrite concurrently | Same as above: read the latest first, merge this task's table/field/index changes onto the latest content (append SQL by newly added objects, do not rewrite objects others have created), write back with expectedBase, retry on conflict, re-read to verify |
| {Project Abbreviation}-api-v{Current Version}.md | api phase | Multiple tasks overwrite concurrently | Same as above: read the latest first, merge this task's API definitions, write back with expectedBase, retry on conflict, re-read to verify |
| {Project Abbreviation}-ui-test-record-v{Current Version}.md | writetest phase | Multiple tasks overwrite concurrently | Same as above: read the latest first, append this task's test record paragraph, write back with expectedBase, retry on conflict |
| {Project Abbreviation}-api-test-v{Current Version}.postman_collection.json (in the version directory docs/{Project Abbreviation}-v{Current Version}/) | writetest phase | Multiple tasks overwrite concurrently | Same as above: read the latest collection JSON first, keep others' items, only add this task's API test items, write back with expectedBase, retry on conflict |

**Universal avoidance iron rules**:
1. This task only writes files under its own task directory docs/{Project Abbreviation}-v{Current Version}/task_{Task ID}/ (context.md/cs.md/ws.md/testcase.md) and the code files corresponding to this task; writing to other tasks' directories is forbidden.
2. Before writing any shared document in the version directory, you must first read the latest content with impm_doc_reader, merge on the latest content, and pass expectedBase=<the read full text> when writing back; when the tool returns a concurrent conflict error, re-read, merge, and then write; wholesale overwrites based on old snapshots are forbidden.
3. Immediately re-read and verify after writing back: your content has been written and others' content is intact; if anything is lost, immediately re-merge and write back.
4. This task does not update task statuses in the task list JSON ({Project Abbreviation}-task-v{Current Version}.json); that operation is exclusively owned by the PM/scm.

## Key Variable Definitions and Values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to assemble all document paths | Read from docs/project.md via impm_project_info |
| Current Version | The version number currently being executed | Obtain via impm_version action=current, or infer from the version directory name |
| Task ID | The task ID currently being executed (e.g., TASK-001) | Passed by the dispatcher (PM/impm-coding) |

## Execution Requirements
1. Strictly follow this skill's phase order: do not skip, reorder, or merge any phase (serial within a task; concurrent between tasks, scheduled by impm-coding).
2. Only perform the operations specified by this skill; do not do work unrelated to the task.
3. All document paths must be assembled with {Project Abbreviation}, {Current Version}, and {Task ID}; do not fabricate file names.
4. Use impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. After each phase completes, verify that the output files exist and the content is correct.
7. This skill is part of the coding workflow; it is executed directly by impm-coding (PM) in phase waves and cannot run independently without a version number and task ID.

## Execution Steps (single-task phase sequence)
### Step 1: Receive the Version and Task ID
Receive the current version and task ID ({Task ID}, e.g., TASK-001) passed by the dispatcher (impm-coding/PM), and call impm_task_manager (action=query, taskId={Task ID}) to verify the task exists and its status is "in progress".

### Step 2: Record the Start of the Task Coding
Call impm_progress (action=add, projectName={Project Name (English)}, version={Current Version}, stepName=impm-task-coding, status={Task ID}-in progress) to record that the current task has started coding.

### Step 3: Phase 1 Collect Requirement Context
Launch the TL subagent to execute the impm-task-coding-context skill, collect and merge the current task's requirement context, and write it to the task directory context.md.

### Step 4: Phase 2 Query Existing Code
Launch the CS subagent to execute the impm-task-coding-cs skill, query existing source code and reusable modules, and write them to the task directory cs.md.

### Step 5: Phase 3 Query Online Materials
Launch the WS subagent to execute the impm-task-coding-ws skill, query third-party packages and related materials, and write them to the task directory ws.md.

### Step 6: Phase 4 Handle Database Design
Determine whether the project needs a database (whether impm_doc_reader docType=dbd, target=main exists); when needed, launch the DBA subagent to execute the impm-task-coding-dbd skill to determine whether the database design needs changes and to synchronously update the version database design document and SQL scripts; writes must comply with the "version directory write conflict avoidance" rules.

### Step 7: Phase 5 Design APIs (as needed)
Determine whether the project separates frontend and backend and whether the current task is a backend task (impm_project_info project type + task taskType); if it separates frontend/backend and is a backend task, launch the TL subagent to execute the impm-task-coding-api skill to design the APIs; otherwise skip this phase. Writes to the version API document comply with the "version directory write conflict avoidance" rules.

### Step 8: Phase 6 Write Test Cases
Launch the TE subagent to execute the impm-task-coding-testcase skill to write the current task's test cases (unit/API/functional/UI) following the TESTCASE-TEMPLATE.MD template, write them to the task directory testcase.md, and merge them into the version test case document (complying with the write conflict avoidance rules).

### Step 9: Phase 7 Coding Implementation
Launch the corresponding subagent by task type (taskType) to execute the impm-task-coding-code skill for coding: backend→BEE subagent, frontend→FEE subagent, common→SSE subagent. Coding only modifies the files corresponding to this task and does not touch others.

### Step 10: Phase 8 Write Test Scripts
Launch the TE subagent to execute the impm-task-coding-writetest skill to write unit test functions, the API test cases (Postman Collection v2.1, in the version directory docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-api-test-v{Current Version}.postman_collection.json, complying with the write conflict avoidance rules), and the functional/UI test record document (the ui-test-record document in the version directory, complying with the write conflict avoidance rules).

### Step 11: Phase 9 Run Tests
Launch the TE subagent to execute the impm-task-coding-runtest skill to run all tests and update the test results; if tests fail, fall back to step 3 to re-collect information and code, then re-execute in order; if consecutive failures reach the limit (3 times), abort this task and report the failure cause to the user.

### Step 12: Record the Completion of the Task Coding
After all tests pass, call impm_progress (action=add, projectName={Project Name (English)}, version={Current Version}, stepName=impm-task-coding, status={Task ID}-completed) to record that the current task's coding is complete; compile a task completion report and return it to the dispatcher (PM): the output file list, test results, and the list of version directory writes/changes (the changed content of the testcase/dbd/api/ui-test-record/api-test cases).

## Deliverables
- context.md, cs.md, ws.md, testcase.md under the task directory docs/{Project Abbreviation}-v{Current Version}/task_{Task ID}/
- The version database design document and SQL scripts, and the API design document (if changes were needed, written back per the merge rules)
- The task's coding implementation code
- The API test cases docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-api-test-v{Current Version}.postman_collection.json (Postman Collection v2.1, merged)
- The functional/UI test record doc docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-ui-test-record-v{Current Version}.md (merged)
- The progress records in version_progress.md ({Task ID} prefix)

## After Completion
- After this step completes, the dispatcher (impm-coding) serially dispatches scm to execute impm-task-coding-gitcommit to commit the current task.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->