---
name: impm-urs-create
description: Generates the User Requirement Specification for the current version from the user input and the files mentioned in the input, following the URS template, and writes it to the version directory.
---

# impm-urs-create Skill

## Triggers
user requirement specification, URS, generate requirements, requirement collection, impm-urs-create

## When to use
Use when the version creation is complete (after impm-version-create). Based on the user's requirement input, generate the User Requirement Specification (URS) following the template format, write it to docs/{project abbreviation}-v{current version}/{project abbreviation}-urs-v{current version}.md, and record this step in the version progress file.

## Execution role
This skill is executed by the Business Analyst (subagent_type=ba) subagent, who loads this skill with the Skill tool.

## Dispatching instructions (the PM/orchestrator must comply when launching this skill)
1. Launch method: start the subagent with the task tool, subagent_type must be `ba`; the PM or orchestrator is prohibited from executing this skill's content on its behalf.
2. Mandatory context for the prompt (none may be omitted): absolute path of the project root (projectRoot), project abbreviation ({project abbreviation}), current version number ({current version}), original user input $ARGUMENTS (including the file paths mentioned by the user), skill name (impm-urs-create, require the subagent to load this skill with the Skill tool before executing).
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
Call impm_template_reader to read the template URS-TEMPLATE.MD to clarify the section structure and filling format of the User Requirement Specification.

### Step 2: Generate the User Requirement Specification
Based on the user's input and the files mentioned in the input, generate the User Requirement Specification following the template format. Template sections include: business goals, user roles, business scenarios, functional requirements (high level), non-functional requirements (high level), constraints, assumptions and dependencies. The content must accurately reflect the user's requests, with clear and acceptable language.
Requirement numbering rule: Functional Requirement (FR) and Non-functional Requirement (NFR) IDs are globally unique across the project, formatted as `prefix-v{current version}-sequence` (e.g. FR-v0.0.1-001, NFR-v0.0.1-001). Sequence numbers increment sequentially from 001 within this version; if a requirement is an existing requirement carried across versions, retain its historical ID, and only newly added or modified requirements are assigned new IDs for this version.

### Step 3: Write the version document
Call impm_doc_writer (docType=urs, target=version) to write the generated User Requirement Specification to docs/{project abbreviation}-v{current version}/{project abbreviation}-urs-v{current version}.md.

### Step 4: Record progress
Call impm_progress (action=add, stepName=impm-urs-create, status=completed) to insert a new row at the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md (the sequence number is automatically the current maximum sequence number + 1).
Verify the output file exists and its content is correct, and the progress row is recorded.

## Deliverables
- docs/{project abbreviation}-v{current version}/{project abbreviation}-urs-v{current version}.md (User Requirement Specification)

## After completion
- To proceed to the next step, input /impm-prd-create
- To proceed through all subsequent steps of this phase, input /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->