---
name: impm-task-coding-code
description: Implements the coding according to the task's taskType via the BEE/FEE/SSE subagent, aiming for simplicity and clarity, and verifies requirement coverage and logical correctness.
---

# impm-task-coding-code Skill

## Trigger Words
- Coding implementation
- Write code
- code

## When to Use
Use this skill when the context, database design, API design, and test cases of the current task are ready, and the coding needs to be implemented according to the task's taskType.

## Executing Agent
This skill is executed by the sse, fee, and bee subagents. Load this skill with the Skill tool when executing. The dispatcher (impm-task-coding) selects the corresponding agent according to the task's taskType:
- taskType=backend: executed by the bee subagent;
- taskType=frontend: executed by the fee subagent;
- taskType=common: executed by the sse subagent.

## Key Variables and How to Get Them
| Variable | Description | How to Get |
| Chinese project name | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| English project name | The English name of the project | Read from docs/project.md via impm_project_info |
| Project abbreviation | The English abbreviation of the project, used to build all document paths | Read from docs/project.md via impm_project_info |
| Current version | The version number currently being executed | Get via impm_version action=current, or infer from the version directory name |
| Task ID | The ID of the task currently being executed (e.g., TASK-001) | Passed in by the dispatcher (PM/upper-level skill) |

## Execution Requirements
1. Follow the steps strictly in the order given in the Execution Steps: no skipping, no out-of-order execution, no parallel execution, no merged execution of any step.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths must be built from {project abbreviation}, {current version}, and {task ID}; never invent file names.
4. Use impm_* tools to obtain information; never fabricate tool results.
5. Use English throughout.
6. After each step, verify that the produced files exist and their content is correct.
7. This skill is part of the coding workflow and can only be dispatched by impm-task-coding or impm-coding; it cannot run standalone without a version number and a task ID.

## Execution Steps
### Step 1: Receive the version number and task ID
Receive the current version number and task ID ({task ID}, e.g., TASK-001) passed in by the dispatcher.

### Step 2: Read the task context
Call impm_doc_reader (docType=context, docType=cs, docType=ws, taskId={task ID}) to read context.md, cs.md, and ws.md in the task directory.

### Step 3: Confirm the executing agent
Determine the agent's responsibilities based on the requirement content:
- If it is a backend business requirement of a frontend/backend project, the BEE subagent executes this skill (responsible for backend business code);
- If it is a frontend business requirement of a frontend/backend project, the FEE subagent executes this skill (responsible for frontend business code);
- If it is not a frontend/backend business requirement, the SSE subagent executes this skill (responsible for common/server-side general code);
- The dispatch is decided by impm-task-coding according to the task's taskType; this skill body has clearly described the responsibilities of the three agent branches.

### Step 4: Read the database design files
Call impm_doc_reader (docType=dbd, target=main), (docType=dbd, target=version), and (docType=sql, target=version) to read the database design files; skip if the files do not exist.

### Step 5: Read the API design files
Call impm_doc_reader (docType=api, target=main) and (docType=api, target=version) to read the API design files; skip if the files do not exist.

### Step 6: Read the test cases
Call impm_doc_reader (docType=testcase, taskId={task ID}) to read the current task's test cases.

### Step 7: Write the code
Write the code based on the content of the files above. The code should aim for simplicity and clear logic, with reasonably sized functions and files; avoid overly long functions and overly long code files.

### Step 8: Self-check format and structure
After writing, first check the code for obvious formatting or syntax issues, whether the function and file responsibility division is appropriate, and whether the structure is clear and highly readable.

### Step 9: Verify requirement coverage
Then check whether the code covers all the requirements in the reference context, checking each requirement point in context.md one by one.

### Step 10: Check for logic flaws
Finally, check whether the code logic has flaws and issues (exception handling, boundary conditions, resource release, concurrency safety, etc.).

### Step 11: Supplement materials on demand
If needed during coding, you may also read docs/{project abbreviation}-sad.md and docs/project.md, and may call CS/WS to obtain more existing code information and related materials.

### Step 12: Record completion
Call impm_progress (action=add, stepName=impm-task-coding-code, status={task ID}-completed).

## Deliverables
- The coding implementation files corresponding to the current task
- The progress records in version_progress.md

## Next Steps
- After this step is complete, the dispatcher (impm-task-coding / impm-coding) continues with the next step according to the process.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
