---
name: impm-sad-update
description: Evaluates whether the system architecture design needs to be modified under the current version's requirements, creates a draft if it is empty, and updates docs/{project abbreviation}-sad.md when needed.
---

# impm-sad-update Skill

## Triggers
system architecture, architecture design, SAD, architecture update, impm-sad-update

## When to use
Use when the Product Requirement Document is complete (after impm-prd-create). Check whether the master architecture document docs/{project abbreviation}-sad.md is empty: if empty, create the initial draft of the system architecture design; if not empty, determine whether a modification is needed based on the current version's requirements (URS and PRD), directly update docs/{project abbreviation}-sad.md when needed, and record this step in the version progress file.

## Execution role
This skill is executed by the System Architect (subagent_type=sa) subagent, who loads this skill with the Skill tool.

## Dispatching instructions (the PM/orchestrator must comply when launching this skill)
1. Launch method: start the subagent with the task tool, subagent_type must be `sa`; the PM or orchestrator is prohibited from executing this skill's content on its behalf.
2. Mandatory context for the prompt (none may be omitted): absolute path of the project root (projectRoot), project abbreviation ({project abbreviation}), current version number ({current version}), original user input $ARGUMENTS (including the file paths mentioned by the user), skill name (impm-sad-update, require the subagent to load this skill with the Skill tool before executing).
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
Call impm_template_reader to read the template SAD-TEMPLATE.MD to clarify the section structure and filling format of the system architecture design document.

### Step 2: Check whether the master architecture document is empty
Call impm_doc_reader (docType=sad, target=main) to view the content of docs/{project abbreviation}-sad.md and determine whether it is an empty file.

### Step 3: Create the initial architecture design draft (only when the master document is empty)
If docs/{project abbreviation}-sad.md is an empty file: based on the current conversation content and the reference files involved in this conversation, apply the SAD template format to complete the initial draft of the system architecture design, then call impm_doc_writer (docType=sad, target=main) to overwrite-write docs/{project abbreviation}-sad.md. After completion, jump directly to step 6.

### Step 4: Determine whether a modification is needed (only when the master document is not empty)
If docs/{project abbreviation}-sad.md is not an empty file: call impm_doc_reader to read the current version's URS and PRD documents, and determine whether the system architecture design needs to be modified under the current version's requirements.

### Step 5: Record "no changes needed" and end
If it is determined that no modification is needed: call impm_progress (action=add, stepName=impm-sad-update, status=no changes needed) to insert a new row at the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md, then end this skill and do not execute the subsequent steps.

### Step 6: Modify the architecture document and record progress (only when a modification is needed)
If a modification is needed: directly modify docs/{project abbreviation}-sad.md (apply the SAD template sections as needed). After the modification is complete, call impm_progress (action=add, stepName=impm-sad-update, status=completed) to insert a new row at the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md.
Verify the output file exists and its content is correct, and the progress row is recorded.

## Deliverables
- docs/{project abbreviation}-sad.md (system architecture design document, initial draft created or updated as needed)

## After completion
- To proceed to the next step, input /impm-dbd-create
- To proceed through all subsequent steps of this phase, input /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->