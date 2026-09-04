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
Use during the coding development phase when existing source code, utility classes, and reusable modules relevant to the task in the current project need to be queried to provide a basis for coding.

## Execution Role
This skill is executed by the Local Code Query (subagent_type=cs) subagent, loading this skill with the Skill tool for execution.

## Dispatch Notes (must be followed by the PM/upper-level orchestrator when launching this skill)
1. Launch method: launch the subagent with the task tool; subagent_type must be `cs`; neither the PM nor the orchestrator may execute this skill's content on its own.
2. The prompt must carry the required context (none may be missing): the absolute path of the project root (projectRoot), the project abbreviation ({Project Abbreviation}), the current version ({Current Version}), the verbatim user input $ARGUMENTS (including any file paths the user mentioned), the skill name (impm-task-coding-cs, requiring the subagent to load this skill with the Skill tool before executing), and the task ID (taskId, extracted from $ARGUMENTS; when missing, use impm_task_manager to query the next executable task).
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

### Step 2: Read the Task Context
Call impm_doc_reader (docType=context, taskId={Task ID}) to locate and read docs/{Project Abbreviation}-v{Current Version}/task_{Task ID}/context.md.

### Step 3: Read the Project Map
Read the project map in docs/project.md to find existing source code files and utility classes that may be relevant to the current development task.

### Step 4: Query Local Code
Query the parts of the local code relevant to the current requirement (related functions, classes, configuration files, reusable components, etc.) and record the code locations and purposes.

### Step 5: Write cs.md
Merge all the collected related information, then call impm_doc_writer (docType=cs, taskId={Task ID}) to write it to docs/{Project Abbreviation}-v{Current Version}/task_{Task ID}/cs.md.

### Step 6: Record Completion
Verify that cs.md has been generated with complete content, and call impm_progress (action=add, stepName=impm-task-coding-cs, status={Task ID}-completed).

## Deliverables
- docs/{Project Abbreviation}-v{Current Version}/task_{Task ID}/cs.md
- The progress record in version_progress.md

## After Completion
- After completing all operations of this skill, you must immediately end and return to the dispatcher: the list of output file paths and the progress status of this skill in version_progress.md; you must not continue to subsequent phases or tasks on your own, nor wait for further instructions; subsequent dispatch is the responsibility of the dispatcher (PM).
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->