---
name: impm-task-create
description: Generates the task list JSON for the current version based on the SAD, the current version PRD, and the LLD, following the task template, validates it, and writes it.
---

# impm-task-create Skill

## Trigger Words
Task list, task decomposition, task.json, task splitting, impm-task-create

## When to Use
Use after the detailed design has been completed (after impm-lld-create). Based on the SAD, the current version PRD, and the current version LLD, complete the current version task list using the JSON format in the task template, write it to docs/{project abbreviation}-v{current version}/{project abbreviation}-task-v{current version}.json, and record this step in the version progress file.

## Executing Agent
This skill is executed by the TL subagent. Load this skill with the Skill tool when executing.

## Key Variables and How to Get Them
| Variable | Description | How to get it |
| Project Chinese name | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project English name | The English name of the project | Read from docs/project.md via impm_project_info |
| Project abbreviation | The project's English abbreviation, used to construct all document paths | Read from docs/project.md via impm_project_info |
| Current version | The version currently being executed | Get via impm_version action=current, or infer from the version directory name |

## Execution Requirements
1. Execute strictly in the order of the content in the execution steps: no skipping, no out-of-order execution, no parallel execution, no merged execution of any step.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths must be constructed with {project abbreviation} and {current version}; do not fabricate file names.
4. Use impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. After each step, verify that the output file exists and its content is correct.

## Execution Steps

### Step 1: Read the template
Call impm_template_reader to read the template TASK-TEMPLATE.json, and clarify the JSON structure and field definitions of the task list.

### Step 2: Collect the task basis
Call impm_doc_reader to read:
1. The System Architecture Design document docs/{project abbreviation}-sad.md;
2. The current version PRD document docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md;
3. The current version LLD document docs/{project abbreviation}-v{current version}/{project abbreviation}-lld-v{current version}.md.

### Step 3: Generate the task list
Based on the SAD, the current version PRD, and the current version LLD, complete the current version task list using the JSON format in the template. The task list contains the fields: projectName, version, tasks array. Each task contains: id, title, description, taskType (backend|frontend|common), userStoryId, upstreamTaskIds, downstreamTaskIds, priority, status (not started|in progress|completed), testMethod, acceptanceCriteria. Tasks must be sorted by upstream-downstream dependency: depended-on tasks come first, and tasks that depend on others come later, ensuring the coding phase can execute serially in order.

### Step 4: Validate and write the task list
Call impm_task_manager (action=init, taskListJson=the list generated in step 3) to validate and write docs/{project abbreviation}-v{current version}/{project abbreviation}-task-v{current version}.json.

### Step 5: Record progress
Call impm_progress (action=add, stepName=impm-task-create, status=completed) to insert a new row in the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md.
Verify that the output file exists, the JSON format is correct, and the progress row has been recorded.

## Deliverables
- docs/{project abbreviation}-v{current version}/{project abbreviation}-task-v{current version}.json (task list)

## Next Steps
- To continue with the next step, enter /impm-analysis-commit
- To continue with all remaining steps of this phase, enter /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
