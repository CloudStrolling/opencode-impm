---
name: impm-sad-update
description: Evaluates whether the System Architecture Design needs to be modified under the current version's requirements, creates a draft if it is empty, and updates docs/{project abbreviation}-sad.md when needed.
---

# impm-sad-update Skill

## Trigger Words
System architecture, architecture design, SAD, architecture update, impm-sad-update

## When to Use
Use after the Product Requirement Document has been generated (after impm-prd-create). Check whether the master architecture document docs/{project abbreviation}-sad.md is empty: if empty, create the System Architecture Design draft; if not empty, judge whether modification is needed based on the current version's requirements (URS and PRD), update docs/{project abbreviation}-sad.md directly when needed, and record this step in the version progress file.

## Executing Agent
This skill is executed by the SA subagent (subagent_type=sa). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `sa`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-sad-update; require the subagent to load this skill with the Skill tool first before executing).
3. Completion requirement: wait for the subagent to return the completion result, verify the output files and the version_progress.md progress records, and only proceed to the next step when everything is correct.

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
Call impm_template_reader to read the template SAD-TEMPLATE.MD, and clarify the chapter structure and filling format of the System Architecture Design document.

### Step 2: Check whether the master architecture document is empty
Call impm_doc_reader (docType=sad, target=main) to view the content of docs/{project abbreviation}-sad.md and determine whether it is an empty file.

### Step 3: Create the architecture design draft (only when the master document is empty)
If docs/{project abbreviation}-sad.md is an empty file: based on the content of this conversation and the reference files involved in this conversation, apply the SAD template format to complete the System Architecture Design draft, then call impm_doc_writer (docType=sad, target=main) to overwrite docs/{project abbreviation}-sad.md. After completion, jump directly to step 6.

### Step 4: Judge whether modification is needed (only when the master document is non-empty)
If docs/{project abbreviation}-sad.md is not an empty file: call impm_doc_reader to read the current version's URS and PRD documents, and judge whether the System Architecture Design needs to be modified under the current version's requirements.

### Step 5: Record "no modification needed" and end
If judged that no modification is needed: call impm_progress (action=add, stepName=impm-sad-update, status=no modification needed) to insert a new row in the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md, then end this skill without executing subsequent steps.

### Step 6: Modify the architecture document and record progress (only when modification is needed)
If modification is needed: modify docs/{project abbreviation}-sad.md directly (applying the SAD template chapters as needed), and after completing the modification, call impm_progress (action=add, stepName=impm-sad-update, status=completed) to insert a new row in the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md.
Verify that the output file exists, its content is correct, and the progress row has been recorded.

## Deliverables
- docs/{project abbreviation}-sad.md (System Architecture Design document, draft created or updated as needed)

## Next Steps
- To continue with the next step, enter /impm-dbd-create
- To continue with all remaining steps of this phase, enter /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
