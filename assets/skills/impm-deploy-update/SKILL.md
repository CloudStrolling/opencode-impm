---
name: impm-deploy-update
description: Creates or updates the build plan build.md and deployment plan deploy.md under the deploy directory, and generates build/deployment scripts when necessary.
---

# impm-deploy-update Skill

## Trigger Words
Build plan, deployment plan, build.md, deploy.md, deployment script, deploy-update

## When to Use
Use this skill in Phase 4, after readme.md and agent.md are updated, when the build and deployment plans need to be organized.

## Executing Agent
This skill is executed by the DW subagent (subagent_type=dw). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `dw`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-deploy-update; require the subagent to load this skill with the Skill tool first before executing).
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
### Step 1: Create or update deploy/build.md (build plan)
1. Based on the project's programming language and build tools (e.g., Maven, npm, pip, go build, etc.), write the build plan: build environment requirements, dependency installation, build commands, build artifact description, and common problems and solutions.
2. If deploy/build.md does not exist, create it; if it already exists, keep the original content and update the changed parts.
3. Call impm_doc_writer (docType=deploy-build) to write deploy/build.md.
4. Verify that the file exists and its content is correct.

### Step 2: Create or update deploy/deploy.md (deployment plan)
1. Based on the project's deployment method (e.g., local running, server deployment, containerization, separated frontend/backend deployment, etc.), write the deployment plan: deployment environment requirements, deployment steps, configuration description, start and stop commands, health checks, and rollback plan.
2. If deploy/deploy.md does not exist, create it; if it already exists, keep the original content and update the changed parts.
3. Call impm_doc_writer (docType=deploy-deploy) to write deploy/deploy.md.
4. Verify that the file exists and its content is correct.

### Step 3: Generate build and deployment scripts (if feasible)
1. If the project has clear build and deployment commands, place the build script (e.g., build.sh / build.bat) and the deployment script (e.g., deploy.sh / deploy.bat) under the deploy directory.
2. Script requirements: clear parameters, complete error handling, and consistent with the descriptions in build.md and deploy.md.
3. Describe the usage of the scripts in build.md and deploy.md.

### Step 4: Record progress
1. Call impm_progress add (impm-deploy-update, completed) to record this skill's completion status in version_progress.md.
2. Verify that this step's status is recorded in version_progress.md.

## Deliverables
- deploy/build.md (build plan)
- deploy/deploy.md (deployment plan)
- Build/deployment scripts under the deploy directory (if feasible)
- The progress records in version_progress.md

## Next Steps
- To continue to the next step, enter /impm-git-merge
- To continue all remaining steps of this phase, enter /impm-finish

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
