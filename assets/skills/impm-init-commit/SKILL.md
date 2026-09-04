---
name: impm-init-commit
description: Confirms the git working directory status, commits all initialization phase content, records the progress, and reports to the user that the initialization phase is fully complete. Use when the last step of the initialization phase is executed.
---

# impm-init-commit Skill

## Trigger words
- initialization commit
- final commit
- commit the initialization content

## When to use
- When the commit step of the initialization phase (/impm-init-commit) is executed.
- When all the documents and files of the initialization phase have been generated and need to be committed uniformly and reported as complete.

## Executing role
This skill is executed by the Software Configuration Engineer (subagent_type=scm) subagent. When executing, load this skill using the Skill tool.

## Scheduling notes (must comply when PM/upper-level orchestrator starts this skill)
1. Startup method: start the subagent using the task tool, subagent_type must be `scm`; the PM or orchestrator is prohibited from executing this skill's content in place of it.
2. The prompt must pass the context (none may be missing): the absolute path of the project root directory (projectRoot), project English abbreviation ({project English abbreviation}), current version number ({current version number}), the original user input $ARGUMENTS (including file paths mentioned by the user), and the skill name (impm-init-commit, require the subagent to first load this skill using the Skill tool before executing).
3. Completion requirement: after waiting for the subagent to return the completion result, verify the produced files and the version_progress.md progress records; only proceed to the next step when all are correct.

## Key variable definitions and values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to concatenate all document paths | Read from docs/project.md via impm_project_info |
| Current version number | The version number being executed (fixed to 0.0.1 in the initialization phase) | Obtained via impm_version or inferred from the version directory name |

## Execution requirements
1. Execute strictly in the content and order of the execution steps: do not skip, do not reorder, do not run in parallel, do not merge any steps.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths must be concatenated with {project English abbreviation} and {current version number}; do not fabricate file names.
4. Use the impm_* tools to obtain information; do not fabricate tool return results.
5. Use English throughout.
6. After each step, verify that the produced files exist and the content is correct.

## Execution steps
### Step 1: confirm the working tree status
Call impm_git(projectRoot, status) to confirm the working tree status and check whether there is uncommitted initialization content; if the working tree has no changes, explain this to the user and end this skill.

### Step 2: commit the initialization content
Call impm_git(projectRoot, commit, null, {project English abbreviation}-v0.0.1-initialize impm project) to commit all initialization content, and verify the commit succeeded via impm_git(projectRoot, status) or log.

### Step 3: record progress
Call impm_progress(projectRoot, {project English abbreviation}, {current version number}, add, impm-init-commit, completed) to record the completion of this step.

### Step 4: report completion
Report to the user that the initialization phase is fully complete, including: the commit message, the list of documents produced in the initialization phase (project/urs/prd/sad/dbd/api/lld/testcase and the version directory), the location of the version progress table, and recommend proceeding to the subsequent phase next.

## Deliverables
- The git commit record (message: {project English abbreviation}-v0.0.1-initialize impm project)

## Completion tips
- The initialization phase is fully complete; there are no subsequent steps.
- To re-run the initialization phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->