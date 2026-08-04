---
name: impm-init-sad
description: Reads the SAD-TEMPLATE.MD template, reverse-engineers the System Architecture Design document from the project code, documents, and the PRD, and writes it to docs/sad.md. Use when the System Architecture Design document needs to be written during the initialization phase.
---

# impm-init-sad Skill
## Trigger Words
- SAD
- System Architecture Design
- Architecture document
- sad.md

## When to Use
- When the architecture step of the initialization phase (/impm-init-sad) is executed.
- When the System Architecture Design document (SAD) needs to be created or completed.

## Executing Agent
This skill is executed by the SA subagent. Load this skill with the Skill tool when executing.

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
Call impm_template_reader(projectRoot, SAD-TEMPLATE.MD) to read the System Architecture Design document template, and clarify the template chapters: design goals and constraints, technology stack selection, system context diagram, container diagram, component diagram, deployment architecture, security architecture, performance architecture, data flow diagram, architecture decision records.

### Step 2: Reverse-engineer the architecture design
Read the existing documents via impm_doc_reader (focus on the PRD: docs/{project abbreviation}-prd.md, as well as project, etc.), and fill in the SAD in the template format combined with the current project code and documents:
- Existing project: reverse-engineer each architecture chapter from the existing code, technology stack, and documents.
- Empty project: write an empty document per the template structure, keeping the chapter titles and filling the content with "to be filled" or empty values.

### Step 3: Write docs/sad.md
Call impm_doc_writer(projectRoot, sad, {project Chinese name}, {current version}, {task ID}, main, content) to write the master document docs/sad.md (sad has only a master document, no version-scoped document; create the master document if it does not exist). Verify that docs/sad.md has been created and its content is complete.

### Step 4: Record progress
Call impm_progress(projectRoot, {project abbreviation}, {current version}, add, impm-init-sad, completed) to record this step as complete.

## Deliverables
- docs/sad.md

## Next Steps
- To continue with the next step, enter /impm-init-dbd
- To continue with all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
