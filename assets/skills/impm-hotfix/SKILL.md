---
name: impm-hotfix
description: impm hotfix orchestration skill; completes bug location to fix in 3 lightweight steps (locate & analyze, fix & code, archive & commit), without creating a version directory or a branch, committing directly on the main branch, and producing only 1 fix record document for review.
---

# impm-hotfix skill

## Trigger words
- /impm-hotfix
- hotfix
- bug fix
- fix bug
- hotfix

## When to use
After the project has been initialized (docs/project.md exists), when the user reports a bug and wants to locate, fix and leave a trace quickly. This skill pursues the fastest fix speed; it does not create a version directory or a branch, commits directly on the main branch, and maintains only 1 append-only fix record document.

## Execution role
This skill is executed (orchestrated) by the Project Manager (main-controller Agent), loading this skill with the Skill tool. The steps that the PM executes directly (locate & analyze, archive & commit) do not start a subagent; the fix & code step dispatches the corresponding subagent for execution according to the "General Scheduling Requirements".

## General Scheduling Requirements (all sub-steps of this skill must follow)
1. Startup method: in the fix & code step, use the task tool to start the corresponding subagent (subagent_type is decided by the nature of the bug: front-end page-type bug→`fee`, back-end interface/logic-type bug→`bee`, general-type bug→`sse`) to execute the impm-hotfix-fix skill; and the steps that the PM executes directly are forbidden to start a subagent.
2. The task prompt must carry the context (all are required): the absolute path of the project root (projectRoot), the Project Abbreviation ({Project Abbreviation}), the raw user input $ARGUMENTS (including the bug description and the related file paths), the skill name (the subagent must first load the skill with the Skill tool and then execute it), the root cause analysis ({root cause analysis}), the fix plan ({fix plan}).
3. task prompt template (fill it in for each sub-step according to this):
   "Act as {the subagent name} (subagent_type={x}) to execute impm's {skill name} skill; first load the skill {skill name} with the Skill tool; the mandatory context: project root={absolute path}, Project Abbreviation={abbreviation}, user input={raw text}, root cause analysis={root cause}, fix plan={plan}; after completing all operations according to the skill execution steps, return: the list of changed file paths and the verification results."
4. Completion check: after each subagent returns, verify the changed files and the verification results; only proceed to the next step when all are correct.
5. Order discipline: strictly follow the order — do not skip, do not reorder, do not parallelize, do not merge; when any sub-step fails, first locate the cause, roll back and redo if necessary, and never bypass it.

### Sub-step subagent mapping table (impm-hotfix)
| Sub-step | Skill name | subagent_type |
|----|----|----|
| Stage 1 Locate & analyze | PM executes directly | — |
| Stage 2 Fix & code | impm-hotfix-fix | sse/fee/bee (by the nature of the bug) |
| Stage 3 Archive & commit | PM executes directly | — |

## Key variable definitions and values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to construct the fix record path | Read from docs/project.md via impm_project_info |
| Root cause analysis | The root cause of the bug located in stage 1 | Product of stage 1 |
| Fix plan | The fix plan decided in stage 1 | Product of stage 1 |

## Execution requirements
1. Strictly execute in the order and content of the execution steps in sequence: do not skip, do not reorder, do not parallelize, do not merge any step.
2. Only perform the operations defined by this skill; do not do work unrelated to the task.
3. The fix record path must be constructed with {Project Abbreviation}; do not invent file names.
4. Use the impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. After each step is complete, verify that the produced files exist and the content is correct.

## Execution steps
### Step 1: Pre-check (PM executes directly)
Call impm_isinit(projectRoot) to determine the project status:
- If docs/project.md does not exist: prompt the user "The project has not been initialized, please run /impm-init first", and end this skill.
- If docs/project.md exists: continue to step 2 (sad.md is not strictly required; the hotfix threshold is lower than the agile process).

### Step 2: Locate & analyze (PM executes directly)
1. Extract the bug description, the error information and the related file/log paths from the user input $ARGUMENTS; when the information is insufficient, ask the user to supplement it (reproduction steps, expected behavior, actual behavior, environment information).
2. Use the read/grep/glob tools to locate the related code, analyze the root cause, and determine the impact scope and the fix plan.
3. Call impm_template_reader(projectRoot, HOTFIX-RECORD-TEMPLATE.MD) to read the fix record template.
4. Maintain docs/{Project Abbreviation}-hotfix.md with the read/write tools: if the file does not exist, create it according to the template; if it already exists, append a new record at the end (including the date, the bug description, the root cause analysis and the fix plan). Note: this file is not within the standard docType path system of impm_doc_writer; maintain it directly with the built-in file tools.

### Step 3: Fix & code (start sse/fee/bee)
1. Start the corresponding subagent according to the nature of the bug with the task tool (front-end page type→fee, back-end interface/logic type→bee, general type→sse) to execute the impm-hotfix-fix skill; the prompt carries the context according to the "General Scheduling Requirements" (including the root cause analysis and the fix plan).
2. Verify the list of changed files and the verification results returned by the subagent, and confirm that the fix is complete.

### Step 4: Archive & commit (PM executes directly)
1. Update the corresponding record in docs/{Project Abbreviation}-hotfix.md with the read/write tools: supplement the fix plan execution result, the list of changed files and the verification results.
2. Call impm_git (action=commit, message={Project Abbreviation}-hotfix-{date}-{brief}) to commit all the changes to the main branch (without creating a branch or a version directory).
3. Settle the progress before exiting: call impm_version (action=current) to get the latest version number under docs; if that version has a version_progress.md, call impm_progress (action=finalize) to settle the total duration and tokens of the last row in the progress table (the most recent step); if there is no progress table, skip it (the hotfix does not create a version directory, so there is nothing to settle).
4. Report to the user: the root cause analysis, the fix plan, the list of changed files, the verification results, and the commit information (commit summary), and remind that the corresponding step of /impm-finish can be run later if a formal archiving is needed.

## Deliverables
- docs/{Project Abbreviation}-hotfix.md (append-only fix record, including the latest fix record)
- The fixed code and the regression tests (committed together)
- The commit record on the main branch (message: {Project Abbreviation}-hotfix-{date}-{brief})

## Notes after completion
- This hotfix is complete, and the fix record has been written into docs/{Project Abbreviation}-hotfix.md.
- If formal version documents need to be supplemented, run the corresponding step of /impm-docs; if code comments and review need to be archived, run the corresponding step of /impm-finish.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->