---
name: impm-init-review
description: Orchestrates all 13 steps of the initialization phase (impm-init-isinit, impm-init-git, impm-init-project, impm-init-version, impm-init-urs, impm-init-prd, impm-init-sad, impm-init-dbd, impm-init-api, impm-init-lld, impm-init-task, impm-init-testcase, impm-init-commit), and after each of the project/urs/prd/sad/dbd/api/lld/task/testcase document generation steps, first extracts a document summary and displays it in the conversation dialog, then pops up a prompt box asking the user to review the document, proceeding to the next step only after the review is approved. Use when the user enters /impm-init-review or asks to initialize an impm project with per-document review.
---

# impm-init-review Skill

## Trigger words
- /impm-init-review
- initialize
- initialize project
- start initialization phase
- impm initialization flow (with review)
- initialization phase review

## When to use
- When the user enters /impm-init-review, asking to execute the impm project initialization phase and review each document one by one.
- When the user asks to initialize the current project (generating documents such as project, urs, prd, sad, dbd, api, lld, testcase) and requires each document to be reviewed and confirmed by the user before continuing to the next step.
- This skill follows the same steps as impm-init; the difference is that the 9 document generation steps (project/urs/prd/sad/dbd/api/lld/task/testcase) each have a "user review confirmation" round inserted after completion (first extract and display the document summary, then pop up a prompt box).

## Executing role
This skill is executed (orchestrated) by the Project Manager (master Agent). When executing, load this skill using the Skill tool. Internal sub-steps must dispatch the corresponding subagent for execution according to the "General scheduling requirements" below; the PM only schedules, checks, and makes decisions; **the user review confirmation rounds (including document summary extraction and display) are executed directly by the PM and do not dispatch subagents**.

## General scheduling requirements (all sub-steps of this skill must comply)
1. Startup method: each sub-step starts the corresponding subagent through the task tool (subagent_type must exactly match the table below) to execute the corresponding skill; the PM is prohibited from performing specific tasks in place of the subagent (the only exception: steps marked "PM directly executes" in the table and the user review confirmation rounds).
2. The task prompt must pass the context (none may be missing): the absolute path of the project root directory (projectRoot), project English abbreviation ({project English abbreviation}), current version number ({current version number}), the original user input $ARGUMENTS (including file paths mentioned by the user), the skill name (require the subagent to first load the skill using the Skill tool before executing), and the task number ({task number}, applicable in the coding phase).
3. Task prompt template (fill in each sub-step accordingly):
   "Execute the impm {skill name} skill as {subagent English name} (subagent_type={x}); first load the skill {skill name} using the Skill tool; context that must be carried: project root={absolute path}, project English abbreviation={abbreviation}, current version number={version number}, user input={original}, task number={taskId} (if applicable); after completing all operations according to the skill execution steps, return: the list of produced file paths and the progress status of {skill name} in version_progress.md."
4. Completion check: after each subagent returns, verify that the produced files exist and version_progress.md has recorded the step status; only proceed to the next step when all are correct.
5. Order discipline: strictly follow the order, do not skip, do not reorder, do not run in parallel, do not merge; when any sub-step fails, first locate the cause, and if necessary roll back and redo; do not bypass.

### Sub-step subagent mapping table (impm-init-review)
| Sub-step | Skill name | subagent_type | User review required |
|----|----|----|----|
| a | impm-init-isinit | PM directly executes | No |
| b | impm-init-git | scm | No |
| c | impm-init-project | sa | Yes |
| d | impm-init-version | sa | No |
| e | impm-init-urs | ba | Yes |
| f | impm-init-prd | ba | Yes |
| g | impm-init-sad | sa | Yes |
| h | impm-init-dbd | dba | Yes |
| i | impm-init-api | sa | Yes |
| j | impm-init-lld | tl | Yes |
| k | impm-init-task | tl | Yes |
| l | impm-init-testcase | te | Yes |
| m | impm-init-commit | scm | No |

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
7. **The user review confirmation rounds must wait for the user's explicit reply before continuing**: when the review is not approved, do not proceed to the next step; regenerate the document per the user's feedback and review it again.

## User review confirmation round (executed directly by the PM)

### Step 1: Document summary extraction and display (pre-prompt, PM directly executes)
Before each review prompt box is triggered, the PM must first extract a concise summary of the document under review and display it as plain text directly in the current conversation for the user to quickly preview. Requirements:
1. Read the document: use the read tool (or impm_doc_reader) to read the full text of the just-generated document (prefer reading the complete version document in the version directory; for master-document-only reads, read the master document).
2. Extract summary: distill a concise summary, generally including: document title and full path, document chapter structure, core content highlights (e.g., project basic information, requirement objectives and key requirements, architecture decisions and module division, data table/field lists, API lists, task list scope and categories, test case scope, etc.).
3. Display method: output the summary as text directly into the conversation (for user quick preview only, **do not write to any file**); keep it concise, highlight key information, and avoid copying the full text.

### Step 2: Pop up review prompt box (question tool)
**Review option design** (question tool):
- header: `Review {document abbreviation}`
- question: `Generated {full document path} (summary has been displayed in the conversation above). Please review the document. Only after the review is approved will we proceed to the next step; if changes are needed, select "Needs Changes" and provide the revision feedback.`
- options:
  - `Approved` (description: The document content is correct; confirm to proceed to the next step)
  - `Needs Changes` (description: The document has issues; after providing revision feedback it will be regenerated and reviewed again)

**Handling logic**:
1. If the user selects "Approved", verify version_progress.md has recorded the corresponding step status as "completed", then go to the next step.
2. If the user selects "Needs Changes" (or provides revision feedback via custom input):
   - The PM consolidates the user's revision feedback and re-dispatches the corresponding document-generation subagent (same subagent_type, same skill) with it as supplementary context to regenerate the document;
   - After the sub-step completes, execute "Step 1: Document summary extraction and display" again (re-extract the new document summary and display it in the conversation) and pop up the prompt box for the user to review, until the user selects "Approved" (if it repeatedly fails to pass, first confirm with the user the feasibility of the revision feedback to avoid pointless to-and-fro);
   - During this period, do not advance to the next step.
3. Note: some steps may be determined as "no database needed / no API needed" (e.g., impm-init-dbd="no database needed", impm-init-api="no API needed"). In this case, skip them following the original impm-init handling, do not trigger the review prompt box (content that needs no review does not pop up), record the progress status truthfully, and proceed to the next step; if the step actually produced a document, the user must still be prompted to review.

## Execution steps
### Step a: execute impm-init-isinit (initialization determination, PM directly executes, does not start a subagent)
Load and execute the impm-init-isinit skill (first load the skill, then execute according to the skill steps): call impm_isinit(projectRoot) to determine whether the current project has been initialized:
- If docs/project.md and docs/sad.md both exist and are non-empty: the project has been initialized, directly skip the entire initialization phase, report the determination conclusion to the user and end this skill, without executing the subsequent steps.
- If it is an empty project: initialize as an empty project, writing the empty structure for each document according to the template.
- If it is an existing project: reverse-engineer and complete each document as an existing project.
After execution, verify the impm-init-isinit progress record in version_progress.md; if the sub-skill has not recorded it (version_progress.md has not yet been created), leave it pending, to be back-filled uniformly by step d (impm-init-version). Pass the determination result (empty project/existing project/initialized) to the subsequent steps as context. (This step does not trigger a user review.)

### Step b: execute impm-init-git (git baseline)
Start an SCM subagent (subagent_type=scm) to execute the impm-init-git skill (the task prompt carries the context according to the "General scheduling requirements" and requires first loading the skill using the Skill tool): have the SCM call impm_git(projectRoot, status) to determine whether it is under git management; if not, call impm_git(projectRoot, init) to bring it under management; create/update .gitignore based on the operating system (Windows) and the project programming language; call impm_git(projectRoot, commit, null, initialize impm project) to make the initial commit.
After completion, verify the .gitignore and the commit record, and verify/back-fill the progress line (impm-init-git, completed). (This step does not trigger a user review.)

### Step c: execute impm-init-project (project master document, with review)
1. Start an SA subagent (subagent_type=sa) to execute the impm-init-project skill: have the SA call impm_template_reader(projectRoot, PROJECT-TEMPLATE.MD) to read the template, and generate docs/project.md (impm_doc_writer docType=project target=main, including project basic information, coding standards, project map, etc.) based on existing documents and code; when information is insufficient, ask the user questions before filling in.
2. After completion, verify that docs/project.md exists and the content is complete, and verify/back-fill the progress line (impm-init-project, completed).
3. **Review confirmation (project)**: per the "User review confirmation round" above, first extract the docs/project.md summary and display it in the conversation dialog, then pop up a prompt box for the user to review; proceed to the next step only after the review is approved.

### Step d: execute impm-init-version (version initialization)
Start an SA subagent (subagent_type=sa) to execute the impm-init-version skill: have the SA call impm_project_info(projectRoot) to obtain the project English abbreviation; call impm_version(projectRoot, init, v0.0.1, {project Chinese name}) to create the version directory docs/{project English abbreviation}-v0.0.1; call impm_progress(projectRoot, {project English abbreviation}, 0.0.1, init, null, null) to create version_progress.md, and back-fill the records of the completed initialization steps (impm-init-isinit, impm-init-git, impm-init-project, impm-init-version are all marked completed).
After completion, verify that the version directory and version_progress.md exist. (This step does not trigger a user review.)

### Step e: execute impm-init-urs (User Requirement Specification, with review)
1. Start a BA subagent (subagent_type=ba) to execute the impm-init-urs skill: have the BA call impm_template_reader(projectRoot, URS-TEMPLATE.MD) to read the template, reverse-engineer or generate the User Requirement Specification according to the empty structure, and use impm_doc_writer docType=urs target=version to write the complete version document docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-urs-v0.0.1.md, then extract a summary and write it to the master document docs/{project English abbreviation}-urs.md (without copying the full content).
2. After completion, verify that the version document has complete content and the master document has summary content, and verify/back-fill the progress line (impm-init-urs, completed).
3. **Review confirmation (URS)**: per the "User review confirmation round" above, first extract the version document summary and display it in the conversation dialog, then pop up a prompt box for the user to review; proceed to the next step only after the review is approved.

### Step f: execute impm-init-prd (Product Requirement Document, with review)
1. Start a BA subagent (subagent_type=ba) to execute the impm-init-prd skill: have the BA call impm_template_reader(projectRoot, PRD-TEMPLATE.MD) to read the template, reverse-engineer or generate the Product Requirement Document according to the project code, documents, and URS, and use impm_doc_writer docType=prd target=version to write the complete version document docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-prd-v0.0.1.md, then extract a summary and write it to the master document docs/{project English abbreviation}-prd.md (without copying the full content).
2. After completion, verify that the version document has complete content and the master document has summary content, and verify/back-fill the progress line (impm-init-prd, completed).
3. **Review confirmation (PRD)**: per the "User review confirmation round" above, first extract the version document summary and display it in the conversation dialog, then pop up a prompt box for the user to review; proceed to the next step only after the review is approved.

### Step g: execute impm-init-sad (System Architecture Design, with review)
1. Start an SA subagent (subagent_type=sa) to execute the impm-init-sad skill: have the SA call impm_template_reader(projectRoot, SAD-TEMPLATE.MD) to read the template, reverse-engineer or generate the System Architecture Design document according to the project code, documents, and PRD, and use impm_doc_writer docType=sad target=main to write docs/sad.md (sad only has the master document, no in-version document).
2. After completion, verify that docs/sad.md exists and the content is complete, and verify/back-fill the progress line (impm-init-sad, completed).
3. **Review confirmation (SAD)**: per the "User review confirmation round" above, first extract the docs/sad.md summary and display it in the conversation dialog, then pop up a prompt box for the user to review; proceed to the next step only after the review is approved.

### Step h: execute impm-init-dbd (database design, with review)
1. Start a DBA subagent (subagent_type=dba) to execute the impm-init-dbd skill: have the DBA determine whether a database is needed based on docs/project.md and docs/sad.md:
   - No database needed: only record the progress line (impm-init-dbd, no database needed), skip document generation, do not trigger review.
   - Database needed: read the DBD-TEMPLATE.MD template, reverse-engineer the database design document and initialization SQL, and use impm_doc_writer docType=dbd and docType=sql to write the version documents and copy them to the master documents docs/{project English abbreviation}-dbd.md and docs/{project English abbreviation}-dbd.sql.
2. After completion, verify that the files exist, and verify/back-fill the progress line (impm-init-dbd, completed).
3. **Review confirmation (DBD)**: if the DBD document was actually produced (status "completed"), per the "User review confirmation round" above, first extract the version document summary and display it in the conversation dialog, then pop up a prompt box for the user to review; if "no database needed", do not pop up and go to the next step.

### Step i: execute impm-init-api (interface design, with review)
1. Start an SA subagent (subagent_type=sa) to execute the impm-init-api skill: have the SA determine whether the project is front-end/back-end separated or has interface integration, and whether interfaces need to be designed, based on docs/project.md and docs/sad.md:
   - No interface needed: only record the progress line (impm-init-api, no interface needed), skip document generation, do not trigger review.
   - Interface needed: read the API-TEMPLATE.MD template, reverse-engineer the interface design document, and use impm_doc_writer docType=api target=main to write the version document and copy it to the master document docs/{project English abbreviation}-api.md.
2. After completion, verify that the file exists, and verify/back-fill the progress line (impm-init-api, completed).
3. **Review confirmation (API)**: if the API document was actually produced (status "completed"), per the "User review confirmation round" above, first extract the version document summary and display it in the conversation dialog, then pop up a prompt box for the user to review; if "no interface needed", do not pop up and go to the next step.

### Step j: execute impm-init-lld (detailed design, with review)
1. Start a TL subagent (subagent_type=tl) to execute the impm-init-lld skill: have the TL call impm_template_reader(projectRoot, LLD-TEMPLATE.MD) to read the template, reverse-engineer or generate the detailed design document of the overall business logic according to the project code, documents, PRD, and SAD, and use impm_doc_writer docType=lld target=main to write the version document and copy it to the master document docs/{project English abbreviation}-lld.md.
2. After completion, verify that both files exist and the content is consistent, and verify/back-fill the progress line (impm-init-lld, completed).
3. **Review confirmation (LLD)**: per the "User review confirmation round" above, first extract the version document summary and display it in the conversation dialog, then pop up a prompt box for the user to review; proceed to the next step only after the review is approved.

### Step k: execute impm-init-task (task list, with review)
1. Start a TL subagent (subagent_type=tl) to execute the impm-init-task skill: have the TL call impm_template_reader(projectRoot, TASK-TEMPLATE.json) to read the template, reverse-engineer the task list according to the PRD, LLD, SAD, and API documents, and use impm_task_manager action=init to validate and write the version document docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-task-v0.0.1.json.
2. After completion, verify that the file exists and the JSON format is correct, and verify/back-fill the progress line (impm-init-task, completed).
3. **Review confirmation (task list)**: per the "User review confirmation round" above, first extract the task list summary and display it in the conversation dialog, then pop up a prompt box for the user to review; proceed to the next step only after the review is approved.

### Step l: execute impm-init-testcase (test cases and test scripts, with review)
1. Start a TE subagent (subagent_type=te) to execute the impm-init-testcase skill: have the TE call impm_template_reader(projectRoot, TESTCASE-TEMPLATE.MD) to read the template, determine the test cases according to the project code, documents, PRD, and LLD, use impm_doc_writer docType=testcase target=main to write the version document docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-testcase-v0.0.1.md and copy it to the master document docs/{project English abbreviation}-testcase.md; complete the writing of test functions according to the cases, and generate Postman Collection v2.1 API test cases (in the version directory docs/{project English abbreviation}-v0.0.1/, executed with scripts/API-TEST/run_api_test.py).
2. After completion, verify that the documents and scripts exist, and verify/back-fill the progress line (impm-init-testcase, completed).
3. **Review confirmation (test cases)**: per the "User review confirmation round" above, first extract the test case document summary and display it in the conversation dialog, then pop up a prompt box for the user to review; proceed to the next step only after the review is approved.

### Step m: execute impm-init-commit (final commit)
Start an SCM subagent (subagent_type=scm) to execute the impm-init-commit skill: have the SCM call impm_git(projectRoot, status) to confirm the working tree status, and call impm_git(projectRoot, commit, null, {project English abbreviation}-v0.0.1-initialize impm project) to commit all initialization content.
After completion, verify that the commit succeeded. (This step does not trigger a user review.)

### Step n: record orchestration completion and report
Call impm_progress(projectRoot, {project English abbreviation}, {current version number}, add, impm-init-review, completed) to record the completion of this orchestration skill; then call impm_progress(projectRoot, {project English abbreviation}, {current version number}, finalize, null, null) to settle the total duration and tokens of the last row of the progress table (impm-init-review, completed) before exiting (including the main session and subagent sub-sessions consumed by this step); report to the user that the initialization phase is fully complete, including: the initialization mode (empty project/existing project), the list of produced files, the executing roles of each step (PM/SCM/SA/BA/DBA/TL/TE), the review result of each document, the location of the version progress table, and suggestions for the next step.

## Deliverables
- The version directory docs/{project English abbreviation}-v0.0.1/ and all its initialization documents
- Master documents docs/project.md, docs/sad.md, docs/{project English abbreviation}-urs.md, docs/{project English abbreviation}-prd.md, docs/{project English abbreviation}-api.md, docs/{project English abbreviation}-dbd.md, docs/{project English abbreviation}-dbd.sql, docs/{project English abbreviation}-lld.md, docs/{project English abbreviation}-testcase.md
- Task list docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-task-v0.0.1.json
- Version progress table version_progress.md
- .gitignore and the git initial commit record
- Postman Collection v2.1 API test cases (version directory) and runner scripts/API-TEST/run_api_test.py
- User review confirmation records after each document was generated (completed in conversation, summaries not persisted to disk)

## Completion tips
- The initialization phase is fully complete (including per-document review); there are no subsequent steps.
- To view the version progress, please view version_progress.md in the version directory.
- To run the standard initialization without document review, enter /impm-init.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
