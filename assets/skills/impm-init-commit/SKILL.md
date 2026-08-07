---
name: impm-init-commit
description: Confirms the git working directory status, commits all initialization phase content, records the progress, and reports to the user that the initialization phase is fully complete. Use when the last step of the initialization phase is executed.
---

# impm-init-commit Skill
## Trigger Words
- Initialization commit
- Final commit
- Commit initialization content

## When to Use
- When the commit step of the initialization phase (/impm-init-commit) is executed.
- After all initialization phase documents and files have been generated, when they need to be committed uniformly and completion reported.

## Executing Agent
This skill is executed by the SCM subagent (subagent_type=scm). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `scm`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-init-commit; require the subagent to load this skill with the Skill tool first before executing).
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
### Step 1: Confirm the working directory status
Call impm_git(projectRoot, status) to confirm the working directory status and check for uncommitted initialization content; if the working directory has no changes, inform the user and end this skill.

### Step 2: Commit the initialization content
Call impm_git(projectRoot, commit, null, {project abbreviation}-v0.0.1-Initialize impm project) to commit all initialization content, and verify the commit succeeded via impm_git(projectRoot, status) or log.

### Step 3: Record progress
Call impm_progress(projectRoot, {project abbreviation}, {current version}, add, impm-init-commit, completed) to record this step as complete.

### Step 4: Report completion
Report to the user that the initialization phase is fully complete, including: the commit message, the list of documents produced in the initialization phase (project/urs/prd/sad/dbd/api/lld/testcase and the version directory), the location of the version progress file, and suggest entering the subsequent phase next.

## Deliverables
- Git commit record (message: {project abbreviation}-v0.0.1-Initialize impm project)

## Next Steps
- The initialization phase is fully complete; there are no subsequent steps.
- To re-run the initialization phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
