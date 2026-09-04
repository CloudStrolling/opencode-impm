---
name: impm-init-prd
description: Reads the PRD-TEMPLATE.MD template, reverse-engineers the Product Requirement Document from the project code, documents, and the URS, writes the version document and copies it to the master document docs/{project English abbreviation}-prd.md. Use when the Product Requirement Document needs to be written during the initialization phase.
---

# impm-init-prd Skill

## Trigger words
- PRD
- Product Requirement Document
- product requirements
- feature list

## When to use
- When the product requirements step of the initialization phase (/impm-init-prd) is executed.
- When the Product Requirement Document (PRD) needs to be created or completed.

## Executing role
This skill is executed by the Business Analyst (subagent_type=ba) subagent. When executing, load this skill using the Skill tool.

## Scheduling notes (must comply when PM/upper-level orchestrator starts this skill)
1. Startup method: start the subagent using the task tool, subagent_type must be `ba`; the PM or orchestrator is prohibited from executing this skill's content in place of it.
2. The prompt must pass the context (none may be missing): the absolute path of the project root directory (projectRoot), project English abbreviation ({project English abbreviation}), current version number ({current version number}), the original user input $ARGUMENTS (including file paths mentioned by the user), and the skill name (impm-init-prd, require the subagent to first load this skill using the Skill tool before executing).
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
Call impm_template_reader(projectRoot, PRD-TEMPLATE.MD) to read the Product Requirement Document template, and clarify the template sections: product background, target users, feature list, detailed feature descriptions, business flow diagrams, data requirements, acceptance criteria, etc.

### Step 2: reverse-engineer the product requirements
Read the existing documents via impm_doc_reader (focus on the URS: docs/{project English abbreviation}-urs.md or the in-version urs document, as well as project, sad, etc.), combine the current project code and documents, and fill in the PRD according to the template format:
- Existing project: reverse-engineer the content of each section from the project code, existing documents, and the URS.
- Empty project: write an empty document according to the template structure, keeping the section titles and filling the content with "to be supplemented" or empty values.

### Step 3: write the version document and copy the master document
Call impm_doc_writer(projectRoot, prd, {project Chinese name}, {current version number}, {task number}, main, content): write the version document docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-prd-v0.0.1.md, and copy it to the master document docs/{project English abbreviation}-prd.md (create it if the master document does not exist). Verify that both files exist and the content is consistent.

### Step 4: record progress
Call impm_progress(projectRoot, {project English abbreviation}, {current version number}, add, impm-init-prd, completed) to record the completion of this step.

## Deliverables
- docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-prd-v0.0.1.md
- docs/{project English abbreviation}-prd.md

## Completion tips
- To continue to the next step, enter /impm-init-sad
- To continue executing all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
