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
Use after all the coding steps and tests of a single task are fully completed and confirmed passing, when the task's changes need to be committed to git and the task status updated.

## Execution Role
This skill is executed by the Software Configuration Engineer (subagent_type=scm) subagent, loading this skill with the Skill tool for execution.

## Dispatch Notes (must be followed by the PM/upper-level orchestrator when launching this skill)
1. Launch method: launch the subagent with the task tool; subagent_type must be `scm`; neither the PM nor the orchestrator may execute this skill's content on its own.
2. The prompt must carry the required context (none may be missing): the absolute path of the project root (projectRoot), the project abbreviation ({Project Abbreviation}), the current version ({Current Version}), the verbatim user input $ARGUMENTS (including any file paths the user mentioned), the skill name (impm-task-coding-gitcommit, requiring the subagent to load this skill with the Skill tool before executing), and the task ID (taskId, extracted from $ARGUMENTS; when missing, pause and request it from the dispatcher; strictly forbidden to pick another task on your own).
3. Completion requirement: after the subagent returns its completion result, verify the output files and the version_progress.md progress records; only proceed to the next step when everything is correct.

## Key Variable Definitions and Values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to assemble all document paths | Read from docs/project.md via impm_project_info |
| Current Version | The version number currently being executed | Obtain via impm_version action=current, or infer from the version directory name |
| Task ID | The task ID currently being executed (e.g., TASK-001) | Passed by the dispatcher (PM/upper-level skill) |

## Execution Requirements
1. Strictly execute in the content and order of the execution steps: do not skip, reorder, parallelize, or merge any step.
2. Only perform the operations specified by this skill; do not do work unrelated to the task.
3. All document paths must be assembled with {Project Abbreviation}, {Current Version}, and {Task ID}; do not fabricate file names.
4. Use impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. After each step completes, verify that the output files exist and the content is correct.
7. This skill is part of the coding workflow; it can only be dispatched by impm-task-coding or impm-coding and cannot run independently without a version number and task ID.

## Execution Steps
### Step 1: Receive the Version and Task ID
Receive the current version and task ID ({Task ID}, e.g., TASK-001) passed by the dispatcher.

### Step 2: Commit the Current Task's Changes
Call impm_git (action=commit, message={Project Abbreviation}-v{Current Version}-{Task ID}) to commit all current changes to git, and verify that the commit succeeded and includes all changes of this task.
**Serial commit requirement (git commit conflict avoidance)**: this sub-step is dispatched serially by the dispatcher (impm-coding); at any moment only one scm is executing a commit; before committing, call impm_git (action=status) to verify that the working tree changes contain only files of this task and completed tasks; if in-progress files of other running tasks are found mixed in, pause the commit and report to the dispatcher for handling; after the commit succeeds, immediately return to the dispatcher and do not commit concurrently with other scm at the same time.

### Step 3: Update the Task Status
Call impm_task_manager (action=update, taskId={Task ID}, status=completed) to change the status of the current task in {Project Abbreviation}-task-v{Current Version}.json to completed.

### Step 4: Record Completion
Call impm_progress (action=add, stepName=impm-task-coding-gitcommit, status={Task ID}-completed).

### Step 5: Immediately Return to the Dispatcher
After the commit completes, compile the commit result (commit hash, included file list, task status update confirmation), **immediately end this session and return to the dispatcher (PM)**; strictly forbidden to continue executing other tasks, wait for or hand over subsequent tasks on your own; subsequent dispatch is the responsibility of the dispatcher (PM).

## Deliverables
- The git commit record ({Project Abbreviation}-v{Current Version}-{Task ID})
- Task status "completed" in docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-task-v{Current Version}.json
- The progress record in version_progress.md

## After Completion
- After completing all operations of this skill, you must immediately end and return to the dispatcher: the commit result and the progress status of this skill in version_progress.md; strictly forbidden to continue executing subsequent tasks, wait for or hand over subsequent tasks on your own; subsequent dispatch is the responsibility of the dispatcher (PM).
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->