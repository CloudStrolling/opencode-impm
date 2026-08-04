---
name: impm-lld-create
description: Completes the Low-Level Design Document for the new requirements of the current version based on the SAD and the current version PRD, following the LLD template.
---

# impm-lld-create Skill

## Trigger Words
Detailed design, LLD, module design, class diagram, sequence diagram, impm-lld-create

## When to Use
Use after the API design has been completed (after impm-api-create). Based on the SAD (docs/{project abbreviation}-sad.md) and the current version PRD, referring to the existing detailed design docs/{project abbreviation}-lld.md (may be empty), complete the detailed design for the new requirements of the current version following the LLD template, write it to the version directory, and record this step in the version progress file.

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
Call impm_template_reader to read the template LLD-TEMPLATE.MD, and clarify the chapter structure and filling format of the Low-Level Design Document.

### Step 2: Collect the design basis
Call impm_doc_reader to read:
1. The System Architecture Design document docs/{project abbreviation}-sad.md;
2. The current version PRD document docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md;
3. The existing Low-Level Design Document docs/{project abbreviation}-lld.md (may be empty; used as a reference).

### Step 3: Complete the current version detailed design
Based on the SAD and the current version PRD, referring to the existing detailed design docs/{project abbreviation}-lld.md (may be empty), apply the LLD template format to complete the detailed design for the new requirements of the current version. Call impm_doc_writer (docType=lld, target=version) to write it to docs/{project abbreviation}-v{current version}/{project abbreviation}-lld-v{current version}.md.

### Step 4: Record progress
Call impm_progress (action=add, stepName=impm-lld-create, status=completed) to insert a new row in the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md.
Verify that the output file exists, its content is correct, and the progress row has been recorded.

## Deliverables
- docs/{project abbreviation}-v{current version}/{project abbreviation}-lld-v{current version}.md (Low-Level Design Document)

## Next Steps
- To continue with the next step, enter /impm-task-create
- To continue with all remaining steps of this phase, enter /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
