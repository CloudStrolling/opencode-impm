---
name: impm-docs-review
description: Orchestrates and executes all steps of the requirements analysis phase (phase 2) (version creation, URS, PRD, SAD update, DBD, API, LLD, task list, requirements traceability matrix, git commit), and pops up a prompt box asking the user to review the document after urs/prd/sad/dbd/api/lld/task each document step completes, proceeding to the next step only after the review is approved.
---

# impm-docs-review Skill

## Triggers
requirements analysis, requirements analysis consolidation, impm-docs-review, generate requirement documents, start analyzing requirements, execute phase 2, document review, review documents, /impm-docs-review

## When to use
Use when the user needs to execute the requirements analysis phase (phase 2) and requires each document (URS, PRD, SAD, DBD, API, LLD, task list) to be reviewed and confirmed by the user after it is generated before continuing to the next step. This skill is a phase orchestration skill, with the same steps as impm-docs; the difference is that after the 7 document steps urs/prd/sad/dbd/api/lld/task complete, a "user review confirmation" round is inserted (a prompt box pops up), proceeding to the next step only after the review is approved.

## Execution role
This skill is executed (orchestrated) by the Project Manager (main Agent), who loads this skill with the Skill tool. Internal document-generation sub-steps must be dispatched to the corresponding subagents for execution according to the "General Dispatching Requirements" below; the PM only dispatches, checks, and makes decisions; **the user document review confirmation round is completed directly by the PM via the question tool popping up a prompt box** (the PM executes this round directly and does not dispatch a subagent).

## General dispatching requirements (all sub-steps of this skill must comply)
1. Launch method: start the corresponding subagent for each document-generation sub-step with the task tool (subagent_type must match the mapping table below exactly) to execute the corresponding skill; the PM is prohibited from executing document-generation work on behalf of the subagent (the only exception: the user review confirmation round is executed directly by the PM).
2. Mandatory context for the task prompt (none may be omitted): absolute path of the project root (projectRoot), project abbreviation ({project abbreviation}), current version number ({current version}), original user input $ARGUMENTS (including the file paths mentioned by the user), skill name (require the subagent to load the skill with the Skill tool before executing), task ID ({task ID}, applicable in the coding phase).
3. Task prompt template (fill in this way for each sub-step):
   "Execute impm's {skill name} skill with the role of {subagent name} (subagent_type={x}); first load the skill {skill name} with the Skill tool; mandatory context: project root={absolute path}, project abbreviation={abbreviation}, current version={version}, user input={original text}, task ID={taskId} (if applicable); after completing all the operations per the skill's execution steps, return: the list of output file paths and the progress status of {skill name} in version_progress.md."
4. Completion check: after each subagent returns, verify the output files exist and version_progress.md has recorded the status of that step; proceed to the next step only when all are correct.
5. Order discipline: strictly follow the order, do not skip, reorder, parallelize, or merge; when any sub-step fails, first locate the cause and, if necessary, roll back and redo, never bypass it.

### Sub-step subagent mapping table (impm-docs-review)
| Sub-step | Skill name | subagent_type | User review required |
|----|----|----|----|
| 2 | impm-version-create | scm | No |
| 3 | impm-urs-create | ba | Yes |
| 4 | impm-prd-create | ba | Yes |
| 5 | impm-sad-update | sa | Yes |
| 6 | impm-dbd-create | dba | Yes |
| 7 | impm-api-create | tl | Yes |
| 8 | impm-lld-create | tl | Yes |
| 9 | impm-task-create | tl | Yes |
| 10 | impm-rtm-create | tl | No |
| 11 | impm-analysis-commit | scm | No |

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
7. **The user review confirmation round must wait for the user's explicit reply before continuing**: when the review is not approved, do not proceed to the next step; regenerate the document per the user's feedback and review it again.

## User document review confirmation round (executed directly by the PM)

The "document review confirmation" round below is triggered after each of the 7 document generation steps urs/prd/sad/dbd/api/lld/task completes. The PM uses the question tool to pop up a prompt box, showing the user the generated document path and content highlights for review.

**Review option design** (question tool):
- header: `Review {document abbreviation}`
- question: `Generated {full document path}. Please review the document. Only after the review is approved will we proceed to the next step; if changes are needed, select "Needs Changes" and provide the revision feedback.`
- options:
  - `Approved`（description: The document content is correct; confirm to proceed to the next step）
  - `Needs Changes`（description: The document has issues; after providing revision feedback it will be regenerated and reviewed again）

**Handling logic**:
1. If the user selects "Approved", verify version_progress.md has recorded the corresponding step status as "completed", then go to the next step.
2. If the user selects "Needs Changes" (or provides revision feedback via custom input):
   - The PM consolidates the user's revision feedback and re-dispatches the corresponding document-generation subagent (same subagent_type, same skill) with it as supplementary context to regenerate the document;
   - After the sub-step completes, pop up the prompt box again for the user to review, until the user selects "Approved" (if it repeatedly fails to pass, first confirm with the user the feasibility of the revision feedback to avoid pointless to-and-fro);
   - During this period, do not advance to the next step.
3. Note: some steps may be determined as "no changes needed / no database needed / no API needed" (e.g., sad-update="no changes needed", dbd-create="no database needed", api-create="no API needed"). In this case, skip them following the original impm-docs handling, do not trigger the review prompt box (content that needs no review does not pop up), record the progress status truthfully, and proceed to the next step; if the step actually produced a document (e.g., the expert judged changes needed and has produced a new document), the user must still be prompted to review.

## Execution steps

### Step 1: Determine the current version number
Check whether the current user input and the documents it mentions contain a version number: if the current version number is unknown before execution and the input does not mention a version number, run impm-version-create per step 2 first to determine the version; if the version number is explicit, pass the relevant information to the subsequent steps.

### Step 2: Run impm-version-create
Launch the SCM subagent to load with the Skill tool and run the impm-version-create skill:
1. Determine the current version number (prefer the version number in the user input; otherwise get the largest version via impm_version action=current and increment z by 1 with action=next);
2. Pull the latest code, create and switch to the branch {project abbreviation}-v{current version};
3. Call impm_version (action=init) to create the version directory docs/{project abbreviation}-v{current version};
4. Call impm_progress (action=init) to create version_progress.md and write the first row.
After completion, read docs/{project abbreviation}-v{current version}/version_progress.md, confirm the impm-version-create row status is "completed", then proceed to the next step. (This step does not trigger a user review; "version creation" is not within the document review scope.)

### Step 3: Run impm-urs-create (with review)
1. Launch the BA subagent to load with the Skill tool and run the impm-urs-create skill, generating the User Requirement Specification and writing it to docs/{project abbreviation}-v{current version}/{project abbreviation}-urs-v{current version}.md.
2. After completion, verify the file exists and version_progress.md has recorded the impm-urs-create status as "completed".
3. **Document review confirmation (URS)**: per the "User document review confirmation round" above, pop up a prompt box for the user to review the URS document; proceed to the next step only after the review is approved.

### Step 4: Run impm-prd-create (with review)
1. Launch the BA subagent to load with the Skill tool and run the impm-prd-create skill, generating the Product Requirement Document and writing it to docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md.
2. After completion, verify the file exists and version_progress.md has recorded the impm-prd-create status as "completed".
3. **Document review confirmation (PRD)**: pop up a prompt box for the user to review the PRD document; proceed to the next step only after the review is approved.

### Step 5: Run impm-sad-update (with review)
1. Launch the SA subagent to load with the Skill tool and run the impm-sad-update skill, evaluating and updating the system architecture design document docs/{project abbreviation}-sad.md.
2. After completion, verify version_progress.md has recorded the impm-sad-update status as "completed" or "no changes needed".
3. **Document review confirmation (SAD)**: if this step actually updated/produced the SAD document (status "completed" and docs/{project abbreviation}-sad.md has substantive updates), pop up a prompt box for the user to review; if the status is "no changes needed" and no new content was produced, do not pop up and go directly to the next step.

### Step 6: Run impm-dbd-create (with review)
1. Launch the DBA subagent to load with the Skill tool and run the impm-dbd-create skill, generating the database design document and SQL scripts.
2. After completion, verify version_progress.md has recorded the impm-dbd-create status as "completed" or "no database needed".
3. **Document review confirmation (DBD)**: if the DBD document was actually produced (status "completed"), pop up a prompt box for the user to review; if "no database needed", do not pop up and go to the next step.

### Step 7: Run impm-api-create (with review)
1. Launch the TL subagent to load with the Skill tool and run the impm-api-create skill, generating the API interface design document.
2. After completion, verify version_progress.md has recorded the impm-api-create status as "completed" or "no API needed".
3. **Document review confirmation (API)**: if the API document was actually produced (status "completed"), pop up a prompt box for the user to review; if "no API needed", do not pop up and go to the next step.

### Step 8: Run impm-lld-create (with review)
1. Launch the TL subagent to load with the Skill tool and run the impm-lld-create skill, generating the detailed design document and writing it to docs/{project abbreviation}-v{current version}/{project abbreviation}-lld-v{current version}.md.
2. After completion, verify the file exists and version_progress.md has recorded the impm-lld-create status as "completed".
3. **Document review confirmation (LLD)**: pop up a prompt box for the user to review the LLD document; proceed to the next step only after the review is approved.

### Step 9: Run impm-task-create (with review)
1. Launch the TL subagent to load with the Skill tool and run the impm-task-create skill, generating the task list docs/{project abbreviation}-v{current version}/{project abbreviation}-task-v{current version}.json.
2. After completion, verify the file exists and version_progress.md has recorded the impm-task-create status as "completed".
3. **Document review confirmation (task list)**: pop up a prompt box for the user to review the task list; proceed to the next step only after the review is approved.

### Step 10: Run impm-rtm-create
Launch the TL subagent to load with the Skill tool and run the impm-rtm-create skill. Based on the current version's URS, PRD, LLD and task list, build the many-to-many "requirement → design → task" traceability matrix and write it to docs/{project abbreviation}-v{current version}/{project abbreviation}-rtm-v{current version}.md.
After completion, verify the file exists and version_progress.md has recorded the impm-rtm-create status as "completed", then proceed to the next step. (This step does not trigger a user review.)

### Step 11: Run impm-analysis-commit
Launch the SCM subagent to load with the Skill tool and run the impm-analysis-commit skill, committing all the files and directories generated in the requirements analysis phase (including rtm.md) to git.
After completion, verify version_progress.md has recorded the impm-analysis-commit status as "completed".

### Step 12: Settle the last step and report
Call impm_progress (action=finalize) before exiting to settle the total elapsed time and tokens of the last row of the progress table (impm-analysis-commit, completed) (including the consumption of the main session and subagent sub-sessions of that step); summarize all the output files of the phase, the completion status of each step, and the user review results, and suggest to the user the next step (enter the coding development phase, input /impm-coding).

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
- User review confirmation records after each document was generated (completed in conversation)

## After completion
- To proceed to the next step (enter the coding development phase), input /impm-coding
- To re-execute all steps of this phase (including review confirmations), input /impm-docs-review
- To run the regular requirements analysis phase without document review, input /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->