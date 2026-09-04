---
name: impm-sprint-test
description: Agile sprint testing sub-skill; the TE writes and runs the tests in a unified manner, merging writetest and runtest into a single step.
---

# impm-sprint-test skill

## Trigger words
- agile testing
- sprint testing
- quick testing
- sprint-test

## When to use
After all the coding tasks of the impm-sprint orchestration skill (stage 4) are complete, when the tests for all the code changes of this sprint need to be written and executed in a unified manner. This skill is dedicated to the agile process; it merges the waterfall impm-task-coding-writetest and impm-task-coding-runtest skills into a single step, without a task-level decomposition.

## Execution role
This skill is executed by the Test Engineer (subagent_type=te) subagent, loading this skill with the Skill tool.

## Scheduling instructions (must be followed when the PM/upper-level orchestrator starts this skill)
1. Startup method: use the task tool to start the subagent, with subagent_type that must be `te`; the PM or the orchestrator is forbidden to execute the content of this skill by itself.
2. The prompt must carry the context (all are required): the absolute path of the project root (projectRoot), the Project Abbreviation ({Project Abbreviation}), the current version number ({Current Version}), the raw user input $ARGUMENTS (including the file paths the user mentioned), the skill name (impm-sprint-test, the subagent must first load this skill with the Skill tool and then execute it).
3. Completion requirement: after waiting for the subagent to return its completion result, verify the test output and the version_progress.md progress records; only proceed to the next step when all are correct.

## Key variable definitions and values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to construct all document paths | Read from docs/project.md via impm_project_info |
| Current Version | The version number of the current execution | Passed in by the scheduling party (PM) |

## Execution requirements
1. Strictly execute in the order and content of the execution steps in sequence: do not skip, do not reorder, do not parallelize, do not merge any step.
2. Only perform the operations defined by this skill; do not do work unrelated to the task.
3. All document paths must be constructed with {Project Abbreviation} and {Current Version}; do not invent file names.
4. Use the impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. This skill is part of the agile process and can only be scheduled and executed by impm-sprint; it cannot be executed alone without a version number.

## Execution steps
### Step 1: Receive the version number and the test scope
Receive the current version number passed in by the scheduling party; call impm_doc_reader (docType=task) to read the task list, and determine the scope of this sprint's code changes together with impm_git (action=status or log).

### Step 2: Write the tests
Write the tests according to the existing test framework and the language conventions of the project:
1. Unit tests: write unit test functions for the functions involved in this sprint's changes in the current development language and with the commonly used test plugins (committed together with the source code);
2. Interface tests: write interface test scripts with the python language and put them into scripts/API-TEST/{Project Abbreviation}-api-test-v{Current Version}.py; each test script uses a unified entry;
3. Functional and UI tests: create {Project Abbreviation}-ui-test-record-v{Current Version}.md under the version directory docs/{Project Abbreviation}-v{Current Version}/, calling impm_doc_writer (docType=ui-test-record), and list the steps and records of the functional and UI tests clearly.

### Step 3: Run the tests
Run the unit tests and the interface test scripts in full; before running the interface test scripts, first **check the Python environment** (running the .py interface test programs depends on the python environment):
1. First check whether the shell can access python: run `python --version`; if it fails, try `python3 --version` (on Windows you can also try `py -3 --version`); if any one succeeds, use that successful command as the python run command;
2. If there is no directly usable python, check the conda environment: run `conda env list` to list the environments, choose any one (e.g., base) and run `conda run -n <env name> python --version` to verify; if it succeeds, subsequently use `conda run -n <env name> python` as the python run command;
3. If there is no conda either, check the uv-managed python environment: run `uv python list` or `uv run python --version`; if it succeeds, subsequently use `uv run python` (or `uv run --python <version> python`) as the python run command;
4. If none of the above is available, judge that the current environment lacks python, the interface tests cannot be executed, report to the scheduling party truthfully and suggest installing python first (a python installation via the official installer / conda / uv is all acceptable).

After confirming a usable python, replace the `python` prefix in the interface test script commands with it and then execute; if any fail, locate the failure cause and fix it (fix the test code problems directly; record the product code problems and return them to the scheduling party to arrange a fix and re-test), and rerun until all pass.

### Step 4: Record the test results
Write the test results (passed count/total count, failure details) into docs/{Project Abbreviation}-v{Current Version}/regression-api-test.md, calling impm_doc_writer (docType=regression-api).

### Step 5: Record the completion
Call impm_progress (action=add, stepName=impm-sprint-test, status=completed).

## Deliverables
- The unit test functions (committed together with the source code)
- The interface test script scripts/API-TEST/{Project Abbreviation}-api-test-v{Current Version}.py
- The functional/UI test record document docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-ui-test-record-v{Current Version}.md
- The test result record docs/{Project Abbreviation}-v{Current Version}/regression-api-test.md
- The progress records in version_progress.md

## Notes after completion
- After all the operations of this skill are complete, it must end immediately and return to the scheduling party: the list of produced file paths and the progress status of this skill in version_progress.md; it is strictly forbidden to continue executing subsequent stages or subsequent tasks by yourself, and strictly forbidden to wait for later instructions; the subsequent scheduling is the responsibility of the scheduling party (PM/impm-sprint).
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->