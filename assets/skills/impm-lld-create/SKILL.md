---
name: impm-lld-create
description: Completes the detailed design document of the overall business logic for the new requirements of the current version (module division, business processes, core business logic, etc., excluding interface detail design) based on the SAD and the current version PRD, following the LLD template.
---

# impm-lld-create Skill

## Trigger Words
Detailed design, LLD, module design, business logic design, class diagram, sequence diagram, impm-lld-create

## When to Use
Use after the API design has been completed (after impm-api-create). Based on the SAD (docs/{project abbreviation}-sad.md) and the current version PRD, referring to the existing detailed design docs/{project abbreviation}-lld.md (may be empty), complete the detailed design of the overall business logic for the new requirements of the current version following the LLD template, write it to the version directory, and record this step in the version progress file. Note: the LLD focuses on the overall business logic design (module division, business processes, core business logic, business rules, etc.); interface definitions, request/response parameters, and other interface details are the responsibility of the API Design Document and are not repeated in the LLD.

## Executing Agent
This skill is executed by the TL subagent (subagent_type=tl). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `tl`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-lld-create; require the subagent to load this skill with the Skill tool first before executing).
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
Call impm_template_reader to read the template LLD-TEMPLATE.MD, and clarify the chapter structure and filling format of the detailed design document (business logic design oriented, without interface details).

### Step 2: Collect the design basis
Call impm_doc_reader to read:
1. The System Architecture Design document docs/{project abbreviation}-sad.md;
2. The current version PRD document docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md;
3. The existing Low-Level Design Document docs/{project abbreviation}-lld.md (may be empty; used as a reference).

### Step 3: Complete the current version detailed design
Based on the SAD and the current version PRD, referring to the existing detailed design docs/{project abbreviation}-lld.md (may be empty), apply the LLD template format to complete the detailed design for the new requirements of the current version from the business logic perspective (module division and responsibilities, class diagrams, core business process sequence diagrams, state diagrams, core business logic, business rules and constraints, business data flows, etc.; interface definitions and request/response parameters are not written into the LLD). Call impm_doc_writer (docType=lld, target=version) to write it to docs/{project abbreviation}-v{current version}/{project abbreviation}-lld-v{current version}.md.

### Step 4: Record progress
Call impm_progress (action=add, stepName=impm-lld-create, status=completed) to insert a new row in the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md.
Verify that the output file exists, its content is correct, and the progress row has been recorded.

## Deliverables
- docs/{project abbreviation}-v{current version}/{project abbreviation}-lld-v{current version}.md (detailed design document)

## Next Steps
- To continue with the next step, enter /impm-task-create
- To continue with all remaining steps of this phase, enter /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
