---
name: impm-task-coding-gitcommit
description: Commits all changes of the current task to git and updates the task status to completed.
---

# impm-task-coding-gitcommit Skill

## Trigger Words
- Commit code
- git commit
- commit

## When to Use
Use this skill when all coding steps and tests of a single task are complete and confirmed passing, and the task's changes need to be committed to git and the task status updated.

## Executing Agent
This skill is executed by the SCM subagent (subagent_type=scm). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `scm`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-task-coding-gitcommit; require the subagent to load this skill with the Skill tool first before executing), and the task ID (taskId, extracted from $ARGUMENTS; when missing, use impm_task_manager to query the next executable task).
3. Completion requirement: wait for the subagent to return the completion result, verify the output files and the version_progress.md progress records, and only proceed to the next step when everything is correct.

## Key Variables and How to Get Them
| Variable | Description | How to Get |
| Chinese project name | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| English project name | The English name of the project | Read from docs/project.md via impm_project_info |
| Project abbreviation | The English abbreviation of the project, used to build all document paths | Read from docs/project.md via impm_project_info |
| Current version | The version number currently being executed | Get via impm_version action=current, or infer from the version directory name |
| Task ID | The ID of the task currently being executed (e.g., TASK-001) | Passed in by the dispatcher (PM/upper-level skill) |

## Execution Requirements
1. Follow the steps strictly in the order given in the Execution Steps: no skipping, no out-of-order execution, no parallel execution, no merged execution of any step.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths must be built from {project abbreviation}, {current version}, and {task ID}; never invent file names.
4. Use impm_* tools to obtain information; never fabricate tool results.
5. Use English throughout.
6. After each step, verify that the produced files exist and their content is correct.
7. This skill is part of the coding workflow and can only be dispatched by impm-task-coding or impm-coding; it cannot run standalone without a version number and a task ID.

## Execution Steps
### Step 1: Receive the version number and task ID
Receive the current version number and task ID ({task ID}, e.g., TASK-001) passed in by the dispatcher.

### Step 2: Commit the current task's changes
Call impm_git (action=commit, message={project abbreviation}-v{current version}-{task ID}) to commit all current changes to git, and verify that the commit succeeded and includes all changes of this task.

### Step 3: Update the task status
Call impm_task_manager (action=update, taskId={task ID}, status=completed) to update the current task's status to completed in {project abbreviation}-task-v{current version}.json.

### Step 4: Record completion
Call impm_progress (action=add, stepName=impm-task-coding-gitcommit, status={task ID}-completed).

### Step 5: Return to the dispatcher and continue
After the commit is complete, return to the impm-coding step, get and execute the next task, until all tasks are complete.

## Deliverables
- The git commit record ({project abbreviation}-v{current version}-{task ID})
- The task status is "completed" in docs/{project abbreviation}-v{current version}/{project abbreviation}-task-v{current version}.json
- The progress records in version_progress.md

## Next Steps
- After this step is complete, the dispatcher (impm-task-coding / impm-coding) continues with the next step according to the process.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
