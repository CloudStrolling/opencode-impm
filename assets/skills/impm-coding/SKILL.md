---
name: impm-coding
description: Main workflow skill for the coding development phase (Phase 3); repeatedly dispatches impm-task-coding and impm-task-coding-gitcommit in upstream-to-downstream task order to complete all coding tasks of the current version.
---

# impm-coding Skill

## Trigger Words
- Start coding
- Enter the coding phase
- Coding development
- Phase 3

## When to Use
Use this skill when the impm waterfall development process has completed the design phase (Phase 2), the task list docs/{project abbreviation}-v{current version}/{project abbreviation}-task-v{current version}.json is ready, and you are entering the coding development phase (Phase 3) to implement all features task by task in upstream-to-downstream order.

## Executing Agent
This skill is executed by the pm subagent. Load this skill with the Skill tool when executing.

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
### Step 1: Record the start of the coding phase
Call impm_progress (action=add, projectName={project English name}, version={current version}, stepName=impm-coding, status=in progress) to record the start of the coding development phase in version_progress.md.

### Step 2: Read the task list
Call impm_task_manager (action=query, projectName={project English name}, version={current version}) to read all tasks whose status is not "completed" from docs/{project abbreviation}-v{current version}/{project abbreviation}-task-v{current version}.json, and confirm the number of remaining tasks and their upstream/downstream dependencies.

### Step 3: Loop and dispatch tasks
All tasks must be executed strictly in upstream-to-downstream order; repeat the following steps:
1. Call impm_task_manager (action=next, projectName={project English name}, version={current version}) to get the next executable task (not started and all of whose upstream tasks are completed), returning only one at a time; if no task is returned, jump to Step 5;
2. Start the impm-task-coding skill: the PM dispatches each subagent to complete all coding steps of that task (context → cs → ws → dbd → api → testcase → code → writetest → runtest);
3. After the task's coding and testing are all complete, start the SCM subagent to execute the impm-task-coding-gitcommit skill, commit all changes of the current task to git, and update the task status to "completed";
4. Strictly comply with: no parallel execution, no out-of-order execution, no merged execution.

### Step 4: Determine whether all tasks are complete
After the previous task has completed all coding steps and been committed, return to Step 3 to get the next task; repeat the loop until impm_task_manager (action=next) returns no more tasks, which means all tasks are complete.

### Step 5: Record the completion of the coding phase
Call impm_progress (action=add, projectName={project English name}, version={current version}, stepName=impm-coding, status=completed) to record the completion of the coding development phase in version_progress.md.

### Step 6: Report the coding phase results
Report the coding phase results to the user: current version, total number of tasks and number completed, a summary of each task's execution result, the git commit records ({project abbreviation}-v{current version}-{task ID}), and recommend entering the testing phase next.

## Deliverables
- Two progress records for impm-coding (in progress / completed) added to version_progress.md
- All tasks in docs/{project abbreviation}-v{current version}/{project abbreviation}-task-v{current version}.json with status "completed"
- All coding artifacts under each task directory docs/{project abbreviation}-v{current version}/task_{task ID}/
- Git commit records ({project abbreviation}-v{current version}-{task ID})

## Next Steps
- After this step is complete, the dispatcher (impm main workflow) continues with the next step (testing phase) according to the process.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
