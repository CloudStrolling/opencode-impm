---
name: impm-init-task
description: Reads the TASK-TEMPLATE.json template, reverse-engineers the task list from the URS, PRD, SAD, LLD, and API documents, and validates and writes it to docs/{project abbreviation}-v0.0.1/{project abbreviation}-task-v0.0.1.json via impm_task_manager. Use when the task list needs to be generated during the initialization phase.
---

# impm-init-task Skill

## Trigger Words
- Task list
- Task decomposition
- task.json
- Task splitting

## When to Use
- When executing the task list step of the initialization phase (/impm-init-task).
- When the task list (task.json) needs to be created or completed.

## Executing Agent
This skill is executed by the TL subagent (subagent_type=tl). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `tl`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-init-task; require the subagent to load this skill with the Skill tool first before executing).
3. Completion requirement: wait for the subagent to return the completion result, verify the output files and the version_progress.md progress records, and only proceed to the next step when everything is correct.

## Key Variables and How to Get Them
| Variable | Description | How to get it |
| Project Chinese name | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project English name | The English name of the project | Read from docs/project.md via impm_project_info |
| Project abbreviation | The project's English abbreviation, used to construct all document paths | Read from docs/project.md via impm_project_info |
| Current version | The version currently being executed (fixed at 0.0.1 during the initialization phase) | Get via impm_version, or infer from the version directory name |

## Execution Requirements
1. Execute strictly in the order of the content in the execution steps: no skipping, no out-of-order execution, no parallel execution, no merged execution of any step.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths must be constructed with {project abbreviation} and {current version}; do not fabricate file names.
4. Use impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. After each step, verify that the output file exists and its content is correct.

## Execution Steps

### Step 1: Read the template
Call impm_template_reader(projectRoot, TASK-TEMPLATE.json) to read the task list template and clarify the JSON structure and field definitions. The task fields include: id, title, description, taskType, userStoryId (corresponding to the PRD user story number), apiId (corresponding to the API interface number; leave empty when the task does not involve interfaces), upstreamTaskIds, downstreamTaskIds, priority, status, testMethod, acceptanceCriteria.

### Step 2: Collect the task basis
Read the existing documents via impm_doc_reader:
1. docs/{project abbreviation}-v0.0.1/{project abbreviation}-prd-v0.0.1.md (or the master document docs/{project abbreviation}-prd.md), extracting the user story numbers (US-xxx) and their story descriptions;
2. docs/{project abbreviation}-v0.0.1/{project abbreviation}-lld-v0.0.1.md (or the master document docs/{project abbreviation}-lld.md);
3. The System Architecture Design document docs/sad.md;
4. The API Design Document docs/{project abbreviation}-api.md (read it when it exists, extracting the interface numbers API-xxx and functional descriptions; skip when it does not exist).
Determine the task list based on the project code and documents; if the document content is incomplete, split the tasks reasonably based on the existing content.

### Step 3: Generate the task list
Based on the basis collected in step 2, generate the task list in the TASK-TEMPLATE.json format, containing the fields: projectName, version, and the tasks array. Each task contains: id, title, description, taskType (backend|frontend|common), userStoryId, apiId, upstreamTaskIds, downstreamTaskIds, priority, status (not started|in progress|completed), testMethod, acceptanceCriteria.
Field mapping rules:
- userStoryId: fill in the PRD user story number implemented by this task (e.g., US-001), obtained from the PRD read in step 2;
- apiId: fill in the API interface number involved/implemented by this task (e.g., API-001), obtained from the API document read in step 2; when a task involves multiple interfaces, separate them with commas (e.g., API-001,API-002); leave an empty string when the task does not involve interfaces or the project has no API document.
The tasks MUST be sorted by upstream-downstream dependency: dependent tasks first, dependents later, so that the coding phase can execute tasks serially in order.
- Existing project: reverse-engineer the task list based on the existing features and code.
- Empty project: write per the template structure, leaving the tasks array empty ([]).

### Step 4: Validate and write the task list
Call impm_task_manager(projectRoot, {project Chinese name}, {current version}, init, null, null, the task list JSON generated in step 3) to validate and write docs/{project abbreviation}-v0.0.1/{project abbreviation}-task-v0.0.1.json. Verify that the file exists and the JSON format is correct.

### Step 5: Record progress
Call impm_progress(projectRoot, {project abbreviation}, {current version}, add, impm-init-task, completed) to record this step as complete.

## Deliverables
- docs/{project abbreviation}-v0.0.1/{project abbreviation}-task-v0.0.1.json (task list)

## Next Steps
- To continue with the next step, enter /impm-init-testcase
- To continue with all subsequent steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
