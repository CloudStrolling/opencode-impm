---
name: impm-doc-update
description: Creates or updates readme.md and agent.md in the project root directory, covering the project introduction, quick start, directory structure, command description, and agent role description
---

# impm-doc-update Skill

## Trigger Words
readme, agent.md, project documentation, usage instructions, doc-update

## When to Use
Use in Phase 4, after the version documents are merged into the master documents, when readme.md and agent.md in the project root directory need to be created or updated.

## Execution Role
This skill is executed by the Document Writer (subagent_type=dw) subagent. Use the Skill tool to load this skill when executing.

## Dispatch Notes (MUST be followed by the PM/upper-level orchestrator when starting this skill)
1. Startup method: start the subagent with the task tool; subagent_type MUST be `dw`; the PM or orchestrator is forbidden from performing this skill's content on their behalf.
2. The prompt MUST include the following context (none may be missing): project root absolute path (projectRoot), project English abbreviation ({Project Abbreviation}), current version number ({Current Version Number}), the original user input $ARGUMENTS (including the file paths mentioned by the user), the skill name (impm-doc-update, require the subagent to load this skill with the Skill tool first before executing).
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
### Step 1: Create or update readme.md
1. Call impm_project_info to obtain the project Chinese name, English name, English abbreviation, programming language, and other information.
2. If the root directory readme.md does not exist, create it; if it already exists, keep the original content and update the changed parts.
3. Content includes: project introduction, quick start, directory structure, command description.
4. Call impm_doc_writer (docType=readme) to write the root directory readme.md.
5. Verify the file exists and the content is correct.

### Step 2: Create or update agent.md
1. If the root directory agent.md does not exist, create it; if it already exists, keep the original content and update the changed parts.
2. Content includes: the agent role description of this project (PM, BA, SA, TL, DBA, TE, SCM, DW, CS, WS, SSE, FEE, BEE, etc.) and the usage.
3. Call impm_doc_writer (docType=agent) to write the root directory agent.md.
4. Verify the file exists and the content is correct.

### Step 3: Record progress
1. Call impm_progress add (impm-doc-update, completed) to record this skill's completion status in version_progress.md.
2. Verify that this step status has been recorded in version_progress.md.

## Deliverables
- readme.md (project root directory)
- agent.md (project root directory)
- version_progress.md progress records

## Completion Hints
- To continue with the next step, enter /impm-deploy-update
- To continue with all subsequent steps of this phase, enter /impm-finish

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->