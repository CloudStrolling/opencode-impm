---
name: impm-analysis-commit
description: Commits all files and directories generated in the requirements analysis phase to git, and reports that the phase is complete.
---

# impm-analysis-commit Skill

## Trigger Words
Commit, git commit, requirements analysis commit, analysis phase complete, impm-analysis-commit

## When to Use
Use after the task list has been generated (after impm-task-create); as the last step of the requirements analysis phase (phase 2): commit all files and directories generated in this phase to git, record the progress, and report to the user that the requirements analysis phase is fully complete.

## Executing Agent
This skill is executed by the SCM subagent. Load this skill with the Skill tool when executing.

## Key Variables and How to Get Them
| Variable | Description | How to get it |
| Project Chinese name | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project English name | The English name of the project | Read from docs/project.md via impm_project_info |
| Project abbreviation | The project's English abbreviation, used to construct all document paths | Read from docs/project.md via impm_project_info |
| Current version | The version currently being executed | Get via impm_version action=current, or infer from the version directory name |

## Execution Requirements
1. Execute strictly in the order of the content in the execution steps: no skipping, no out-of-order execution, no parallel execution, no merged execution of any step.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths must be constructed with {project abbreviation} and {current version}; do not fabricate file names.
4. Use impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. After each step, verify that the output file exists and its content is correct.

## Execution Steps

### Step 1: Confirm the working directory status
Call impm_git (action=status) to confirm the working directory status, check that the files and directories generated in the requirements analysis phase are all in place, and confirm the branch is {project abbreviation}-v{current version}.

### Step 2: Commit to git
Call impm_git (action=commit, message={project abbreviation}-v{current version}-Requirements analysis) to commit all files and directories generated in the requirements analysis phase to git. The commit includes: the documents, task list, and progress file generated under the version directory docs/{project abbreviation}-v{current version}/, as well as the master documents updated in this phase (e.g., the modification of docs/{project abbreviation}-sad.md). Confirm the commit succeeded.

### Step 3: Record progress
Call impm_progress (action=add, stepName=impm-analysis-commit, status=completed) to insert a new row in the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md, and confirm the progress row has been recorded.

### Step 4: Report to the user
Report to the user that the requirements analysis phase is fully complete, listing the committed version, the commit message, and the phase output summary.

## Deliverables
- Git commit record: {project abbreviation}-v{current version}-Requirements analysis
- Updated docs/{project abbreviation}-v{current version}/version_progress.md (including the status of all phase steps)

## Next Steps
- To continue with the next step (enter the coding development phase), enter /impm-coding
- To re-run all steps of this phase, enter /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
