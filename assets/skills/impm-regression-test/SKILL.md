---
name: impm-regression-test
description: Executes the version regression test, running all unit tests and API tests in full and recording the results, identifying and deleting outdated test cases, backfilling test cases into and verifying the coverage completeness of the requirements traceability matrix (RTM), and generating the current version quality metrics report (Phase 1: testing metrics, written to regression.md; review-type quality metrics are backfilled in Phase 2 by impm-regression-metrics)
---

# impm-regression-test Skill

## Trigger Words
regression testing, unit testing, API testing, requirements traceability matrix, RTM, coverage verification, test coverage, quality metrics, defect metrics, regression

## When to Use
Use when Phase 4 starts and, after all coding development of the version is complete, the whole version needs regression testing; at the same time backfill the test cases into the requirements traceability matrix (RTM) and verify the coverage completeness of all requirements/user stories (design, tasks, test cases).

## Execution Role
This skill is executed by the Test Engineer (subagent_type=te) subagent. Use the Skill tool to load this skill when executing.

## Dispatch Notes (MUST be followed by the PM/upper-level orchestrator when starting this skill)
1. Startup method: start the subagent with the task tool; subagent_type MUST be `te`; the PM or orchestrator is forbidden from performing this skill's content on their behalf.
2. The prompt MUST include the following context (none may be missing): project root absolute path (projectRoot), project English abbreviation ({Project Abbreviation}), current version number ({Current Version Number}), the original user input $ARGUMENTS (including the file paths mentioned by the user), the skill name (impm-regression-test, require the subagent to load this skill with the Skill tool first before executing).
3. Completion requirement: after the subagent returns the completion result, verify the produced files and the version_progress.md progress records; only proceed to the next step when all are correct.

## Key Variable Definitions and Values
| Variable | Description | How to Obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to concatenate all document paths | Read from docs/project.md via impm_project_info |
| Current Version Number | The version number currently being executed | Get via impm_version action=current, or infer from the version directory name |

## Execution Requirements
1. Strictly execute in the content and order of the execution steps: no skipping, no reordering, no parallel execution, no merging of any step.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths MUST be concatenated with {Project Abbreviation} and {Current Version Number}; do not fabricate file names.
4. Use impm_* tools to obtain information; do not fabricate tool return results.
5. Use English throughout.
6. After each step completes, verify that the produced files exist and the content is correct.

## Execution Steps
### Step 1: Run all unit tests in full
1. Get the programming language of the project via impm_project_info, and determine the corresponding unit test plugin and run command (such as mvn test for Java, pytest for Python, npm test for Node, etc.).
2. Run all unit tests in full; do not skip or selectively run any test.
3. Record: test time, run environment, run command, total number of cases, number passed, number failed, details and causes of failed cases.

### Step 1.5: Handle outdated test cases (unit tests only)
1. Analyze the failing test cases from step 1 and identify those whose failure cause is "the case is outdated" (e.g. the tested feature point has been discontinued, the interface has been deprecated, or the business logic has changed so the case no longer applies).
2. If outdated test cases exist, use the question tool to list these test cases to the user:
   - Test case ID (TC-{version}-{task number}-{sequence})
   - Test case name
   - Path of the test file
   - Reason for being outdated
3. Ask the user whether to confirm deleting these outdated test cases.
4. If the user confirms deletion:
   a. Delete the corresponding test case entries from the version test case document docs/{Project Abbreviation}-v{Current Version Number}/{Project Abbreviation}-testcase-v{Current Version Number}.md;
   b. Delete the corresponding test code file or test functions;
   c. Record the deleted test case list.

### Step 2: Write the unit test regression results
1. Organize the results of step 1 into a Markdown document, including: test time, run environment, run command, statistics, list of failed cases and failure causes, deletion records of outdated test cases (if any), conclusion.
2. Call impm_doc_writer (docType=regression-unit) to write docs/{Project Abbreviation}-v{Current Version Number}/regression-unit-test.md.
3. Verify the file exists and the content is correct.

### Step 3: Run the API tests
0. **Detect the Python environment** (running the .py API test runner depends on a Python environment; confirm that a usable python exists before executing):
   Determine the usable python run command by checking in the following order:
   a. Directly check whether the shell can access python: run `python --version`; if it fails, try `python3 --version` (on Windows you may also try `py -3 --version`); whichever succeeds, use that successful command as the python run command;
   b. If no python is directly available, check the conda environment: run `conda env list` to list the environments, pick one (such as base) and run `conda run -n <env name> python --version` to verify; if successful, subsequently use `conda run -n <env name> python` as the python run command;
   c. If there is no conda either, check the uv-managed python environment: run `uv python list` or `uv run python --version`; if successful, subsequently use `uv run python` (or `uv run --python <version> python`) as the python run command;
   d. If none of the above is usable, conclude that the current environment lacks python and the API tests cannot run; report honestly to the dispatcher and suggest installing python first (official installer / conda / uv installation all work).
1. Confirm that the API test runner run_api_test.py exists under the scripts/API-TEST/ directory; if it does not exist, copy it from the assets/skills/template/API-TEST-RUNNER.py template to that path.
2. List all Postman Collection v2.1 API test case files under the current version directory docs/{Project Abbreviation}-v{Current Version Number}/ (such as {Project Abbreviation}-api-test-v{Current Version Number}.postman_collection.json).
3. Use the python run command determined in step 3.0 to call scripts/API-TEST/run_api_test.py in turn to run each collection file under the current version directory docs/{Project Abbreviation}-v{Current Version Number}/ (the `--base-url http://localhost:port` option may be added to specify the address of the service under test), read the aggregated results of the generated scripts/API-TEST/report/api-test-report.json, and record the execution result of each collection (pass/fail, assertion details, error messages).

### Step 3.5: Handle outdated test cases (API tests only)
1. Analyze the failing API test cases from step 3 and identify those whose failure cause is "the case is outdated" (e.g. the interface has been discontinued, the request/response format has changed, or the business logic has been adjusted so the case no longer applies).
2. If outdated test cases exist, use the question tool to list these test cases to the user:
   - Test case ID (TC-{version}-{task number}-{sequence})
   - Test case name
   - Path of the Postman Collection file
   - Reason for being outdated
3. Ask the user whether to confirm deleting these outdated test cases.
4. If the user confirms deletion:
   a. Delete the corresponding test case entries from the version test case document docs/{Project Abbreviation}-v{Current Version Number}/{Project Abbreviation}-testcase-v{Current Version Number}.md;
   b. Delete the corresponding items from the Postman Collection JSON file;
   c. Record the deleted test case list.

### Step 3.6: Write the API test regression results
1. Organize the results of step 3 into a Markdown document, including: collection name, run command, number of cases, number passed, number failed, failure details, deletion records of outdated test cases (if any), conclusion.
2. Call impm_doc_writer (docType=regression-api) to write docs/{Project Abbreviation}-v{Current Version Number}/regression-api-test.md.
3. Verify the file exists and the content is correct.

### Step 4: Requirements traceability matrix (RTM) test case backfill and coverage verification
1. Call impm_doc_reader (docType=rtm, target=version) to read the current version requirements traceability matrix docs/{Project Abbreviation}-v{Current Version Number}/{Project Abbreviation}-rtm-v{Current Version Number}.md; if the document does not exist, read the master document docs/{Project Abbreviation}-rtm.md, or state that this version did not generate an RTM and skip this step (mark the hint).
2. Collect this version's test cases: read the current version test cases docs/{Project Abbreviation}-v{Current Version Number}/{Project Abbreviation}-testcase-v{Current Version Number}.md, and extract all test case IDs (TC-xxx) and their "related requirement IDs" (FR-xxx / US-xxx; requirement/user story IDs are globally unique across the project, e.g. FR-v0.0.1-001, US-v0.0.1-001).
3. Establish and backfill the "requirement/user story → test case" associations:
   - Based on the "related requirement ID" field in the test cases, associate each test case with its corresponding requirement/user story;
   - Complete/update each association record in the "requirement/user story → test case" section (2.3) of the "2. Traceability matrix" of the RTM, marking the coverage status as "covered"; mark requirements/user stories never associated with any test case as "missing";
   - Synchronously backfill the "has test case" column of each requirement/user story in "3. Coverage completeness verification".
4. Coverage completeness verification: check one by one whether every original requirement (FR-xxx / NFR-xxx) and user story (US-xxx; IDs are all in the globally unique format FR-v{version}-xxx / US-v{version}-xxx) in the "1. Requirements/user stories list" simultaneously satisfies all of the following conditions:
   - Has design (a "covered" record exists under "requirement/user story → design");
   - Has task (a "covered" record exists under "requirement/user story → task");
   - Has test case (a "covered" record exists under "requirement/user story → test case").
   Any unmet condition is regarded as a gap.
5. Generate/update the issue list: merge the gaps found by the verification (missing design, missing tasks, missing test cases) with the existing issue list, fill them into the "4. Issue list" section of the RTM, give the issue description and handling suggestions, update the status of resolved issues to "resolved", and keep unresolved issues "pending".
6. Call impm_doc_writer (docType=rtm, target=version, expectedBase=the latest full text read in step 4.1) to overwrite the complete rtm.md containing the test case associations, the coverage verification, and the issue list (if this version originally has no rtm.md, a new one may be created, or written to the master document per main).
7. Verify that rtm.md has been written and the verification results are correct.

### Step 5: Generate the version quality metrics report (Phase 1: test metrics)
> This step only produces the Phase 1 "testing-type" quality metrics and writes them into regression.md; the "review-type" quality metrics (number of review issues and severity distribution, fix rate, defect density, DRE), because they depend on the review report generated by impm-coding-review, are backfilled into the same regression.md by the Phase 2 skill impm-regression-metrics after the code review completes.
1. Read the quality metrics report template: call impm_template_reader to read the REGRESSION-TEMPLATE.MD template content.
2. Aggregate the test metrics needed for Phase 1:
   - Unit tests: total number of cases, number passed, number failed, pass rate (taken from the regression results of steps 1/2);
   - API tests: total number of cases, number passed, number failed, pass rate (taken from the regression results of steps 3/3.6);
   - Test coverage: requirement/user story case coverage (calculated from the step 4 RTM coverage completeness verification results: covered requirements/user stories / total requirements/user stories); if the tool can produce code/branch coverage, fill it in as well, otherwise mark "not applicable".
3. Read the current version regression.md (docType=regression, target=version); if it does not exist, create it per the template; if it exists, keep the historical content and the parts already backfilled in Phase 2, only updating the Phase 1 test metrics.
4. Call impm_doc_writer (docType=regression, target=version, expectedBase=the latest full text read in step 5.3) to write docs/{Project Abbreviation}-v{Current Version Number}/regression.md; leave the review quality metrics section (chapters 3~5) pending backfill in Phase 2.
5. Verify that regression.md has been written and the test metrics content is correct.

### Step 6: Record progress
1. Call impm_progress add (impm-regression-test, completed) to record this skill's completion status in version_progress.md.
2. Verify that this step status has been recorded in version_progress.md.

## Deliverables
- docs/{Project Abbreviation}-v{Current Version Number}/regression-unit-test.md
- docs/{Project Abbreviation}-v{Current Version Number}/regression-api-test.md
- docs/{Project Abbreviation}-v{Current Version Number}/{Project Abbreviation}-rtm-v{Current Version Number}.md (with test case associations and coverage verification results backfilled)
- docs/{Project Abbreviation}-v{Current Version Number}/regression.md (Phase 1: test metrics; review-type quality metrics are backfilled in Phase 2 by impm-regression-metrics)
- version_progress.md progress records

## Completion Hints
- To continue with the next step, enter /impm-coding-comment
- To continue with all subsequent steps of this phase, enter /impm-finish

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->