---
name: impm-init-project
description: Reads the PROJECT-TEMPLATE.MD template, and generates and writes the project master document docs/project.md (project basic information, coding standards, project map, etc.) based on the current project state. Use when the project master document needs to be written during the initialization phase.
---

# impm-init-project Skill
## Trigger Words
- project.md
- Project master document
- Project basic information
- Coding standards

## When to Use
- When the project document step of the initialization phase (/impm-init-project) is executed.
- When the project master document docs/project.md needs to be created or completed.

## Executing Agent
This skill is executed by the SA subagent (subagent_type=sa). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `sa`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-init-project; require the subagent to load this skill with the Skill tool first before executing).
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
Call impm_template_reader(projectRoot, PROJECT-TEMPLATE.MD) to read the project master document template, and clarify the chapter structure required by the template (project basic information, coding standards, project map, etc.).

### Step 2: Collect the project state
Read the existing documents under the docs directory via impm_doc_reader (docType=project|sad, etc., target=main), inspect the code structure of the project root directory (language, framework, directory organization), and determine what content can be filled in for each template chapter; record chapters with insufficient information as items to be confirmed.

### Step 3: Ask the user questions when necessary
If the project is a new project (no code or documents yet), or the existing documents and code are insufficient to cover the chapters of project.md, or there are other unclear situations, ask the user questions through the conversation before filling in. Questions should focus on information that is missing in the template and required, such as: project Chinese name/English name/abbreviation, programming language, project type, team role assignments, etc.

### Step 4: Generate and write docs/project.md
Apply the PROJECT-TEMPLATE.MD template format, and generate the project.md content (including project basic information, coding standards, project map, etc.) combined with the collected project state and user answers; call impm_doc_writer(projectRoot, project, {project Chinese name}, {current version}, {task ID}, main, content) to write docs/project.md. Verify that docs/project.md has been created and its content is complete.

### Step 5: Record progress
Call impm_progress(projectRoot, {project abbreviation}, {current version}, add, impm-init-project, completed) to record this step as complete; if version_progress.md does not yet exist (impm-init-version not yet executed), skip the progress record and let impm-init-version backfill it uniformly.

## Deliverables
- docs/project.md (project master document)

## Next Steps
- To continue with the next step, enter /impm-init-version
- To continue with all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
