---
name: impm-sprint-code
description: Agile sprint coding sub-skill; the SSE/FEE/BEE directly implement the coding by the task's taskType, skipping the context/cs/ws/testcase prerequisite sub-skills; the requirement context is passed in directly by the orchestration skill.
---

# impm-sprint-code skill

## Trigger words
- agile coding
- sprint coding
- quick coding
- sprint-code

## When to use
After the impm-sprint orchestration skill (stage 3) obtains the next executable task, when the coding of that task needs to be implemented quickly. This skill is dedicated to the agile process; it skips the context/cs/ws/testcase prerequisite sub-skills of waterfall coding, and the scheduling party passes the requirement context in directly.

## Execution role
This skill is executed by the sse, fee and bee subagents, loading this skill with the Skill tool. The scheduling party (impm-sprint) selects the corresponding role by the task taskType: common→sse, frontend→fee, backend→bee.

## Scheduling instructions (must be followed when the PM/impm-sprint starts this skill)
1. Startup method: use the task tool to start the subagent, with subagent_type decided by the task taskType: common→`sse`, frontend→`fee`, backend→`bee`; the scheduling party is forbidden to execute the content of this skill by itself.
2. The prompt must carry the context (all are required): the absolute path of the project root (projectRoot), the Project Abbreviation ({Project Abbreviation}), the current version number ({Current Version}), the task ID (taskId), the skill name (impm-sprint-code, the subagent must first load this skill with the Skill tool and then execute it), the task taskType, the requirement brief highlights (the requirement description and acceptance criteria of this task).
3. Completion requirement: after waiting for the subagent to return its completion result, verify the code output and the requirement coverage; only proceed to the next step when all are correct.

## Key variable definitions and values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to construct all document paths | Read from docs/project.md via impm_project_info |
| Current Version | The version number of the current execution | Passed in by the scheduling party (PM) |
| Task ID | The task ID of the current execution (e.g., TASK-001) | Passed in by the scheduling party (PM) |
| Requirement brief highlights | The requirement description and acceptance criteria of this task | Passed in by the scheduling party (PM) |

## Execution requirements
1. Strictly execute in the order and content of the execution steps in sequence: do not skip, do not reorder, do not parallelize, do not merge any step.
2. Only perform the operations defined by this skill; do not do work unrelated to the task.
3. Use the impm_* tools to obtain information; do not fabricate tool results.
4. Use English throughout.
5. This skill is part of the agile process and can only be scheduled and executed by impm-sprint; it cannot be executed alone without a version number and a task ID.

## Execution steps
### Step 1: Receive the context
Receive the current version number, the task ID and the requirement brief highlights passed in by the scheduling party, and confirm that the task exists (it can be verified with impm_task_manager action=query).

### Step 2: Read the requirement brief
Call impm_doc_reader (docType=urs, target=version) to read the requirement brief docs/{Project Abbreviation}-v{Current Version}/{Project Abbreviation}-urs-v{Current Version}.md, and clarify the requirement scope and the acceptance criteria of this task together with the requirement brief highlights passed in by the scheduling party.

### Step 3: Query the existing code (as needed)
Use the read/grep/glob tools directly to query the related code and the reusable modules in this project (do not start the cs subagent); if the project has master documents such as docs/sad.md, docs/{Project Abbreviation}-api.md, docs/{Project Abbreviation}-dbd.md, read the sections related to this task as needed.

### Step 4: Write the code
Write the code according to the requirement brief and the existing code; the coding should be as simple and clear as possible, with appropriately sized functions and files, avoiding overlong functions and overlong code files; cover the acceptance criteria in the requirement brief one by one.

### Step 5: Self-check the quality
After writing, check: whether the code has obvious formatting or syntax problems; whether the logic has holes (exception handling, boundary conditions, resource release, concurrency safety, etc.); whether all the acceptance criteria in the requirement brief are covered.

### Step 6: Record the completion
Call impm_progress (action=add, stepName=impm-sprint-code, status={task ID}-completed).

## Deliverables
- The coding implementation files for the current task
- The progress records in version_progress.md

## Notes after completion
- After all the operations of this skill are complete, it must end immediately and return to the scheduling party: the list of produced file paths and the progress status of this skill in version_progress.md; it is strictly forbidden to continue executing subsequent stages or subsequent tasks by yourself, and strictly forbidden to wait for later instructions; the subsequent scheduling is the responsibility of the scheduling party (PM/impm-sprint).
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->