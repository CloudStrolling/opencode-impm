---
name: impm-init-version
description: Creates the version directory docs/{project English abbreviation}-v0.0.1 and the version progress table version_progress.md, and back-fills the records of the completed initialization steps. Use when version management needs to be established during the initialization phase.
---

# impm-init-version Skill

## Trigger words
- version directory
- version initialization
- version_progress
- version progress table

## When to use
- When the version step of the initialization phase (/impm-init-version) is executed.
- When the version directory docs/{project English abbreviation}-v{version} or the version progress table version_progress.md needs to be created.

## Executing role
This skill is executed by the System Architect (subagent_type=sa) subagent. When executing, load this skill using the Skill tool.

## Scheduling notes (must comply when PM/upper-level orchestrator starts this skill)
1. Startup method: start the subagent using the task tool, subagent_type must be `sa`; the PM or orchestrator is prohibited from executing this skill's content in place of it.
2. The prompt must pass the context (none may be missing): the absolute path of the project root directory (projectRoot), project English abbreviation ({project English abbreviation}), current version number ({current version number}), the original user input $ARGUMENTS (including file paths mentioned by the user), and the skill name (impm-init-version, require the subagent to first load this skill using the Skill tool before executing).
3. Completion requirement: after waiting for the subagent to return the completion result, verify the produced files and the version_progress.md progress records; only proceed to the next step when all are correct.

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
### Step 1: obtain the project English abbreviation
Call impm_project_info(projectRoot) to read the project Chinese name, English name, English abbreviation, etc. from docs/project.md; if project.md has not yet been generated, first execute /impm-init-project to generate it before continuing.

### Step 2: create the version directory
Call impm_version(projectRoot, init, v0.0.1, {project Chinese name}) to create the version directory docs/{project English abbreviation}-v0.0.1; the tool returns the current version number. Verify that the version directory has been created and the current version number is 0.0.1.

### Step 3: create the version progress table and back-fill records
Call impm_progress(projectRoot, {project English abbreviation}, {current version number}, init, null, null) to create version_progress.md (10-column header: Step No. | Step Name | Step Status | Start Time | Duration (s) | Input tokens | Output tokens | Cache read | Cache write | Total tokens); then sequentially call impm_progress(projectRoot, {project English abbreviation}, {current version number}, add, step name, completed) to back-fill the steps completed in the initialization phase: impm-init-isinit, impm-init-git, impm-init-project, impm-init-version are all marked completed; subsequent steps continue to append new rows using add (sequence number is automatically the current max + 1, start time is automatically recorded as the current time, and the previous row is automatically settled with duration and tokens).

### Step 4: verify and record
Verify that the version directory docs/{project English abbreviation}-v0.0.1/ and version_progress.md both exist, and that the progress table already contains the above 4 completed records; call impm_progress(projectRoot, {project English abbreviation}, {current version number}, add, impm-init-version, completed) to record the completion of this step.

## Deliverables
- The version directory docs/{project English abbreviation}-v0.0.1/
- version_progress.md (containing the records of the completed steps)

## Completion tips
- To continue to the next step, enter /impm-init-urs
- To continue executing all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
