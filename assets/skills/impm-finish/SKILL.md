---
name: impm-finish
description: Orchestrates all steps of the regression testing and version documentation phase (Phase 4), dispatching each subagent in order to complete the version wrap-up work
---

# impm-finish Skill

## Trigger Words
/impm-finish, Phase 4, regression testing, version documentation, version wrap-up, complete current version

## When to Use
Use after all Phase 3 coding development is complete and all tasks in the version have been committed, when regression testing and version documentation need to be performed. This skill is the Phase 4 orchestration entry, responsible for strictly dispatching the other 9 skills in order.

## Execution Role
This skill is executed (orchestrated) by the Project Manager (main control Agent). Use the Skill tool to load this skill when executing. Internal sub-steps MUST be dispatched to the corresponding subagents per the "General Dispatch Requirements" below; the PM only dispatches, checks, and makes decisions.

## General Dispatch Requirements (MUST be followed by all sub-steps of this skill)
1. Startup method: each sub-step starts the corresponding subagent (subagent_type MUST exactly match the mapping table below) via the task tool to execute the corresponding skill; the PM is forbidden from performing concrete work on behalf of subagents (the only exception: steps marked "PM executes directly" in the mapping table).
2. The task prompt MUST include the following context (none may be missing): project root absolute path (projectRoot), project English abbreviation ({Project Abbreviation}), current version number ({Current Version Number}), the original user input $ARGUMENTS (including the file paths mentioned by the user), the skill name (require the subagent to load the skill with the Skill tool first before executing), task ID ({Task ID}, applicable in the coding phase).
3. task prompt template (fill in for each sub-step):
   "Execute impm's {skill name} skill as {subagent Chinese name} (subagent_type={x}); first load the skill {skill name} with the Skill tool; required context: project root={absolute path}, project English abbreviation={abbreviation}, current version number={version number}, user input={original text}, task ID={taskId} (if applicable); after completing all operations per the skill execution steps, return: the list of produced file paths and the progress status of {skill name} in version_progress.md."
4. Completion verification: after each subagent returns, verify that the produced files exist and version_progress.md has recorded the step status; only proceed to the next step when all are correct.
5. Order discipline: strictly follow the order, no skipping, no reordering, no parallel execution, no merging; when any sub-step fails, first locate the cause, and if necessary roll back and redo, without bypassing.

### Sub-step subagent mapping table (impm-finish)
| Sub-step | Skill Name | subagent_type |
|----|----|----|
| 1 | impm-regression-test | te |
| 2 | impm-coding-comment | dw |
| 3 | impm-coding-review | tl |
| 4 | impm-regression-metrics | tl |
| 5 | impm-project-update | sa |
| 6 | impm-doc-merge | dw |
| 7 | impm-doc-update | dw |
| 8 | impm-deploy-update | dw |
| 9 | impm-git-merge | scm |

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
### Step 1: Execute regression testing
1. Check docs/{Project Abbreviation}-v{Current Version Number}/version_progress.md and confirm the status of the impm-regression-test step. If the status is already "completed", skip this step and go directly to Step 2; otherwise:
2. Start the TE subagent, load the impm-regression-test skill via the Skill tool, and have the TE complete: merge the task test cases into the master test case, run all unit tests in full, run all API test scripts under the scripts/API-TEST/ directory, and write the regression test results respectively.
3. After the TE finishes, re-check that the impm-regression-test step status has been recorded as "completed" in version_progress.md before continuing to the next step.

### Step 2: Execute code comments
1. Start the DW subagent, load the impm-coding-comment skill via the Skill tool, and have the DW add clear English comments to all code updated in this version based on the git change records of the current branch.
2. After completion, verify that the impm-coding-comment step status has been recorded as "completed" in version_progress.md before continuing to the next step.

### Step 3: Execute code review
1. Start the TL subagent, load the impm-coding-review skill via the Skill tool, and have the TL review this version's code for security vulnerabilities, performance traps, code quality, architecture compliance, and test coverage, outputting a review report per the template.
2. After completion, verify that the impm-coding-review step status has been recorded as "completed" in version_progress.md before continuing to the next step.

### Step 4: Backfill the regression quality metrics report (Phase 2)
1. Start the TL subagent, load the impm-regression-metrics skill via the Skill tool, and have the TL read the code review report and the Phase 1 regression.md, count the number of review issues and their severity distribution and fix rate, calculate the defect density and the defect removal efficiency DRE, and backfill them into the version quality metrics report regression.md.
2. After completion, verify that the impm-regression-metrics step status has been recorded as "completed" in version_progress.md before continuing to the next step.

### Step 5: Update the project map
1. Start the SA subagent, load the impm-project-update skill via the Skill tool, and have the SA scan the source code directories to generate the project map and update the project map section of docs/project.md.
2. After completion, verify that the impm-project-update step status has been recorded as "completed" in version_progress.md before continuing to the next step.

### Step 6: Merge version documents into the master documents
1. Start the DW subagent, load the impm-doc-merge skill via the Skill tool, and have the DW merge the current version's URS, PRD, API, DBD, DBD SQL, LLD documents into the corresponding master documents under docs.
2. After completion, verify that the impm-doc-merge step status has been recorded as "completed" in version_progress.md before continuing to the next step.

### Step 7: Update readme.md and agent.md
1. Start the DW subagent, load the impm-doc-update skill via the Skill tool, and have the DW create or update readme.md and agent.md in the project root directory.
2. After completion, verify that the impm-doc-update step status has been recorded as "completed" in version_progress.md before continuing to the next step.

### Step 8: Update the build and deployment plan
1. Start the DW subagent, load the impm-deploy-update skill via the Skill tool, and have the DW create or update deploy/build.md and deploy/deploy.md, and generate build/deployment scripts under the deploy directory when necessary.
2. After completion, verify that the impm-deploy-update step status has been recorded as "completed" in version_progress.md before continuing to the next step.

### Step 9: Merge the main branch and commit
1. Start the SCM subagent, load the impm-git-merge skill via the Skill tool, and have the SCM merge the current version branch into the main branch (master or main) via git merge --squash and commit.
2. After completion, verify that the impm-git-merge step status has been recorded as "completed" in version_progress.md before continuing to the next step.

### Step 10: Record progress and report
1. Call impm_progress add (impm-finish, completed) to record this skill's completion status in version_progress.md.
2. Call impm_progress (action=finalize) before exiting to settle the total duration and tokens of the last row of the progress table (impm-finish, completed) (including the tokens consumed by the main session and the subagent sub-sessions of this step).
3. Verify that all 9 steps of Phase 4 have been recorded as "completed" in version_progress.md.
4. Report to the user: all steps of Phase 4 (regression testing and version documentation) have been completed in order; the development of this version is fully complete.

## Deliverables
- Status records of all Phase 4 steps in docs/{Project Abbreviation}-v{Current Version Number}/version_progress.md
- The commit record after the version is merged into the main branch

## Completion Hints
- Phase 4 (regression testing and version documentation) is fully complete; the development of this version is fully complete.
- To re-execute all steps of this phase, enter /impm-finish

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->