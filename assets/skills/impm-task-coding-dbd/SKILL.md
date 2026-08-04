---
name: impm-task-coding-dbd
description: Determines whether the current task requires changes to the database design; if so, updates the version database design document and SQL scripts accordingly.
---

# impm-task-coding-dbd Skill

## Trigger Words
- Database design
- dbd
- Modify database

## When to Use
Use this skill when impm-task-coding starts the DBA subagent to handle the database design, and it needs to determine whether the database design requires changes based on the task context, and synchronize the documents and scripts accordingly.

## Executing Agent
This skill is executed by the dba subagent. Load this skill with the Skill tool when executing.

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

### Step 2: Check whether the project needs a database
Call impm_doc_reader (docType=dbd, target=main) to check whether docs/{project abbreviation}-dbd.md exists:
- If it does not exist, the current project needs no database; call impm_progress (action=add, stepName=impm-task-coding-dbd, status={task ID}-no database needed) and then end this step.

### Step 3: Read the task context
Call impm_doc_reader (docType=context, docType=cs, docType=ws, taskId={task ID}) to read context.md, cs.md, and ws.md in the task directory.

### Step 4: Read the database design documents
Call impm_doc_reader (docType=dbd, target=main) and (docType=dbd, target=version) to read the master database design document and the current version's database design document.

### Step 5: Determine whether changes are needed
Based on the current task's context.md, cs.md, and ws.md, determine whether the database design requires changes:
- If no changes are needed, call impm_progress (action=add, stepName=impm-task-coding-dbd, status={task ID}-database design needs no modification) and then end this step.

### Step 6: Update the database design document and scripts
If changes are needed:
1. First call impm_doc_writer (docType=dbd, target=version) to modify the version database design document docs/{project abbreviation}-v{current version}/{project abbreviation}-dbd-v{current version}.md;
2. Then call impm_doc_writer (docType=sql, target=version) to modify the version database script docs/{project abbreviation}-v{current version}/{project abbreviation}-dbd-v{current version}.sql accordingly;
3. Verify that the content of the two files is consistent and the script is executable.

### Step 7: Record completion
Call impm_progress (action=add, stepName=impm-task-coding-dbd, status={task ID}-database design updated).

## Deliverables
- docs/{project abbreviation}-v{current version}/{project abbreviation}-dbd-v{current version}.md (if changed)
- docs/{project abbreviation}-v{current version}/{project abbreviation}-dbd-v{current version}.sql (if changed)
- The progress records in version_progress.md

## Next Steps
- After this step is complete, the dispatcher (impm-task-coding / impm-coding) continues with the next step according to the process.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
