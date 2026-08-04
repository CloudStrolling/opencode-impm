---
name: impm-dbd-create
description: Determines whether the project needs a database, and completes the Database Design Document and SQL scripts for the current version following the DBD template.
---

# impm-dbd-create Skill

## Trigger Words
Database design, DBD, database scripts, SQL, impm-dbd-create

## When to Use
Use after the System Architecture Design update has been completed (after impm-sad-update). Check whether the master Database Design Document docs/{project abbreviation}-dbd.md exists: if it does not exist, the current project needs no database and this step is skipped; if it exists, complete the Database Design Document and SQL scripts for the current version following the DBD template based on the SAD and the current version PRD, and record this step in the version progress file.

## Executing Agent
This skill is executed by the DBA subagent. Load this skill with the Skill tool when executing.

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
Call impm_template_reader to read the template DBD-TEMPLATE.MD, and clarify the chapter structure and filling format of the Database Design Document.

### Step 2: Determine whether the project needs a database
Call impm_doc_reader (docType=dbd, target=main) to check whether docs/{project abbreviation}-dbd.md exists:
- If it does not exist: the current project needs no database. Call impm_progress (action=add, stepName=impm-dbd-create, status=no database needed) to insert a new row in the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md, then skip this step and end this skill.

### Step 3: Collect the design basis
Call impm_doc_reader to read:
1. The System Architecture Design document docs/{project abbreviation}-sad.md;
2. The current version PRD document docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md;
3. The existing Database Design Document docs/{project abbreviation}-dbd.md (may be empty; used as a reference).

### Step 4: Complete the current version database design
Based on the SAD and the current version PRD, referring to the existing database design docs/{project abbreviation}-dbd.md (may be empty), apply the DBD template format to complete the current version database design. Call impm_doc_writer (docType=dbd, target=version) to write it to docs/{project abbreviation}-v{current version}/{project abbreviation}-dbd-v{current version}.md.

### Step 5: Complete the database scripts
Based on the database design from step 4, complete the corresponding database scripts (database creation, table creation, indexes, initial data, etc.). Call impm_doc_writer (docType=sql, target=version) to write them to docs/{project abbreviation}-v{current version}/{project abbreviation}-dbd-v{current version}.sql.

### Step 6: Record progress
Call impm_progress (action=add, stepName=impm-dbd-create, status=completed) to insert a new row in the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md.
Verify that the output files exist, their content is correct, and the progress row has been recorded.

## Deliverables
- docs/{project abbreviation}-v{current version}/{project abbreviation}-dbd-v{current version}.md (Database Design Document)
- docs/{project abbreviation}-v{current version}/{project abbreviation}-dbd-v{current version}.sql (database scripts)

## Next Steps
- To continue with the next step, enter /impm-api-create
- To continue with all remaining steps of this phase, enter /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
