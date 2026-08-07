---
name: impm-init-dbd
description: Determines whether the project needs a database; if so, reads the DBD-TEMPLATE.MD template to reverse-engineer the Database Design Document and initialization SQL, writes the version documents and copies them to the master documents docs/{project abbreviation}-dbd.md and docs/{project abbreviation}-dbd.sql. Use when the database needs to be designed during the initialization phase.
---

# impm-init-dbd Skill
## Trigger Words
- DBD
- Database design
- Table structure
- Initialization SQL

## When to Use
- When the database step of the initialization phase (/impm-init-dbd) is executed.
- When the Database Design Document (DBD) and initialization SQL need to be created or completed.

## Executing Agent
This skill is executed by the DBA subagent (subagent_type=dba). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `dba`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-init-dbd; require the subagent to load this skill with the Skill tool first before executing).
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
### Step 1: Determine whether a database is needed
Read docs/project.md and docs/sad.md via impm_doc_reader to determine whether the current project needs a database, and which database product (e.g., MySQL, PostgreSQL, etc.) and version:
- No database needed: call impm_progress(projectRoot, {project abbreviation}, {current version}, add, impm-init-dbd, no database needed) to record the progress and end this skill.
- Database needed: continue to step 2.

### Step 2: Read the template
Call impm_template_reader(projectRoot, DBD-TEMPLATE.MD) to read the Database Design Document template, and clarify the template chapters: ER diagram, table structure, index design, data dictionary, etc.

### Step 3: Reverse-engineer the database design
Read the existing documents via impm_doc_reader (focus on the PRD and SAD, and the data requirements in the PRD), and fill in the DBD in the template format combined with the current project code and documents, while reverse-engineering the project initialization SQL statements (database creation, table creation, initial data, etc.):
- Existing project: reverse-engineer the table structure and index design from the existing code, entity classes, and persistence-layer code.
- Empty project: write an empty MD and empty SQL (keeping the template structure).

### Step 4: Write the version documents and copy the master documents
Call impm_doc_writer(projectRoot, dbd, {project Chinese name}, {current version}, {task ID}, main, content): write the version document docs/{project abbreviation}-v0.0.1/{project abbreviation}-dbd-v0.0.1.md, and copy it to the master document docs/{project abbreviation}-dbd.md (create the master document if it does not exist); call impm_doc_writer(projectRoot, sql, {project Chinese name}, {current version}, {task ID}, main, content): write the version document docs/{project abbreviation}-v0.0.1/{project abbreviation}-dbd-v0.0.1.sql, and copy it to the master document docs/{project abbreviation}-dbd.sql (create the master document if it does not exist). Verify that all four files exist and their contents match.

### Step 5: Record progress
Call impm_progress(projectRoot, {project abbreviation}, {current version}, add, impm-init-dbd, completed) to record this step as complete.

## Deliverables
- docs/{project abbreviation}-v0.0.1/{project abbreviation}-dbd-v0.0.1.md
- docs/{project abbreviation}-dbd.md
- docs/{project abbreviation}-v0.0.1/{project abbreviation}-dbd-v0.0.1.sql
- docs/{project abbreviation}-dbd.sql

## Next Steps
- To continue with the next step, enter /impm-init-api
- To continue with all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
