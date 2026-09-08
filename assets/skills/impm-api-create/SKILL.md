---
name: impm-api-create
description: Determines whether the project needs API interfaces, completes the new API Design Document for the current version following the API template, and generates OpenAPI 3.0 JSON and Swagger UI HTML.
---

# impm-api-create Skill

## Triggers
interface design, API, interface document, add interfaces, impm-api-create

## When to use
Use when the database design is complete (after impm-dbd-create). Check whether the master interface design document docs/{project abbreviation}-api.md exists: if it does not exist, the current project needs no API interfaces to be created, skip this step; if it exists, complete the current version's new API design following the API template based on the SAD and the current version PRD, and record this step in the version progress file.

## Execution role
This skill is executed by the Technical Lead (subagent_type=tl) subagent, who loads this skill with the Skill tool.

## Dispatching instructions (the PM/orchestrator must comply when launching this skill)
1. Launch method: start the subagent with the task tool, subagent_type must be `tl`; the PM or orchestrator is prohibited from executing this skill's content on its behalf.
2. Mandatory context for the prompt (none may be omitted): absolute path of the project root (projectRoot), project abbreviation ({project abbreviation}), current version number ({current version}), original user input $ARGUMENTS (including the file paths mentioned by the user), skill name (impm-api-create, require the subagent to load this skill with the Skill tool before executing).
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
Call impm_template_reader to read the template API-TEMPLATE.MD to clarify the section structure and filling format of the interface design document.

### Step 2: Determine whether the project needs interfaces
Call impm_doc_reader (docType=api, target=main) to check whether docs/{project abbreviation}-api.md exists:
- If it does not exist: the current project needs no API interfaces to be created. Call impm_progress (action=add, stepName=impm-api-create, status=no API needed) to insert a new row at the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md, then skip this step and end this skill.

### Step 3: Collect design bases
Call impm_doc_reader to read:
1. The system architecture design document docs/{project abbreviation}-sad.md;
2. The current version PRD document docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md;
3. The existing API design document docs/{project abbreviation}-api.md (may be empty, used as a reference).

### Step 4: Complete the current version new API design
Based on the SAD and the current version PRD, reference the existing API design docs/{project abbreviation}-api.md (may be empty), and apply the API template format to complete the current version's new API design. Call impm_doc_writer (docType=api, target=version) to write docs/{project abbreviation}-v{current version}/{project abbreviation}-api-v{current version}.md.

### Step 4.1: Read the project-level API numbers to determine the maximum sequence
Call impm_doc_reader (docType=api, target=main) to read the project-level API document docs/{project abbreviation}-api.md, parse all interface numbers in it (format API-{sequence}) and determine the current maximum sequence max_api_number. If the master document does not exist or has no interface numbers, then max_api_number = 0.

### Step 4.2: Generate the OpenAPI 3.0 JSON
Based on the API Markdown document generated in Step 4, convert it to an OpenAPI 3.0 format JSON file docs/{project abbreviation}-v{current version}/openapi-v{current version}.json:
1. **Basic structure**:
```json
{
  "openapi": "3.0.3",
  "info": {
    "title": "{Project Name (Chinese)} API Documentation",
    "version": "v{current version}",
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
2. **Interface extraction rules**:
   - Extract from the interface definitions in the API Markdown (### 5.x format)
   - HTTP method: extract from the interface line `GET/POST/PUT/DELETE /api/xxx`
   - Path: extract the full path from the interface line
   - Summary: interface name
   - Description: functional description
   - Tags: group by module (inferred from the section hierarchy)
   - Parameters: extract from the request parameter table
   - RequestBody: extract from the request parameters/request example
   - Responses: extract from the response parameters/response example
3. **Globally unique numbers**: new interface numbers start incrementing from max_api_number + 1 in the format API-{sequence} (e.g., API-001, API-002), guaranteeing global uniqueness.
4. **Tags grouping**: generate tags based on the module division in the SAD, in the format `{ "name": "module name", "description": "module description" }`.

### Step 4.3: Generate the Swagger UI HTML
Generate the version-level Swagger UI entry file docs/{project abbreviation}-v{current version}/index.html per the following template:
```html
<!DOCTYPE html>
<html>
<head>
  <title>{project name} API Documentation - v{current version}</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
</head>
<body>
  <h1>{project name} API Documentation - v{current version}</h1>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: "./openapi-v{current version}.json",
      dom_id: '#swagger-ui'
    });
  </script>
</body>
</html>
```

### Step 5: Record progress
Call impm_progress (action=add, stepName=impm-api-create, status=completed) to insert a new row at the first position of the table in the version progress file docs/{project abbreviation}-v{current version}/version_progress.md.
Verify the output file exists and its content is correct, and the progress row is recorded.

## Deliverables
- docs/{project abbreviation}-v{current version}/{project abbreviation}-api-v{current version}.md (API interface design document)
- docs/{project abbreviation}-v{current version}/openapi-v{current version}.json (OpenAPI 3.0 format)
- docs/{project abbreviation}-v{current version}/index.html (Swagger UI entry)

## After completion
- To proceed to the next step, input /impm-lld-create
- To proceed through all subsequent steps of this phase, input /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->