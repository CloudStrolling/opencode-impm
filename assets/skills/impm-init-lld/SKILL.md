---
name: impm-init-lld
description: Reads the LLD-TEMPLATE.MD template, reverse-engineers the detailed design document of the overall business logic (module division, business processes, core business logic, etc., excluding interface detail design) from the project code, documents, PRD, and SAD, writes the version document and copies it to the master document docs/{project abbreviation}-lld.md. Use when the detailed design needs to be written during the initialization phase.
---

# impm-init-lld Skill
## Trigger Words
- LLD
- Detailed design
- Business logic design
- Class diagram
- Sequence diagram

## When to Use
- When the detailed design step of the initialization phase (/impm-init-lld) is executed.
- When the Low-Level Design Document (LLD) needs to be created or completed.

## Executing Agent
This skill is executed by the TL subagent (subagent_type=tl). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `tl`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-init-lld; require the subagent to load this skill with the Skill tool first before executing).
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
Call impm_template_reader(projectRoot, LLD-TEMPLATE.MD) to read the detailed design document template, and clarify the template chapters: module overview, module division and responsibilities, class diagrams, core business process sequence diagrams, state diagrams, core business logic, business rules and constraints, business data flows, exception handling strategy, unit test strategy, etc. Note: the LLD focuses on the overall business logic design; interface definitions, request/response parameters, and other interface details are the responsibility of the API Design Document and are not repeated in the LLD.

### Step 2: Reverse-engineer the detailed design
Read the existing documents via impm_doc_reader (focus on the PRD and SAD, and refer to docs/{project abbreviation}-api.md when necessary to understand the overall interface picture), and reverse-engineer the module division, business processes, core business logic, and business rules from the business logic perspective combined with the current project code and documents, filling in the LLD in the template format:
- Existing project: reverse-engineer the module division, class diagrams, core business process sequence diagrams, and business rules from the existing code (classes, modules, call chains, business processing flows).
- Empty project: write an empty document per the template structure, keeping the chapter titles and filling the content with "to be filled" or empty values.

### Step 3: Write the version document and copy the master document
Call impm_doc_writer(projectRoot, lld, {project Chinese name}, {current version}, {task ID}, main, content): write the version document docs/{project abbreviation}-v0.0.1/{project abbreviation}-lld-v0.0.1.md, and copy it to the master document docs/{project abbreviation}-lld.md (create the master document if it does not exist). Verify both files exist and their contents match.

### Step 4: Record progress
Call impm_progress(projectRoot, {project abbreviation}, {current version}, add, impm-init-lld, completed) to record this step as complete.

## Deliverables
- docs/{project abbreviation}-v0.0.1/{project abbreviation}-lld-v0.0.1.md
- docs/{project abbreviation}-lld.md

## Next Steps
- To continue with the next step, enter /impm-init-task
- To continue with all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
