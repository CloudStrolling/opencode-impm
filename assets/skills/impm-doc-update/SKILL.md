---
name: impm-doc-update
description: Creates or updates readme.md and agent.md in the project root, covering the project introduction, quick start, directory structure, command description, and agent role description.
---

# impm-doc-update Skill

## Trigger Words
readme, agent.md, project documentation, usage instructions, doc-update

## When to Use
Use this skill in Phase 4, after the version documents are merged into the master documents, when readme.md and agent.md in the project root directory need to be created or updated.

## Executing Agent
This skill is executed by the DW subagent (subagent_type=dw). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `dw`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-doc-update; require the subagent to load this skill with the Skill tool first before executing).
3. Completion requirement: wait for the subagent to return the completion result, verify the output files and the version_progress.md progress records, and only proceed to the next step when everything is correct.

## Key Variables and How to Get Them
| Variable | Description | How to Get |
| Chinese project name | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| English project name | The English name of the project | Read from docs/project.md via impm_project_info |
| Project abbreviation | The English abbreviation of the project, used to build all document paths | Read from docs/project.md via impm_project_info |
| Current version | The version number currently being executed | Get via impm_version action=current, or infer from the version directory name |

## Execution Requirements
1. Follow the steps strictly in the order given in the Execution Steps: no skipping, no out-of-order execution, no parallel execution, no merged execution of any step.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths must be built from {project abbreviation} and {current version}; never invent file names.
4. Use impm_* tools to obtain information; never fabricate tool results.
5. Use English throughout.
6. After each step, verify that the produced files exist and their content is correct.

## Execution Steps
### Step 1: Create or update readme.md
1. Call impm_project_info to get the project's Chinese name, English name, English abbreviation, programming language, and other information.
2. If readme.md does not exist in the root directory, create it; if it already exists, keep the original content and update the changed parts.
3. The content includes: project introduction, quick start, directory structure, and command description.
4. Call impm_doc_writer (docType=readme) to write the root directory readme.md.
5. Verify that the file exists and its content is correct.

### Step 2: Create or update agent.md
1. If agent.md does not exist in the root directory, create it; if it already exists, keep the original content and update the changed parts.
2. The content includes: the description of this project's agent roles (PM, BA, SA, TL, DBA, TE, SCM, DW, CS, WS, SSE, FEE, BEE, etc.) and how to use them.
3. Call impm_doc_writer (docType=agent) to write the root directory agent.md.
4. Verify that the file exists and its content is correct.

### Step 3: Record progress
1. Call impm_progress add (impm-doc-update, completed) to record this skill's completion status in version_progress.md.
2. Verify that this step's status is recorded in version_progress.md.

## Deliverables
- readme.md (project root directory)
- agent.md (project root directory)
- The progress records in version_progress.md

## Next Steps
- To continue to the next step, enter /impm-deploy-update
- To continue all remaining steps of this phase, enter /impm-finish

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
