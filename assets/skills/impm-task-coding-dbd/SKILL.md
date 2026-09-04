---
name: impm-task-coding-dbd
description: Determines whether the current task requires changes to the database design; if so, synchronously updates the version database design document and SQL scripts.
---

# impm-task-coding-dbd Skill

## Trigger Words
- Database design
- dbd
- Modify database

## When to Use
Use when impm-task-coding launches the DBA subagent to handle the database design, and the task context needs to be used to determine whether the database design requires changes and whether the document and scripts need to be synchronized.

## Execution Role
This skill is executed by the Database Architect (subagent_type=dba) subagent, loading this skill with the Skill tool for execution.

## Dispatch Notes (must be followed by the PM/upper-level orchestrator when launching this skill)
1. Launch method: launch the subagent with the task tool; subagent_type must be `dba`; neither the PM nor the orchestrator may execute this skill's content on its own.
2. The prompt must carry the required context (none may be missing): the absolute path of the project root (projectRoot), the project abbreviation ({Project Abbreviation}), the current version ({Current Version}), the verbatim user input $ARGUMENTS (including any file paths the user mentioned), the skill name (impm-task-coding-dbd, requiring the subagent to load this skill with the Skill tool before executing), and the task ID (taskId, extracted from $ARGUMENTS; when missing, use impm_task_manager to query the next executable task).
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

### Step 2: Check Whether the Project Needs a Database
Call impm_doc_reader (docType=dbd, target=main) to check whether docs/{Project Abbreviation}-dbd.md exists:
- If it does not exist, the current project needs no database; call impm_progress (action=add, stepName=impm-task-coding-dbd, status={Task ID}-no database needed), then end this step.

### Step 3: Read the Task Context
Call impm_doc_reader (docType=context, docType=cs, docType=ws, taskId={Task ID}) to read context.md, cs.md, and ws.md in the task directory.

### Step 4: Read the Database Design Documents
Call impm_doc_reader (docType=dbd, target=main) and (docType=dbd, target=version) to read the main database design document and the current version's database design document.

### Step 5: Determine Whether Changes Are Needed
Determine whether the database design requires changes based on the current task's context.md, cs.md, and ws.md:
- If no changes are needed, call impm_progress (action=add, stepName=impm-task-coding-dbd, status={Task ID}-no database design changes needed), then end this step.

### Step 6: Update the Database Design Document and Scripts
If changes are needed:
1. First call impm_doc_reader (docType=dbd, target=version) and (docType=sql, target=version) to read the **latest content** of the version database design document and SQL scripts (other parallel tasks may have already written to them; merging must be based on the latest content);
2. On the basis of the latest content, merge the tables, fields, indexes, etc. that this task needs to add/modify (append SQL by newly added objects, do not rewrite objects others have created);
3. Call impm_doc_writer (docType=dbd, target=version, expectedBase=<the latest full text of the dbd document read in step 1>) to write back the version database design document docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-dbd-v{Current Version}.md; if a concurrent conflict error is returned (the file has been modified by another task), go back to step 1 to re-read the latest content, merge, and write back;
4. Then call impm_doc_writer (docType=sql, target=version, expectedBase=<the latest full text of the SQL script read in step 1>) to write back the version database script docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-dbd-v{Current Version}.sql; if a concurrent conflict error is returned, go back to step 1 to re-read, merge, and write back;
5. After writing back, immediately re-read both files to verify that this task's content has been written and others' content is intact (version directory write conflict avoidance: when multiple tasks run in parallel, wholesale overwrites based on old snapshots are forbidden); verify that the two files are consistent and the scripts are executable.

### Step 7: Record Completion
Call impm_progress (action=add, stepName=impm-task-coding-dbd, status={Task ID}-database design updated).

## Deliverables
- docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-dbd-v{Current Version}.md (if changed)
- docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-dbd-v{Current Version}.sql (if changed)
- The progress record in version_progress.md

## After Completion
- After completing all operations of this skill, you must immediately end and return to the dispatcher: the list of output file paths and the progress status of this skill in version_progress.md; you must not continue to subsequent phases or tasks on your own, nor wait for further instructions; subsequent dispatch is the responsibility of the dispatcher (PM).
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->