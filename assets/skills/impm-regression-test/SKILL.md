---
name: impm-regression-test
description: Runs the version regression tests: merges test cases into the master test case, runs all unit tests and API tests, and records the results.
---

# impm-regression-test Skill

## Trigger Words
Regression test, unit test, API test, test case merge, regression

## When to Use
Use this skill at the start of Phase 4, after the version's coding development is fully complete, when regression testing of the entire version needs to be performed.

## Executing Agent
This skill is executed by the TE subagent (subagent_type=te). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `te`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-regression-test; require the subagent to load this skill with the Skill tool first before executing).
3. Completion requirement: wait for the subagent to return the completion result, verify the output files and the version_progress.md progress records, and only proceed to the next step when everything is correct.

## Key Variables and How to Get Them
| Variable | Description | How to Get |
| Chinese project name | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| English project name | The English name of the project | Read from docs/project.md via impm_project_info |
| Project abbreviation | The English abbreviation of the project, used to build all document paths | Read from docs/project.md via impm_project_info |
| Current version | The version number currently being executed | Get via impm_version action=current, or infer from the version directory name |

## Execution Requirements
1. Follow the steps strictly in the order given in the Execution Steps: no skipping, no out-of-order execution, no parallel execution, no merged execution of any step.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths must be built from {project abbreviation} and {current version}; never invent file names.
4. Use impm_* tools to obtain information; never fabricate tool results.
5. Use English throughout.
6. After each step, verify that the produced files exist and their content is correct.

## Execution Steps
### Step 1: Merge the current version's test cases into the master test case
1. Read the current version's test cases docs/{project abbreviation}-v{current version}/{project abbreviation}-testcase-v{current version}.md.
2. If docs/{project abbreviation}-testcase.md does not exist or is empty, create the master test case using the content of the current version's test cases.
3. If it already exists, keep the existing historical content in the master test case and merge in the test cases newly added or changed in the current version; for identical case IDs, update with the current version's content, and do not lose historical cases.
4. Call impm_doc_writer (docType=testcase, target=main) to write docs/{project abbreviation}-testcase.md.
5. Verify that the merged master test case file exists and its content is correct.

### Step 2: Run all unit tests
1. Get the project's programming language via impm_project_info, and determine the corresponding unit test plugin and run command (e.g., mvn test for Java, pytest for Python, npm test for Node, etc.).
2. Run all unit tests; do not skip or selectively run any test.
3. Record: test time, runtime environment, execution command, total number of cases, number passed, number failed, and details and reasons of failed cases.

### Step 3: Write the unit test regression results
1. Organize the results of Step 2 into a Markdown document, including: test time, runtime environment, execution command, statistics, list of failed cases with reasons, and conclusion.
2. Call impm_doc_writer (docType=regression-unit) to write docs/{project abbreviation}-v{current version}/regression-unit-test.md.
3. Verify that the file exists and its content is correct.

### Step 4: Run the API test scripts and write the results
1. List all test scripts under the scripts/API-TEST/ directory (e.g., {project abbreviation}-api-test-v{current version}.py, etc.).
2. Run all test scripts one by one, and record the execution result of each script (pass/fail, assertion details, error messages).
3. Organize the results into a Markdown document: script name, execution command, number of cases, number passed, number failed, failure details, and conclusion.
4. Call impm_doc_writer (docType=regression-api) to write docs/{project abbreviation}-v{current version}/regression-api-test.md.
5. Verify that the file exists and its content is correct.

### Step 5: Record progress
1. Call impm_progress add (impm-regression-test, completed) to record this skill's completion status in version_progress.md.
2. Verify that this step's status is recorded in version_progress.md.

## Deliverables
- docs/{project abbreviation}-testcase.md (the merged master test case)
- docs/{project abbreviation}-v{current version}/regression-unit-test.md
- docs/{project abbreviation}-v{current version}/regression-api-test.md
- The progress records in version_progress.md

## Next Steps
- To continue to the next step, enter /impm-coding-comment
- To continue all remaining steps of this phase, enter /impm-finish

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
