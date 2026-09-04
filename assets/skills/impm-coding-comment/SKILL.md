---
name: impm-coding-comment
description: Determines the scope of code changed in this version update based on git change records, and adds clear English comments to all updated code.
---

# impm-coding-comment Skill

## Trigger Words
- Code comments
- English comments
- Comment the code

## When to Use
Use after all coding tasks of the current version have passed tests and been committed, when comments need to be added to all code changed in this version.

## Execution Role
This skill is executed by the Documentation Writer (subagent_type=dw) subagent, loading this skill with the Skill tool for execution.

## Dispatch Notes (must be followed by the PM/upper-level orchestrator when launching this skill)
1. Launch method: launch the subagent with the task tool; subagent_type must be `dw`; neither the PM nor the orchestrator may execute this skill's content on its own.
2. The prompt must carry the required context (none may be missing): the absolute path of the project root (projectRoot), the project abbreviation ({Project Abbreviation}), the current version ({Current Version}), the verbatim user input $ARGUMENTS (including any file paths the user mentioned), and the skill name (impm-coding-comment, requiring the subagent to load this skill with the Skill tool before executing).
3. Completion requirement: after the subagent returns its completion result, verify the output files and the version_progress.md progress records; only proceed to the next step when everything is correct.

## Key Variable Definitions and Values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to assemble all document paths | Read from docs/project.md via impm_project_info |
| Current Version | The version number currently being executed | Obtain via impm_version action=current, or infer from the version directory name |

## Execution Requirements
1. Strictly execute in the content and order of the execution steps: do not skip, reorder, parallelize, or merge any step.
2. Only perform the operations specified by this skill; do not do work unrelated to the task.
3. All document paths must be assembled with {Project Abbreviation} and {Current Version}; do not fabricate file names.
4. Use impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. After each step completes, verify that the output files exist and the content is correct.
7. This skill is part of the coding workflow; it can only be dispatched by impm-coding and cannot run independently without a version number.

## Execution Steps
### Step 1: View the Git Change Records of This Version
Call impm_git (action=log) to view the git commit records of the current version (commit messages in the format {Project Abbreviation}-v{Current Version}-{Task ID}), and call impm_git (action=status) to confirm the working tree status; determine the scope of all files and code changed in this version update.

### Step 2: Add Clear English Comments to All Updated Code
For all code changed in this version update (newly added code, modified code, and the corresponding test code), add clear English comments:
1. Add concise explanatory comments to each function, class, method, loop, and core business logic;
2. Add file-level comments on new files (project full name, module/function description);
3. Comments must be in English and concise and clear; keep the existing comment style of the code (line comments, block comments, docstrings);
4. Do not modify any business logic; comments only, no behavior change.

### Step 3: Record Completion
Call impm_progress (action=add, stepName=impm-coding-comment, status=completed).

## Deliverables
- All updated code in this version with clear English comments
- The progress record in version_progress.md

## After Completion
- After completing all operations of this skill, you must immediately end and return to the dispatcher: the list of output file paths and the progress status of this skill in version_progress.md; you must not continue to subsequent phases or tasks on your own, nor wait for further instructions; subsequent dispatch is the responsibility of the dispatcher (PM).
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->