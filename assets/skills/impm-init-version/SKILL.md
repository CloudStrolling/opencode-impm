---
name: impm-init-version
description: Creates the version directory docs/{project abbreviation}-v0.0.1 and the version progress file version_progress.md, and backfills the records of completed initialization steps. Use when version management needs to be established during the initialization phase.
---

# impm-init-version Skill
## Trigger Words
- Version directory
- Version initialization
- version_progress
- Version progress file

## When to Use
- When the version step of the initialization phase (/impm-init-version) is executed.
- When the version directory docs/{project abbreviation}-v{version} or the version progress file version_progress.md needs to be created.

## Executing Agent
This skill is executed by the SA subagent. Load this skill with the Skill tool when executing.

## Key Variables and How to Get Them
| Variable | Description | How to get it |
| Project Chinese name | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project English name | The English name of the project | Read from docs/project.md via impm_project_info |
| Project abbreviation | The project's English abbreviation, used to construct all document paths | Read from docs/project.md via impm_project_info |
| Current version | The version currently being executed (fixed at 0.0.1 during the initialization phase) | Get via impm_version, or infer from the version directory name |

## Execution Requirements
1. Execute strictly in the order of the content in the execution steps: no skipping, no out-of-order execution, no parallel execution, no merged execution of any step.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths must be constructed with {project abbreviation} and {current version}; do not fabricate file names.
4. Use impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. After each step, verify that the output file exists and its content is correct.

## Execution Steps
### Step 1: Get the project abbreviation
Call impm_project_info(projectRoot) to read the project Chinese name, English name, English abbreviation, etc. from docs/project.md; if project.md has not been generated yet, first run /impm-init-project to generate it before continuing.

### Step 2: Create the version directory
Call impm_version(projectRoot, init, v0.0.1, {project Chinese name}) to create the version directory docs/{project abbreviation}-v0.0.1; the tool returns the current version. Verify that the version directory has been created and the current version is 0.0.1.

### Step 3: Create the version progress file and backfill records
Call impm_progress(projectRoot, {project abbreviation}, {current version}, init, null, null) to create version_progress.md (header: Step No. | Step Name | Step Status); then call impm_progress(projectRoot, {project abbreviation}, {current version}, add, step name, completed) in sequence to backfill the completed steps of the initialization phase: mark impm-init-isinit, impm-init-git, impm-init-project, impm-init-version all as completed; subsequent steps continue to append new rows with add (the sequence number is automatically the current maximum sequence number + 1).

### Step 4: Verify and record
Verify that the version directory docs/{project abbreviation}-v0.0.1/ and version_progress.md both exist, and the progress file already contains the 4 completed records above; call impm_progress(projectRoot, {project abbreviation}, {current version}, add, impm-init-version, completed) to record this step as complete.

## Deliverables
- Version directory docs/{project abbreviation}-v0.0.1/
- version_progress.md (including records of completed steps)

## Next Steps
- To continue with the next step, enter /impm-init-urs
- To continue with all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
