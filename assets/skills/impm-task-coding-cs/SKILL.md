---
name: impm-task-coding-cs
description: Queries existing source code and reusable modules and writes the results to cs.md in the task directory to provide the code basis for the coding development phase.
---

# impm-task-coding-cs Skill

## Trigger Words
- Query existing code
- Code query
- cs

## When to Use
Use this skill during the coding development phase when existing source code, utility classes, and reusable modules related to the task need to be queried in the current project to provide a basis for coding.

## Executing Agent
This skill is executed by the CS subagent (subagent_type=cs). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `cs`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-task-coding-cs; require the subagent to load this skill with the Skill tool first before executing), and the task ID (taskId, extracted from $ARGUMENTS; when missing, use impm_task_manager to query the next executable task).
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

### Step 2: Read the task context
Call impm_doc_reader (docType=context, taskId={task ID}) to locate and read docs/{project abbreviation}-v{current version}/task_{task ID}/context.md.

### Step 3: Read the project map
Read the project map in docs/project.md to find existing source code files and utility classes that may be related to the current development task.

### Step 4: Query local code
Query the local codebase for content related to the current requirements (relevant functions, classes, configuration files, reusable components, etc.), and record the code locations and their purposes.

### Step 5: Write cs.md
After merging all collected information, call impm_doc_writer (docType=cs, taskId={task ID}) to write it to docs/{project abbreviation}-v{current version}/task_{task ID}/cs.md.

### Step 6: Record completion
Verify that cs.md has been generated with complete content, then call impm_progress (action=add, stepName=impm-task-coding-cs, status={task ID}-completed).

## Deliverables
- docs/{project abbreviation}-v{current version}/task_{task ID}/cs.md
- The progress records in version_progress.md

## Next Steps
- After this step is complete, the dispatcher (impm-task-coding / impm-coding) continues with the next step according to the process.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
