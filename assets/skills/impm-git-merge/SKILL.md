---
name: impm-git-merge
description: Merges the current version branch into the main branch using git merge --squash and commits, completing the version management wrap-up for this version.
---

# impm-git-merge Skill

## Trigger Words
Merge main branch, git merge, version commit, branch merge, git-merge

## When to Use
Use this skill at the last step of Phase 4, after all regression tests and documentation are complete, when the current version branch needs to be merged into the main branch and committed.

## Executing Agent
This skill is executed by the SCM subagent (subagent_type=scm). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `scm`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-git-merge; require the subagent to load this skill with the Skill tool first before executing).
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
### Step 1: Get the current branch name
1. Call impm_git (action=current-branch) to get the current branch name.
2. Record the current branch name for the subsequent merge operation.

### Step 2: Switch to the main branch and pull the latest code
1. Confirm the main branch name of the repository (master or main) via impm_git (action=branch).
2. Call impm_git (action=checkout, branchName=main branch name) to switch to the main branch.
3. Pull the latest code of the main branch to ensure it is up to date.

### Step 3: Merge the current version branch into the main branch
1. Call impm_git (action=merge, branchName=current branch name) to execute git merge --squash of the current branch.
2. If there are conflicts, resolve them one by one and then stage; if there are no conflicts, stage the merge result directly.

### Step 4: Commit the merge result
1. Call impm_git (action=commit) to commit the merge result, with the message: {project abbreviation}-v{current version}-regression test and version documentation complete.
2. Verify that the commit succeeded.

### Step 5: Record progress
1. Call impm_progress add (impm-git-merge, completed) to record this skill's completion status in version_progress.md.
2. Verify that this step's status is recorded in version_progress.md.

### Step 6: Report completion
1. Report to the user: the current version branch has been merged into the main branch and committed, and the full development process of this version (requirement analysis, coding development, regression testing, version documentation) is fully complete.

## Deliverables
- The merge commit on the main branch (message: {project abbreviation}-v{current version}-regression test and version documentation complete)
- The progress records in version_progress.md

## Next Steps
- This skill is the last step of Phase 4; after execution, the development of this version is fully complete, and no other steps need to be executed.
- To re-run all steps of this phase, enter /impm-finish

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
