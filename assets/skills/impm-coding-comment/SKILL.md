---
name: impm-coding-comment
description: Determines the scope of code changed in this version update based on git change records, and adds clear English comments to all updated code.
---

# impm-coding-comment Skill

## Trigger Words
Code annotation, code comments, add comments, English comments, coding-comment

## When to Use
Use this skill in Phase 4, after the version regression tests pass and before code review, when English comments need to be added to all code updated in this version.

## Executing Agent
This skill is executed by the DW subagent (subagent_type=dw). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `dw`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-coding-comment; require the subagent to load this skill with the Skill tool first before executing).
3. Completion requirement: wait for the subagent to return the completion result, verify the output files and the version_progress.md progress records, and only proceed to the next step when everything is correct.

## Key Variables and How to Get Them
| Variable | Description | How to Get |
| Project Chinese name | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| English project name | The English name of the project | Read from docs/project.md via impm_project_info |
| Project abbreviation | The English abbreviation of the project, used to build all document paths | Read from docs/project.md via impm_project_info |
| Current version | The version number currently being executed | Get via impm_version action=current, or infer from the version directory name |

## Execution Requirements
1. Follow the steps strictly in the order given in the Execution Steps: no skipping, no out-of-order execution, no parallel execution, no merged execution of any step.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths must be built from {project abbreviation} and {current version}; never invent file names.
4. Use impm_* tools to obtain information; never fabricate tool results.
5. Use English throughout.
6. After each step, verify that the produced files exist and their content is correct.

## Execution Steps
### Step 1: Check the git change records and determine the scope of code updated in this version
1. Call impm_git (action=log) to view all commit records of the current branch.
2. Call impm_git (action=status) to check whether there are uncommitted changes.
3. Combine the commit records and uncommitted changes to determine all code files and the scope of changes in this version update, and form a code file list to avoid omissions or misjudgments.

### Step 2: Add English comments to the code updated in this version
1. Check the code changed in this update one file at a time according to the code file list.
2. Add clear English comments to functions, classes, and key logic: the purpose of functions/classes, parameter meanings, return value meanings; the intent and constraints of key business logic.
3. Comments must be concise, accurate, and correspond one-to-one with the code behavior; do not fabricate code behavior, and do not add meaningless comments.
4. Only add comments; do not modify any code logic, and do not delete or change existing comments.
5. After all comments are added, run compilation or syntax checks according to the project language to confirm that the comments have not broken the code.

### Step 3: Record progress
1. Call impm_progress add (impm-coding-comment, completed) to record this skill's completion status in version_progress.md.
2. Verify that this step's status is recorded in version_progress.md.

## Deliverables
- The English comments on the code updated in this version (located in the code files)
- The progress records in version_progress.md

## Next Steps
- To continue to the next step, enter /impm-coding-review
- To continue all remaining steps of this phase, enter /impm-finish

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
