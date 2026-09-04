---
name: impm-coding
description: Main workflow skill for the coding development phase (Phase 3); the PM concurrently dispatches coding tasks (up to 5 in parallel, dispatching sub-step subagents in phase waves), commits to git serially, and completes all coding tasks of the current version.
---

# impm-coding Skill

## Trigger Words
- Start coding
- Enter the coding phase
- Coding development
- Phase 3

## When to Use
Use when the impm waterfall development process has completed the design phase (Phase 2), the task list docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-task-v{Current Version}.json is ready, and the project enters the coding development phase (Phase 3) to concurrently schedule the implementation of all features.

## Execution Role
This skill is executed (orchestrated) by the Project Manager (main Agent), loading this skill with the Skill tool for execution. **The PM is the sole dispatcher**: responsible for selecting parallel tasks, concurrently dispatching sub-step subagents in phase waves, verifying outputs, and committing to git serially. **No TM role is introduced**; all sub-steps are dispatched directly by the PM. The PM only dispatches, checks, and decides; it does not execute concrete work on behalf of subagents.

## Concurrency Dispatch Model (Core of This Skill)
1. **Parallelism limit**: at most **5** coding tasks may run at the same time.
2. **Parallel eligibility**: a task whose status is "not started" and whose prerequisite tasks (upstreamTaskIds) are all "completed" can be included in a batch; whether it runs at the same time as other tasks in the current batch is scheduled uniformly by the PM.
3. **Phase-wave parallelism**: each task follows the standard step sequence of impm-task-coding: context → cs → ws → dbd (as needed) → api (as needed) → testcase → code → writetest → runtest. Within the **same phase**, the PM **concurrently** dispatches the phase's sub-step subagents for all eligible tasks in the batch (multiple task calls in the same round); only after all of them return and pass verification does the next phase start.
4. **Status marking**: once a batch is selected, immediately mark every task in the batch as "in progress" (impm_task_manager update) to prevent duplicate dispatch; after the git commit completes, the scm marks it as "completed".
5. **Serial commits**: after all tasks in the batch finish runtest, start the scm subagent to execute impm-task-coding-gitcommit for each successful task **serially one by one** (only one task committed at a time); commit the next one only after the previous commit is completed and verified.
6. **Batch loop**: after each batch is fully completed (all commits done), re-read the task list to compute the next batch of parallel tasks, until no tasks remain to execute.

## General Dispatch Requirements (all sub-steps of this skill must comply)
1. Launch method: each sub-step launches the corresponding subagent with the task tool (subagent_type must exactly match the "Phase-wave subagent reference table" below) to execute the corresponding skill; the PM must not execute concrete work instead of a subagent (the only exceptions: dispatching, status marking, and progress recording performed directly by the PM).
2. The task prompt must carry the following context (none may be missing): the absolute path of the project root (projectRoot), the project abbreviation ({Project Abbreviation}), the current version ({Current Version}), the verbatim user input $ARGUMENTS (including any file paths the user mentioned), the skill name (requiring the subagent to load the skill with the Skill tool before executing), and the task ID ({Task ID}).
3. Task prompt template (fill in for each phase as follows):
   "Execute impm's {skill name} skill as the {subagent Chinese name} (subagent_type={x}); first load the {skill name} skill with the Skill tool; required context: project root={absolute path}, project abbreviation={abbreviation}, current version={version}, user input={verbatim}, task ID={taskId}; note: this sub-step may run in parallel with the same-phase sub-steps of other tasks; when writing to shared documents in the version directory, comply with the "version directory write conflict avoidance" rules (read the latest first, merge, write back with expectedBase, retry on conflict); after completing all operations per the skill's execution steps, return: the list of output file paths and the progress status of {skill name} in version_progress.md; important: this sub-task's scope is limited to this skill itself; you must end immediately and return the result after completing all operations; you must not continue to subsequent phases, subsequent tasks, or wait for further instructions on your own (subsequent dispatch is the PM's responsibility)."
4. Completion check: after each subagent returns, verify that the output files exist, the content is correct, and version_progress.md has been recorded (with {Task ID} prefix); only proceed to the next phase after all subagents of this phase pass the check.
5. Failure handling: when any step of any task fails, first locate the cause and put the task into the retry queue to be re-run alone (see step 3.4); if consecutive failures reach the limit (3 times), abort the task (set the status back to "not started" and record the failure cause); other tasks continue; after reporting the aborted task to the user, human intervention is required.
6. Stuck restart (heartbeat detection): the plugin performs heartbeat monitoring on every subagent sub-session; a sub-session that has not ended but is inactive for a long time is automatically aborted, and the alert record is written to docs/prompts/heartbeat.md. When the task tool returns an abort/stuck-type error, or a new alert appears in heartbeat.md, the subagent is considered forcibly restarted: immediately re-dispatch the same skill with the original prompt (the re-dispatch counts toward the task's retry limit); if necessary, first use impm_heartbeat (action=status) to confirm there is no residual stuck session.

### Phase-wave subagent reference table (impm-coding)
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
| 10 | impm-task-coding-gitcommit | scm | Commit to git and mark the task completed (serial, one at a time) |

## Version Directory Write Conflict Avoidance (must comply)
When multiple tasks code in parallel, tasks write content to the version directory docs/{Project Abbreviation}-v{Current Version}/ and to the shared script directories, causing concurrent write conflicts. **All places with write conflicts and their avoidance rules are as follows**:

| Conflict point (file) | Writer | Concurrent conflict | Avoidance rule |
|----|----|----|----|
| version_progress.md | All sub-step subagents (impm_progress action=add) | Concurrent "read-modify-write" by multiple subagents may lose progress rows | The progress status must carry the {Task ID} prefix (e.g., {Task ID}-completed), which naturally distinguishes rows; impm_progress de-duplicates idempotently for identical (stepName, status); the tool-layer file write lock (locked throughout read-modify-write) ensures concurrent runs do not lose rows |
| {Project Abbreviation}-testcase-v{Current Version}.md | testcase / runtest sub-steps | Multiple tasks overwrite concurrently | Before writing, use impm_doc_reader (docType=testcase, target=version) to read the latest full text; append/merge this task's cases onto the latest content, then write back with impm_doc_writer using expectedBase=<the read full text>; if a concurrent conflict error is returned (the file has been modified by others), re-read, merge, and write again; re-read to verify after writing |
| {Project Abbreviation}-dbd-v{Current Version}.md / .sql | dbd sub-step | Multiple tasks overwrite concurrently | Same as above: read the latest first, merge this task's table/field/index changes onto the latest content (append SQL by newly added objects, do not rewrite objects others have created), write back with expectedBase, retry on conflict, re-read to verify |
| {Project Abbreviation}-api-v{Current Version}.md | api sub-step | Multiple tasks overwrite concurrently | Same as above: read the latest first, merge this task's API definitions, write back with expectedBase, retry on conflict, re-read to verify |
| {Project Abbreviation}-ui-test-record-v{Current Version}.md | writetest sub-step | Multiple tasks overwrite concurrently | Same as above: read the latest first, append this task's test record paragraph after the latest content, write back with expectedBase, retry on conflict |
| scripts/API-TEST/{Project Abbreviation}-api-test-v{Current Version}.py | writetest sub-step | Multiple tasks overwrite concurrently | Same as above: read the latest script first, keep others' test functions and entries, only add this task's test functions and register their entries, write back with expectedBase, retry on conflict |
| {Project Abbreviation}-task-v{Current Version}.json | PM (marks "in progress"), scm (marks "completed") | Concurrent updates overwrite each other | Task status is exclusively updated only by the PM and scm; sub-step subagents never update it; commits are serialized; the tool-layer file write lock ensures concurrent updates are not lost |
| git working tree | impm_git commit | Concurrent commits may mix in files of other tasks | gitcommit is forcibly serial: only one scm commit at a time; commit the next one only after the previous is completed and confirmed; before committing, use impm_git (action=status) to verify the working tree changes contain only files of this task and completed tasks; if files of other in-progress tasks are mixed in, hold off the commit and report to the PM |

**Universal avoidance iron rules**:
1. Each task only writes files under its own task directory docs/{Project Abbreviation}-v{Current Version}/task_{Task ID}/ (context.md/cs.md/ws.md/testcase.md) and the code files corresponding to this task; writing to other tasks' directories is forbidden.
2. Before writing any shared document in the version directory, you must first read the latest content with impm_doc_reader, merge on the latest content, and pass expectedBase=<the read full text> when writing back; when the tool returns a concurrent conflict error, re-read, merge, and then write; wholesale overwrites based on old snapshots are forbidden.
3. Immediately re-read and verify after writing back: your content has been written and others' content is intact; if anything is lost, immediately re-merge and write back.
4. Sub-step subagents do not update task statuses in the task list JSON ({Project Abbreviation}-task-v{Current Version}.json); that operation is exclusively owned by the PM/scm.
5. Git commits are serialized: at any moment, at most one scm is executing gitcommit.

## Key Variable Definitions and Values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to assemble all document paths | Read from docs/project.md via impm_project_info |
| Current Version | The version number currently being executed | Obtain via impm_version action=current, or infer from the version directory name |
| Task ID | The task ID currently being executed (e.g., TASK-001) | Obtained from the task list via impm_task_manager |

## Execution Requirements
1. Task coding can be concurrent (up to 5, in phase waves) while git commits are serial; no phase of any task may be skipped.
2. Only perform the operations specified by this skill; do not do work unrelated to the task.
3. All document paths must be assembled with {Project Abbreviation}, {Current Version}, and {Task ID}; do not fabricate file names.
4. Use impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. After each subagent returns, verify that the output files exist and the content is correct; after each task is committed, verify the commit succeeded.
7. This skill is part of the coding workflow; it can only be dispatched by the impm main workflow and cannot run independently without a version number.

## Execution Steps
### Step 1: Record the Start of the Coding Phase
Call impm_progress (action=add, projectName={Project Name (English)}, version={Current Version}, stepName=impm-coding, status=in progress) to record the start of the coding development phase in version_progress.md.

### Step 2: Read the Task List and Determine Project Characteristics
1. Call impm_task_manager (action=query, projectName={Project Name (English)}, version={Current Version}) to read all tasks in the task list and confirm the number of remaining tasks and their upstream/downstream dependencies.
2. Determine the project characteristics (to decide whether the dbd/api phases are dispatched):
   - Whether the project needs a database: call impm_doc_reader (docType=dbd, target=main) to check whether docs/{Project Abbreviation}-dbd.md exists;
   - Whether the project separates frontend and backend: call impm_project_info to read the project type.

### Step 3: Concurrently Dispatch and Execute Tasks (Batch Loop)
Repeat the following flow until no tasks remain to execute:
1. **Compute parallel-eligible tasks**: call impm_task_manager (action=query) to get the task list, and filter for all "executable tasks": status is "not started" and all prerequisite tasks (upstreamTaskIds) have status "completed"; select at most **5** of them for this batch (prioritize tasks with no prerequisites or whose prerequisites finished earliest; if the batch already contains writers of the same shared document, stagger them as much as possible per the "version directory write conflict avoidance" rules).
2. **Mark in progress**: for each task in the batch, call impm_task_manager (action=update, taskId={Task ID}, status=in progress) to prevent duplicate dispatch.
3. **Phase-wave loop**: for all tasks in the batch, execute phase by phase following the standard step sequence of impm-task-coding; **in each phase, concurrently dispatch that phase's subagents for all eligible tasks in the batch** (multiple task calls in the same round); proceed to the next phase only after all of this phase's subagents return and pass verification:
   - Phase 1 context: concurrently launch a tl subagent to execute impm-task-coding-context for each task in the batch;
   - Phase 2 cs: concurrently launch a cs subagent to execute impm-task-coding-cs for each task in the batch;
   - Phase 3 ws: concurrently launch a ws subagent to execute impm-task-coding-ws for each task in the batch;
   - Phase 4 dbd: only when the project needs a database (determined in step 2), concurrently launch a dba subagent to execute impm-task-coding-dbd for each task in the batch; otherwise skip the whole batch;
   - Phase 5 api: only when the project separates frontend/backend and the task has taskType=backend, concurrently launch a tl subagent to execute impm-task-coding-api for the corresponding tasks; otherwise skip;
   - Phase 6 testcase: concurrently launch a te subagent to execute impm-task-coding-testcase for each task in the batch;
   - Phase 7 code: concurrently launch the corresponding subagent by each task's taskType (common→sse, frontend→fee, backend→bee) to execute impm-task-coding-code;
   - Phase 8 writetest: concurrently launch a te subagent to execute impm-task-coding-writetest for each task in the batch;
   - Phase 9 runtest: concurrently launch a te subagent to execute impm-task-coding-runtest for each task in the batch.
4. **Handle failures and retries**: when any phase of a task in this batch fails, put that task into the retry queue; other tasks in the batch continue. After all successful tasks in the batch complete, re-run the step sequence (phase 1 → phase 9) **separately** for each task in the retry queue; if the retry still fails, it re-enters the retry queue; when the same task fails consecutively up to the limit (3 times), abort the task: call impm_task_manager (action=update, status=not started) to set it back to not started and record the failure cause, report to the user, and require human intervention; other tasks are unaffected. When the task returns an abort/stuck-type error or a new alert for that sub-session appears in docs/prompts/heartbeat.md (heartbeat-detection forced restart), it is handled the same as a failed retry: immediately re-dispatch the same subagent with the original prompt; the re-dispatch counts toward the retry limit.
5. **Serial commits**: for all successful tasks in this batch, launch the scm subagent (subagent_type=scm) **serially one by one** to execute impm-task-coding-gitcommit: launch task A's scm first, wait for its commit to complete and pass verification, then launch task B's scm, and so on, committing only one task at a time.
6. Return to item 1 of this step and recompute the next batch of parallel-eligible tasks; if no tasks remain to execute, jump to step 4.

### Step 4: Determine Whether All Tasks Are Completed
When impm_task_manager (action=query) shows that all tasks have status "completed", all tasks are complete (except aborted tasks, which require human intervention).

### Step 5: Record the Completion of the Coding Phase
Call impm_progress (action=add, projectName={Project Name (English)}, version={Current Version}, stepName=impm-coding, status=completed) to record the completion of the coding development phase in version_progress.md; then call impm_progress (action=finalize, projectName={Project Name (English)}, version={Current Version}) before exiting to settle the total duration and tokens of the last row in the progress table (impm-coding, completed), including the consumption of the main session and subagent sub-sessions of this step.

### Step 6: Report the Completion of the Coding Phase
Report the completion of the coding phase to the user: the current version, total tasks and completed count, a summary of each task's execution result, the final merge status of the shared documents in the version directory (whether testcase/dbd/api/ui-test-record/api-test scripts had conflicts and how they were resolved), the git commit records ({Project Abbreviation}-v{Current Version}-{Task ID}), and recommend proceeding to the testing phase next.

## Deliverables
- Two new progress records (in progress/completed) for impm-coding added to version_progress.md
- All tasks in docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-task-v{Current Version}.json have status "completed"
- All coding artifacts under each task directory docs/{Project Abbreviation}-v{Current Version}/task_{Task ID}/
- The concurrent merge results of the shared documents in the version directory (testcase/dbd/api/ui-test-record/api-test scripts)
- The git commit records ({Project Abbreviation}-v{Current Version}-{Task ID})

## After Completion
- After this step completes, the dispatcher (impm main workflow) continues with the next step (testing phase) per the workflow.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->