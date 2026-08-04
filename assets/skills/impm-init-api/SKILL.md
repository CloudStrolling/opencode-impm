---
name: impm-init-api
description: Determines whether the project needs API design; if so, reads the API-TEMPLATE.MD template to reverse-engineer the API Design Document, writes the version document and copies it to the master document docs/{project abbreviation}-api.md. Use when system interfaces need to be designed during the initialization phase.
---

# impm-init-api Skill
## Trigger Words
- API
- API design
- API document
- Front-end/back-end separation

## When to Use
- When the API step of the initialization phase (/impm-init-api) is executed.
- When the API Design Document (API) needs to be created or completed.

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
### Step 1: Determine whether API design is needed
Read docs/project.md and docs/sad.md via impm_doc_reader to determine whether the project uses a front-end/back-end separation or has interface integration (e.g., web services, third-party system integration, etc.) and whether API design is needed:
- No API needed: call impm_progress(projectRoot, {project abbreviation}, {current version}, add, impm-init-api, no API needed) to record the progress and end this skill.
- API needed: continue to step 2.

### Step 2: Read the template
Call impm_template_reader(projectRoot, API-TEMPLATE.MD) to read the API Design Document template, and clarify the template chapters: API list, authentication and authorization, error codes, detailed API definitions, etc.

### Step 3: Reverse-engineer the API design
Read the existing documents via impm_doc_reader (focus on the PRD and SAD), and fill in the API in the template format combined with the current project code and documents:
- Existing project: reverse-engineer the API definitions (request/response parameters, authentication method, error codes, etc.) from the existing Controller/API code, routes, and callers.
- Empty project: write an empty document per the template structure, keeping the chapter titles and filling the content with "to be filled" or empty values.

### Step 4: Write the version document and copy the master document
Call impm_doc_writer(projectRoot, api, {project Chinese name}, {current version}, {task ID}, main, content): write the version document docs/{project abbreviation}-v0.0.1/{project abbreviation}-api-v0.0.1.md, and copy it to the master document docs/{project abbreviation}-api.md (create the master document if it does not exist). Verify both files exist and their contents match.

### Step 5: Record progress
Call impm_progress(projectRoot, {project abbreviation}, {current version}, add, impm-init-api, completed) to record this step as complete.

## Deliverables
- docs/{project abbreviation}-v0.0.1/{project abbreviation}-api-v0.0.1.md
- docs/{project abbreviation}-api.md

## Next Steps
- To continue with the next step, enter /impm-init-lld
- To continue with all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
