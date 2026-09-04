---
name: impm-task-coding-code
description: Implements the coding by task taskType via the BEE/FEE/SSE subagent, aiming for simplicity and clarity, and verifies requirement coverage and logical correctness.
---

# impm-task-coding-code Skill

## Trigger Words
- Coding implementation
- Write code
- code

## When to Use
Use after the current task's context, database design, API design, and test cases are ready, when the coding needs to be implemented by task taskType.

## Execution Role
This skill is executed by the sse, fee, and bee subagents, loading this skill with the Skill tool for execution. The dispatcher (impm-task-coding) selects the corresponding role by task taskType: common→sse, frontend→fee, backend→bee.

## Dispatch Notes (must be followed by the PM/impm-task-coding when launching this skill)
1. Launch method: launch the subagent with the task tool; subagent_type is determined by the task taskType: common→`sse`, frontend→`fee`, backend→`bee`; the dispatcher may not execute this skill's content on its own.
2. The prompt must carry the required context (none may be missing): the absolute path of the project root (projectRoot), the project abbreviation ({Project Abbreviation}), the current version ({Current Version}), the task ID (taskId), the skill name (impm-task-coding-code, requiring the subagent to load this skill with the Skill tool before executing), and the task taskType.
3. Completion requirement: after the subagent returns its completion result, verify the code outputs and the requirement coverage; only proceed to the next step when everything is correct.

## Key Variable Definitions and Values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to assemble all document paths | Read from docs/project.md via impm_project_info |
| Current Version | The version number currently being executed | Obtain via impm_version action=current, or infer from the version directory name |
| Task ID | The task ID currently being executed (e.g., TASK-001) | Passed by the dispatcher (PM/upper-level skill) |

## Execution Requirements
1. Strictly execute in the content and order of the execution steps: do not skip, reorder, parallelize, or merge any step.
2. Only perform the operations specified by this skill; do not do work unrelated to the task.
3. All document paths must be assembled with {Project Abbreviation}, {Current Version}, and {Task ID}; do not fabricate file names.
4. Use impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. After each step completes, verify that the output files exist and the content is correct.
7. This skill is part of the coding workflow; it can only be dispatched by impm-task-coding or impm-coding and cannot run independently without a version number and task ID.

## Execution Steps
### Step 1: Receive the Version and Task ID
Receive the current version and task ID ({Task ID}, e.g., TASK-001) passed by the dispatcher.

### Step 2: Read the Task Context
Call impm_doc_reader (docType=context, docType=cs, docType=ws, taskId={Task ID}) to read context.md, cs.md, and ws.md in the task directory.

### Step 3: Confirm the Execution Role
Determine the role's responsibility based on the requirement content:
- If the requirement involves frontend and backend and is a backend business requirement, the BEE subagent executes this skill (responsible for the backend business code);
- If the requirement involves frontend and backend and is a frontend business requirement, the FEE subagent executes this skill (responsible for the frontend business code);
- If the requirement involves no frontend/backend business, the SSE subagent executes this skill (responsible for common/server-side generic code);
- The dispatch is determined by impm-task-coding by task taskType; the body of this skill has already described the responsibilities of the three role branches.

### Step 4: Read the Database Design Files
Call impm_doc_reader (docType=dbd, target=main), (docType=dbd, target=version), and (docType=sql, target=version) to read the database design files; skip reading if the files do not exist.

### Step 5: Read the API Design Files
Call impm_doc_reader (docType=api, target=main) and (docType=api, target=version) to read the API design files; skip reading if the files do not exist.

### Step 6: Read the Test Cases
Call impm_doc_reader (docType=testcase, taskId={Task ID}) to read the current task's test cases.

### Step 7: Write the Code
Write the code based on the content of the above files. Keep the coding simple and the logic clear, with moderate function and file sizes, avoiding overly long functions and overly long code files.

### Step 8: Self-check Format and Structure
After writing, first check whether the code has obvious formatting or syntax issues, whether the functional division of functions and files is appropriate, and whether the structure is clear and highly readable.

### Step 9: Verify Requirement Coverage
Then check whether the code covers all the requirements in the reference context, item by item against the requirement points in context.md.

### Step 10: Check for Logic Flaws
Finally, check whether the code logic has flaws and issues (exception handling, boundary conditions, resource release, concurrency safety, etc.).

### Step 11: Supplement Materials as Needed
If needed during coding, you may also read docs/{Project Abbreviation}-sad.md and docs/project.md, or call CS/WS to get more existing code information and related materials.

### Step 12: Record Completion
Call impm_progress (action=add, stepName=impm-task-coding-code, status={Task ID}-completed).

## Deliverables
- The coding implementation files corresponding to the current task
- The progress record in version_progress.md

## After Completion
- After completing all operations of this skill, you must immediately end and return to the dispatcher: the list of output file paths and the progress status of this skill in version_progress.md; you must not continue to subsequent phases or tasks on your own, nor wait for further instructions; subsequent dispatch is the responsibility of the dispatcher (PM).
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->