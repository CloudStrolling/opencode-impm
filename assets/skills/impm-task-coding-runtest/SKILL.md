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
Use after the current task's test functions and test scripts are written, when all tests need to be run, the test results confirmed, and the documents updated.

## Execution Role
This skill is executed by the Test Engineer (subagent_type=te) subagent, loading this skill with the Skill tool for execution.

## Dispatch Notes (must be followed by the PM/upper-level orchestrator when launching this skill)
1. Launch method: launch the subagent with the task tool; subagent_type must be `te`; neither the PM nor the orchestrator may execute this skill's content on its own.
2. The prompt must carry the required context (none may be missing): the absolute path of the project root (projectRoot), the project abbreviation ({Project Abbreviation}), the current version ({Current Version}), the verbatim user input $ARGUMENTS (including any file paths the user mentioned), the skill name (impm-task-coding-runtest, requiring the subagent to load this skill with the Skill tool before executing), and the task ID (taskId, extracted from $ARGUMENTS; when missing, use impm_task_manager to query the next executable task).
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

### Step 2: Read the Test Cases
Call impm_doc_reader (docType=testcase, taskId={Task ID}) to read the current task's test cases.

### Step 3: Run the Tests by Test Type
Based on the current task's test cases (docType=testcase, taskId={Task ID}), run them separately by test type:

1. **Unit tests**: locate the unit test functions written by this task and run them with the unit test tool of the current development language or build environment (e.g., pytest / go test / mvn test / npm test / dotnet test, etc.); after execution, generate a unit test result summary (the number of passed/failed cases and the failure causes).

2. **Functional and UI tests**: this step does not run or generate UI automation tests; ignore them (UI tests are subject to the manual/functional test records in docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-ui-test-record-v{Current Version}.md).

3. **API tests**:
   1. **Detect the Python environment** (running the .py API test program depends on a python environment; before executing, you must first confirm whether a usable python exists):
      Detect and determine the usable python run command in the following order:
      a. Directly check whether the shell can access python: run `python --version`; if it fails, try `python3 --version` (on Windows you can also try `py -3 --version`); if any succeeds, use that successful command as the python run command;
      b. If there is no directly usable python, check the conda environments: run `conda env list` to list the environments, choose one (e.g., base) and run `conda run -n <env name> python --version` to verify; on success, use `conda run -n <env name> python` as the python run command;
      c. If there is no conda either, check the uv-managed python environment: run `uv python list` or `uv run python --version`; on success, use `uv run python` (or `uv run --python <version> python`) as the python run command;
      d. If none of the above is usable, judge that the current environment lacks python and the API tests cannot run; report this truthfully to the dispatcher and prompt to install python first (official installer / conda / uv installation all work).
   2. Check whether the API test runner program run_api_test.py already exists in the target project's scripts/API-TEST/ directory; if not, call impm_template_reader to read the assets/skills/template/API-TEST-RUNNER.py template content and create run_api_test.py in the scripts/API-TEST/ directory (i.e., copy the template to that path);
   3. Locate this task's API test cases generated in scripts/API-TEST/{Project Abbreviation}-api-test-v{Current Version}.postman_collection.json (Postman Collection v2.1 format);
   4. Use the python run command determined in step 3.1 to call that program to run the API tests, and specify the above Postman Collection JSON file and the optional base address (e.g., `--base-url http://localhost:port`):
      `<python run command> scripts/API-TEST/run_api_test.py scripts/API-TEST/{Project Abbreviation}-api-test-v{Current Version}.postman_collection.json --report-dir scripts/API-TEST/report`
   5. The program reads the collection, sends the requests one by one, compares them against the expected results, and generates a test report (console + scripts/API-TEST/report/api-test-report.md, api-test-report.json); judge whether the API tests pass based on the PASS/FAIL summary in the report.

### Step 4: Update the Test Results
After each test completes, update the pass status of the current task's test cases (update the task directory testcase.md, marking pass/fail and the failure causes); for API tests, combine the api-test-report generated in step 3.5 and back-fill each case's execution result (HTTP status code, elapsed time, assertion failure details) into the "Test Result" column of the corresponding case in testcase.md.

### Step 5: Handle Failures (unit tests and API tests)
After all tests complete, if some cases in the unit tests or API tests fail (UI tests are not counted in the failure judgment):
1. Add the error messages/failure details in the report to the context;
2. The dispatcher (impm-task-coding) falls back to impm-task-coding-context to re-collect information and code, then re-runs the tests per the workflow;
3. If consecutive failures reach the limit (3 times), abort this task and report to the user.

### Step 6: Confirm Everything Passes
If all tests succeed, the current task's coding is successfully completed.

### Step 7: Merge the Version Test Cases
Merge and update the current task's test cases docs/{Project Abbreviation}-v{Current Version}/task_{Task ID}/testcase.md into the current version's test cases docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-testcase-v{Current Version}.md. **Version directory write conflict avoidance**: first call impm_doc_reader (docType=testcase, target=version) to read the latest content, append/merge this task's cases onto the latest content (keeping others' cases), then write the whole file back with impm_doc_writer (docType=testcase, target=version) using expectedBase=<the read full text>; if a concurrent conflict error is returned (the file has been modified by another task), re-read, merge, and write back; re-read to verify after writing.

### Step 8: Record Completion
Call impm_progress (action=add, stepName=impm-task-coding-runtest, status={Task ID}-completed).

## Deliverables
- Task directory testcase.md (test pass status updated)
- docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-testcase-v{Current Version}.md (merged and updated)
- The progress record in version_progress.md

## After Completion
- After completing all operations of this skill, you must immediately end and return to the dispatcher: the list of output file paths and the progress status of this skill in version_progress.md; you must not continue to subsequent phases or tasks on your own, nor wait for further instructions; subsequent dispatch is the responsibility of the dispatcher (PM).
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->