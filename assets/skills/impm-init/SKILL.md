---
name: impm-init
description: Orchestrates all 13 steps of the initialization phase (impm-init-isinit, impm-init-git, impm-init-project, impm-init-version, impm-init-urs, impm-init-prd, impm-init-sad, impm-init-dbd, impm-init-api, impm-init-lld, impm-init-task, impm-init-testcase, impm-init-commit), executing them strictly in sequence and reporting the results. Use when the user enters /impm-init or asks to initialize an impm project.
---

# impm-init Skill

## Trigger words
- /impm-init
- initialize
- initialize project
- start initialization phase
- impm initialization flow

## When to use
- When the user enters /impm-init, asking to execute the impm project initialization phase.
- When the user asks to initialize the current project (generating documents such as project, urs, prd, sad, dbd, api, lld, testcase).

## Executing role
This skill is executed (orchestrated) by the Project Manager (master Agent). When executing, load this skill using the Skill tool. Internal sub-steps must dispatch the corresponding subagent for execution according to the "General scheduling requirements" below; the PM only schedules, checks, and makes decisions.

## General scheduling requirements (all sub-steps of this skill must comply)
1. Startup method: each sub-step starts the corresponding subagent through the task tool (subagent_type must exactly match the table below) to execute the corresponding skill; the PM is prohibited from performing specific tasks in place of the subagent (the only exception: steps marked "PM directly executes" in the table).
2. The task prompt must pass the context (none may be missing): the absolute path of the project root directory (projectRoot), project English abbreviation ({project English abbreviation}), current version number ({current version number}), the original user input $ARGUMENTS (including file paths mentioned by the user), the skill name (require the subagent to first load the skill using the Skill tool before executing), and the task number ({task number}, applicable in the coding phase).
3. Task prompt template (fill in each sub-step accordingly):
   "Execute the impm {skill name} skill as {subagent Chinese name} (subagent_type={x}); first load the skill {skill name} using the Skill tool; context that must be carried: project root={absolute path}, project English abbreviation={abbreviation}, current version number={version number}, user input={original}, task number={taskId} (if applicable); after completing all operations according to the skill execution steps, return: the list of produced file paths and the progress status of {skill name} in version_progress.md."
4. Completion check: after each subagent returns, verify that the produced files exist and version_progress.md has recorded the step status; only proceed to the next step when all are correct.
5. Order discipline: strictly follow the order, do not skip, do not reorder, do not run in parallel, do not merge; when any sub-step fails, first locate the cause, and if necessary roll back and redo; do not bypass.

### Sub-step subagent mapping table (impm-init)
| Sub-step | Skill name | subagent_type |
|----|----|----|
| a | impm-init-isinit | PM directly executes |
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

## Key variable definitions and values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to concatenate all document paths | Read from docs/project.md via impm_project_info |
| Current version number | The version number being executed (fixed to 0.0.1 in the initialization phase) | Obtained via impm_version or inferred from the version directory name |

## Execution requirements
1. Execute strictly in the content and order of the execution steps: do not skip, do not reorder, do not run in parallel, do not merge any steps.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths must be concatenated with {project English abbreviation} and {current version number}; do not fabricate file names.
4. Use the impm_* tools to obtain information; do not fabricate tool return results.
5. Use English throughout.
6. After each step, verify that the produced files exist and the content is correct.

## Execution steps
### Step a: execute impm-init-isinit (initialization determination, PM directly executes, does not start a subagent)
Load and execute the impm-init-isinit skill (first load the skill, then execute according to the skill steps): call impm_isinit(projectRoot) to determine whether the current project has been initialized:
- If docs/project.md and docs/sad.md both exist and are non-empty: the project has been initialized, directly skip the entire initialization phase, report the determination conclusion to the user and end this skill, without executing the subsequent steps.
- If it is an empty project: initialize as an empty project, writing the empty structure for each document according to the template.
- If it is an existing project: reverse-engineer and complete each document as an existing project.
After execution, verify the impm-init-isinit progress record in version_progress.md; if the sub-skill has not recorded it (version_progress.md has not yet been created), leave it pending, to be back-filled uniformly by step d (impm-init-version). Pass the determination result (empty project/existing project/initialized) to the subsequent steps as context.

### Step b: execute impm-init-git (git baseline)
Start an SCM subagent (subagent_type=scm) to execute the impm-init-git skill (the task prompt carries the context according to the "General scheduling requirements" and requires first loading the skill using the Skill tool): have the SCM call impm_git(projectRoot, status) to determine whether it is under git management; if not, call impm_git(projectRoot, init) to bring it under management; create/update .gitignore based on the operating system (Windows) and the project programming language; call impm_git(projectRoot, commit, null, initialize impm project) to make the initial commit.
After completion, verify the .gitignore and the commit record, and verify/back-fill the progress line (impm-init-git, completed).

### Step c: execute impm-init-project (project master document)
Start an SA subagent (subagent_type=sa) to execute the impm-init-project skill: have the SA call impm_template_reader(projectRoot, PROJECT-TEMPLATE.MD) to read the template, and generate docs/project.md (impm_doc_writer docType=project target=main, including project basic information, coding standards, project map, etc.) based on existing documents and code; when information is insufficient, ask the user questions before filling in.
After completion, verify that docs/project.md exists and the content is complete, and verify/back-fill the progress line (impm-init-project, completed).

### Step d: execute impm-init-version (version initialization)
Start an SA subagent (subagent_type=sa) to execute the impm-init-version skill: have the SA call impm_project_info(projectRoot) to obtain the project English abbreviation; call impm_version(projectRoot, init, v0.0.1, {project Chinese name}) to create the version directory docs/{project English abbreviation}-v0.0.1; call impm_progress(projectRoot, {project English abbreviation}, 0.0.1, init, null, null) to create version_progress.md, and back-fill the records of the completed initialization steps (impm-init-isinit, impm-init-git, impm-init-project, impm-init-version are all marked completed).
After completion, verify that the version directory and version_progress.md exist.

### Step e: execute impm-init-urs (User Requirement Specification)
Start a BA subagent (subagent_type=ba) to execute the impm-init-urs skill: have the BA call impm_template_reader(projectRoot, URS-TEMPLATE.MD) to read the template, reverse-engineer or generate the User Requirement Specification according to the empty structure, and use impm_doc_writer docType=urs target=main to write the version document docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-urs-v0.0.1.md and copy it to the master document docs/{project English abbreviation}-urs.md.
After completion, verify that both files exist and the content is consistent, and verify/back-fill the progress line (impm-init-urs, completed).

### Step f: execute impm-init-prd (Product Requirement Document)
Start a BA subagent (subagent_type=ba) to execute the impm-init-prd skill: have the BA call impm_template_reader(projectRoot, PRD-TEMPLATE.MD) to read the template, reverse-engineer or generate the Product Requirement Document according to the project code, documents, and URS, and use impm_doc_writer docType=prd target=main to write the version document docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-prd-v0.0.1.md and copy it to the master document docs/{project English abbreviation}-prd.md.
After completion, verify that both files exist and the content is consistent, and verify/back-fill the progress line (impm-init-prd, completed).

### Step g: execute impm-init-sad (System Architecture Design)
Start an SA subagent (subagent_type=sa) to execute the impm-init-sad skill: have the SA call impm_template_reader(projectRoot, SAD-TEMPLATE.MD) to read the template, reverse-engineer or generate the System Architecture Design document according to the project code, documents, and PRD, and use impm_doc_writer docType=sad target=main to write docs/sad.md (sad only has the master document, no in-version document).
After completion, verify that docs/sad.md exists and the content is complete, and verify/back-fill the progress line (impm-init-sad, completed).

### Step h: execute impm-init-dbd (database design)
Start a DBA subagent (subagent_type=dba) to execute the impm-init-dbd skill: have the DBA determine whether a database is needed based on docs/project.md and docs/sad.md:
- No database needed: only record the progress line (impm-init-dbd, no database needed), skip document generation.
- Database needed: read the DBD-TEMPLATE.MD template, reverse-engineer the database design document and initialization SQL, and use impm_doc_writer docType=dbd and docType=sql to write the version documents and copy them to the master documents docs/{project English abbreviation}-dbd.md and docs/{project English abbreviation}-dbd.sql.
After completion, verify that the files exist, and verify/back-fill the progress line (impm-init-dbd, completed).

### Step i: execute impm-init-api (interface design)
Start an SA subagent (subagent_type=sa) to execute the impm-init-api skill: have the SA determine whether the project is front-end/back-end separated or has interface integration, and whether interfaces need to be designed, based on docs/project.md and docs/sad.md:
- No interface needed: only record the progress line (impm-init-api, no interface needed), skip document generation.
- Interface needed: read the API-TEMPLATE.MD template, reverse-engineer the interface design document, and use impm_doc_writer docType=api target=main to write the version document and copy it to the master document docs/{project English abbreviation}-api.md.
After completion, verify that the file exists, and verify/back-fill the progress line (impm-init-api, completed).

### Step j: execute impm-init-lld (detailed design)
Start a TL subagent (subagent_type=tl) to execute the impm-init-lld skill: have the TL call impm_template_reader(projectRoot, LLD-TEMPLATE.MD) to read the template, reverse-engineer or generate the detailed design document of the overall business logic according to the project code, documents, PRD, and SAD, and use impm_doc_writer docType=lld target=main to write the version document and copy it to the master document docs/{project English abbreviation}-lld.md.
After completion, verify that both files exist and the content is consistent, and verify/back-fill the progress line (impm-init-lld, completed).

### Step k: execute impm-init-task (task list)
Start a TL subagent (subagent_type=tl) to execute the impm-init-task skill: have the TL call impm_template_reader(projectRoot, TASK-TEMPLATE.json) to read the template, reverse-engineer the task list according to the PRD, LLD, SAD, and API documents, and use impm_task_manager action=init to validate and write the version document docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-task-v0.0.1.json.
After completion, verify that the file exists and the JSON format is correct, and verify/back-fill the progress line (impm-init-task, completed).

### Step l: execute impm-init-testcase (test cases and test scripts)
Start a TE subagent (subagent_type=te) to execute the impm-init-testcase skill: have the TE call impm_template_reader(projectRoot, TESTCASE-TEMPLATE.MD) to read the template, determine the test cases according to the project code, documents, PRD, and LLD, use impm_doc_writer docType=testcase target=main to write the version document docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-testcase-v0.0.1.md and copy it to the master document docs/{project English abbreviation}-testcase.md; complete the writing of test functions according to the cases, and generate automated test scripts (under scripts/API-TEST/).
After completion, verify that the documents and scripts exist, and verify/back-fill the progress line (impm-init-testcase, completed).

### Step m: execute impm-init-commit (final commit)
Start an SCM subagent (subagent_type=scm) to execute the impm-init-commit skill: have the SCM call impm_git(projectRoot, status) to confirm the working tree status, and call impm_git(projectRoot, commit, null, {project English abbreviation}-v0.0.1-initialize impm project) to commit all initialization content.
After completion, verify that the commit succeeded.

### Step n: record orchestration completion and report
Call impm_progress(projectRoot, {project English abbreviation}, {current version number}, add, impm-init, completed) to record the completion of this orchestration skill; then call impm_progress(projectRoot, {project English abbreviation}, {current version number}, finalize, null, null) to settle the total duration and tokens of the last row of the progress table (impm-init, completed) before exiting (including the main session and subagent sub-sessions consumed by this step); report to the user that the initialization phase is fully complete, including: the initialization mode (empty project/existing project), the list of produced files, the executing roles of each step (PM/SCM/SA/BA/DBA/TL/TE), the location of the version progress table, and suggestions for the next step.

## Deliverables
- The version directory docs/{project English abbreviation}-v0.0.1/ and all its initialization documents
- Master documents docs/project.md, docs/sad.md, docs/{project English abbreviation}-urs.md, docs/{project English abbreviation}-prd.md, docs/{project English abbreviation}-api.md, docs/{project English abbreviation}-dbd.md, docs/{project English abbreviation}-dbd.sql, docs/{project English abbreviation}-lld.md, docs/{project English abbreviation}-testcase.md
- Task list docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-task-v0.0.1.json
- Version progress table version_progress.md
- .gitignore and the git initial commit record
- Automated test scripts scripts/API-TEST/

## Completion tips
- The initialization phase is fully complete; there are no subsequent steps.
- To view the version progress, please view version_progress.md in the version directory.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
