---
name: impm-init-isinit
description: Determines whether the current project has been initialized (whether docs/project.md and docs/sad.md both exist and are non-empty), and determines the initialization mode: empty projects are written with an empty template structure, existing projects are reverse-engineered and completed. Use as the first step of the initialization phase when the project state needs to be determined.
---

# impm-init-isinit Skill

## Trigger words
- initialization determination
- whether already initialized
- empty project
- existing project
- isinit

## When to use
- The first step of the initialization phase (/impm-init), when the project initialization state needs to be determined first.
- When the user asks whether the current project has been initialized, and whether it should be handled as an empty project or an existing project.

## Executing role
This skill is directly executed by the PM (Project Manager, master Agent); it does not start a subagent.

## Scheduling notes (must comply when starting this skill)
1. This skill does not start a subagent; it is directly executed by the PM.
2. Execution context: the absolute path of the project root directory (projectRoot); the determination result (empty project/existing project/initialized) must be passed to the subsequent steps as context.
3. Completion requirement: the isinit progress line is uniformly back-filled by the impm-init-version step; after this step ends, feed back the determination conclusion to the user and the subsequent steps.

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
### Step 1: determine whether already initialized
Call impm_isinit(projectRoot) to determine whether docs/project.md and docs/sad.md both exist and are non-empty:
- If both exist and are non-empty: the project has been initialized, this skill ends, no files are created or modified, and the determination conclusion is output to the user (initialized, skip the initialization phase).
- Otherwise, continue to step 2.

### Step 2: determine the project type
Check whether the current project has substantive coding or project structure (source code directories, configuration files, runnable programs, etc.):
- No substantive coding or project structure: determine it as an empty project, initialize as an empty project - write the empty structure for each document according to the template.
- Has substantive coding or project structure: determine it as an existing project, reverse-engineer and complete it as an existing project - reverse-engineer the content for each document based on the existing code and documents.

### Step 3: output the determination conclusion and record progress
Output the initialization determination conclusion to the user, including: whether it has been initialized, the project type (empty project/existing project), and the subsequent initialization mode (write empty structure / reverse-engineer and complete as an existing project). Call impm_progress(projectRoot, {project English abbreviation}, {current version number}, add, impm-init-isinit, completed) to record the completion of this step; if version_progress.md does not yet exist (impm-init-version has not been executed), skip the progress record and prompt the user, to be back-filled uniformly by impm-init-version.

## Deliverables
- The initialization determination conclusion (text output to the user; no file is produced)

## Completion tips
- To continue to the next step, enter /impm-init-git
- To continue executing all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
