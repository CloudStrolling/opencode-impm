---
name: impm-analysis-commit
description: Commits all files and directories generated in the requirements analysis phase to git, and reports that the phase is complete.
---

# impm-analysis-commit Skill

## Triggers
commit, git commit, requirements analysis commit, analysis phase complete, impm-analysis-commit

## When to use
Use when the requirements traceability matrix is complete (after impm-rtm-create), as the last step of the requirements analysis phase (phase 2): commit all the files and directories generated in this phase (including rtm.md) to git, record the progress, and report to the user that the requirements analysis phase is fully complete.

## Execution role
This skill is executed by the Software Configuration Engineer (subagent_type=scm) subagent, who loads this skill with the Skill tool.

## Dispatching instructions (the PM/orchestrator must comply when launching this skill)
1. Launch method: start the subagent with the task tool, subagent_type must be `scm`; the PM or orchestrator is prohibited from executing this skill's content on its behalf.
2. Mandatory context for the prompt (none may be omitted): absolute path of the project root (projectRoot), project abbreviation ({project abbreviation}), current version number ({current version}), original user input $ARGUMENTS (including the file paths mentioned by the user), skill name (impm-analysis-commit, require the subagent to load this skill with the Skill tool before executing).
3. Completion requirement: after waiting for the subagent to return the completion result, verify the output files and the version_progress.md progress records; proceed to the next step only when all are correct.

## Key variable definitions and values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to build all document paths | Read from docs/project.md via impm_project_info |
| Current Version | The version number currently being executed | Get via impm_version action=current, or infer from the version directory name |

## Execution requirements
1. Execute strictly in the content and order of the execution steps: do not skip, reorder, parallelize, or merge any step.
2. Only perform the operations specified by this skill; do not do work unrelated to the task.
3. All document paths must be built from {project abbreviation} and {current version}; do not invent file names.
4. Use impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. After each step completes, verify that the output file exists and its content is correct.

## Execution steps

### Step 1: Confirm the working tree status
Call impm_git (action=status) to confirm the working tree status, check whether the files and directories generated in the requirements analysis phase are all in place, and confirm the branch is {project abbreviation}-v{current version}.

### Step 2: Commit to git
Call impm_git (action=commit, message={project abbreviation}-v{current version}-requirements analysis) to commit all the files and directories generated in the requirements analysis phase to git. The commit includes: the documents generated under the version directory docs/{project abbreviation}-v{current version}/ (including rtm.md), the task list, the progress file, and the master documents updated in this phase (such as the modifications to docs/{project abbreviation}-sad.md). Confirm the commit succeeds.

### Step 3: Record progress
Call impm_progress (action=add, stepName=impm-analysis-commit, status=completed) to insert a new row at the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md, and confirm the progress row is recorded.

### Step 4: Report to the user
Report to the user that the requirements analysis phase is fully complete, and list the committed version number, commit information, and the phase deliverable summary.

## Deliverables
- git commit record: {project abbreviation}-v{current version}-requirements analysis
- Updated docs/{project abbreviation}-v{current version}/version_progress.md (with the statuses of all phase steps)

## After completion
- To proceed to the next step (enter the coding development phase), input /impm-coding
- To re-execute all steps of this phase, input /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->