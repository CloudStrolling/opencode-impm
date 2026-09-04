---
name: impm-task-create
description: Generates the task list JSON for the current version based on the SAD, the current version PRD, and the LLD, following the task template, validates it, and writes it.
---

# impm-task-create Skill

## Triggers
task list, task decomposition, task.json, task breakdown, impm-task-create

## When to use
Use when the detailed design is complete (after impm-lld-create). Based on the SAD, the current version PRD, and the current version LLD, complete the current version task list using the JSON format in the task template, write it to docs/{project abbreviation}-v{current version}/{project abbreviation}-task-v{current version}.json, and record this step in the version progress file.

## Execution role
This skill is executed by the Technical Lead (subagent_type=tl) subagent, who loads this skill with the Skill tool.

## Dispatching instructions (the PM/orchestrator must comply when launching this skill)
1. Launch method: start the subagent with the task tool, subagent_type must be `tl`; the PM or orchestrator is prohibited from executing this skill's content on its behalf.
2. Mandatory context for the prompt (none may be omitted): absolute path of the project root (projectRoot), project abbreviation ({project abbreviation}), current version number ({current version}), original user input $ARGUMENTS (including the file paths mentioned by the user), skill name (impm-task-create, require the subagent to load this skill with the Skill tool before executing).
3. Completion requirement: after waiting for the subagent to return the completion result, verify the output files and the version_progress.md progress records; proceed to the next step only when all are correct.

## Key variable definitions and values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to build all document paths | Read from docs/project.md via impm_project_info |
| Current Version | The version number currently being executed | Get via impm_version action=current, or infer from the version directory name |

## Execution requirements
1. Execute strictly in the content and order of the execution steps: do not skip, reorder, parallelize, or merge any step.
2. Only perform the operations specified by this skill; do not do work unrelated to the task.
3. All document paths must be built from {project abbreviation} and {current version}; do not invent file names.
4. Use impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. After each step completes, verify that the output file exists and its content is correct.

## Execution steps

### Step 1: Read the template
Call impm_template_reader to read the template TASK-TEMPLATE.json to clarify the JSON structure and field definitions of the task list. A task contains the fields: id, title, description, taskType, userStoryId (corresponding to the PRD user story number), apiId (corresponding to the API interface number, left empty when the task does not involve interfaces), upstreamTaskIds, downstreamTaskIds, priority, status, testMethod, acceptanceCriteria.

### Step 2: Collect task bases
Call impm_doc_reader to read:
1. The system architecture design document docs/{project abbreviation}-sad.md;
2. The current version PRD document docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md, and extract the user story numbers (US-xxx) and their story descriptions;
3. The current version LLD document docs/{project abbreviation}-v{current version}/{project abbreviation}-lld-v{current version}.md;
4. The current version API design document docs/{project abbreviation}-v{current version}/{project abbreviation}-api-v{current version}.md (call impm_doc_reader, docType=api, target=version), and extract the interface numbers (API-xxx) and interface function descriptions; if the project has no API document (the document does not exist), skip this item.

### Step 3: Generate the task list
Based on the SAD, the current version PRD, and the current version LLD, complete the current version task list using the JSON format in the template. The task list contains the fields: projectName, version, tasks array. Each task contains: id, title, description, taskType (backend|frontend|common), userStoryId, apiId, upstreamTaskIds, downstreamTaskIds, priority, status ("not started" | "in progress" | "completed"), testMethod, acceptanceCriteria.
Field mapping rules:
- userStoryId: fill in the number of the PRD user story implemented by this task (e.g., US-001), obtained from the PRD read in step 2;
- apiId: fill in the number of the API interface involved/implemented by this task (e.g., API-001), obtained from the API document read in step 2; when a task involves multiple interfaces, separate them with commas (e.g., API-001,API-002); leave the empty string when the task does not involve interfaces or the project has no API document.
Tasks must be ordered by upstream/downstream dependency: tasks being depended on come first, tasks that depend on others come after, ensuring the coding phase can execute serially in order.

### Step 4: Validate and write the task list
Call impm_task_manager (action=init, taskListJson=the list generated in step 3) to validate and write docs/{project abbreviation}-v{current version}/{project abbreviation}-task-v{current version}.json.

### Step 5: Record progress
Call impm_progress (action=add, stepName=impm-task-create, status=completed) to insert a new row at the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md.
Verify the output file exists, the JSON format is correct, and the progress row is recorded.

## Deliverables
- docs/{project abbreviation}-v{current version}/{project abbreviation}-task-v{current version}.json (task list)

## After completion
- To proceed to the next step, input /impm-rtm-create
- To proceed through all subsequent steps of this phase, input /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->