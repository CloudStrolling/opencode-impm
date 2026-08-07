---
name: impm-task-coding
description: Single-task coding orchestration skill; dispatches the context/cs/ws/dbd/api/testcase/code/writetest/runtest sub-skills in fixed order to complete the coding development of one task.
---

# impm-task-coding Skill

## Trigger Words
- Coding task
- Execute task
- Task coding

## When to Use
Use this skill when impm-coding has obtained the next executable task via impm_task_manager (action=next) and all coding development steps of that task (from context collection to passing tests) need to be completed.

## Executing Agent
This skill is executed by the Project Manager (master agent) (orchestration). Load this skill with the Skill tool when executing. Internal sub-steps MUST be dispatched to the corresponding subagents per the "General Dispatch Requirements" below; the PM only schedules, checks, and decides.

## General Dispatch Requirements (all sub-steps of this skill MUST comply)
1. Launch method: launch the corresponding subagent via the task tool for each sub-step (subagent_type MUST exactly match the mapping table below) to execute the corresponding skill; the PM must not execute the specific work in place of the subagents (the only exception: steps marked "executed directly by the PM" in the mapping table).
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), the skill name (require the subagent to load the skill with the Skill tool first before executing), and the task ID ({task ID}, applicable in the coding phase).
3. Task prompt template (fill in for each sub-step accordingly):
   "Execute impm's {skill name} skill as {subagent Chinese name} (subagent_type={x}); first load the skill {skill name} with the Skill tool; the context that MUST be carried: project root={absolute path}, project English abbreviation={abbreviation}, current version={version}, user input={original text}, task ID={taskId} (if applicable); after completing all operations per the skill's execution steps, return: the list of output file paths and the progress status of {skill name} in version_progress.md."
4. Completion verification: after each subagent returns, verify that the output files exist and version_progress.md has recorded the step status; only proceed to the next step when everything is correct.
5. Order discipline: strictly follow the execution order; do not skip, reorder, parallelize, or merge any step; if any sub-step fails, first locate the cause and roll back and redo when necessary; never bypass it.

### Sub-step Subagent Mapping Table (impm-task-coding)
| Sub-step | Skill name | subagent_type |
|----|----|----|
| 3 | impm-task-coding-context | tl |
| 4 | impm-task-coding-cs | cs |
| 5 | impm-task-coding-ws | ws |
| 6 | impm-task-coding-dbd | dba |
| 7 | impm-task-coding-api | tl (as needed) |
| 8 | impm-task-coding-testcase | te |
| 9 | impm-task-coding-code | sse/fee/bee (by taskType) |
| 10 | impm-task-coding-writetest | te |
| 11 | impm-task-coding-runtest | te |

## Key Variables and How to Get Them
| Variable | Description | How to Get |
| Chinese project name | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| English project name | The English name of the project | Read from docs/project.md via impm_project_info |
| Project abbreviation | The English abbreviation of the project, used to build all document paths | Read from docs/project.md via impm_project_info |
| Current version | The version number currently being executed | Get via impm_version action=current, or infer from the version directory name |
| Task ID | The ID of the task currently being executed (e.g., TASK-001) | Passed in by the dispatcher (PM/upper-level skill) |

## Execution Requirements
1. Follow the steps strictly in the order given in the Execution Steps: no skipping, no out-of-order execution, no parallel execution, no merged execution of any step.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths must be built from {project abbreviation}, {current version}, and {task ID}; never invent file names.
4. Use impm_* tools to obtain information; never fabricate tool results.
5. Use English throughout.
6. After each step, verify that the produced files exist and their content is correct.
7. This skill is part of the coding workflow and can only be dispatched by impm-task-coding or impm-coding; it cannot run standalone without a version number and a task ID.

## Execution Steps
### Step 1: Receive the version number and task ID
Receive the current version number and task ID ({task ID}, e.g., TASK-001) passed in by the dispatcher, and verify that the task exists.

### Step 2: Record the start of task coding
Call impm_progress (action=add, projectName={project English name}, version={current version}, stepName=impm-task-coding, status={task ID}-in progress) to record that the current task has started coding.

### Step 3: Collect the requirement context
Start the TL subagent to execute the impm-task-coding-context skill, collect and merge the requirement context of the current task, and write it to context.md in the task directory.

### Step 4: Query existing code
Start the CS subagent to execute the impm-task-coding-cs skill, query existing source code and reusable modules, and write the results to cs.md in the task directory.

### Step 5: Query web resources
Start the WS subagent to execute the impm-task-coding-ws skill, query third-party packages and related materials, and write the results to ws.md in the task directory.

### Step 6: Handle the database design
Start the DBA subagent to execute the impm-task-coding-dbd skill, determine whether the database design needs changes, and update the version database design document and SQL scripts accordingly.

### Step 7: Design the API (on demand)
Determine whether the project separates frontend and backend and whether the current task is a backend task: get the project type (whether frontend/backend are separated) via impm_project_info, and determine the task type via the taskType field; if frontend/backend are separated and the task is a backend task, start the TL subagent to execute the impm-task-coding-api skill to design the API; otherwise, skip this step.

### Step 8: Write test cases
Start the TE subagent to execute the impm-task-coding-testcase skill, write the test cases (unit/API/functional/UI) for the current task following the TESTCASE-TEMPLATE.MD template, and write them to testcase.md in the task directory.

### Step 9: Implement the coding
Start the corresponding subagent according to the task type (taskType) to execute the impm-task-coding-code skill: backend → BEE subagent, frontend → FEE subagent, common → SSE subagent.

### Step 10: Write test scripts
Start the TE subagent to execute the impm-task-coding-writetest skill, write unit test functions, the API test automated script (scripts/API-TEST/{project abbreviation}-api-test-v{current version}.py), and the functional/UI test record document.

### Step 11: Run tests
Start the TE subagent to execute the impm-task-coding-runtest skill, run all tests and update the test results; if tests fail, roll back to Step 3 to re-collect information and code, then re-execute in order; if failures consecutively reach the upper limit (3 times), abort this task and report the failure reason to the user.

### Step 12: Record the completion of task coding
After all tests pass, call impm_progress (action=add, projectName={project English name}, version={current version}, stepName=impm-task-coding, status={task ID}-completed) to record that the current task's coding is complete.

## Deliverables
- context.md, cs.md, ws.md, testcase.md under the task directory docs/{project abbreviation}-v{current version}/task_{task ID}/
- The version database design document and SQL scripts, and the API design document (if changes are needed)
- The coding implementation code for the task
- The API test script scripts/API-TEST/{project abbreviation}-api-test-v{current version}.py
- The functional/UI test record docs/{project abbreviation}-v{current version}/{project abbreviation}-ui-test-record-v{current version}.md
- The progress records in version_progress.md

## Next Steps
- After this step is complete, the dispatcher (impm-coding) continues with the next step (impm-task-coding-gitcommit to commit the current task) according to the process.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
