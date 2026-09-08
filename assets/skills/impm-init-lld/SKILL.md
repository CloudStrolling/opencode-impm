---
name: impm-init-lld
description: Reads the LLD-TEMPLATE.MD template, reverse-engineers the detailed design document of the overall business logic (module division, business processes, core business logic, etc., excluding interface detail design) from the project code, documents, PRD, and SAD, writes the version document and copies it to the master document docs/{project English abbreviation}-lld.md. Use when the detailed design needs to be written during the initialization phase.
---

# impm-init-lld Skill

## Trigger words
- LLD
- detailed design
- business logic design
- class diagram
- sequence diagram

## When to use
- When the detailed design step of the initialization phase (/impm-init-lld) is executed.
- When the detailed design document (LLD) needs to be created or completed.

## Executing role
This skill is executed by the Technical Lead (subagent_type=tl) subagent. When executing, load this skill using the Skill tool.

## Scheduling notes (must comply when PM/upper-level orchestrator starts this skill)
1. Startup method: start the subagent using the task tool, subagent_type must be `tl`; the PM or orchestrator is prohibited from executing this skill's content in place of it.
2. The prompt must pass the context (none may be missing): the absolute path of the project root directory (projectRoot), project English abbreviation ({project English abbreviation}), current version number ({current version number}), the original user input $ARGUMENTS (including file paths mentioned by the user), and the skill name (impm-init-lld, require the subagent to first load this skill using the Skill tool before executing).
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
Call impm_template_reader(projectRoot, LLD-TEMPLATE.MD) to read the detailed design document template, and clarify the template sections: module overview, module division and responsibilities, class diagram, core business process sequence diagrams, state diagram, core business logic, business rules and constraints, business data flow, exception handling strategy, unit testing strategy, etc. Note: LLD focuses on the overall business logic design; interface definitions, request/response parameters, and other interface details are handled by the API design document, and are not repeatedly written in LLD.

### Step 2: reverse-engineer the detailed design
Read the existing documents via impm_doc_reader (focus on the PRD, SAD; when necessary, refer to docs/{project English abbreviation}-api.md to understand the full picture of the interfaces), combine the current project code and documents, reverse-engineer the module division, business processes, core business logic, and business rules from the business logic perspective, and fill in the LLD according to the template format:
- Existing project: reverse-engineer the module division, class diagram, core business process sequence diagrams, and business rules from the existing code (classes, modules, call chains, business processing flows).
- Empty project: write an empty document according to the template structure, keeping the section titles and filling the content with "to be supplemented" or empty values.

### Step 3: write the version document
Call impm_doc_writer(projectRoot, lld, {project Chinese name}, {current version number}, {task number}, version, content): write the version document docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-lld-v0.0.1.md. Verify that the file exists and its content is correct.

### Step 4: record progress
Call impm_progress(projectRoot, {project English abbreviation}, {current version number}, add, impm-init-lld, completed) to record the completion of this step.

## Deliverables
- docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-lld-v0.0.1.md

## Completion tips
- To continue to the next step, enter /impm-init-task
- To continue executing all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->