---
name: impm-doc-merge
description: Restructure-merges the current version's URS, PRD, API, DBD, DBD SQL, and LLD documents into the project master documents (URS/PRD summarized merge, API/DBD/SQL/LLD restructure-merged by project structure and system architecture), and merges the OpenAPI 3.0 JSON and Swagger UI HTML.
---

# impm-doc-merge Skill

## Trigger Words
document merge, merge master documents, doc-merge, version document merge

## When to Use
Use in Phase 4, after the project map update is complete, when the current version's design documents need to be merged into the corresponding master documents under docs.

## Execution Role
This skill is executed by the Document Writer (subagent_type=dw) subagent. Use the Skill tool to load this skill when executing.

## Dispatch Notes (MUST be followed by the PM/upper-level orchestrator when starting this skill)
1. Startup method: start the subagent with the task tool; subagent_type MUST be `dw`; the PM or orchestrator is forbidden from performing this skill's content on their behalf.
2. The prompt MUST include the following context (none may be missing): project root absolute path (projectRoot), project English abbreviation ({Project Abbreviation}), current version number ({Current Version Number}), the original user input $ARGUMENTS (including the file paths mentioned by the user), the skill name (impm-doc-merge, require the subagent to load this skill with the Skill tool first before executing).
3. Completion requirement: after the subagent returns the completion result, verify the produced files and the version_progress.md progress records; only proceed to the next step when all are correct.

## Key Variable Definitions and Values
| Variable | Description | How to Obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to concatenate all document paths | Read from docs/project.md via impm_project_info |
| Current Version Number | The version number currently being executed | Get via impm_version action=current, or infer from the version directory name |

## Execution Requirements
1. Strictly execute in the content and order of the execution steps: no skipping, no reordering, no parallel execution, no merging of any step.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths MUST be concatenated with {Project Abbreviation} and {Current Version Number}; do not fabricate file names.
4. Use impm_* tools to obtain information; do not fabricate tool return results.
5. Use English throughout.
6. After each step completes, verify that the produced files exist and the content is correct.

## Execution Steps

### Overall Merge Principle (Restructure Merge)
This skill performs a "restructure merge" rather than simple appending: the master documents organize sections by **project organization → code structure → system architecture**, and the current version content is merged into the existing structure, instead of appending a large "this version content" block at the end of the document.

1. **Load the structural baseline**: first use impm_doc_reader to read docs/project.md (project map, directory organization) and docs/{Project Abbreviation}-sad.md (system architecture: module division, layering, deployment form), as the basis for organizing the master document sections; when both are missing, use the LLD's module division as the baseline.
2. **Structure-oriented, in-place updates**: existing sections/entries with the same name are updated in place and never duplicated; newly emerged modules/tables/interface groups are inserted at positions consistent with the architecture, adjusting the master document section order as the architecture evolves (restructures), always staying consistent with the current system structure.
3. **Incremental merge, version traceability**: long-lived entries (interfaces, tables, modules, requirement numbers) are annotated with "source version / most recently modified version"; changed, renamed, and retired entries leave a trace in a unified "change record" table within the document, ensuring traceability.
4. **Document-header version evolution table**: each master document maintains a version evolution table at the top (version number / date / change summary / related full document path), and this merge appends a row for the current version.
5. **Never overwrite history**: only update/add/retire the content involved in the current version; all other historical content in the master documents remains unchanged.
6. **Division between master and full documents**: the URS and PRD master documents carry only **summaries**, and the body is **not sectioned by version number**, but reorganized and logically ordered by "project → module → business logic" (version information is carried by the source-version column / version evolution table); the full statements remain in the version directory documents. The API, DBD, and LLD master documents carry **full designs** (because this content treats the current system structure as authoritative and does not pile up by version), and again are **not sectioned by version number**, but reorder-merged by subsystem → business module → business logic.

### Step 0: Preparation
1. Read docs/project.md and docs/{Project Abbreviation}-sad.md to determine the module division and the structural baseline.
2. Summarize the list of files to merge, and confirm one by one whether the master document exists (create it in a later step if it does not).

### Step 1: Merge the URS document (summarized + reorganized by business logic)
1. Use impm_doc_reader (docType=urs, target=main) to read the master document docs/{Project Abbreviation}-urs.md; if it does not exist, create it per the summary template.
2. Extract the summary from the version document docs/{Project Abbreviation}-v{Current Version Number}/{Project Abbreviation}-urs-v{Current Version Number}.md: the number/name/one-line description/priority/business ownership (belonging module or business scenario) of each functional requirement (FR-v{version}-xxx), the same for non-functional requirements (NFR), and topic-level summaries of business goals, scenarios, constraints, and assumptions.
3. Reorganize and merge the summary into the master document, **not sectioned by version**: update the description and priority of existing numbers in place; insert new numbers into their belonging business-logic position by "project → module → business scenario" and order them logically (main flows first, side flows after); when module/business-logic structure changes, restructure the grouping and ordering of the master document to match the current business logic; keep a "source version" column for each entry; merge the business goals, scenarios, constraints, and assumptions summaries into the corresponding sections by topic; append the current version row to the version evolution table; append the current version file path to the full-document index.
4. Note at the end that the current version's full content is available in docs/{Project Abbreviation}-v{Current Version Number}/{Project Abbreviation}-urs-v{Current Version Number}.md.
5. Write back the master document with impm_doc_writer (docType=urs, target=main).
6. Verify: the master document is the global requirement summary, reorganized and ordered by project/module/business logic, with no version-number sections, globally unique non-duplicated requirement numbers, and historical content preserved.

### Step 2: Merge the PRD document (summarized + reorganized by module/business logic)
1. Use impm_doc_reader (docType=prd, target=main) to read the master document docs/{Project Abbreviation}-prd.md; if it does not exist, create it per the summary template.
2. Extract the summary from the version document docs/{Project Abbreviation}-v{Current Version Number}/{Project Abbreviation}-prd-v{Current Version Number}.md: the feature list (F-v{version}-xxx) number/name/belonging module/priority/version range, user stories (US-v{version}-xxx) number/title/one-line summary/priority/belonging feature, topic-level summaries of product background/target users/data requirements/acceptance criteria, and update the version planning table.
3. Reorganize and merge the summary into the master document, **not sectioned by version**: update existing numbers in place; insert new numbers into their belonging module by "project → module", ordering within a module by business logic (main flows first, side flows after); insert new modules at the position matching their business logic; keep a "version range" column for each feature entry and a "source version" column for each user story; merge the product background/target users/data requirements/acceptance criteria summaries by business topic; append the current version row to the version evolution table; append the current version file path to the full-document index.
4. Note at the end that the current version's full content is available in the corresponding file in the version directory.
5. Write back the master document with impm_doc_writer (docType=prd, target=main).
6. Verify: the master document is the global product requirement summary, reorganized and ordered by project/module/business logic, with no version-number sections, globally unique non-duplicated numbers, and historical content preserved.

### Step 3: Merge the API document (restructure merge) + OpenAPI merge

#### 3.1 Merge the Markdown API document
1. Use impm_doc_reader (docType=api, target=main) to read the master document docs/{Project Abbreviation}-api.md; if the master document does not exist but the current version API document exists, create it per its structure + the architecture baseline.
2. Determine the interface grouping: take the module division in sad.md/LLD as the baseline; keep existing groups, insert new module interfaces at positions consistent with the architecture.
3. Merge the interfaces of the version document docs/{Project Abbreviation}-v{Current Version Number}/{Project Abbreviation}-api-v{Current Version Number}.md one by one:
   - **Globally unique numbers**: first read all interface numbers in the master document (format API-{sequence}), determine the maximum sequence max_api_number; if an interface number in the version document conflicts with the master document, renumber it starting from max_api_number + 1, guaranteeing global uniqueness
   - Insert new interfaces into their belonging module group
   - Update existing interfaces in place (an interface with the same URL/path is considered the same interface), updating request/response/error codes and annotating the most recently modified version
   - Update the interface list synchronously
   - Move deleted or retired interfaces into a "retired/offline interfaces" section and annotate the offline version
4. **Reorganization principle** (not sectioned by version):
   - The master document is ordered by "module → business logic", not sectioned by version number
   - Modules are based on the SAD's module division
   - Order within a module by business logic (main flows first, side flows after)
   - Each interface keeps a "source version" column, annotating the first introduction and most recently modified versions
5. If this is the first merge (v0.0.1), establish the master document structure by architecture groups, reorganizing the version interfaces into it rather than copying verbatim.
6. Write back the master document with impm_doc_writer (docType=api, target=main).
7. Verify: the master document is grouped by module, with no duplicate definitions, traceable interfaces/numbers/source versions, and historical interfaces preserved.

#### 3.2 Merge the OpenAPI 3.0 JSON
1. Read the project-level master document docs/openapi.json (create the empty structure if it does not exist):
```json
{
  "openapi": "3.0.3",
  "info": {
    "title": "{Project Name (Chinese)} API Documentation",
    "version": "v{Current Version Number}",
    "description": "Automatically generated by impm"
  },
  "servers": [
    {
      "url": "/api",
      "description": "API base path"
    }
  ],
  "paths": {},
  "components": {
    "schemas": {},
    "securitySchemes": {}
  },
  "tags": []
}
```
2. Read the version-level docs/{Project Abbreviation}-v{Current Version Number}/openapi-v{Current Version Number}.json.
3. Determine the maximum API sequence in the master document: traverse the interface descriptions in the master document paths (API-{sequence} in operationId/summary) and extract the maximum value.
4. Remap the version-document interface numbers: if the interface numbers in the version document conflict with the master document, renumber them starting from max_api_number + 1.
5. Merge paths: add new interfaces directly, update existing interfaces (same path) in place with request/response.
6. Merge tags: add new module tags, keep existing modules, and order by module + business logic.
7. Merge components: add new schemas, keep existing schemas.
8. Update info.version to the current version number.
9. Write the master document docs/openapi.json.

#### 3.3 Generate the project-level Swagger UI HTML
Generate the project-level Swagger UI entry file docs/index.html per the following template:
```html
<!DOCTYPE html>
<html>
<head>
  <title>{project name} API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
</head>
<body>
  <h1>{project name} API Documentation (latest version)</h1>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: "./openapi.json",
      dom_id: '#swagger-ui'
    });
  </script>
</body>
</html>
```

### Step 4: Merge the DBD document (restructure merge, ordered by subsystem/business module)
1. Use impm_doc_reader (docType=dbd, target=main) to read the master document docs/{Project Abbreviation}-dbd.md.
2. Restructure and merge the content of the version document docs/{Project Abbreviation}-v{Current Version Number}/{Project Abbreviation}-dbd-v{Current Version Number}.md into the master document by **subsystem → business module → business logic**, **not sectioned by version number**:
   - **Physical model**: group by subsystem abbreviation, and within a subsystem group by business module; insert new tables under the corresponding subsystem/module group; update existing tables (same name) in place with fields/indexes and annotate the changed version; move retired tables into a "retired tables" section. Table names must follow the `{subsystem abbreviation}_{module abbreviation}_{entity name}` naming convention, and non-conforming table names must be corrected during the merge.
   - **ER diagram**: update it synchronously, drawing or annotating it grouped by subsystem/module area.
   - **Data dictionary**: merge enum values by subsystem/module.
   - **Index design**: merge indexes into the corresponding subsystem/module positions along with their tables.
   - **Data initialization** (Chapter 11): merge the initialization data by subsystem/module, appending new initialization entries to the corresponding group.
   - Version traceability: each table/index/initialization entry keeps a "source version" column, annotating the first introduction and most recently modified versions.
3. If the current version has no substantive DBD change (the version document does not exist or is empty), skip this step.
4. Write back the master document with impm_doc_writer (docType=dbd, target=main).
5. Verify: the master document is organized by subsystem/business module, not sectioned by version number, with no duplicate table definitions, table names conforming to the naming convention, and historical structure preserved and consistent with the current version structure.

### Step 5: Merge the DBD SQL script (restructure merge, ordered by subsystem/business module)
1. Use impm_doc_reader (docType=sql, target=main) to read the master document docs/{Project Abbreviation}-dbd.sql; if the master document does not exist, create it per the version SQL structure.
2. Merge the version SQL docs/{Project Abbreviation}-v{Current Version Number}/{Project Abbreviation}-dbd-v{Current Version Number}.sql, organized in groups by **subsystem → business module**:
   - Append new CREATE TABLE statements to the corresponding subsystem/module group;
   - For existing tables, generate ALTER statements or update the original CREATE (keeping the script fully executable from the beginning);
   - Annotate each statement segment with a source-version comment and its belonging subsystem/module;
   - Append data initialization statements (INSERT INTO) to the initialization area of the corresponding subsystem/module;
   - Remove duplicate definitions and adjust the execution order (tables first, then foreign keys/indexes, initialization data after table creation).
3. If the current version has no substantive SQL change, skip this step.
4. Write back the master document with impm_doc_writer (docType=sql, target=main).
5. Verify: the SQL statements are complete, organized by subsystem/business module, without duplicate conflicts, include the data initialization statements, and can be executed directly.

### Step 6: Record progress
1. Call impm_progress add (impm-doc-merge, completed) to record this skill's completion status in version_progress.md.
2. Verify that this step status has been recorded in version_progress.md.

## Deliverables
- docs/{Project Abbreviation}-urs.md, docs/{Project Abbreviation}-prd.md (requirement/feature/user story **summary** master documents, not full content)
- docs/{Project Abbreviation}-api.md, docs/{Project Abbreviation}-dbd.md, docs/{Project Abbreviation}-dbd.sql (full design master documents **restructure-merged** by project organization, code structure, and system architecture)
- docs/openapi.json (project-level OpenAPI 3.0 format)
- docs/index.html (project-level Swagger UI entry)
- version_progress.md progress records

## Completion Hints
- To continue with the next step, enter /impm-doc-update
- To continue with all subsequent steps of this phase, enter /impm-finish

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->