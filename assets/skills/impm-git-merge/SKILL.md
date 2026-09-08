---
name: impm-git-merge
description: Merges the current version branch into the main branch via git merge --squash and commits, completing the version management wrap-up of this version
---

# impm-git-merge Skill

## Trigger Words
merge main branch, git merge, version commit, branch merge, git-merge

## When to Use
Use at the last step of Phase 4, after all regression tests and documentation wrap-up are complete, when the current version branch needs to be merged into the main branch and committed.

## Execution Role
This skill is executed by the Software Configuration Engineer (subagent_type=scm) subagent. Use the Skill tool to load this skill when executing.

## Dispatch Notes (MUST be followed by the PM/upper-level orchestrator when starting this skill)
1. Startup method: start the subagent with the task tool; subagent_type MUST be `scm`; the PM or orchestrator is forbidden from performing this skill's content on their behalf.
2. The prompt MUST include the following context (none may be missing): project root absolute path (projectRoot), project English abbreviation ({Project Abbreviation}), current version number ({Current Version Number}), the original user input $ARGUMENTS (including the file paths mentioned by the user), the skill name (impm-git-merge, require the subagent to load this skill with the Skill tool first before executing).
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
### Step 0: Precondition check (regression test and code review)
1. Read the current version regression test report `docs/{project abbreviation}-v{current version}/regression.md`, and check whether all test results passed.
2. Read the current version code review report `docs/{project abbreviation}-v{current version}/review.md`, and check whether there are any unfixed severe/critical issues.
3. **If either condition is not met, stop executing immediately** and report to the user:
   - The specific failed test cases or failure reasons from the regression test
   - The list of unfixed severe/critical issues from the code review
   - Prompt the user to handle the above issues first, and manually perform the merge after confirming everything is correct
4. Only after both are passed may you continue with the subsequent steps.

### Step 1: Get the current branch name
1. Call impm_git (action=current-branch) to get the current branch name.
2. Record the current branch name for the subsequent merge operations.

### Step 2: Switch to the main branch and pull the latest code
1. Confirm the repository main branch name (master or main) via impm_git (action=branch).
2. Call impm_git (action=checkout, branchName=main branch name) to switch to the main branch.
3. Pull the latest code of the main branch to ensure the main branch is up to date.

### Step 3: Merge the current version branch into the main branch
1. Call impm_git (action=merge, branchName=current branch name) to execute git merge --squash of the current branch.
2. If there are conflicts, resolve them one by one and then stage; if there are no conflicts, stage the merge result directly.

### Step 4: Commit the merge result
1. Call impm_git (action=commit) to commit the merge result, with the message: {Project Abbreviation}-v{Current Version Number}-regression testing and version documentation complete.
2. Verify the commit succeeded.

### Step 5: Record progress
1. Call impm_progress add (impm-git-merge, completed) to record this skill's completion status in version_progress.md.
2. Verify that this step status has been recorded in version_progress.md.

### Step 6: Report completion
1. Report to the user: the current version branch has been merged into the main branch and committed; the full development process of this version (requirements analysis and documentation, coding development, regression testing, version documentation) is fully complete.

## Deliverables
- The merge commit on the main branch (message: {Project Abbreviation}-v{Current Version Number}-regression testing and version documentation complete)
- version_progress.md progress records

## Completion Hints
- This skill is the last step of Phase 4; after it is complete, the development of this version is fully complete, and no other steps need to be executed.
- To re-execute all steps of this phase, enter /impm-finish

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->