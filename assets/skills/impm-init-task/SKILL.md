---
name: impm-init-task
description: Reads the TASK-TEMPLATE.json template, reverse-engineers the task list from the URS, PRD, SAD, LLD, and API documents, validates it via impm_task_manager, and writes it to docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-task-v0.0.1.json. Use when the task list needs to be generated during the initialization phase.
---

# impm-init-task Skill

## Trigger words
- task list
- task decomposition
- task.json
- task breakdown

## When to use
- When the task list step of the initialization phase (/impm-init-task) is executed.
- When the task list (task.json) needs to be created or completed.

## Executing role
This skill is executed by the Technical Lead (subagent_type=tl) subagent. When executing, load this skill using the Skill tool.

## Scheduling notes (must comply when PM/upper-level orchestrator starts this skill)
1. Startup method: start the subagent using the task tool, subagent_type must be `tl`; the PM or orchestrator is prohibited from executing this skill's content in place of it.
2. The prompt must pass the context (none may be missing): the absolute path of the project root directory (projectRoot), project English abbreviation ({project English abbreviation}), current version number ({current version number}), the original user input $ARGUMENTS (including file paths mentioned by the user), and the skill name (impm-init-task, require the subagent to first load this skill using the Skill tool before executing).
3. Completion requirement: after waiting for the subagent to return the completion result, verify the produced files and the version_progress.md progress records; only proceed to the next step when all are correct.

## Key variable definitions and values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to concatenate all document paths | Read from docs/project.md via impm_project_info |
| Current version number | The version number being executed (fixed to 0.0.1 in the initialization phase) | Obtained via impm_version or inferred from the version directory name |

## Execution requirements
1. Execute strictly in the content and order of the execution steps: do not skip, do not reorder, do not run in parallel, do not merge any steps.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths must be concatenated with {project English abbreviation} and {current version number}; do not fabricate file names.
4. Use the impm_* tools to obtain information; do not fabricate tool return results.
5. Use English throughout.
6. After each step, verify that the produced files exist and the content is correct.

## Execution steps
### Step 1: read the template
Call impm_template_reader(projectRoot, TASK-TEMPLATE.json) to read the task list template, and clarify the JSON structure and field definitions. Tasks include the fields: id, title, description, taskType, userStoryId (corresponding to the PRD user story number), apiId (corresponding to the API interface number; empty when the task does not involve interfaces), upstreamTaskIds, downstreamTaskIds, priority, status, testMethod, acceptanceCriteria.

### Step 2: collect the task basis
Read the existing documents via impm_doc_reader:
1. docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-prd-v0.0.1.md (or the master document docs/{project English abbreviation}-prd.md), extract the user story numbers (US-xxx; IDs are globally unique across the project, e.g. US-v0.0.1-001) and their story descriptions;
2. docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-lld-v0.0.1.md (or the master document docs/{project English abbreviation}-lld.md);
3. The System Architecture Design document docs/sad.md;
4. The API design document docs/{project English abbreviation}-api.md (read it when it exists, extract the interface numbers API-xxx and feature descriptions; skip it when it does not exist).
Combine the project code and documents to determine the task list; if the document content is incomplete, reasonably break down the tasks based on the existing content.

### Step 3: generate the task list
Based on the basis collected in step 2, generate the task list according to the TASK-TEMPLATE.json format, containing the fields: projectName, version, and the tasks array. Each task includes: id, title, description, taskType (backend|frontend|common), userStoryId, apiId, upstreamTaskIds, downstreamTaskIds, priority, status ("not started" | "in progress" | "completed"), testMethod, acceptanceCriteria.
Field mapping rules:
- userStoryId: fill in the PRD user story number that this task implements (e.g., US-v0.0.1-001; IDs are globally unique across the project and include the version number), obtained from the PRD read in step 2;
- apiId: fill in the API interface number that this task involves/implements (e.g., API-001), obtained from the API document read in step 2; when a task involves multiple interfaces, separate them with commas (e.g., API-001,API-002); leave an empty string when the task does not involve interfaces or the project has no API document.
Tasks must be ordered by upstream/downstream dependency: tasks being depended on come first, and tasks that depend on others come later, ensuring the coding phase can execute them serially in order.
- Existing project: reverse-engineer the task list from the existing features and code.
- Empty project: write according to the template structure, leaving the tasks array empty ([]).

### Step 4: validate and write the task list
Call impm_task_manager(projectRoot, {project Chinese name}, {current version number}, init, null, null, the task list JSON generated in step 3) to validate and write docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-task-v0.0.1.json. Verify that the file exists and the JSON format is correct.

### Step 5: record progress
Call impm_progress(projectRoot, {project English abbreviation}, {current version number}, add, impm-init-task, completed) to record the completion of this step.

## Deliverables
- docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-task-v0.0.1.json (the task list)

## Completion tips
- To continue to the next step, enter /impm-init-testcase
- To continue executing all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->