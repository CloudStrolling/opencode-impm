---
name: impm-init-urs
description: Reads the URS-TEMPLATE.MD template, reverse-engineers the User Requirement Specification from the current project code and documents, writes the version document and copies it to the master document docs/{project abbreviation}-urs.md. Use when the user requirements document needs to be written during the initialization phase.
---

# impm-init-urs Skill
## Trigger Words
- URS
- User Requirement Specification
- Requirements document
- User requirements

## When to Use
- When the requirements step of the initialization phase (/impm-init-urs) is executed.
- When the User Requirement Specification (URS) needs to be created or completed.

## Executing Agent
This skill is executed by the BA subagent (subagent_type=ba). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `ba`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-init-urs; require the subagent to load this skill with the Skill tool first before executing).
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
Call impm_template_reader(projectRoot, URS-TEMPLATE.MD) to read the User Requirement Specification template, and clarify the template chapters: business goals, user roles, business scenarios, functional requirements, non-functional requirements, constraints, assumptions and dependencies.

### Step 2: Reverse-engineer the user requirements
Read the existing documents via impm_doc_reader (project, sad, etc.), and fill in the URS in the template format combined with the current project code and documents:
- Existing project: reverse-engineer each chapter from the existing code and documents (business goals, user roles, business scenarios, functional requirements, non-functional requirements, constraints, assumptions and dependencies).
- Empty project: write an empty document per the template structure, keeping the chapter titles and filling the content with "to be filled" or empty values.

### Step 3: Write the version document and copy the master document
Call impm_doc_writer(projectRoot, urs, {project Chinese name}, {current version}, {task ID}, main, content): write the version document docs/{project abbreviation}-v0.0.1/{project abbreviation}-urs-v0.0.1.md, and copy it to the master document docs/{project abbreviation}-urs.md (create the master document if it does not exist). Verify both files exist and their contents match.

### Step 4: Record progress
Call impm_progress(projectRoot, {project abbreviation}, {current version}, add, impm-init-urs, completed) to record this step as complete.

## Deliverables
- docs/{project abbreviation}-v0.0.1/{project abbreviation}-urs-v0.0.1.md
- docs/{project abbreviation}-urs.md

## Next Steps
- To continue with the next step, enter /impm-init-prd
- To continue with all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
