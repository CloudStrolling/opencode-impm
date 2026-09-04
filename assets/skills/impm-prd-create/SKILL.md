---
name: impm-prd-create
description: Generates the Product Requirement Document for the current version from the user input, the URS document, and existing materials, following the PRD template, and writes it to the version directory.
---

# impm-prd-create Skill

## Triggers
product requirement document, PRD, product requirements, feature list, impm-prd-create

## When to use
Use when the User Requirement Specification is complete (after impm-urs-create). Based on the user's input, the files mentioned in the input, and the URS document, generate the Product Requirement Document (PRD) following the template format, write it to docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md, and record this step in the version progress file.

## Execution role
This skill is executed by the Business Analyst (subagent_type=ba) subagent, who loads this skill with the Skill tool.

## Dispatching instructions (the PM/orchestrator must comply when launching this skill)
1. Launch method: start the subagent with the task tool, subagent_type must be `ba`; the PM or orchestrator is prohibited from executing this skill's content on its behalf.
2. Mandatory context for the prompt (none may be omitted): absolute path of the project root (projectRoot), project abbreviation ({project abbreviation}), current version number ({current version}), original user input $ARGUMENTS (including the file paths mentioned by the user), skill name (impm-prd-create, require the subagent to load this skill with the Skill tool before executing).
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
Call impm_template_reader to read the template PRD-TEMPLATE.MD to clarify the section structure and filling format of the Product Requirement Document.

### Step 2: Collect requirement bases
1. Call impm_doc_reader to read the master document docs/{project abbreviation}-urs.md (the consolidated URS document of the previous version);
2. Call impm_doc_reader to read the current version URS document docs/{project abbreviation}-v{current version}/{project abbreviation}-urs-v{current version}.md (read it if it exists);
3. Combine the user's input and the files mentioned in the input.

### Step 3: Generate the Product Requirement Document
Based on the requirement bases collected in step 2, generate the Product Requirement Document following the template format. Template sections include: product background, target users, feature list, detailed feature description, business flow diagrams, page prototypes, data requirements, acceptance criteria, version planning, appendices (glossary, reference documents). The feature descriptions must be specific, acceptable, and traceable, and remain consistent with the URS.

### Step 4: Write the version document
Call impm_doc_writer (docType=prd, target=version) to write the Product Requirement Document to docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md.

### Step 5: Record progress
Call impm_progress (action=add, stepName=impm-prd-create, status=completed) to insert a new row at the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md.
Verify the output file exists and its content is correct, and the progress row is recorded.

## Deliverables
- docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md (Product Requirement Document)

## After completion
- To proceed to the next step, input /impm-sad-update
- To proceed through all subsequent steps of this phase, input /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->