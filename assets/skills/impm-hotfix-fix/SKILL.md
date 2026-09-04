---
name: impm-hotfix-fix
description: Hotfix coding sub-skill; the SSE/FEE/BEE directly fix the bug and supplement regression tests, skipping all the prerequisite document steps; the root cause and the fix plan are passed in directly by the orchestration skill.
---

# impm-hotfix-fix skill

## Trigger words
- fix bug
- hotfix coding
- fix code
- hotfix-fix

## When to use
After the impm-hotfix orchestration skill (stage 2) completes the bug location analysis, when the code needs to be fixed quickly according to the root cause analysis and the fix plan. This skill is dedicated to the hotfix process; it skips all the prerequisite document steps and pursues the minimal change and the fastest fix.

## Execution role
This skill is executed by the sse, fee and bee subagents, loading this skill with the Skill tool. The scheduling party (impm-hotfix) selects the corresponding role by the nature of the bug: front-end page-type bug→fee, back-end interface/logic-type bug→bee, general-type bug→sse.

## Scheduling instructions (must be followed when the PM/impm-hotfix starts this skill)
1. Startup method: use the task tool to start the subagent, with subagent_type decided by the nature of the bug: `fee` (front-end page type), `bee` (back-end interface/logic type), `sse` (general type); the scheduling party is forbidden to execute the content of this skill by itself.
2. The prompt must carry the context (all are required): the absolute path of the project root (projectRoot), the Project Abbreviation ({Project Abbreviation}), the raw user input $ARGUMENTS (including the bug description and the related file paths), the skill name (impm-hotfix-fix, the subagent must first load this skill with the Skill tool and then execute it), the root cause analysis, the fix plan.
3. Completion requirement: after waiting for the subagent to return its completion result, verify the changed files and the verification results; only proceed to the next step when all are correct.

## Key variable definitions and values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to construct document paths | Read from docs/project.md via impm_project_info |
| Root cause analysis | The root cause of the bug located by the scheduling party | Passed in by the scheduling party (PM) |
| Fix plan | The fix plan decided by the scheduling party | Passed in by the scheduling party (PM) |

## Execution requirements
1. Strictly execute in the order and content of the execution steps in sequence: do not skip, do not reorder, do not parallelize, do not merge any step.
2. Only perform the operations defined by this skill; do not do work unrelated to the task.
3. Use the impm_* tools to obtain information; do not fabricate tool results.
4. Use English throughout.
5. This skill is part of the hotfix process and can only be scheduled and executed by impm-hotfix; it cannot be executed alone.

## Execution steps
### Step 1: Receive the root cause and the fix plan
Receive the root cause analysis, the fix plan and the related file paths passed in by the scheduling party, and confirm the fix target and the boundary (this time only the bug is fixed; no requirement expansion).

### Step 2: Read the related code
Use the read/grep/glob tools to read the related code files (including the files at the bug site, the related files on the call chain and the related configuration files), and verify whether the root cause analysis is correct; if the root cause analysis is found to be wrong, explain it to the scheduling party and suggest a correction.

### Step 3: Fix the code
Modify the code according to the fix plan, aiming for the minimal change, without introducing side effects and without changing unrelated behavior; during the fix, pay attention to exception handling, boundary conditions and compatibility (do not break the existing functionality).

### Step 4: Verify the fix
1. If the project has an existing test framework: supplement regression test cases for this bug (covering the trigger conditions and the expected behavior), run the related tests to confirm they pass; then run the related existing tests of the module to confirm there is no regression.
2. If the project has no test framework: manually verify the bug scenario (run the program/script to reproduce the behavior before and after the fix), and confirm that the fix takes effect.
3. Check whether the changes affect other callers (use grep to find the related references), and supplement verification if necessary.

### Step 5: Return the result
Return to the scheduling party: the list of changed file paths, the fix logic description, the verification results (test pass status/manual verification conclusion), and any remaining risks (if any).

## Deliverables
- The fixed code files and the regression tests
- The verification result description (returned to the scheduling party)

## Notes after completion
- After this step is complete, the scheduling party (impm-hotfix) continues to execute the next step (archive & commit) according to the process.
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->