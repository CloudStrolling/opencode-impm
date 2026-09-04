---
name: impm-docs
description: Orchestrates and executes all 10 steps of the requirements analysis phase (phase 2) (version creation, URS, PRD, SAD update, DBD, API, LLD, task list, requirements traceability matrix, git commit), ensuring each step executes strictly in sequence.
---

# impm-docs Skill

## Triggers
requirements analysis, requirements analysis consolidation, impm-docs, generate requirement documents, start analyzing requirements, execute phase 2, /impm-docs

## When to use
Use when the user needs to execute the requirements analysis phase (phase 2). This skill is a phase orchestration skill responsible for scheduling all 10 sub-skills of the phase in fixed order: impm-version-create → impm-urs-create → impm-prd-create → impm-sad-update → impm-dbd-create → impm-api-create → impm-lld-create → impm-task-create → impm-rtm-create → impm-analysis-commit. Each sub-skill is executed by the corresponding subagent.

## Execution role
This skill is executed (orchestrated) by the Project Manager (main Agent), who loads this skill with the Skill tool. Internal sub-steps must be dispatched to the corresponding subagents for execution according to the "General Dispatching Requirements" below; the PM only dispatches, checks, and makes decisions.

## General dispatching requirements (all sub-steps of this skill must comply)
1. Launch method: start the corresponding subagent for each sub-step with the task tool (subagent_type must match the mapping table below exactly) to execute the corresponding skill; the PM is prohibited from executing concrete work on behalf of the subagent (the only exception: steps marked "PM executes directly" in the mapping table).
2. Mandatory context for the task prompt (none may be omitted): absolute path of the project root (projectRoot), project abbreviation ({project abbreviation}), current version number ({current version}), original user input $ARGUMENTS (including the file paths mentioned by the user), skill name (require the subagent to load the skill with the Skill tool before executing), task ID ({task ID}, applicable in the coding phase).
3. Task prompt template (fill in this way for each sub-step):
   "Execute impm's {skill name} skill with the role of {subagent name} (subagent_type={x}); first load the skill {skill name} with the Skill tool; mandatory context: project root={absolute path}, project abbreviation={abbreviation}, current version={version}, user input={original text}, task ID={taskId} (if applicable); after completing all the operations per the skill's execution steps, return: the list of output file paths and the progress status of {skill name} in version_progress.md."
4. Completion check: after each subagent returns, verify the output files exist and version_progress.md has recorded the status of that step; proceed to the next step only when all are correct.
5. Order discipline: strictly follow the order, do not skip, reorder, parallelize, or merge; when any sub-step fails, first locate the cause and, if necessary, roll back and redo, never bypass it.

### Sub-step subagent mapping table (impm-docs)
| Sub-step | Skill name | subagent_type |
|----|----|----|
| 2 | impm-version-create | scm |
| 3 | impm-urs-create | ba |
| 4 | impm-prd-create | ba |
| 5 | impm-sad-update | sa |
| 6 | impm-dbd-create | dba |
| 7 | impm-api-create | tl |
| 8 | impm-lld-create | tl |
| 9 | impm-task-create | tl |
| 10 | impm-rtm-create | tl |
| 11 | impm-analysis-commit | scm |

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

### Step 1: Determine the current version number
Check whether the current user input and the documents it mentions contain a version number: if the current version number is unknown before execution and the input does not mention a version number, run impm-version-create per step 2 first to determine the version; if the version number is explicit, pass the relevant information to the subsequent steps.

### Step 2: Run impm-version-create
Launch the SCM subagent to load with the Skill tool and run the impm-version-create skill:
1. Determine the current version number (prefer the version number in the user input; otherwise get the largest version via impm_version action=current and increment z by 1 with action=next);
2. Pull the latest code, create and switch to the branch {project abbreviation}-v{current version};
3. Call impm_version (action=init) to create the version directory docs/{project abbreviation}-v{current version};
4. Call impm_progress (action=init) to create version_progress.md and write the first row.
After completion, read docs/{project abbreviation}-v{current version}/version_progress.md, confirm the impm-version-create row status is "completed", then proceed to the next step.

### Step 3: Run impm-urs-create
Launch the BA subagent to load with the Skill tool and run the impm-urs-create skill, generating the User Requirement Specification and writing it to docs/{project abbreviation}-v{current version}/{project abbreviation}-urs-v{current version}.md.
After completion, verify the file exists and version_progress.md has recorded the impm-urs-create status as "completed", then proceed to the next step.

### Step 4: Run impm-prd-create
Launch the BA subagent to load with the Skill tool and run the impm-prd-create skill, generating the Product Requirement Document and writing it to docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md.
After completion, verify the file exists and version_progress.md has recorded the impm-prd-create status as "completed", then proceed to the next step.

### Step 5: Run impm-sad-update
Launch the SA subagent to load with the Skill tool and run the impm-sad-update skill, evaluating and updating the System Architecture Design document docs/{project abbreviation}-sad.md.
After completion, verify version_progress.md has recorded the impm-sad-update status as "completed" or "no changes needed", then proceed to the next step.

### Step 6: Run impm-dbd-create
Launch the DBA subagent to load with the Skill tool and run the impm-dbd-create skill, generating the database design document and SQL scripts.
After completion, verify version_progress.md has recorded the impm-dbd-create status as "completed" or "no database needed", then proceed to the next step.

### Step 7: Run impm-api-create
Launch the TL subagent to load with the Skill tool and run the impm-api-create skill, generating the API interface design document.
After completion, verify version_progress.md has recorded the impm-api-create status as "completed" or "no API needed", then proceed to the next step.

### Step 8: Run impm-lld-create
Launch the TL subagent to load with the Skill tool and run the impm-lld-create skill, generating the detailed design document and writing it to docs/{project abbreviation}-v{current version}/{project abbreviation}-lld-v{current version}.md.
After completion, verify the file exists and version_progress.md has recorded the impm-lld-create status as "completed", then proceed to the next step.

### Step 9: Run impm-task-create
Launch the TL subagent to load with the Skill tool and run the impm-task-create skill, generating the task list docs/{project abbreviation}-v{current version}/{project abbreviation}-task-v{current version}.json.
After completion, verify the file exists and version_progress.md has recorded the impm-task-create status as "completed", then proceed to the next step.

### Step 10: Run impm-rtm-create
Launch the TL subagent to load with the Skill tool and run the impm-rtm-create skill. Based on the current version's URS, PRD, LLD and task list, build the many-to-many "requirement → design → task" traceability matrix and write it to docs/{project abbreviation}-v{current version}/{project abbreviation}-rtm-v{current version}.md.
After completion, verify the file exists and version_progress.md has recorded the impm-rtm-create status as "completed", then proceed to the next step.

### Step 11: Run impm-analysis-commit
Launch the SCM subagent to load with the Skill tool and run the impm-analysis-commit skill, committing all the files and directories generated in the requirements analysis phase (including rtm.md) to git.
After completion, verify version_progress.md has recorded the impm-analysis-commit status as "completed".

### Step 12: Settle the last step and report
Call impm_progress (action=finalize) before exiting to settle the total elapsed time and tokens of the last row of the progress table (impm-analysis-commit, completed) (including the consumption of the main session and subagent sub-sessions of that step); summarize all the output files of the phase and the completion status of each step, and suggest to the user the next step (enter the coding development phase, input /impm-coding).

## Deliverables
- docs/{project abbreviation}-v{current version}/version_progress.md (version progress table, all 10 steps recorded)
- docs/{project abbreviation}-v{current version}/{project abbreviation}-urs-v{current version}.md
- docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md
- docs/{project abbreviation}-v{current version}/{project abbreviation}-dbd-v{current version}.md (if applicable)
- docs/{project abbreviation}-v{current version}/{project abbreviation}-dbd-v{current version}.sql (if applicable)
- docs/{project abbreviation}-v{current version}/{project abbreviation}-api-v{current version}.md (if applicable)
- docs/{project abbreviation}-v{current version}/{project abbreviation}-lld-v{current version}.md
- docs/{project abbreviation}-v{current version}/{project abbreviation}-task-v{current version}.json
- docs/{project abbreviation}-v{current version}/{project abbreviation}-rtm-v{current version}.md (requirements traceability matrix)
- Updated docs/{project abbreviation}-sad.md (when a change is judged necessary)

## After completion
- To proceed to the next step (enter the coding development phase), input /impm-coding
- To re-execute all steps of this phase, input /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->