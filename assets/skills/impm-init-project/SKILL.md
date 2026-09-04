---
name: impm-init-project
description: Reads the PROJECT-TEMPLATE.MD template, combines it with the current project state to generate and write the project master document docs/project.md (project basic information, coding standards, project map, etc.). Use when the project master document needs to be written during the initialization phase.
---

# impm-init-project Skill

## Trigger words
- project.md
- project master document
- project basic information
- coding standards

## When to use
- When the project document step of the initialization phase (/impm-init-project) is executed.
- When docs/project.md, the project master document, needs to be created or completed.

## Executing role
This skill is executed by the System Architect (subagent_type=sa) subagent. When executing, load this skill using the Skill tool.

## Scheduling notes (must comply when PM/upper-level orchestrator starts this skill)
1. Startup method: start the subagent using the task tool, subagent_type must be `sa`; the PM or orchestrator is prohibited from executing this skill's content in place of it.
2. The prompt must pass the context (none may be missing): the absolute path of the project root directory (projectRoot), project English abbreviation ({project English abbreviation}), current version number ({current version number}), the original user input $ARGUMENTS (including file paths mentioned by the user), and the skill name (impm-init-project, require the subagent to first load this skill using the Skill tool before executing).
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
Call impm_template_reader(projectRoot, PROJECT-TEMPLATE.MD) to read the project master document template, and clarify the section structure required by the template (project basic information, coding standards, project map, etc.).

### Step 2: collect the current project state
Read the existing documents under the docs directory via impm_doc_reader (docType=project|sad etc., target=main), check the code structure of the project root (language, framework, directory organization), and determine the content that can be filled in for each template section; sections with insufficient information are recorded as items to be confirmed.

### Step 3: ask the user when necessary
If the project is a new project (no code or documents yet), or the existing documents/code are not enough to cover the sections of project.md, or other unclear situations arise, ask the user questions through conversation before filling in. Questions should focus on the information missing from the template and required, for example: project Chinese name / English name / English abbreviation, programming language, project type, team role division, etc.

### Step 4: generate and write docs/project.md
Apply the PROJECT-TEMPLATE.MD template format, combine the collected current project state and the user's answers to generate the project.md content (including project basic information, coding standards, project map, etc.), and call impm_doc_writer(projectRoot, project, {project Chinese name}, {current version number}, {task number}, main, content) to write docs/project.md. Verify that docs/project.md has been created and the content is complete.

### Step 5: record progress
Call impm_progress(projectRoot, {project English abbreviation}, {current version number}, add, impm-init-project, completed) to record the completion of this step; if version_progress.md does not yet exist (impm-init-version has not been executed), skip the progress record, to be back-filled uniformly by impm-init-version.

## Deliverables
- docs/project.md (the project master document)

## Completion tips
- To continue to the next step, enter /impm-init-version
- To continue executing all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
