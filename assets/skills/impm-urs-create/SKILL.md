---
name: impm-urs-create
description: Generates the User Requirement Specification for the current version from the user input and the files mentioned in the input, following the URS template, and writes it to the version directory.
---

# impm-urs-create Skill

## Trigger Words
User Requirement Specification, URS, generate requirements, requirements collection, impm-urs-create

## When to Use
Use after the version has been created (after impm-version-create). Based on the user's requirement input, generate the User Requirement Specification (URS) in the template format, write it to docs/{project abbreviation}-v{current version}/{project abbreviation}-urs-v{current version}.md, and record this step in the version progress file.

## Executing Agent
This skill is executed by the BA subagent (subagent_type=ba). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `ba`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-urs-create; require the subagent to load this skill with the Skill tool first before executing).
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
Call impm_template_reader to read the template URS-TEMPLATE.MD, and clarify the chapter structure and filling format of the User Requirement Specification.

### Step 2: Generate the User Requirement Specification
Based on the user's input and the files mentioned in the user input, generate the User Requirement Specification in the template format. The template chapters include: business goals, user roles, business scenarios, functional requirements (high level), non-functional requirements (high level), constraints, assumptions and dependencies. The content must accurately reflect the user's needs, with clear and acceptable language.

### Step 3: Write the version document
Call impm_doc_writer (docType=urs, target=version) to write the generated User Requirement Specification to docs/{project abbreviation}-v{current version}/{project abbreviation}-urs-v{current version}.md.

### Step 4: Record progress
Call impm_progress (action=add, stepName=impm-urs-create, status=completed) to insert a new row in the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md (the sequence number is automatically the current maximum sequence number + 1).
Verify that the output file exists, its content is correct, and the progress row has been recorded.

## Deliverables
- docs/{project abbreviation}-v{current version}/{project abbreviation}-urs-v{current version}.md (User Requirement Specification)

## Next Steps
- To continue with the next step, enter /impm-prd-create
- To continue with all remaining steps of this phase, enter /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
