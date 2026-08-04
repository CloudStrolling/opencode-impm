---
name: impm-finish
description: Orchestrates all steps of the regression testing and version documentation phase (Phase 4), dispatching each subagent in order to complete the version wrap-up work.
---

# impm-finish Skill

## Trigger Words
/impm-finish, Phase 4, regression testing, version documentation, version wrap-up, complete this version

## When to Use
Use this skill when the Phase 3 coding development is fully complete and all tasks in the version have been committed, and regression testing and version documentation need to be performed. This skill is the orchestration entry of Phase 4 and is responsible for strictly dispatching the other 8 skills in order.

## Executing Agent
This skill is executed by the PM subagent. Load this skill with the Skill tool when executing.

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
### Step 1: Run regression tests
1. Check docs/{project abbreviation}-v{current version}/version_progress.md to confirm the status of the impm-regression-test step. If the status is already "completed", skip this step and go directly to Step 2; otherwise:
2. Start the TE subagent, load the impm-regression-test skill via the Skill tool, and have the TE complete: merging test cases into the master test case, running all unit tests, running all API test scripts under the scripts/API-TEST/ directory, and writing the regression test results respectively.
3. After the TE finishes, re-check that the impm-regression-test step status in version_progress.md is recorded as "completed" before continuing to the next step.

### Step 2: Add code annotations
1. Start the DW subagent, load the impm-coding-comment skill via the Skill tool, and have the DW add clear English comments to all code updated in this version based on the git change records of the current branch.
2. After execution, verify that the impm-coding-comment step status in version_progress.md is recorded as "completed" before continuing to the next step.

### Step 3: Perform code review
1. Start the TL subagent, load the impm-coding-review skill via the Skill tool, and have the TL review this version's code for security vulnerabilities, performance traps, code quality, architecture compliance, and test coverage, and output the review report following the template.
2. After execution, verify that the impm-coding-review step status in version_progress.md is recorded as "completed" before continuing to the next step.

### Step 4: Update the project map
1. Start the SA subagent, load the impm-project-update skill via the Skill tool, and have the SA scan the source code directories to generate the project map, and update the project map section of docs/project.md.
2. After execution, verify that the impm-project-update step status in version_progress.md is recorded as "completed" before continuing to the next step.

### Step 5: Merge the version documents into the master documents
1. Start the DW subagent, load the impm-doc-merge skill via the Skill tool, and have the DW merge the current version's URS, PRD, API, DBD, DBD SQL, and LLD documents into the corresponding master documents under docs.
2. After execution, verify that the impm-doc-merge step status in version_progress.md is recorded as "completed" before continuing to the next step.

### Step 6: Update readme.md and agent.md
1. Start the DW subagent, load the impm-doc-update skill via the Skill tool, and have the DW create or update readme.md and agent.md in the project root directory.
2. After execution, verify that the impm-doc-update step status in version_progress.md is recorded as "completed" before continuing to the next step.

### Step 7: Update the build and deployment plans
1. Start the DW subagent, load the impm-deploy-update skill via the Skill tool, and have the DW create or update deploy/build.md and deploy/deploy.md, and generate build/deployment scripts under the deploy directory when necessary.
2. After execution, verify that the impm-deploy-update step status in version_progress.md is recorded as "completed" before continuing to the next step.

### Step 8: Merge into the main branch and commit
1. Start the SCM subagent, load the impm-git-merge skill via the Skill tool, and have the SCM merge the current version branch into the main branch (master or main) using git merge --squash and commit.
2. After execution, verify that the impm-git-merge step status in version_progress.md is recorded as "completed" before continuing to the next step.

### Step 9: Record progress and report
1. Call impm_progress add (impm-finish, completed) to record this skill's completion status in version_progress.md.
2. Verify that all 8 steps of Phase 4 in version_progress.md are recorded as "completed".
3. Report to the user: all steps of Phase 4 (regression testing and version documentation) have been completed in order, and the development of this version is fully complete.

## Deliverables
- The status records of all Phase 4 steps in docs/{project abbreviation}-v{current version}/version_progress.md
- The commit record after the version is merged into the main branch

## Next Steps
- Phase 4 (regression testing and version documentation) is fully complete, and the development of this version is fully complete.
- To re-run all steps of this phase, enter /impm-finish

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
