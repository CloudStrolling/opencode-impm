---
name: impm-deploy-update
description: Creates or updates the build plan build.md and the deployment plan deploy.md under the deploy directory, and generates build/deployment scripts when necessary
---

# impm-deploy-update Skill

## Trigger Words
build plan, deployment plan, build.md, deploy.md, deployment script, deploy-update

## When to Use
Use in Phase 4, after readme.md and agent.md are updated, when the build and deployment plans need to be organized.

## Execution Role
This skill is executed by the Document Writer (subagent_type=dw) subagent. Use the Skill tool to load this skill when executing.

## Dispatch Notes (MUST be followed by the PM/upper-level orchestrator when starting this skill)
1. Startup method: start the subagent with the task tool; subagent_type MUST be `dw`; the PM or orchestrator is forbidden from performing this skill's content on their behalf.
2. The prompt MUST include the following context (none may be missing): project root absolute path (projectRoot), project English abbreviation ({Project Abbreviation}), current version number ({Current Version Number}), the original user input $ARGUMENTS (including the file paths mentioned by the user), the skill name (impm-deploy-update, require the subagent to load this skill with the Skill tool first before executing).
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
### Step 1: Create or update deploy/build.md (build plan)
1. Write the build plan according to the project's programming language and build tools (such as Maven, npm, pip, go build, etc.): build environment requirements, dependency installation, build commands, build artifact description, common problems and handling.
2. If deploy/build.md does not exist, create it; if it already exists, keep the original content and update the changed parts.
3. Call impm_doc_writer (docType=deploy-build) to write deploy/build.md.
4. Verify the file exists and the content is correct.

### Step 2: Create or update deploy/deploy.md (deployment plan)
1. Write the deployment plan according to the project's deployment method (such as local run, server deployment, containerization, front-end/back-end separated deployment, etc.): deployment environment requirements, deployment steps, configuration description, start and stop commands, health check, rollback plan.
2. If deploy/deploy.md does not exist, create it; if it already exists, keep the original content and update the changed parts.
3. Call impm_doc_writer (docType=deploy-deploy) to write deploy/deploy.md.
4. Verify the file exists and the content is correct.

### Step 3: Generate build and deployment scripts (if feasible)
1. If the project has clear build and deployment commands, place the build script (such as build.sh / build.bat) and the deployment script (such as deploy.sh / deploy.bat) under the deploy directory.
2. Script requirements: clear parameters, complete error handling, and consistent with the instructions in build.md and deploy.md.
3. Explain the usage of the scripts in build.md and deploy.md.

### Step 4: Record progress
1. Call impm_progress add (impm-deploy-update, completed) to record this skill's completion status in version_progress.md.
2. Verify that this step status has been recorded in version_progress.md.

## Deliverables
- deploy/build.md (build plan)
- deploy/deploy.md (deployment plan)
- build/deployment scripts under the deploy directory (if feasible)
- version_progress.md progress records

## Completion Hints
- To continue with the next step, enter /impm-git-merge
- To continue with all subsequent steps of this phase, enter /impm-finish

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->