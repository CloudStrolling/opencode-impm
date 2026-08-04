---
name: impm
description: The impm master workflow skill that automatically orchestrates all four phases of waterfall development (project initialization, requirements analysis, coding development, regression testing, and version documentation). Use when the user enters /impm or asks to run the full impm workflow development.
---

# impm Skill

## Trigger Words
/impm, full workflow development, start impm, run impm, impm software engineering full workflow, from requirements to release

## When to Use
Use when the user requests full impm software engineering workflow development. This skill automatically orchestrates the four phases:
1. Project initialization phase (impm-init)
2. Requirements analysis phase (impm-docs)
3. Coding development phase (impm-coding)
4. Regression testing and version documentation phase (impm-finish)

## Executing Agent
This skill is executed by the PM (Project Manager, master agent), which acts as the scheduling core that starts the subagents to execute the specific skills.

## Key Variables and How to Get Them
| Variable | Description | How to get it |
| --- | --- | --- |
| Project Chinese name | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project English name | The English name of the project | Read from docs/project.md via impm_project_info |
| Project abbreviation | The project's English abbreviation, used to construct all document paths | Read from docs/project.md via impm_project_info |
| Current version | The version currently being executed | Get via impm_version action=current, or infer from the version directory name |

## Execution Requirements
1. Execute strictly in the order of the four phases: no skipping, no out-of-order execution, no parallel execution, no merged execution of any phase or step.
2. Verify the prerequisites before each phase; after execution, check the version progress file version_progress.md to confirm the step status has been recorded.
3. Use impm_* tools to obtain factual data such as versions, tasks, and project information; do not fabricate it.
4. When user input is required, ask the user through the conversation; do not fabricate requirements.
5. Use English throughout.

## Execution Steps

### Phase 1: Project Initialization (impm-init)
1. Load and execute the impm-init skill using the Skill tool.
2. First run impm-init-isinit to determine whether the project has been initialized:
   - If docs/project.md and docs/sad.md both exist and are non-empty, the project is initialized; skip the entire initialization phase;
   - If it is an empty project or an existing project, execute all initialization steps in sequence.
3. After the initialization phase completes, check version_progress.md to confirm the initialization steps have been recorded.

### Phase 2: Requirements Analysis (impm-docs)
1. Ask the user for this round of requirements: ask the user to enter the requirement description for this version (or provide a requirements document path).
2. Load and execute the impm-docs skill using the Skill tool, executing in sequence: impm-version-create → impm-urs-create → impm-prd-create → impm-sad-update → impm-dbd-create → impm-api-create → impm-lld-create → impm-task-create → impm-analysis-commit.
3. Each step is executed by the corresponding subagent; after each step, check version_progress.md to confirm the step status has been recorded before continuing to the next step.

### Phase 3: Coding Development (impm-coding)
1. Load and execute the impm-coding skill using the Skill tool.
2. Read all tasks in the task list whose status is not "completed", and execute impm-task-coding (with its 10 substeps) and impm-task-coding-gitcommit for each task strictly in upstream-downstream order.
3. After all tasks complete, check version_progress.md to confirm the impm-coding status has been recorded.

### Phase 4: Regression Testing and Version Documentation (impm-finish)
1. Load and execute the impm-finish skill using the Skill tool, executing in sequence: impm-regression-test → impm-coding-comment → impm-coding-review → impm-project-update → impm-doc-merge → impm-doc-update → impm-deploy-update → impm-git-merge.
2. After all steps complete, report the full deliverables of this version's development to the user.

## Deliverables
- Version directory docs/{project abbreviation}-v{current version}/ and all its documents
- Version progress file version_progress.md (records the status of all steps)
- Implementation code, test functions, and automated test scripts
- Regression test report, code review report, readme.md, agent.md, deploy/ build and deployment documentation

## Next Steps
- The full workflow development for this version is complete.
- To view the version progress, check version_progress.md in the version directory.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
