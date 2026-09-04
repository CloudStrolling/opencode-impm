---
name: impm-lld-create
description: Completes the overall business logic detailed design document for the new requirements of the current version (module division, business processes, core business logic, etc., excluding interface detail design) based on the SAD and the current version PRD, following the LLD template.
---

# impm-lld-create Skill

## Triggers
detailed design, LLD, module design, business logic design, class diagram, sequence diagram, impm-lld-create

## When to use
Use when the API interface design is complete (after impm-api-create). Based on the SAD (docs/{project abbreviation}-sad.md) and the current version PRD, reference the existing detailed design docs/{project abbreviation}-lld.md (may be empty), complete the overall business logic detailed design for the new requirements of the current version following the LLD template, write it to the version directory, and record this step in the version progress file. Note: the LLD focuses on the overall business logic design (module division, business processes, core business logic, business rules, etc.); interface definitions and request/response parameters and other interface details are handled by the API design document and are not repeated in the LLD.

## Execution role
This skill is executed by the Technical Lead (subagent_type=tl) subagent, who loads this skill with the Skill tool.

## Dispatching instructions (the PM/orchestrator must comply when launching this skill)
1. Launch method: start the subagent with the task tool, subagent_type must be `tl`; the PM or orchestrator is prohibited from executing this skill's content on its behalf.
2. Mandatory context for the prompt (none may be omitted): absolute path of the project root (projectRoot), project abbreviation ({project abbreviation}), current version number ({current version}), original user input $ARGUMENTS (including the file paths mentioned by the user), skill name (impm-lld-create, require the subagent to load this skill with the Skill tool before executing).
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
Call impm_template_reader to read the template LLD-TEMPLATE.MD to clarify the section structure and filling format of the detailed design document (business logic design oriented, without interface details).

### Step 2: Collect design bases
Call impm_doc_reader to read:
1. The system architecture design document docs/{project abbreviation}-sad.md;
2. The current version PRD document docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md;
3. The existing detailed design document docs/{project abbreviation}-lld.md (may be empty, used as a reference).

### Step 3: Complete the current version detailed design
Based on the SAD and the current version PRD, reference the existing detailed design docs/{project abbreviation}-lld.md (may be empty), apply the LLD template format, and complete the detailed design of the new requirements of the current version from the business logic perspective (module division and responsibilities, class diagrams, sequence diagrams of core business processes, state diagrams, core business logic, business rules and constraints, business data flows, etc.; interface definitions and request/response parameters are not written into the LLD). Call impm_doc_writer (docType=lld, target=version) to write docs/{project abbreviation}-v{current version}/{project abbreviation}-lld-v{current version}.md.

### Step 4: Record progress
Call impm_progress (action=add, stepName=impm-lld-create, status=completed) to insert a new row at the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md.
Verify the output file exists and its content is correct, and the progress row is recorded.

## Deliverables
- docs/{project abbreviation}-v{current version}/{project abbreviation}-lld-v{current version}.md (detailed design document)

## After completion
- To proceed to the next step, input /impm-task-create
- To proceed through all subsequent steps of this phase, input /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->