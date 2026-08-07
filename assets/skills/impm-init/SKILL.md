---
name: impm-init
description: Orchestrates all 13 steps of the initialization phase (impm-init-isinit, impm-init-git, impm-init-project, impm-init-version, impm-init-urs, impm-init-prd, impm-init-sad, impm-init-dbd, impm-init-api, impm-init-lld, impm-init-task, impm-init-testcase, impm-init-commit), executing them strictly in sequence and reporting the results. Use when the user enters /impm-init or asks to initialize an impm project.
---

# impm-init Skill
## Trigger Words
- /impm-init
- Initialize
- Initialize project
- Start initialization phase
- impm initialization workflow

## When to Use
- When the user enters /impm-init, requesting the impm project initialization phase.
- When the user asks to initialize the current project (generating project, urs, prd, sad, dbd, api, lld, testcase and other documents).

## Executing Agent
This skill is executed by the Project Manager (master agent) (orchestration). Load this skill with the Skill tool when executing. Internal sub-steps MUST be dispatched to the corresponding subagents per the "General Dispatch Requirements" below; the PM only schedules, checks, and decides.

## General Dispatch Requirements (all sub-steps of this skill MUST comply)
1. Launch method: launch the corresponding subagent via the task tool for each sub-step (subagent_type MUST exactly match the mapping table below) to execute the corresponding skill; the PM must not execute the specific work in place of the subagents (the only exception: steps marked "executed directly by the PM" in the mapping table).
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), the skill name (require the subagent to load the skill with the Skill tool first before executing), and the task ID ({task ID}, applicable in the coding phase).
3. Task prompt template (fill in for each sub-step accordingly):
   "Execute impm's {skill name} skill as {subagent Chinese name} (subagent_type={x}); first load the skill {skill name} with the Skill tool; the context that MUST be carried: project root={absolute path}, project English abbreviation={abbreviation}, current version={version}, user input={original text}, task ID={taskId} (if applicable); after completing all operations per the skill's execution steps, return: the list of output file paths and the progress status of {skill name} in version_progress.md."
4. Completion verification: after each subagent returns, verify that the output files exist and version_progress.md has recorded the step status; only proceed to the next step when everything is correct.
5. Order discipline: strictly follow the execution order; do not skip, reorder, parallelize, or merge any step; if any sub-step fails, first locate the cause and roll back and redo when necessary; never bypass it.

### Sub-step Subagent Mapping Table (impm-init)
| Sub-step | Skill name | subagent_type |
|----|----|----|
| a | impm-init-isinit | PM (executed directly) |
| b | impm-init-git | scm |
| c | impm-init-project | sa |
| d | impm-init-version | sa |
| e | impm-init-urs | ba |
| f | impm-init-prd | ba |
| g | impm-init-sad | sa |
| h | impm-init-dbd | dba |
| i | impm-init-api | sa |
| j | impm-init-lld | tl |
| k | impm-init-task | tl |
| l | impm-init-testcase | te |
| m | impm-init-commit | scm |

## Key Variables and How to Get Them
| Variable | Description | How to get it |
| Project Chinese name | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project English name | The English name of the project | Read from docs/project.md via impm_project_info |
| Project abbreviation | The project's English abbreviation, used to construct all document paths | Read from docs/project.md via impm_project_info |
| Current version | The version currently being executed (fixed at 0.0.1 during the initialization phase) | Get via impm_version, or infer from the version directory name |

## Execution Requirements
1. Execute strictly in the order of the content in the execution steps: no skipping, no out-of-order execution, no parallel execution, no merged execution of any step.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths must be constructed with {project abbreviation} and {current version}; do not fabricate file names.
4. Use impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. After each step, verify that the output file exists and its content is correct.

## Execution Steps
### Step a: Execute impm-init-isinit (initialization determination)
Load and execute the impm-init-isinit skill: call impm_isinit(projectRoot) to determine whether the current project has been initialized:
- If docs/project.md and docs/sad.md both exist and are non-empty: the project is initialized; skip the entire initialization phase, report the determination to the user, and end this skill without executing subsequent steps.
- If it is an empty project: initialize it as an empty project, writing each document as an empty structure per the template.
- If it is an existing project: reverse-engineer and complete each document based on the existing project.
After execution, verify the impm-init-isinit progress record in version_progress.md; if the sub-skill has not recorded it (version_progress.md not yet created), leave it for step d (impm-init-version) to backfill uniformly.

### Step b: Execute impm-init-git (git baseline)
Launch the SCM subagent (subagent_type=scm) to execute the impm-init-git skill (the task prompt carries the context per the "General Dispatch Requirements" and requires loading the skill with the Skill tool first): the SCM calls impm_git(projectRoot, status) to determine whether the project is under git management; if not, calls impm_git(projectRoot, init) to bring it under management; creates/updates .gitignore based on the operating system (Windows) and the project programming language; calls impm_git(projectRoot, commit, null, Initialize impm project) to make the initial commit. Verify .gitignore and the commit records, and verify/backfill the progress line (impm-init-git, completed).

### Step c: Execute impm-init-project (project master document)
Launch the SA subagent (subagent_type=sa) to execute the impm-init-project skill: the SA calls impm_template_reader(projectRoot, PROJECT-TEMPLATE.MD) to read the template, then generates docs/project.md based on the existing documents and code (impm_doc_writer docType=project target=main; content includes project basic information, coding standards, project map, etc.); when information is insufficient, the SA asks the user questions before filling in. Verify that docs/project.md exists and its content is complete, and verify/backfill the progress line (impm-init-project, completed).

### Step d: Execute impm-init-version (version initialization)
Launch the SA subagent (subagent_type=sa) to execute the impm-init-version skill: the SA calls impm_project_info(projectRoot) to get the project abbreviation; calls impm_version(projectRoot, init, v0.0.1, {project Chinese name}) to create the version directory docs/{project abbreviation}-v0.0.1; calls impm_progress(projectRoot, {project abbreviation}, 0.0.1, init, null, null) to create version_progress.md, and backfills the completed initialization step records (mark impm-init-isinit, impm-init-git, impm-init-project, impm-init-version all as completed). Verify that the version directory and version_progress.md exist.

### Step e: Execute impm-init-urs (User Requirement Specification)
Launch the BA subagent (subagent_type=ba) to execute the impm-init-urs skill: the BA calls impm_template_reader(projectRoot, URS-TEMPLATE.MD) to read the template, reverse-engineers or generates the User Requirement Specification as an empty structure, writes the version document docs/{project abbreviation}-v0.0.1/{project abbreviation}-urs-v0.0.1.md via impm_doc_writer docType=urs target=main and copies it to the master document docs/{project abbreviation}-urs.md. Verify both files exist and their contents match, and verify/backfill the progress line (impm-init-urs, completed).

### Step f: Execute impm-init-prd (Product Requirement Document)
Launch the BA subagent (subagent_type=ba) to execute the impm-init-prd skill: the BA calls impm_template_reader(projectRoot, PRD-TEMPLATE.MD) to read the template, reverse-engineers or generates the Product Requirement Document as an empty structure based on the project code, documents, and the URS, writes the version document docs/{project abbreviation}-v0.0.1/{project abbreviation}-prd-v0.0.1.md via impm_doc_writer docType=prd target=main and copies it to the master document docs/{project abbreviation}-prd.md. Verify both files exist and their contents match, and verify/backfill the progress line (impm-init-prd, completed).

### Step g: Execute impm-init-sad (System Architecture Design)
Launch the SA subagent (subagent_type=sa) to execute the impm-init-sad skill: the SA calls impm_template_reader(projectRoot, SAD-TEMPLATE.MD) to read the template, reverse-engineers or generates the System Architecture Design document as an empty structure based on the project code, documents, and the PRD, writes it to docs/sad.md via impm_doc_writer docType=sad target=main (sad has only a master document, no version-scoped document). Verify that docs/sad.md exists and its content is complete, and verify/backfill the progress line (impm-init-sad, completed).

### Step h: Execute impm-init-dbd (database design)
Launch the DBA subagent (subagent_type=dba) to execute the impm-init-dbd skill: the DBA determines whether a database is needed based on docs/project.md and docs/sad.md:
- No database needed: only record the progress line (impm-init-dbd, no database needed) and skip document generation.
- Database needed: read the DBD-TEMPLATE.MD template, reverse-engineer the Database Design Document and the initialization SQL, write the version documents via impm_doc_writer docType=dbd and docType=sql and copy them to the master documents docs/{project abbreviation}-dbd.md and docs/{project abbreviation}-dbd.sql.
Verify that the files exist, and verify/backfill the progress line (impm-init-dbd, completed).

### Step i: Execute impm-init-api (API design)
Launch the SA subagent (subagent_type=sa) to execute the impm-init-api skill: the SA determines whether the project uses a front-end/back-end separation or interface integration and whether API design is needed based on docs/project.md and docs/sad.md:
- No API needed: only record the progress line (impm-init-api, no API needed) and skip document generation.
- API needed: read the API-TEMPLATE.MD template, reverse-engineer the API Design Document, write the version document via impm_doc_writer docType=api target=main and copy it to the master document docs/{project abbreviation}-api.md.
Verify that the file exists, and verify/backfill the progress line (impm-init-api, completed).

### Step j: Execute impm-init-lld (detailed design)
Launch the TL subagent (subagent_type=tl) to execute the impm-init-lld skill: the TL calls impm_template_reader(projectRoot, LLD-TEMPLATE.MD) to read the template, reverse-engineers or generates the detailed design document of the overall business logic as an empty structure based on the project code, documents, PRD, and SAD, writes the version document via impm_doc_writer docType=lld target=main and copies it to the master document docs/{project abbreviation}-lld.md. Verify both files exist and their contents match, and verify/backfill the progress line (impm-init-lld, completed).

### Step k: Execute impm-init-task (task list)
Launch the TL subagent (subagent_type=tl) to execute the impm-init-task skill: the TL calls impm_template_reader(projectRoot, TASK-TEMPLATE.json) to read the template, reverse-engineers the task list based on the PRD, LLD, SAD, and API documents, validates and writes the version document docs/{project abbreviation}-v0.0.1/{project abbreviation}-task-v0.0.1.json via impm_task_manager action=init. Verify that the file exists and the JSON format is correct, and verify/backfill the progress line (impm-init-task, completed).

### Step l: Execute impm-init-testcase (test cases and test scripts)
Launch the TE subagent (subagent_type=te) to execute the impm-init-testcase skill: the TE calls impm_template_reader(projectRoot, TESTCASE-TEMPLATE.MD) to read the template, determines the test cases based on the project code, documents, PRD, and LLD, writes the version document docs/{project abbreviation}-v0.0.1/{project abbreviation}-testcase-v0.0.1.md via impm_doc_writer docType=testcase target=main and copies it to the master document docs/{project abbreviation}-testcase.md; writes the test functions according to the test cases and generates automated test scripts (under scripts/API-TEST/). Verify that the documents and scripts exist, and verify/backfill the progress line (impm-init-testcase, completed).

### Step m: Execute impm-init-commit (final commit)
Launch the SCM subagent (subagent_type=scm) to execute the impm-init-commit skill: the SCM calls impm_git(projectRoot, status) to confirm the working directory status, calls impm_git(projectRoot, commit, null, {project abbreviation}-v0.0.1-Initialize impm project) to commit all initialization content, and verify the commit succeeded.

### Step n: Record orchestration completion and report
Call impm_progress(projectRoot, {project abbreviation}, {current version}, add, impm-init, completed) to record the completion of this orchestration skill; report to the user that the initialization phase is fully complete, including: the initialization mode (empty project / existing project), the list of output files, the executing agent of each step (PM/SCM/SA/BA/DBA/TL/TE), the location of the version progress file, and next-step suggestions.

## Deliverables
- Version directory docs/{project abbreviation}-v0.0.1/ and all its initialization documents
- Master documents docs/project.md, docs/sad.md, docs/{project abbreviation}-urs.md, docs/{project abbreviation}-prd.md, docs/{project abbreviation}-api.md, docs/{project abbreviation}-dbd.md, docs/{project abbreviation}-dbd.sql, docs/{project abbreviation}-lld.md, docs/{project abbreviation}-testcase.md
- Task list docs/{project abbreviation}-v0.0.1/{project abbreviation}-task-v0.0.1.json
- Version progress file version_progress.md
- .gitignore and the git initial commit record
- Automated test scripts under scripts/API-TEST/

## Next Steps
- The initialization phase is fully complete; there are no subsequent steps.
- To view the version progress, check version_progress.md in the version directory.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
