---
name: impm-init-testcase
description: Reads the TESTCASE-TEMPLATE.MD template, determines test cases from the project code, documents, PRD, and LLD, writes the test functions, and generates automated test scripts (scripts/API-TEST/). Use when test cases need to be written during the initialization phase.
---

# impm-init-testcase Skill
## Trigger Words
- Test case
- Automated testing
- testcase
- Test script

## When to Use
- When the test step of the initialization phase (/impm-init-testcase) is executed.
- When the test case document and automated test scripts need to be created or completed.

## Executing Agent
This skill is executed by the TE subagent (subagent_type=te). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `te`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-init-testcase; require the subagent to load this skill with the Skill tool first before executing).
3. Completion requirement: wait for the subagent to return the completion result, verify the output files and the version_progress.md progress records, and only proceed to the next step when everything is correct.

## Key Variables and How to Get Them
| Variable | Description | How to get it |
| Project Chinese name | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project English name | The English name of the project | Read from docs/project.md via impm_project_info |
| Project abbreviation | The project's English abbreviation, used to construct all document paths | Read from docs/project.md via impm_project_info |
| Current version | The version currently being executed (fixed at 0.0.1 during the initialization phase) | Get via impm_version, or infer from the version directory name |

## Execution Requirements
1. Execute strictly in the order of the content in the execution steps: no skipping, no out-of-order execution, no parallel execution, no merged execution of any step.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths must be constructed with {project abbreviation} and {current version}; do not fabricate file names.
4. Use impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. After each step, verify that the output file exists and its content is correct.

## Execution Steps
### Step 1: Read the template
Call impm_template_reader(projectRoot, TESTCASE-TEMPLATE.MD) to read the test case document template, and clarify the template chapter structure and the case format (case ID, case name, preconditions, test steps, expected results, etc.).

### Step 2: Determine the test cases
Read the existing documents via impm_doc_reader (focus on the PRD and LLD, and the API definitions in docs/{project abbreviation}-api.md), and determine the test case list combined with the current project code and documents:
- Existing project: determine the cases from the existing features and code.
- Empty project: write an empty document per the template structure, keeping the chapter titles and filling the content with "to be filled" or empty values.

### Step 3: Write the version document and copy the master document
Call impm_doc_writer(projectRoot, testcase, {project Chinese name}, {current version}, {task ID}, main, content): write the version document docs/{project abbreviation}-v0.0.1/{project abbreviation}-testcase-v0.0.1.md, and copy it to the master document docs/{project abbreviation}-testcase.md (create the master document if it does not exist). Verify both files exist and their contents match.

### Step 4: Write the unit test functions
For the unit test part of the test cases, write the unit test functions: test functions correspond one-to-one with the cases, and the function names, input parameters, and assertions are consistent with the cases' test steps and expected results.

### Step 5: Write the API test scripts
For the API interface tests in the test cases, write the API test scripts and put them uniformly under scripts/API-TEST/; the scripts should be directly executable and output the pass/fail result for each case.

### Step 6: Record progress
Call impm_progress(projectRoot, {project abbreviation}, {current version}, add, impm-init-testcase, completed) to record this step as complete.

## Deliverables
- docs/{project abbreviation}-v0.0.1/{project abbreviation}-testcase-v0.0.1.md
- docs/{project abbreviation}-testcase.md
- Automated test scripts under scripts/API-TEST/

## Next Steps
- To continue with the next step, enter /impm-init-commit
- To continue with all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
