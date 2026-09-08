---
name: impm-dbd-create
description: Determines whether the project needs a database, and completes the Database Design Document and SQL scripts for the current version following the DBD template.
---

# impm-dbd-create Skill

## Triggers
database design, DBD, database scripts, SQL, impm-dbd-create

## When to use
Use when the system architecture design update is complete (after impm-sad-update). Check whether the master database design document docs/{project abbreviation}-dbd.md exists: if it does not exist, the current project needs no database, skip this step; if it exists, determine whether there are substantial database changes based on the SAD and the current version PRD: if no changes, skip DBD generation; if changes exist, complete the Database Design Document and SQL scripts for the current version following the DBD template, and record this step in the version progress file.

## Execution role
This skill is executed by the Database Architect (subagent_type=dba) subagent, who loads this skill with the Skill tool.

## Dispatching instructions (the PM/orchestrator must comply when launching this skill)
1. Launch method: start the subagent with the task tool, subagent_type must be `dba`; the PM or orchestrator is prohibited from executing this skill's content on its behalf.
2. Mandatory context for the prompt (none may be omitted): absolute path of the project root (projectRoot), project abbreviation ({project abbreviation}), current version number ({current version}), original user input $ARGUMENTS (including the file paths mentioned by the user), skill name (impm-dbd-create, require the subagent to load this skill with the Skill tool before executing).
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
Call impm_template_reader to read the template DBD-TEMPLATE.MD to clarify the section structure and filling format of the database design document.

### Step 2: Determine whether the project needs a database
Call impm_doc_reader (docType=dbd, target=main) to check whether docs/{project abbreviation}-dbd.md exists:
- If it does not exist: the current project needs no database. Call impm_progress (action=add, stepName=impm-dbd-create, status=no database needed) to insert a new row at the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md, then skip this step and end this skill.

### Step 3: Collect design bases
Call impm_doc_reader to read:
1. The system architecture design document docs/{project abbreviation}-sad.md;
2. The current version PRD document docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md;
3. The existing database design document docs/{project abbreviation}-dbd.md (may be empty, used as a reference).

### Step 3.5: Determine whether the current version has substantial database changes
Based on the SAD and current version PRD read in step 3, determine whether the current version introduces **substantial database changes**, including but not limited to: new tables, modifications to existing table structures (adding/modifying/deleting columns), new indexes, data initialization requirements, etc.

- **No substantial changes needed** (e.g., the current version only involves frontend interaction adjustments, business logic optimization, pure API layer changes, etc. that do not involve database schema changes): call impm_progress (action=add, stepName=impm-dbd-create, status=no database changes needed, skip DBD generation) to record progress, then end this skill without generating DBD documents or SQL scripts.
- **Substantial changes needed**: continue to step 4.

### Step 4: Complete the current version database design
Based on the SAD and the current version PRD, reference the existing database design docs/{project abbreviation}-dbd.md (may be empty), and apply the DBD template format to complete the current version database design. The physical model should be organized by **subsystem → business module** grouping, with table names following the `{subsystem_abbreviation}_{module_abbreviation}_{entity_name}` naming convention. Call impm_doc_writer (docType=dbd, target=version) to write docs/{project abbreviation}-v{current version}/{project abbreviation}-dbd-v{current version}.md.

### Step 5: Complete the database scripts
Based on the database design in step 4, complete the corresponding database scripts (database creation, table creation, indexes, initialization data, etc.). SQL scripts should be organized by **subsystem → business module** grouping, with each statement annotated with its subsystem and module; the end should include data initialization statements (INSERT INTO) corresponding to the Chapter 11 data initialization content in the DBD document. Call impm_doc_writer (docType=sql, target=version) to write docs/{project abbreviation}-v{current version}/{project abbreviation}-dbd-v{current version}.sql.

### Step 6: Record progress
Call impm_progress (action=add, stepName=impm-dbd-create, status=completed) to insert a new row at the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md.
Verify the output files exist and their content is correct, and the progress row is recorded.

## Deliverables
- docs/{project abbreviation}-v{current version}/{project abbreviation}-dbd-v{current version}.md (Database Design Document, grouped by subsystem/business module)
- docs/{project abbreviation}-v{current version}/{project abbreviation}-dbd-v{current version}.sql (database scripts, including data initialization statements)

## After completion
- To proceed to the next step, input /impm-api-create
- To proceed through all subsequent steps of this phase, input /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->