---
name: impm-init-testcase
description: Reads the TESTCASE-TEMPLATE.MD template, determines test cases from the project code, documents, PRD, and LLD, writes the unit test functions and generates the Postman Collection v2.1 interface test cases (scripts/API-TEST/, executed together with run_api_test.py). Use when test cases need to be written during the initialization phase.
---

# impm-init-testcase Skill

## Trigger words
- test cases
- automated testing
- testcase
- test scripts

## When to use
- When the testing step of the initialization phase (/impm-init-testcase) is executed.
- When the test case document and automated test scripts need to be created or completed.

## Executing role
This skill is executed by the Test Engineer (subagent_type=te) subagent. When executing, load this skill using the Skill tool.

## Scheduling notes (must comply when PM/upper-level orchestrator starts this skill)
1. Startup method: start the subagent using the task tool, subagent_type must be `te`; the PM or orchestrator is prohibited from executing this skill's content in place of it.
2. The prompt must pass the context (none may be missing): the absolute path of the project root directory (projectRoot), project English abbreviation ({project English abbreviation}), current version number ({current version number}), the original user input $ARGUMENTS (including file paths mentioned by the user), and the skill name (impm-init-testcase, require the subagent to first load this skill using the Skill tool before executing).
3. Completion requirement: after waiting for the subagent to return the completion result, verify the produced files and the version_progress.md progress records; only proceed to the next step when all are correct.

## Key variable definitions and values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to concatenate all document paths | Read from docs/project.md via impm_project_info |
| Current version number | The version number being executed (fixed to 0.0.1 in the initialization phase) | Obtained via impm_version or inferred from the version directory name |

## Execution requirements
1. Execute strictly in the content and order of the execution steps: do not skip, do not reorder, do not run in parallel, do not merge any steps.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths must be concatenated with {project English abbreviation} and {current version number}; do not fabricate file names.
4. Use the impm_* tools to obtain information; do not fabricate tool return results.
5. Use English throughout.
6. After each step, verify that the produced files exist and the content is correct.

## Execution steps
### Step 1: read the templates
Call impm_template_reader(projectRoot, TESTCASE-TEMPLATE.MD) to read the test case document template, and clarify the template section structure and the case format (case number, case name, preconditions, test steps, expected results, etc.). If API interface testing is involved, also call impm_template_reader(projectRoot, API-TEST-COLLECTION-TEMPLATE.json) to read the Postman Collection v2.1 case structure template (focus: info/variable/item/request/expected), to understand the interface case fields and the expected assertion writing style.

### Step 2: determine the test cases
Read the existing documents via impm_doc_reader (focus on the PRD, LLD, and the interface definitions in docs/{project English abbreviation}-api.md), combine the current project code and documents, and determine the test case list:
- Existing project: determine the cases based on the existing features and code.
- Empty project: write an empty document according to the template structure, keeping the section titles and filling the content with "to be supplemented" or empty values.

### Step 3: write the version document and copy the master document
Call impm_doc_writer(projectRoot, testcase, {project Chinese name}, {current version number}, {task number}, main, content): write the version document docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-testcase-v0.0.1.md, and copy it to the master document docs/{project English abbreviation}-testcase.md (create it if the master document does not exist). Verify that both files exist and the content is consistent.

### Step 4: write the unit test functions
For the unit test part of the test cases, write the unit test functions: the test functions correspond one-to-one with the cases, and the function names, parameters, and assertions remain consistent with the test steps and expected results of the cases.

### Step 5: write the API interface test cases (Postman Collection v2.1)
For the API interface tests in the test cases, generate the JSON case file in Postman Collection v2.1 format, place it at scripts/API-TEST/{project English abbreviation}-api-test-v0.0.1.postman_collection.json, and use it together with the interface test execution program:
1. Confirm that the interface test execution program run_api_test.py already exists under scripts/API-TEST/; if it does not exist, copy it from the template assets/skills/template/API-TEST-RUNNER.py to that path (i.e., create run_api_test.py).
2. According to the API-TEST-COLLECTION-TEMPLATE.json template structure, generate an item for each interface case:
   - item.name = interface path + case name + case ID;
   - item.request.method/url/header/body filled in according to the case's interface and test steps (use the `{{base_url}}` placeholder in url.raw; fill query as an array; when body is JSON, use mode=raw);
   - In item.event, generate the pm.test assertion script according to the case's expected results (status code, business code, field values), for convenient debugging in Apifox;
   - Fill item.expected with the structured assertions according to the case's expected results (status status code, max_response_time response time upper limit, headers included response headers, assertions response body assertions: type=json with path+equals/contains, type=body_contains with value); this expected field is read and executed by API-TEST-RUNNER.py and must be consistent with the actual interface expectations.
3. The interface tests are executed via `python scripts/API-TEST/run_api_test.py scripts/API-TEST/{project English abbreviation}-api-test-v0.0.1.postman_collection.json --report-dir scripts/API-TEST/report`; the program reads the collection, sends each request, compares against the expected results, and generates a test report (console + scripts/API-TEST/report/api-test-report.md, api-test-report.json). **Before running, detect the Python environment** (running the .py interface test program depends on the python environment):
   a. Directly detect whether the shell can access python: execute `python --version`; if it fails, try `python3 --version` (on Windows, also try `py -3 --version`); if any succeeds, use the successful command as the python run command;
   b. If there is no directly usable python, detect the conda environment: execute `conda env list` to list the environments, choose any one (such as base) and execute `conda run -n <env name> python --version` to verify; on success, subsequently use `conda run -n <env name> python` as the python run command;
   c. If there is no conda either, detect a uv-managed python environment: execute `uv python list` or `uv run python --version`; on success, subsequently use `uv run python` (or `uv run --python <version> python`) as the python run command;
   d. If none of the above is available, conclude that the current environment lacks python and interface tests cannot be executed; honestly report to the orchestrator and prompt to install python first (official installer / conda / uv installation are all fine). If a usable python is detected, replace `python` in the execution command above with the determined python run command and then execute.

### Step 6: record progress
Call impm_progress(projectRoot, {project English abbreviation}, {current version number}, add, impm-init-testcase, completed) to record the completion of this step.

## Deliverables
- docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-testcase-v0.0.1.md
- docs/{project English abbreviation}-testcase.md
- scripts/API-TEST/{project English abbreviation}-api-test-v0.0.1.postman_collection.json (Postman Collection v2.1 interface test cases)
- scripts/API-TEST/run_api_test.py (the interface test execution program, copied from the template)

## Completion tips
- To continue to the next step, enter /impm-init-commit
- To continue executing all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->