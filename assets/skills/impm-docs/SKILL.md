---
name: impm-docs
description: Orchestrates and executes all 9 steps of the requirements analysis phase (phase 2) (version creation, URS, PRD, SAD update, DBD, API, LLD, task list, git commit), ensuring each step executes strictly in sequence.
---

# impm-docs Skill

## Trigger Words
Requirements analysis, requirements analysis and organization, impm-docs, generate requirements documents, start analyzing requirements, execute phase 2, /impm-docs

## When to Use
Use when the user needs to execute the requirements analysis phase (phase 2). This skill is the phase orchestration skill, responsible for scheduling all 9 sub-skills of the phase in a fixed order: impm-version-create → impm-urs-create → impm-prd-create → impm-sad-update → impm-dbd-create → impm-api-create → impm-lld-create → impm-task-create → impm-analysis-commit. Each sub-skill is executed by the corresponding subagent.

## Executing Agent
This skill is executed by the PM (Project Manager) agent. Load this skill with the Skill tool when executing.

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

### Step 1: Determine the current version
Check whether this user input and the documents mentioned in it contain a version: if the current version is unknown before execution and the input does not mention one, first execute impm-version-create per step 2 to determine the version; if the version is already explicit, pass the relevant information to the subsequent steps.

### Step 2: Execute impm-version-create
Start the SCM subagent, and use the Skill tool to load and execute the impm-version-create skill:
1. Determine the current version (prefer the version in the user input; otherwise get the maximum version via impm_version action=current, then use action=next to increment the z value by 1);
2. Pull the latest code, create and switch to the branch {project abbreviation}-v{current version};
3. Call impm_version (action=init) to create the version directory docs/{project abbreviation}-v{current version};
4. Call impm_progress (action=init) to create version_progress.md and write the first row.
After execution, read docs/{project abbreviation}-v{current version}/version_progress.md and confirm the impm-version-create row status is "completed", then proceed to the next step.

### Step 3: Execute impm-urs-create
Start the BA subagent, and use the Skill tool to load and execute the impm-urs-create skill to generate the User Requirement Specification and write it to docs/{project abbreviation}-v{current version}/{project abbreviation}-urs-v{current version}.md.
After execution, verify that the file exists and version_progress.md records the impm-urs-create status as "completed", then proceed to the next step.

### Step 4: Execute impm-prd-create
Start the BA subagent, and use the Skill tool to load and execute the impm-prd-create skill to generate the Product Requirement Document and write it to docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md.
After execution, verify that the file exists and version_progress.md records the impm-prd-create status as "completed", then proceed to the next step.

### Step 5: Execute impm-sad-update
Start the SA subagent, and use the Skill tool to load and execute the impm-sad-update skill to evaluate and update the System Architecture Design document docs/{project abbreviation}-sad.md.
After execution, verify that version_progress.md records the impm-sad-update status as "completed" or "no modification needed", then proceed to the next step.

### Step 6: Execute impm-dbd-create
Start the DBA subagent, and use the Skill tool to load and execute the impm-dbd-create skill to generate the Database Design Document and SQL scripts.
After execution, verify that version_progress.md records the impm-dbd-create status as "completed" or "no database needed", then proceed to the next step.

### Step 7: Execute impm-api-create
Start the TL subagent, and use the Skill tool to load and execute the impm-api-create skill to generate the API Design Document.
After execution, verify that version_progress.md records the impm-api-create status as "completed" or "no API needed", then proceed to the next step.

### Step 8: Execute impm-lld-create
Start the TL subagent, and use the Skill tool to load and execute the impm-lld-create skill to generate the Low-Level Design Document and write it to docs/{project abbreviation}-v{current version}/{project abbreviation}-lld-v{current version}.md.
After execution, verify that the file exists and version_progress.md records the impm-lld-create status as "completed", then proceed to the next step.

### Step 9: Execute impm-task-create
Start the TL subagent, and use the Skill tool to load and execute the impm-task-create skill to generate the task list docs/{project abbreviation}-v{current version}/{project abbreviation}-task-v{current version}.json.
After execution, verify that the file exists and version_progress.md records the impm-task-create status as "completed", then proceed to the next step.

### Step 10: Execute impm-analysis-commit
Start the SCM subagent, and use the Skill tool to load and execute the impm-analysis-commit skill to commit all files and directories generated in the requirements analysis phase to git.
After execution, verify that version_progress.md records the impm-analysis-commit status as "completed".

### Step 11: Report to the user
Summarize the full list of output files of this phase, the completion status of each step, and explain the next-step suggestion to the user (enter the coding development phase by entering /impm-coding).

## Deliverables
- docs/{project abbreviation}-v{current version}/version_progress.md (version progress file, all 9 steps recorded)
- docs/{project abbreviation}-v{current version}/{project abbreviation}-urs-v{current version}.md
- docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md
- docs/{project abbreviation}-v{current version}/{project abbreviation}-dbd-v{current version}.md (if applicable)
- docs/{project abbreviation}-v{current version}/{project abbreviation}-dbd-v{current version}.sql (if applicable)
- docs/{project abbreviation}-v{current version}/{project abbreviation}-api-v{current version}.md (if applicable)
- docs/{project abbreviation}-v{current version}/{project abbreviation}-lld-v{current version}.md
- docs/{project abbreviation}-v{current version}/{project abbreviation}-task-v{current version}.json
- Updated docs/{project abbreviation}-sad.md (if judged to need modification)

## Next Steps
- To continue with the next step (enter the coding development phase), enter /impm-coding
- To re-run all steps of this phase, enter /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
