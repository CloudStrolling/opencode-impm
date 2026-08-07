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
This skill is executed by the Project Manager (master agent) (orchestration). Load this skill with the Skill tool when executing. Internal sub-steps MUST be dispatched to the corresponding subagents per the "General Dispatch Requirements" below; the PM only schedules, checks, and decides.

## General Dispatch Requirements (all sub-steps of this skill MUST comply)
1. Launch method: launch the corresponding subagent via the task tool for each sub-step (subagent_type MUST exactly match the mapping table below) to execute the corresponding skill; the PM must not execute the specific work in place of the subagents (the only exception: steps marked "executed directly by the PM" in the mapping table).
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), the skill name (require the subagent to load the skill with the Skill tool first before executing), and the task ID ({task ID}, applicable in the coding phase).
3. Task prompt template (fill in for each sub-step accordingly):
   "Execute impm's {skill name} skill as {subagent Chinese name} (subagent_type={x}); first load the skill {skill name} with the Skill tool; the context that MUST be carried: project root={absolute path}, project English abbreviation={abbreviation}, current version={version}, user input={original text}, task ID={taskId} (if applicable); after completing all operations per the skill's execution steps, return: the list of output file paths and the progress status of {skill name} in version_progress.md."
4. Completion verification: after each subagent returns, verify that the output files exist and version_progress.md has recorded the step status; only proceed to the next step when everything is correct.
5. Order discipline: strictly follow the execution order; do not skip, reorder, parallelize, or merge any step; if any sub-step fails, first locate the cause and roll back and redo when necessary; never bypass it.

### Sub-step Subagent Mapping Table (impm)
| Sub-step | Skill name | subagent_type |
|----|----|----|
| Phase 1 | impm-init | PM (orchestration, dispatches internally) |
| Phase 2 | impm-docs | PM (orchestration, dispatches internally) |
| Phase 3 | impm-coding | PM (orchestration, dispatches internally) |
| Phase 4 | impm-finish | PM (orchestration, dispatches internally) |

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
   - If it is an empty project or an existing project, execute all initialization steps in sequence: impm-init-isinit → impm-init-git → impm-init-project → impm-init-version → impm-init-urs → impm-init-prd → impm-init-sad → impm-init-dbd → impm-init-api → impm-init-lld → impm-init-task → impm-init-testcase → impm-init-commit.
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
