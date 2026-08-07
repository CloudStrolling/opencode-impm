---
name: impm-api-create
description: Determines whether the project needs API interfaces, and completes the new API Design Document for the current version following the API template.
---

# impm-api-create Skill

## Trigger Words
API design, API, API document, new API, impm-api-create

## When to Use
Use after the database design has been completed (after impm-dbd-create). Check whether the master API Design Document docs/{project abbreviation}-api.md exists: if it does not exist, the current project needs no API interfaces and this step is skipped; if it exists, complete the new API design for the current version following the API template based on the SAD and the current version PRD, and record this step in the version progress file.

## Executing Agent
This skill is executed by the TL subagent (subagent_type=tl). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `tl`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-api-create; require the subagent to load this skill with the Skill tool first before executing).
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
Call impm_template_reader to read the template API-TEMPLATE.MD, and clarify the chapter structure and filling format of the API Design Document.

### Step 2: Determine whether the project needs interfaces
Call impm_doc_reader (docType=api, target=main) to check whether docs/{project abbreviation}-api.md exists:
- If it does not exist: the current project needs no API interfaces. Call impm_progress (action=add, stepName=impm-api-create, status=no API needed) to insert a new row in the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md, then skip this step and end this skill.

### Step 3: Collect the design basis
Call impm_doc_reader to read:
1. The System Architecture Design document docs/{project abbreviation}-sad.md;
2. The current version PRD document docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md;
3. The existing API Design Document docs/{project abbreviation}-api.md (may be empty; used as a reference).

### Step 4: Complete the current version new API design
Based on the SAD and the current version PRD, referring to the existing API design docs/{project abbreviation}-api.md (may be empty), apply the API template format to complete the current version new API design. Call impm_doc_writer (docType=api, target=version) to write it to docs/{project abbreviation}-v{current version}/{project abbreviation}-api-v{current version}.md.

### Step 5: Record progress
Call impm_progress (action=add, stepName=impm-api-create, status=completed) to insert a new row in the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md.
Verify that the output file exists, its content is correct, and the progress row has been recorded.

## Deliverables
- docs/{project abbreviation}-v{current version}/{project abbreviation}-api-v{current version}.md (API Design Document)

## Next Steps
- To continue with the next step, enter /impm-lld-create
- To continue with all remaining steps of this phase, enter /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
