---
name: impm-task-coding-writetest
description: Writes unit test functions, API test Python scripts, and functional/UI test record documents according to the test cases, and back-annotates testcase.md.
---

# impm-task-coding-writetest Skill

## Trigger Words
- Write tests
- Automation scripts
- writetest

## When to Use
Use after the current task's coding implementation is complete, when unit tests, API test automation scripts, and functional/UI test records need to be written according to the test cases.

## Execution Role
This skill is executed by the Test Engineer (subagent_type=te) subagent, loading this skill with the Skill tool for execution.

## Dispatch Notes (must be followed by the PM/upper-level orchestrator when launching this skill)
1. Launch method: launch the subagent with the task tool; subagent_type must be `te`; neither the PM nor the orchestrator may execute this skill's content on its own.
2. The prompt must carry the required context (none may be missing): the absolute path of the project root (projectRoot), the project abbreviation ({Project Abbreviation}), the current version ({Current Version}), the verbatim user input $ARGUMENTS (including any file paths the user mentioned), the skill name (impm-task-coding-writetest, requiring the subagent to load this skill with the Skill tool before executing), and the task ID (taskId, extracted from $ARGUMENTS; when missing, use impm_task_manager to query the next executable task).
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

### Step 2: Read the Test Cases and Write Them by Type
Call impm_doc_reader (docType=testcase, taskId={Task ID}) to read the current task's test cases, and write them separately by test type:
1. Unit tests: write unit test functions directly following the habits and common test plugins of the current development language;
2. API tests: generate a Postman Collection v2.1 format JSON case file and put it in the current version directory docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-api-test-v{Current Version}.postman_collection.json. First call impm_template_reader to read the API-TEST-COLLECTION-TEMPLATE.json template to understand its structure (focus: info/variable/item/request/expected), then generate items one by one for this task's API-type test cases:
   - item.name = API path + case name + case ID;
   - item.request.method/url/header/body filled in per the case's API and test steps (url.raw uses the `{{base_url}}` placeholder, query is filled as an array, body uses mode=raw when it is JSON);
   - item.event generates pm.test assertion scripts per the case's expected result (status code, business code, field values), for easy debugging in Apifox;
   - item.expected fills in structured assertions per the case's expected result (status status code, max_response_time response time limit, headers response header containment, assertions response body assertions: type=json uses path+equals/contains, type=body_contains uses value); this expected field is read and executed by API-TEST-RUNNER.py and must match the actual API expectations.
   **Version directory write conflict avoidance**: first read the latest content of this JSON file (other parallel tasks may have already written items); on the basis of the latest item array, keep others' items and only append this task's items, then write the whole file back (a wholesale overwrite on this file is fine because the content has been merged); if the file does not exist, create it based on the template; re-read and verify after writing that the item count is correct.
3. Functional and UI tests: create/update {Project Abbreviation}-ui-test-record-v{Current Version}.md under the version directory docs/{Project Abbreviation}-v{Current Version}/, calling impm_doc_writer (docType=ui-test-record). **Version directory write conflict avoidance**: first read the latest content of that document, append this task's test record paragraph after the latest content, then write back with impm_doc_writer using expectedBase=<the read full text>; if a concurrent conflict error is returned, re-read, merge, and write back; wholesale overwrites based on old snapshots are forbidden.

### Step 3: Back-annotate the Test Cases
Based on the completed test functions and scripts, mark the corresponding function location or script location in testcase.md (update the task directory testcase.md).

### Step 4: Record Completion
Call impm_progress (action=add, stepName=impm-task-coding-writetest, status={Task ID}-completed).

## Deliverables
- Unit test functions (committed with the source code)
- API test cases docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-api-test-v{Current Version}.postman_collection.json (Postman Collection v2.1)
- The functional/UI test record document docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-ui-test-record-v{Current Version}.md
- Task directory testcase.md (test locations back-annotated)
- The progress record in version_progress.md

## After Completion
- After completing all operations of this skill, you must immediately end and return to the dispatcher: the list of output file paths and the progress status of this skill in version_progress.md; you must not continue to subsequent phases or tasks on your own, nor wait for further instructions; subsequent dispatch is the responsibility of the dispatcher (PM).
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->