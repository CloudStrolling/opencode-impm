---
name: impm-review-edition
description: The "document review edition" of the impm master workflow, which automatically executes all four phases of waterfall development (project initialization, requirements analysis (with per-document user review), coding development, regression testing and version documentation), in which the requirements analysis phase uses impm-docs-review (popping up a prompt box to ask the user to review the document after urs/prd/sad/dbd/api/lld/task each step completes).
---

# impm-review-edition Skill

## Triggers
/impm-review-edition, full workflow development document review edition, impm document review edition, full workflow with review, from requirements to release (with document review)

## When to use
Use when the user requests executing the impm software engineering full workflow development and wants each document (URS, PRD, SAD, DBD, API, LLD, task list) to be reviewed and confirmed one by one by the user after it is generated during the requirements analysis phase. This skill is fully consistent with the impm skill workflow; the only difference is that phase 2 uses impm-docs-review instead of impm-docs.

## Execution role
This skill is executed (orchestrated) by the Project Manager (main Agent), who loads this skill with the Skill tool. Internal sub-steps must be dispatched to the corresponding subagents for execution according to the "General Dispatching Requirements" below; the PM only dispatches, checks, and makes decisions; in phase 2, the user document review confirmation is completed directly by the PM via the question tool popping up a prompt box.

## General dispatching requirements (all sub-steps of this skill must comply)
1. Launch method: start the corresponding subagent for each sub-step with the task tool (subagent_type must match the mapping table below exactly) to execute the corresponding skill; the PM is prohibited from executing concrete work on behalf of the subagent (the only exception: the phase 2 user document review confirmation round is executed directly by the PM).
2. Mandatory context for the task prompt (none may be omitted): absolute path of the project root (projectRoot), project abbreviation ({project abbreviation}), current version number ({current version}), original user input $ARGUMENTS (including the file paths mentioned by the user), skill name (require the subagent to load the skill with the Skill tool before executing), task ID ({task ID}, applicable in the coding phase).
3. Task prompt template (fill in this way for each sub-step):
   "Execute impm's {skill name} skill with the role of {subagent name} (subagent_type={x}); first load the skill {skill name} with the Skill tool; mandatory context: project root={absolute path}, project abbreviation={abbreviation}, current version={version}, user input={original text}, task ID={taskId} (if applicable); after completing all the operations per the skill's execution steps, return: the list of output file paths and the progress status of {skill name} in version_progress.md."
4. Completion check: after each subagent returns, verify the output files exist and version_progress.md has recorded the status of that step; proceed to the next step only when all are correct.
5. Order discipline: strictly follow the order, do not skip, reorder, parallelize, or merge; when any sub-step fails, first locate the cause and, if necessary, roll back and redo, never bypass it.

### Sub-step subagent mapping table (impm-review-edition)
| Sub-step | Skill name | subagent_type |
|----|----|----|
| Phase 1 | impm-init | PM (orchestrates, dispatches internally) |
| Phase 2 | impm-docs-review | PM (orchestrates, dispatches internally, with per-document user review) |
| Phase 3 | impm-coding | PM (orchestrates, dispatches internally) |
| Phase 4 | impm-finish | PM (orchestrates, dispatches internally) |

## Key variable definitions and values
| Variable | Description | How to obtain |
| --- | --- | --- |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to build all document paths | Read from docs/project.md via impm_project_info |
| Current Version | The version number currently being executed | Get via impm_version action=current, or infer from the version directory name |

## Execution requirements
1. Execute strictly in the order of the four phases: do not skip, reorder, parallelize, or merge any phase or step (phases run serially; whether concurrency is used inside a phase is defined by the corresponding skill, e.g., impm-coding coding tasks may be dispatched concurrently).
2. Before each phase, check the prerequisites; after each phase, check the version progress file version_progress.md to confirm the step statuses are recorded.
3. Use impm_* tools to obtain factual data such as version numbers, tasks, and project information; do not fabricate.
4. When user input or document review is needed, ask the user via the question tool popping up a prompt box; do not fabricate requirements yourself.
5. **The document review in phase 2 (impm-docs-review) must wait for the user's explicit confirmation (review approved) after each document is generated before proceeding to the next step**; when the review is not approved, regenerate per the user's feedback and review again, never skip it.
6. Use English throughout.

## Execution steps

### Phase 1: Project initialization (impm-init)
1. Load with the Skill tool and run the impm-init skill.
2. First run impm-init-isinit to determine whether the project has been initialized:
   - If docs/project.md and docs/sad.md both exist and are non-empty, the project is already initialized, skip the entire initialization phase;
   - If it is an empty project or an existing project, execute all the initialization steps in sequence: impm-init-isinit → impm-init-git → impm-init-project → impm-init-version → impm-init-urs → impm-init-prd → impm-init-sad → impm-init-dbd → impm-init-api → impm-init-lld → impm-init-task → impm-init-testcase → impm-init-commit.
3. After the initialization phase completes, check version_progress.md to confirm the initialization steps are recorded.

### Phase 2: Requirements analysis (impm-docs-review, with per-document user review)
1. Ask the user for this round's requirements: ask the user to input the requirement description of this version (or provide the requirement document path).
2. Load with the Skill tool and run the impm-docs-review skill, executing in sequence: impm-version-create → impm-urs-create (review) → impm-prd-create (review) → impm-sad-update (review) → impm-dbd-create (review) → impm-api-create (review) → impm-lld-create (review) → impm-task-create (review) → impm-rtm-create → impm-analysis-commit. After each step marked "(review)" completes, the PM pops up a prompt box for the user to review the document, proceeding to the next step only after the review is approved.
3. Each step is executed by the corresponding subagent; after each step, check version_progress.md to confirm the step status is recorded; the document review confirmation round is completed by the PM via the question tool, proceeding to the next step only after the review is approved.

### Phase 3: Coding development (impm-coding)
1. Load with the Skill tool and run the impm-coding skill.
2. Read all tasks in the task list whose status is not "completed", **dispatch them concurrently** by upstream/downstream dependency (up to 5 in parallel; the PM directly dispatches sub-step subagents in phase waves to execute impm-task-coding), and after all tasks are coded, execute impm-task-coding-gitcommit **serially** one by one to commit.
3. After all tasks complete, check version_progress.md to confirm the impm-coding status is recorded.

### Phase 4: Regression testing and version documentation (impm-finish)
1. Load with the Skill tool and run the impm-finish skill, executing in sequence: impm-regression-test → impm-coding-comment → impm-coding-review → impm-regression-metrics → impm-project-update → impm-doc-merge → impm-doc-update → impm-deploy-update → impm-git-merge.
2. After all steps complete, call impm_progress (action=finalize) before exiting to settle the total elapsed time and tokens of the last row of the progress table (impm-finish, completed) (idempotent: automatically skipped when impm-finish has already been settled).
3. Report the complete deliverables of this version's development to the user, and explain the document review results (the review confirmation status of each document in phase 2).

## Deliverables
- Version directory docs/{project abbreviation}-v{current version}/ and all its documents
- Version progress file version_progress.md (records the status of all steps)
- Implementation code, test functions, and automated test scripts
- Regression test report, code review report, readme.md, agent.md, deploy/ build and deployment documentation
- User review confirmation records of each document in phase 2 (completed in conversation)

## After completion
- This version's full workflow development (document review edition) is complete.
- To view the version progress, check version_progress.md in the version directory.
- If per-document review is no longer needed later, use the standard full workflow /impm or /impm-docs.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->