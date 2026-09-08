---
name: impm-init-dbd
description: Determines whether the project needs a database; if so, reads the DBD-TEMPLATE.MD template to reverse-engineer the Database Design Document and initialization SQL, writes the version documents and copies them to the master documents docs/{project English abbreviation}-dbd.md and docs/{project English abbreviation}-dbd.sql. Use when the database needs to be designed during the initialization phase.
---

# impm-init-dbd Skill

## Trigger words
- DBD
- database design
- table structure
- initialization SQL

## When to use
- When the database step of the initialization phase (/impm-init-dbd) is executed.
- When the Database Design Document (DBD) and initialization SQL need to be created or completed.

## Executing role
This skill is executed by the Database Architect (subagent_type=dba) subagent. When executing, load this skill using the Skill tool.

## Scheduling notes (must comply when PM/upper-level orchestrator starts this skill)
1. Startup method: start the subagent using the task tool, subagent_type must be `dba`; the PM or orchestrator is prohibited from executing this skill's content in place of it.
2. The prompt must pass the context (none may be missing): the absolute path of the project root directory (projectRoot), project English abbreviation ({project English abbreviation}), current version number ({current version number}), the original user input $ARGUMENTS (including file paths mentioned by the user), and the skill name (impm-init-dbd, require the subagent to first load this skill using the Skill tool before executing).
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
### Step 1: determine whether a database is needed
Read docs/project.md and docs/sad.md via impm_doc_reader to determine whether the current project needs a database, and the specific database product (such as MySQL, PostgreSQL, etc.) and version:
- No database needed: call impm_progress(projectRoot, {project English abbreviation}, {current version number}, add, impm-init-dbd, no database needed) to record the progress and end this skill.
- Database needed: continue to step 2.

### Step 2: read the template
Call impm_template_reader(projectRoot, DBD-TEMPLATE.MD) to read the Database Design Document template, and clarify the template sections: ER diagram, physical model (grouped by subsystem/business module), index design, data dictionary, data initialization, etc.

### Step 3: reverse-engineer the database design
Read the existing documents via impm_doc_reader (focus on the PRD, SAD, and the data requirements in the PRD), combine the current project code and documents, and fill in the DBD according to the template format; also reverse-engineer the project initialization SQL statements (database creation, table creation, initial data, etc.):
- Existing project: reverse-engineer the table structure and index design from the existing code, entity classes, and persistence layer code, organize the physical model by subsystem/business module grouping, with table names following the `{subsystem_abbreviation}_{module_abbreviation}_{entity_name}` naming convention.
- Empty project: write an empty MD and empty SQL (keeping the template structure).
- Data initialization: identify preset data in the project (enumeration dictionaries, configuration items, initial business data), and write them into Chapter 11 of the DBD document and the SQL script synchronously.

### Step 4: write the version documents and copy the master documents
Call impm_doc_writer(projectRoot, dbd, {project Chinese name}, {current version number}, {task number}, main, content): write the version document docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-dbd-v0.0.1.md, and copy it to the master document docs/{project English abbreviation}-dbd.md (create it if the master document does not exist); call impm_doc_writer(projectRoot, sql, {project Chinese name}, {current version number}, {task number}, main, content): write the version document docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-dbd-v0.0.1.sql, and copy it to the master document docs/{project English abbreviation}-dbd.sql (create it if the master document does not exist). Verify that all four files exist and the content is consistent.

### Step 5: record progress
Call impm_progress(projectRoot, {project English abbreviation}, {current version number}, add, impm-init-dbd, completed) to record the completion of this step.

## Deliverables
- docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-dbd-v0.0.1.md
- docs/{project English abbreviation}-dbd.md
- docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-dbd-v0.0.1.sql
- docs/{project English abbreviation}-dbd.sql

## Completion tips
- To continue to the next step, enter /impm-init-api
- To continue executing all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->