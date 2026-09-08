---
name: impm-rtm-create
description: Establish a requirement traceability matrix (RTM), record the many-to-many relationships among the URS requirements, the PRD user stories, the LLD design and the tasks, and generate rtm.md.
---

# impm-rtm-create skill

## Trigger words
requirement traceability matrix, RTM, traceability matrix, requirement tracking, requirement trace, impm-rtm-create

## When to use
Used when the task list generation is complete (after impm-task-create). According to the current version's URS (docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-urs-v{Current Version}.md), PRD (docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-prd-v{Current Version}.md), LLD (docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-lld-v{Current Version}.md) and the task list (docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-task-v{Current Version}.json), establish the "requirement → design → task" many-to-many traceability matrix, write it to docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-rtm-v{Current Version}.md, and record this step in the version progress file.

## Execution role
This skill is executed by the Tech Lead (subagent_type=tl) subagent, loading this skill with the Skill tool.

## Scheduling instructions (must be followed when the PM/upper-level orchestrator starts this skill)
1. Startup method: use the task tool to start the subagent, with subagent_type that must be `tl`; the PM or the orchestrator is forbidden to execute the content of this skill by itself.
2. The prompt must carry the context (all are required): the absolute path of the project root (projectRoot), the Project Abbreviation ({Project Abbreviation}), the current version number ({Current Version}), the raw user input $ARGUMENTS (including the file paths the user mentioned), the skill name (impm-rtm-create, the subagent must first load this skill with the Skill tool and then execute it).
3. Completion requirement: after waiting for the subagent to return its completion result, verify the produced files and the version_progress.md progress records; only proceed to the next step when all are correct.

## Key variable definitions and values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to construct all document paths | Read from docs/project.md via impm_project_info |
| Current Version | The version number of the current execution | Obtained via impm_version action=current, or inferred from the version directory name |

## Execution requirements
1. Strictly execute in the order and content of the execution steps in sequence: do not skip, do not reorder, do not parallelize, do not merge any step.
2. Only perform the operations defined by this skill; do not do work unrelated to the task.
3. All document paths must be constructed with {Project Abbreviation} and {Current Version}; do not invent file names.
4. Use the impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. After each step is complete, verify that the produced files exist and the content is correct.

## Execution steps

### Step 1: Read the template
Call impm_template_reader to read the template RTM-TEMPLATE.MD, and clarify the section structure and the filling format of the requirement traceability matrix (the requirement/user story list, the many-to-many trace records, the coverage check, the issue list).

### Step 2: Collect the traceability basis
Call impm_doc_reader to read:
1. The current version URS document docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-urs-v{Current Version}.md, and extract the original requirement IDs (FR-xxx, NFR-xxx; IDs are globally unique across the project, formatted as `prefix-v{version}-sequence`, e.g. FR-v0.0.1-001) and their names, description summaries and priorities;
2. The current version PRD document docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-prd-v{Current Version}.md, and extract the user story IDs (US-xxx; IDs are globally unique across the project, e.g. US-v0.0.1-001) and their story descriptions;
3. The current version LLD document docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-lld-v{Current Version}.md, and extract the design content (module division, core business processes, business rules, etc., as the design trace objects);
4. The current version task list docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-task-v{Current Version}.json; obtain each task via impm_doc_reader (docType=task) or impm_task_manager (action=query); extract the task ID (TASK-xxx), the task title (title), userStoryId and apiId, to verify the correspondence between the tasks and the requirements/user stories.

### Step 3: Establish the complete set of requirements/user stories
Summarize the original requirements (FR-xxx / NFR-xxx) and the PRD user stories (US-xxx; all IDs are globally unique by version number) collected in step 2, deduplicate them, and fill them into the "1. Requirement/User Story List" section of the template to form the complete set of this version's requirements/user stories. Record the ID, type (URS requirement/PRD user story), name, description summary and priority of each entry.

### Step 4: Establish the many-to-many traceability matrix
According to the "2. Traceability Matrix" section of the template, establish the following association records (many-to-many; one association is one row; the same requirement/user story may correspond to multiple rows):
1. Requirement/user story → design: associate the LLD design content (module/process) for each requirement/user story together with the module division, business processes and core business logic of the LLD, generate records, and mark the coverage status (covered/missing);
2. Requirement/user story → task: associate the tasks with their corresponding requirements/user stories according to the userStoryId of each task in the task list (the user story US-xxx is directly associated through userStoryId; the original requirements FR-xxx / NFR-xxx are associated by matching the task description, acceptanceCriteria and the requirement description; one task can be associated with multiple requirements/user stories, and one requirement/user story can also be covered by multiple tasks), generate records, and mark the coverage status;
3. Assign a unique record ID (RTM-001, RTM-002, ...) to each record.
Call impm_doc_writer (docType=rtm, target=version) to write docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-rtm-v{Current Version}.md.

### Step 5: Perform the coverage completeness check and generate the issue list
According to the "3. Coverage Completeness Check" section of the template, verify whether each requirement/user story has a design, whether it has a task, and whether it has test cases (the test cases have not been generated yet at this stage; the test coverage is temporarily marked as "no/missing", and will be backfilled after the test cases are associated in the impm-regression-test stage):
- If a requirement/user story lacks a design (there is no corresponding module/process in the LLD) or lacks a task (no task in the task list covers it), mark the corresponding issue in the "Issue Mark" column;
- Fill the items that fail the check into the "4. Issue List" section of the template, give the issue description and the handling suggestion, and mark the status as "pending".
Call impm_doc_writer (docType=rtm, target=version, expectedBase=the full text after step 4 was written) to write the complete rtm.md containing the check result and the issue list back, overwriting it.

### Step 6: Record the progress
Call impm_progress (action=add, stepName=impm-rtm-create, status=completed) to insert a new row at the first row of the table in the version progress file docs/{Project Abbreviation}-v{Current Version}/version_progress.md.
Verify that the produced file exists and the content is correct, and that the progress row has been recorded.

## Deliverables
- docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-rtm-v{Current Version}.md (the requirement traceability matrix, including the requirement/user story list, the many-to-many trace association records, the coverage completeness check and the issue list)

## Notes after completion
- To continue with the next step, enter /impm-analysis-commit
- To continue executing all the remaining steps of this stage, enter /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->