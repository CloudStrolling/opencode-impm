---
name: impm-task-coding-ws
description: Queries the official documentation and usage of third-party packages, middleware, and SDKs and writes the results to ws.md in the task directory to provide the reference basis for the coding development phase.
---

# impm-task-coding-ws Skill

## Trigger Words
- Online materials
- Query materials
- Third-party packages
- ws

## When to Use
Use during the coding development phase when the official documentation, usage, and examples of the third-party middleware, packages, or SDKs used in the task need to be queried, or when online materials relevant to the task need to be queried.

## Execution Role
This skill is executed by the Web Query (subagent_type=ws) subagent, loading this skill with the Skill tool for execution.

## Dispatch Notes (must be followed by the PM/upper-level orchestrator when launching this skill)
1. Launch method: launch the subagent with the task tool; subagent_type must be `ws`; neither the PM nor the orchestrator may execute this skill's content on its own.
2. The prompt must carry the required context (none may be missing): the absolute path of the project root (projectRoot), the project abbreviation ({Project Abbreviation}), the current version ({Current Version}), the verbatim user input $ARGUMENTS (including any file paths the user mentioned), the skill name (impm-task-coding-ws, requiring the subagent to load this skill with the Skill tool before executing), and the task ID (taskId, extracted from $ARGUMENTS; when missing, use impm_task_manager to query the next executable task).
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

### Step 2: Read the Context and Code Query Results
Call impm_doc_reader (docType=context, docType=cs, taskId={Task ID}) to locate and read context.md and cs.md in the task directory.

### Step 3: Identify the Needed Third-party Components
Based on the content of the above files, determine which third-party middleware, packages, or SDKs the current task needs.

### Step 4: Query Official Documentation and Examples
Query the official documentation, usage, and examples of these packages online, including installation, core APIs, and common usage patterns.

### Step 5: Verify Version Compatibility
When querying and collecting, check whether the version used by the current project is compatible with the version of the queried materials; if there are version differences, record them and provide suggestions.

### Step 6: Query Task-related Materials
Also query and collect online materials relevant to the current task (e.g., algorithms, business solutions, troubleshooting experience).

### Step 7: Write ws.md
Analyze, merge, and summarize the queried content, then call impm_doc_writer (docType=ws, taskId={Task ID}) to write it to docs/{Project Abbreviation}-v{Current Version}/task_{Task ID}/ws.md.

### Step 8: Record Completion
Verify that ws.md has been generated with complete content, and call impm_progress (action=add, stepName=impm-task-coding-ws, status={Task ID}-completed).

## Deliverables
- docs/{Project Abbreviation}-v{Current Version}/task_{Task ID}/ws.md
- The progress record in version_progress.md

## After Completion
- After completing all operations of this skill, you must immediately end and return to the dispatcher: the list of output file paths and the progress status of this skill in version_progress.md; you must not continue to subsequent phases or tasks on your own, nor wait for further instructions; subsequent dispatch is the responsibility of the dispatcher (PM).
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->