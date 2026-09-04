---
name: impm
description: impm master workflow skill that automatically orchestrates all four phases of waterfall development (project initialization, requirements analysis, coding development, regression testing, and version documentation). Use when the user enters /impm or asks to run the full impm workflow development.
---

# impm Skill

## Trigger Phrases
/impm, full workflow development, start impm, run impm, impm software engineering full workflow, from requirements to deployment

## When to Use
Use when the user requests to execute the impm full software engineering workflow. This skill automatically orchestrates four phases:
1. Project Initialization Phase (impm-init)
2. Requirements Analysis Phase (impm-docs)
3. Coding Development Phase (impm-coding)
4. Regression Testing and Version Documentation Phase (impm-finish)

## Execution Role
This skill is orchestrated by the Project Manager (PM, the controlling agent), using the Skill tool to load this skill. Internal sub-steps must dispatch the corresponding subagent as defined in the "General Dispatch Requirements" below; the PM only dispatches, checks, and makes decisions.

## General Dispatch Requirements (all sub-steps of this skill must comply)
1. Launch method: Each sub-step launches the corresponding subagent via the task tool (subagent_type must exactly match the table below) to execute the corresponding skill; the PM is prohibited from executing concrete tasks in place of the subagent (the only exception: steps marked "PM executes directly" in the table).
2. Required context in the task prompt (all mandatory): absolute path of the project root directory (projectRoot), project abbreviation ({project abbreviation}), current version number ({current version number}), user input $ARGUMENTS verbatim (including file paths mentioned by the user), skill name (requiring the subagent to load the skill with the Skill tool before executing), task ID ({task ID}, applicable to the coding phase).
3. Task prompt template (each sub-step follows this format):
   "Execute the impm {skill name} skill as {subagent role name} (subagent_type={x}); first load the skill {skill name} using the Skill tool; required context: projectRoot={absolute path}, project abbreviation={abbreviation}, current version number={version number}, user input={verbatim}, task ID={taskId} (if applicable); after completing all operations per the skill execution steps, return: the output file path list and the progress status of {skill name} in version_progress.md."
4. Completion check: After each subagent returns, verify that output files exist and version_progress.md has recorded the step status; proceed to the next step only after all checks pass.
5. Sequential discipline: Execute strictly in order; no skipping, no reordering, no parallelizing, no merging; when any sub-step fails, first identify the cause, rollback and redo if necessary, and never bypass it.

### Sub-step subagent Mapping Table (impm)
| Sub-step | Skill Name | subagent_type |
|----|----|----|
| Phase 1 | impm-init | PM (orchestrates, internally dispatches) |
| Phase 2 | impm-docs | PM (orchestrates, internally dispatches) |
| Phase 3 | impm-coding | PM (orchestrates, internally dispatches) |
| Phase 4 | impm-finish | PM (orchestrates, internally dispatches) |

## Key Variable Definitions and Values
| Variable | Description | How to Obtain |
| --- | --- | --- |
| Project Name (Chinese) | The Chinese name of the project | Read via impm_project_info from docs/project.md |
| Project Name (English) | The English name of the project | Read via impm_project_info from docs/project.md |
| Project Abbreviation | The English abbreviation of the project, used to construct all document paths | Read via impm_project_info from docs/project.md |
| Current Version Number | The version number currently being executed | Obtained via impm_version action=current, or inferred from the version directory name |

## Execution Requirements
1. Execute strictly in the order of the four phases: no skipping, no reordering, no parallelizing, no merging of any phases or steps (phases are serial; whether concurrency occurs within a phase is defined by the corresponding skill, e.g., impm-coding coding tasks may be dispatched in parallel).
2. Before executing each phase, check prerequisites; after execution, check the version progress file version_progress.md to confirm the step status has been recorded.
3. Use impm_* tools to obtain factual data such as version numbers, tasks, and project information; never fabricate data.
4. When user input is needed, ask the user through conversation; never invent requirements on your own.
5. Use English throughout.

## Execution Steps

### Phase 1: Project Initialization (impm-init)
1. Load and execute the impm-init skill using the Skill tool.
2. First execute impm-init-isinit to determine whether the project has been initialized:
   - If both docs/project.md and docs/sad.md exist and are non-empty, the project is already initialized; skip the entire initialization phase;
   - If it is an empty project or existing project, execute all initialization steps in sequence: impm-init-isinit → impm-init-git → impm-init-project → impm-init-version → impm-init-urs → impm-init-prd → impm-init-sad → impm-init-dbd → impm-init-api → impm-init-lld → impm-init-task → impm-init-testcase → impm-init-commit.
3. After the initialization phase is complete, check version_progress.md to confirm initialization steps have been recorded.

### Phase 2: Requirements Analysis (impm-docs)
1. Ask the user for this round of requirements: request the user to input the requirements description for this version (or provide the requirements document path).
2. Load and execute the impm-docs skill using the Skill tool, executing in sequence: impm-version-create → impm-urs-create → impm-prd-create → impm-sad-update → impm-dbd-create → impm-api-create → impm-lld-create → impm-task-create → impm-rtm-create → impm-analysis-commit.
3. Each step is executed by the corresponding subagent; after each step completes, check version_progress.md to confirm the step status has been recorded before continuing to the next step.

### Phase 3: Coding Development (impm-coding)
1. Load and execute the impm-coding skill using the Skill tool.
2. Read all tasks from the task list whose status is not "completed", and dispatch them **concurrently** based on upstream/downstream dependencies (up to 5 in parallel, with the PM dispatching sub-step subagents to execute impm-task-coding by phase wave). After all task coding is complete, execute impm-task-coding-gitcommit **serially** for each task to commit.
3. After all tasks are complete, check version_progress.md to confirm impm-coding status has been recorded.

### Phase 4: Regression Testing and Version Documentation (impm-finish)
1. Load and execute the impm-finish skill using the Skill tool, executing in sequence: impm-regression-test → impm-coding-comment → impm-coding-review → impm-regression-metrics → impm-project-update → impm-doc-merge → impm-doc-update → impm-deploy-update → impm-git-merge.
2. After all steps are complete, call impm_progress (action=finalize) to settle the total duration and tokens of the last row in the progress table (impm-finish, completed) before exiting (idempotent: automatically skipped when impm-finish is already settled).
3. Report the complete deliverables of this version development to the user.

## Deliverables
- Version directory docs/{project abbreviation}-v{current version number}/ and all its documents
- Version progress file version_progress.md (recording the status of all steps)
- Implementation code, test functions, and automated test scripts
- Regression test report, code review report, readme.md, agent.md, deploy/ build and deployment documentation

## Post-completion Notes
- The full workflow development for this version is complete.
- To view the version progress, check version_progress.md under the version directory.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
