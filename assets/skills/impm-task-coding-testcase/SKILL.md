---
name: impm-task-coding-testcase
description: Writes test cases covering unit/API/functional/UI tests for the current task following the TESTCASE-TEMPLATE.MD template, and updates the version test case document accordingly.
---

# impm-task-coding-testcase Skill

## Trigger Words
- Write test cases
- testcase
- Test cases

## When to Use
Use this skill when coding a single task and the test cases for the current task need to be written following the template before coding, and synchronized to the version test case document.

## Executing Agent
This skill is executed by the TE subagent (subagent_type=te). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `te`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-task-coding-testcase; require the subagent to load this skill with the Skill tool first before executing), and the task ID (taskId, extracted from $ARGUMENTS; when missing, use impm_task_manager to query the next executable task).
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

### Step 2: Read the task context
Call impm_doc_reader (docType=context, docType=cs, docType=ws, taskId={task ID}) to read context.md, cs.md, and ws.md in the task directory.

### Step 3: Read the database design files
Call impm_doc_reader (docType=dbd, target=main) and (docType=dbd, target=version) to read the database design files; skip if the files do not exist.

### Step 4: Read the API design files
Call impm_doc_reader (docType=api, target=main) and (docType=api, target=version) to read the API design files; skip if the files do not exist.

### Step 5: Read existing test cases
Call impm_doc_reader (docType=testcase, target=main) and (docType=testcase, target=version) to read previous test cases; skip if the files do not exist.

### Step 6: Create the task test cases
Based on the current task's requirements, referencing the current version's test cases and applying the TESTCASE-TEMPLATE.MD template file read via impm_template_reader, create the test cases for the current task, and call impm_doc_writer (docType=testcase, taskId={task ID}) to write them to docs/{project abbreviation}-v{current version}/task_{task ID}/testcase.md.

### Step 7: Cover the four test types
The test cases should include the following test types: unit test, API test, functional test, UI test.

### Step 8: Check test coverage
Check the coverage of each test type separately, fix the test case file in time, and improve coverage as much as possible to avoid missing tests.

### Step 9: Synchronize the version test case document
Based on the current task's test cases, compare with and update the different test cases in the version test case document docs/{project abbreviation}-v{current version}/{project abbreviation}-testcase-v{current version}.md, via impm_doc_writer (docType=testcase, target=version).

### Step 10: Record completion
Call impm_progress (action=add, stepName=impm-task-coding-testcase, status={task ID}-completed).

## Deliverables
- docs/{project abbreviation}-v{current version}/task_{task ID}/testcase.md
- docs/{project abbreviation}-v{current version}/{project abbreviation}-testcase-v{current version}.md (updated)
- The progress records in version_progress.md

## Next Steps
- After this step is complete, the dispatcher (impm-task-coding / impm-coding) continues with the next step according to the process.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
