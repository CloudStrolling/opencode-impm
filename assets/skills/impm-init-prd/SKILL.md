---
name: impm-init-prd
description: Reads the PRD-TEMPLATE.MD template, reverse-engineers the Product Requirement Document from the project code, documents, and the URS, writes the version document and copies it to the master document docs/{project abbreviation}-prd.md. Use when the Product Requirement Document needs to be written during the initialization phase.
---

# impm-init-prd Skill
## Trigger Words
- PRD
- Product Requirement Document
- Product requirements
- Feature list

## When to Use
- When the product requirement step of the initialization phase (/impm-init-prd) is executed.
- When the Product Requirement Document (PRD) needs to be created or completed.

## Executing Agent
This skill is executed by the BA subagent (subagent_type=ba). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `ba`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-init-prd; require the subagent to load this skill with the Skill tool first before executing).
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
Call impm_template_reader(projectRoot, PRD-TEMPLATE.MD) to read the Product Requirement Document template, and clarify the template chapters: product background, target users, feature list, detailed feature description, business flow diagrams, data requirements, acceptance criteria, etc.

### Step 2: Reverse-engineer the product requirements
Read the existing documents via impm_doc_reader (focus on the URS: docs/{project abbreviation}-urs.md or the version-scoped urs document, as well as project, sad, etc.), and fill in the PRD in the template format combined with the current project code and documents:
- Existing project: reverse-engineer each chapter from the project code, existing documents, and the URS.
- Empty project: write an empty document per the template structure, keeping the chapter titles and filling the content with "to be filled" or empty values.

### Step 3: Write the version document and copy the master document
Call impm_doc_writer(projectRoot, prd, {project Chinese name}, {current version}, {task ID}, main, content): write the version document docs/{project abbreviation}-v0.0.1/{project abbreviation}-prd-v0.0.1.md, and copy it to the master document docs/{project abbreviation}-prd.md (create the master document if it does not exist). Verify both files exist and their contents match.

### Step 4: Record progress
Call impm_progress(projectRoot, {project abbreviation}, {current version}, add, impm-init-prd, completed) to record this step as complete.

## Deliverables
- docs/{project abbreviation}-v0.0.1/{project abbreviation}-prd-v0.0.1.md
- docs/{project abbreviation}-prd.md

## Next Steps
- To continue with the next step, enter /impm-init-sad
- To continue with all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
