---
name: impm-task-coding-context
description: Collects the requirement context of the current task, merges it, and writes it to context.md in the task directory to provide the requirement basis for the coding development phase.
---

# impm-task-coding-context Skill

## Trigger Words
- Collect context
- Requirement context
- context

## When to Use
Use this skill when impm-task-coding starts the TL subagent to collect the requirement context of the current task, and the task content, PRD user stories, and SAD/project-related content need to be merged into a concise context.

## Executing Agent
This skill is executed by the tl subagent. Load this skill with the Skill tool when executing.

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

### Step 2: Read the task content
Call impm_task_manager (action=query, taskId={task ID}) to read the content of the corresponding task (task name, description, userStoryId, taskType, upstream/downstream dependencies, etc.) from docs/{project abbreviation}-v{current version}/{project abbreviation}-task-v{current version}.json.

### Step 3: Read the PRD user story
According to the userStoryId in the task content, call impm_doc_reader (docType=prd, target=version) to get the content of that user story in the current version's PRD.

### Step 4: Read related design documents
Read content related to the current task from files such as docs/{project abbreviation}-sad.md and docs/project.md (e.g., architecture design, technology selection, project map, related conventions).

### Step 5: Merge the context
Call impm_context_builder (projectName={project English name}, version={current version}, taskId={task ID}) to collect and merge all related requirement information and organize it into a concise context.

### Step 6: Write context.md
Call impm_doc_writer (docType=context, taskId={task ID}) to write the merged context to docs/{project abbreviation}-v{current version}/task_{task ID}/context.md; create the task directory automatically if it does not exist.

### Step 7: Record completion
Verify that docs/{project abbreviation}-v{current version}/task_{task ID}/context.md has been generated with complete content, then call impm_progress (action=add, stepName=impm-task-coding-context, status={task ID}-completed).

## Deliverables
- docs/{project abbreviation}-v{current version}/task_{task ID}/context.md
- The progress records in version_progress.md

## Next Steps
- After this step is complete, the dispatcher (impm-task-coding / impm-coding) continues with the next step according to the process.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
