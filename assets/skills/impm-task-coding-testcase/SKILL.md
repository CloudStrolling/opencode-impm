---
name: impm-task-coding-testcase
description: Writes test cases covering unit/API/functional/UI tests for the current task following the TESTCASE-TEMPLATE.MD template, and synchronously updates the version test case document.
---

# impm-task-coding-testcase Skill

## Trigger Words
- Write test cases
- testcase
- Test cases

## When to Use
Use during single-task coding when the current task's test cases need to be written following the template before coding and synchronized into the version test case document.

## Execution Role
This skill is executed by the Test Engineer (subagent_type=te) subagent, loading this skill with the Skill tool for execution.

## Dispatch Notes (must be followed by the PM/upper-level orchestrator when launching this skill)
1. Launch method: launch the subagent with the task tool; subagent_type must be `te`; neither the PM nor the orchestrator may execute this skill's content on its own.
2. The prompt must carry the required context (none may be missing): the absolute path of the project root (projectRoot), the project abbreviation ({Project Abbreviation}), the current version ({Current Version}), the verbatim user input $ARGUMENTS (including any file paths the user mentioned), the skill name (impm-task-coding-testcase, requiring the subagent to load this skill with the Skill tool before executing), and the task ID (taskId, extracted from $ARGUMENTS; when missing, use impm_task_manager to query the next executable task).
3. Completion requirement: after the subagent returns its completion result, verify the output files and the version_progress.md progress records; only proceed to the next step when everything is correct.

## Key Variable Definitions and Values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to assemble all document paths | Read from docs/project.md via impm_project_info |
| Current Version | The version number currently being executed | Obtain via impm_version action=current, or infer from the version directory name |
| Task ID | The task ID currently being executed (e.g., TASK-001) | Passed by the dispatcher (PM/upper-level skill) |

## Execution Requirements
1. Strictly execute in the content and order of the execution steps: do not skip, reorder, parallelize, or merge any step.
2. Only perform the operations specified by this skill; do not do work unrelated to the task.
3. All document paths must be assembled with {Project Abbreviation}, {Current Version}, and {Task ID}; do not fabricate file names.
4. Use impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. After each step completes, verify that the output files exist and the content is correct.
7. This skill is part of the coding workflow; it can only be dispatched by impm-task-coding or impm-coding and cannot run independently without a version number and task ID.

## Execution Steps
### Step 1: Receive the Version and Task ID
Receive the current version and task ID ({Task ID}, e.g., TASK-001) passed by the dispatcher.

### Step 2: Read the Task Context
Call impm_doc_reader (docType=context, docType=cs, docType=ws, taskId={Task ID}) to read context.md, cs.md, and ws.md in the task directory.

### Step 3: Read the Database Design Files
Call impm_doc_reader (docType=dbd, target=main) and (docType=dbd, target=version) to read the database design files; skip reading if the files do not exist.

### Step 4: Read the API Design Files
Call impm_doc_reader (docType=api, target=main) and (docType=api, target=version) to read the API design files; skip reading if the files do not exist.

### Step 5: Read Existing Test Cases
Call impm_doc_reader (docType=testcase, target=main) and (docType=testcase, target=version) to read the previous test cases; skip reading if the files do not exist.

### Step 6: Create the Task Test Cases
Based on the current task requirements, referencing the current version's test cases, apply the TESTCASE-TEMPLATE.MD template file read by impm_template_reader to create the current task's test cases, and call impm_doc_writer (docType=testcase, taskId={Task ID}) to write them to docs/{Project Abbreviation}-v{Current Version}/task_{Task ID}/testcase.md.

### Step 7: Cover the Four Test Types
The test cases should include these test types: unit testing, API testing, functional testing, and UI testing.

### Step 8: Check Test Coverage
Check the test coverage of each different test type, correct the test case file in time, and increase the coverage as much as possible to avoid missing tests.

### Step 9: Synchronize the Version Test Case Document
1. First call impm_doc_reader (docType=testcase, target=version) to read the **latest content** of the version test case document (other parallel tasks may have already written to it; merging must be based on the latest content);
2. Based on the current task's test cases, append/merge this task's test cases onto the latest content, keeping the cases of others (version directory write conflict avoidance: when multiple tasks run in parallel, wholesale overwrites based on old snapshots are forbidden);
3. Call impm_doc_writer (docType=testcase, target=version, expectedBase=<the latest full text read in step 1>) to write back the version test case document docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-testcase-v{Current Version}.md; if a concurrent conflict error is returned (the file has been modified by another task), go back to step 1 to re-read the latest content, merge, and write back;
4. After writing back, immediately re-read to verify that this task's cases have been written and others' content is intact.

### Step 10: Record Completion
Call impm_progress (action=add, stepName=impm-task-coding-testcase, status={Task ID}-completed).

## Deliverables
- docs/{Project Abbreviation}-v{Current Version}/task_{Task ID}/testcase.md
- docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-testcase-v{Current Version}.md (synchronously updated)
- The progress record in version_progress.md

## After Completion
- After completing all operations of this skill, you must immediately end and return to the dispatcher: the list of output file paths and the progress status of this skill in version_progress.md; you must not continue to subsequent phases or tasks on your own, nor wait for further instructions; subsequent dispatch is the responsibility of the dispatcher (PM).
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->