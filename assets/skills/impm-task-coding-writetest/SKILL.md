---
name: impm-task-coding-writetest
description: Writes unit test functions, API test Python scripts, and functional/UI test record documents according to the test cases, and back-annotates testcase.md.
---

# impm-task-coding-writetest Skill

## Trigger Words
- Write tests
- Automated scripts
- writetest

## When to Use
Use this skill when the coding implementation of the current task is complete and unit tests, API test automated scripts, and functional/UI test records need to be written according to the test cases.

## Executing Agent
This skill is executed by the te subagent. Load this skill with the Skill tool when executing.

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

### Step 2: Read the test cases and write them by type
Call impm_doc_reader (docType=testcase, taskId={task ID}) to read the current task's test cases, and write them by test type:
1. Unit tests: write unit test functions in the current development language, following the language's conventions and common test plugins;
2. API tests: write API test scripts in Python and place them in scripts/API-TEST/{project abbreviation}-api-test-v{current version}.py, with each test script using a unified entry point;
3. Functional and UI tests: add {project abbreviation}-ui-test-record-v{current version}.md under the version directory docs/{project abbreviation}-v{current version}/ via impm_doc_writer (docType=ui-test-record), and clearly list the steps and records of the functional and UI tests in it.

### Step 3: Back-annotate the test cases
Based on the completed test functions and scripts, mark the corresponding function locations or script locations in testcase.md (update the testcase.md in the task directory).

### Step 4: Record completion
Call impm_progress (action=add, stepName=impm-task-coding-writetest, status={task ID}-completed).

## Deliverables
- Unit test functions (committed with the source code)
- The API test script scripts/API-TEST/{project abbreviation}-api-test-v{current version}.py
- The functional/UI test record document docs/{project abbreviation}-v{current version}/{project abbreviation}-ui-test-record-v{current version}.md
- testcase.md in the task directory (with test locations back-annotated)
- The progress records in version_progress.md

## Next Steps
- After this step is complete, the dispatcher (impm-task-coding / impm-coding) continues with the next step according to the process.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
