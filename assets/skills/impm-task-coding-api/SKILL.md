---
name: impm-task-coding-api
description: Determines whether the current task requires changes to the API design; if so, updates the current version's API design document.
---

# impm-task-coding-api Skill

## Trigger Words
- API design
- api
- Modify API

## When to Use
Use this skill before coding backend tasks in projects with separated frontend and backend, when it needs to determine whether the API design requires changes based on the task context, and synchronize the version API design document accordingly.

## Executing Agent
This skill is executed by the TL subagent (subagent_type=tl). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `tl`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-task-coding-api; require the subagent to load this skill with the Skill tool first before executing), and the task ID (taskId, extracted from $ARGUMENTS; when missing, use impm_task_manager to query the next executable task).
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

### Step 2: Check whether the project needs an API
Call impm_doc_reader (docType=api, target=main) to check whether docs/{project abbreviation}-api.md exists:
- If it does not exist, the current project needs no API; call impm_progress (action=add, stepName=impm-task-coding-api, status={task ID}-no API needed) and then end this step.

### Step 3: Read the task context
Call impm_doc_reader (docType=context, docType=cs, docType=ws, taskId={task ID}) to read context.md, cs.md, and ws.md in the task directory.

### Step 4: Read the API design documents
Call impm_doc_reader (docType=api, target=main) and (docType=api, target=version) to read the master API design document and the current version's API design document.

### Step 5: Determine whether changes are needed
Based on the current task's context.md, cs.md, and ws.md, determine whether the API design requires changes:
- If no changes are needed, call impm_progress (action=add, stepName=impm-task-coding-api, status={task ID}-API design needs no modification) and then end this step.

### Step 6: Update the API design document
If changes are needed: call impm_doc_writer (docType=api, target=version) to modify the current version's API design document docs/{project abbreviation}-v{current version}/{project abbreviation}-api-v{current version}.md, and verify that the API definitions are complete (path, method, request/response, error codes, etc.).

### Step 7: Record completion
Call impm_progress (action=add, stepName=impm-task-coding-api, status={task ID}-API design updated).

## Deliverables
- docs/{project abbreviation}-v{current version}/{project abbreviation}-api-v{current version}.md (if changed)
- The progress records in version_progress.md

## Next Steps
- After this step is complete, the dispatcher (impm-task-coding / impm-coding) continues with the next step according to the process.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
