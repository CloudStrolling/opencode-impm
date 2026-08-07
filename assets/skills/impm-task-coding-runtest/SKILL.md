---
name: impm-task-coding-runtest
description: Runs all tests for the current task and updates the test results; once all pass, merges the task's test cases into the version test case document.
---

# impm-task-coding-runtest Skill

## Trigger Words
- Run tests
- Execute tests
- runtest

## When to Use
Use this skill when the test functions and test scripts of the current task have been written, and all tests need to be run, the test results confirmed, and the documents updated.

## Executing Agent
This skill is executed by the TE subagent (subagent_type=te). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `te`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-task-coding-runtest; require the subagent to load this skill with the Skill tool first before executing), and the task ID (taskId, extracted from $ARGUMENTS; when missing, use impm_task_manager to query the next executable task).
3. Completion requirement: wait for the subagent to return the completion result, verify the output files and the version_progress.md progress records, and only proceed to the next step when everything is correct.

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
Receive the current version number and task ID ({task ID}, e.g., TASK-001) passed in by the dispatcher.

### Step 2: Read the test cases
Call impm_doc_reader (docType=testcase, taskId={task ID}) to read the current task's test cases.

### Step 3: Run the tests
Based on the current task's test cases, find the corresponding test functions and test scripts, and run the test scripts (unit tests, API tests, functional/UI tests).

### Step 4: Update the test results
After each test completes, update the pass/fail status of the test cases of the current task (update testcase.md in the task directory, marking pass/fail and the failure reason).

### Step 5: Handle failures
After all tests complete, if some of them fail:
1. Add the error information to the context;
2. The dispatcher (impm-task-coding) rolls back to impm-task-coding-context to re-collect information and re-code, then re-executes according to the process;
3. If failures consecutively reach the upper limit (3 times), abort this task and report to the user.

### Step 6: Confirm all pass
If all tests succeed, the coding of the current task has been successfully completed.

### Step 7: Merge the version test cases
Merge and update the current task's test cases docs/{project abbreviation}-v{current version}/task_{task ID}/testcase.md into the current version's test cases docs/{project abbreviation}-v{current version}/{project abbreviation}-testcase-v{current version}.md, via impm_doc_writer (docType=testcase, target=version).

### Step 8: Record completion
Call impm_progress (action=add, stepName=impm-task-coding-runtest, status={task ID}-completed).

## Deliverables
- testcase.md in the task directory (test pass status updated)
- docs/{project abbreviation}-v{current version}/{project abbreviation}-testcase-v{current version}.md (merged and updated)
- The progress records in version_progress.md

## Next Steps
- After this step is complete, the dispatcher (impm-task-coding / impm-coding) continues with the next step according to the process.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
