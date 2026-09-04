---
name: impm-sprint
description: impm agile sprint development orchestration skill; completes one sprint cycle in 6 lightweight steps (requirement brief, version & tasks, coding, testing, summary & archive, commit & merge), skipping the six design documents URS/PRD/SAD/DBD/API/LLD and the task-level context/cs/ws/testcase documents; the PM directly executes lightweight operations to reduce token consumption and the number of steps; the summary step also maintains the agile requirement summary master document under the docs root (docs/{Project Abbreviation}-sprint.md) for review reference.
---

# impm-sprint skill

## Trigger words
- /impm-sprint
- agile sprint
- agile development
- lightweight iteration
- sprint

## When to use
After the project has been initialized (docs/project.md and docs/sad.md both exist and are non-empty), when the user needs to quickly complete a small-batch iteration requirement and wants fewer steps, lower token consumption and higher speed, while still keeping the necessary document records for review.

## Execution role
This skill is executed (orchestrated) by the Project Manager (main-controller Agent), loading this skill with the Skill tool. The steps that the PM executes directly (requirement brief, version & tasks, summary & archive) do not start a subagent; the remaining steps dispatch the corresponding subagent for execution according to the "General Scheduling Requirements" below.

## General Scheduling Requirements (all sub-steps of this skill must follow)
1. Startup method: in the coding step, use the task tool to start the corresponding subagent (subagent_type is decided by the task taskType: common→`sse`, frontend→`fee`, backend→`bee`) to execute the impm-sprint-code skill; start `te` in the testing step to execute the impm-sprint-test skill; start `scm` in the commit & merge step to execute the impm-git-merge skill (reuse the existing skill). Steps that the PM executes directly are forbidden to start a subagent.
2. The task prompt must carry the context (all are required): the absolute path of the project root (projectRoot), the Project Abbreviation ({Project Abbreviation}), the current version number ({Current Version}), the raw user input $ARGUMENTS (including the file paths the user mentioned), the skill name (the subagent must first load the skill with the Skill tool and then execute it), the task ID ({task ID}, applicable to the coding step), the requirement brief highlights ({requirement brief highlights}, applicable to the coding step).
3. task prompt template (fill it in for each sub-step according to this):
   "Act as {the subagent name} (subagent_type={x}) to execute impm's {skill name} skill; first load the skill {skill name} with the Skill tool; the mandatory context: project root={absolute path}, Project Abbreviation={abbreviation}, current version number={version number}, user input={raw text}, task ID={taskId}, requirement brief highlights={highlights}; after completing all operations according to the skill execution steps, return: the list of produced file paths and the progress status of {skill name} in version_progress.md."
4. Completion check: after each subagent returns, verify that the produced files exist and version_progress.md has recorded the status of that step; only proceed to the next step when all are correct.
5. Order discipline: strictly follow the order — do not skip, do not reorder, do not parallelize, do not merge; when any sub-step fails, first locate the cause, roll back and redo if necessary, and never bypass it.

### Sub-step subagent mapping table (impm-sprint)
| Sub-step | Skill name | subagent_type |
|----|----|----|
| Stage 1 Requirement brief | PM executes directly | — |
| Stage 2 Version & tasks | PM executes directly | — |
| Stage 3 Coding | impm-sprint-code | sse/fee/bee (by taskType) |
| Stage 4 Testing | impm-sprint-test | te |
| Stage 5 Summary & archive | PM executes directly | — |
| Stage 6 Commit & merge | impm-git-merge (reused) | scm |

## Key variable definitions and values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to construct all document paths | Read from docs/project.md via impm_project_info |
| Current Version | The version number of the current execution (the largest version's z value +1) | Obtained via impm_version action=current/next |
| Requirement brief highlights | The highlights of this sprint's requirement compiled in Stage 1, passed to the coding step | Product of Stage 1 |

## Execution requirements
1. Strictly execute in the order and content of the execution steps in sequence: do not skip, do not reorder, do not parallelize, do not merge any step.
2. Only perform the operations defined by this skill; do not do work unrelated to the task.
3. All document paths must be constructed with {Project Abbreviation} and {Current Version}; do not invent file names.
4. Use the impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. After each step is complete, verify that the produced files exist and the content is correct.

## Execution steps
### Step 1: Pre-check (PM executes directly)
Call impm_isinit(projectRoot) to determine whether the project has been initialized:
- If initialized=false: prompt the user "The project has not been initialized, please run /impm-init first", end this skill, and create no files.
- If initialized=true: continue to step 2.

### Step 2: Requirement brief (PM executes directly)
1. Call impm_template_reader(projectRoot, SPRINT-REQUIREMENT-TEMPLATE.MD) to read the agile requirement brief template.
2. If the user input $ARGUMENTS already contains the requirement description, organize it directly; otherwise ask the user about the requirement of this sprint (description, acceptance criteria, impact scope).
3. Organize the requirement into a brief (requirement overview, acceptance criteria, impact scope, task decomposition suggestion), and call impm_doc_writer (docType=urs, target=version) to write the version document docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-urs-v{Current Version}.md (the content adopts the agile brief format).
4. Call impm_progress (action=add, stepName=impm-sprint-requirement, status=completed) to record the completion of this step.

### Step 3: Version & tasks (PM executes directly)
1. Call impm_version (action=current) to get the current largest version number under docs; call impm_version (action=next) to add 1 to the largest version's z value to get the current version number.
2. Call impm_git (action=branch, branchName={Project Abbreviation}-v{Current Version}) to create and switch to the version branch.
3. Call impm_version (action=init, hintVersion={Current Version}) to create the version directory docs/{Project Abbreviation}-v{Current Version}.
4. Call impm_progress (action=init) to create version_progress.md.
5. Call impm_template_reader(projectRoot, TASK-TEMPLATE.json) to read the task list template.
6. Decompose the tasks directly based on the requirement brief: embed the requirement details and the acceptance criteria in the task description field (not relying on the SAD/DBD/API/LLD design documents), fill in taskType by the nature of the task (common/frontend/backend), and fill in up/downstream by the dependency relationships between the tasks.
7. Call impm_task_manager (action=init, taskListJson={task list}) to validate and write docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-task-v{Current Version}.json.
8. Call impm_progress (action=add, stepName=impm-sprint-version-task, status=completed) to record the completion of this step.

### Step 4: Coding (start sse/fee/bee per task)
1. Call impm_task_manager (action=query) to read all the tasks whose status is not "completed" in the task list, and confirm the count and the up/downstream relationships.
2. Loop execution: call impm_task_manager (action=next) to get the next executable task (not completed and all of whose upstream tasks are completed); if no task is returned, jump to step 5.
3. Start the corresponding subagent with the task tool according to the task taskType (common→sse, frontend→fee, backend→bee) to execute the impm-sprint-code skill; the prompt carries the context according to the "General Scheduling Requirements" (including the task ID and the requirement brief highlights).
4. After the coding completes, verify the produced files, and call impm_task_manager (action=update, taskId={task ID}, status=completed) to update the task status; return to step 4.2 to continue with the next task.
5. After all the tasks are complete, call impm_progress (action=add, stepName=impm-sprint-code, status=completed) to record the completion of this step.

### Step 5: Testing (start te)
1. Use the task tool to start the te subagent to execute the impm-sprint-test skill; the prompt carries the context according to the "General Scheduling Requirements" (including the scope of this sprint's task list).
2. After all the tests pass, call impm_progress (action=add, stepName=impm-sprint-test, status=completed) to record the completion of this step.

### Step 6: Summary & archive (PM executes directly)
1. Call impm_template_reader(projectRoot, SPRINT-SUMMARY-TEMPLATE.MD) to read the agile summary template.
2. Summarize this sprint's change summary and task completion status (read from the task JSON), and the test results (read from the regression document).
3. Call impm_doc_writer (docType=review, target=version) to write docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-review.md (the content adopts the agile summary format).
4. Maintain the master document docs/{Project Abbreviation}-sprint.md under the docs root (summary of all agile requirements):
   - Call impm_template_reader(projectRoot, SPRINT-MASTER-TEMPLATE.MD) to read the master document template;
   - If docs/{Project Abbreviation}-sprint.md does not exist: create it with the built-in read/write tools according to the template, filling in this sprint's requirement overview, acceptance criteria, task completion status, test results and verification records;
   - If it already exists: use the built-in read/write tools to append a section for this sprint at the end of the file (following the "Sprint {Version}" section structure of the template), preserving the historical records;
   - Note: the master document is not within the standard docType path system of impm_doc_writer; maintain it directly with the built-in file tools (the same strategy as the hotfix master document docs/{Project Abbreviation}-hotfix.md).
5. Call impm_progress (action=add, stepName=impm-sprint-summary, status=completed) to record the completion of this step.

### Step 7: Commit & merge (start scm, reuse impm-git-merge)
1. Use the task tool to start the scm subagent to execute the impm-git-merge skill (the prompt carries the context according to the "General Scheduling Requirements"), merging the version branch into the main branch with git merge --squash and committing.
2. After completion, verify that the main-branch merge commit exists, and call impm_progress (action=add, stepName=impm-sprint, status=completed) to record the completion of this skill; then call impm_progress (action=finalize) to settle the total duration and tokens of the last row in the progress table (impm-sprint, completed) before exiting.

### Step 8: Report to the user
Report the completion of this sprint to the user: the current version number, the total number of tasks and the number completed, the list of produced files, the git merge commit record, the document retention locations (requirement brief/summary/test results/the agile requirement summary master document docs/{Project Abbreviation}-sprint.md under the docs root), and remind of any remaining items (if formal design documents need to be supplemented, the corresponding steps of /impm-docs can be run manually).

## Deliverables
- docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-urs-v{Current Version}.md (agile requirement brief, reusing the urs path)
- docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-task-v{Current Version}.json (task list, with the requirements and acceptance criteria embedded in the descriptions)
- docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-review.md (agile summary, reusing the review path)
- docs/{Project Abbreviation}-v{Current Version}/regression-api-test.md (test results, produced by impm-sprint-test)
- docs/{Project Abbreviation}-sprint.md (the agile requirement summary master document under the docs root; one section is appended per sprint)
- The implemented code, test functions and test scripts
- The version_progress.md progress records, the git branch and the squash merge commit record

## Notes after completion
- This agile sprint is complete. If formal design documents (URS/PRD/SAD/DBD/API/LLD) need to be supplemented, please run the corresponding step of /impm-docs manually.
- To view the version progress, please view version_progress.md in the version directory.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->