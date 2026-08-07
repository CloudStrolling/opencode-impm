---
name: impm-prd-create
description: Generates the Product Requirement Document for the current version from the user input, the URS document, and existing materials, following the PRD template, and writes it to the version directory.
---

# impm-prd-create Skill

## Trigger Words
Product Requirement Document, PRD, product requirements, feature list, impm-prd-create

## When to Use
Use after the User Requirement Specification has been generated (after impm-urs-create). Based on the user's input, the files mentioned in the input, and the URS document, generate the Product Requirement Document (PRD) in the template format, write it to docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md, and record this step in the version progress file.

## Executing Agent
This skill is executed by the BA subagent (subagent_type=ba). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `ba`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-prd-create; require the subagent to load this skill with the Skill tool first before executing).
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
Call impm_template_reader to read the template PRD-TEMPLATE.MD, and clarify the chapter structure and filling format of the Product Requirement Document.

### Step 2: Collect the requirement basis
1. Call impm_doc_reader to read the master document docs/{project abbreviation}-urs.md (the consolidated URS document of the previous version);
2. Call impm_doc_reader to read the current version URS document docs/{project abbreviation}-v{current version}/{project abbreviation}-urs-v{current version}.md (read it if it exists);
3. Combine the user's input and the files mentioned in the user input.

### Step 3: Generate the Product Requirement Document
Based on the requirement basis collected in step 2, generate the Product Requirement Document in the template format. The template chapters include: product background, target users, feature list, detailed feature description, business flow diagrams, page prototypes, data requirements, acceptance criteria, version planning, appendix (glossary, reference documents). The feature descriptions must be specific, acceptable, and traceable, and consistent with the URS.

### Step 4: Write the version document
Call impm_doc_writer (docType=prd, target=version) to write the Product Requirement Document to docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md.

### Step 5: Record progress
Call impm_progress (action=add, stepName=impm-prd-create, status=completed) to insert a new row in the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md.
Verify that the output file exists, its content is correct, and the progress row has been recorded.

## Deliverables
- docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md (Product Requirement Document)

## Next Steps
- To continue with the next step, enter /impm-sad-update
- To continue with all remaining steps of this phase, enter /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
