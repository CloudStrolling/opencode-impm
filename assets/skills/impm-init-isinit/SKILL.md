---
name: impm-init-isinit
description: Determines whether the current project has been initialized (whether docs/project.md and docs/sad.md both exist and are non-empty), and determines the initialization mode: empty projects are written with an empty template structure, existing projects are reverse-engineered and completed. Use as the first step of the initialization phase when the project state needs to be determined.
---

# impm-init-isinit Skill
## Trigger Words
- Initialization determination
- Whether initialized
- Empty project
- Existing project
- isinit

## When to Use
- As the first step of the initialization phase (/impm-init), when the project initialization state needs to be determined.
- When the user asks whether the current project has been initialized and whether it should be handled as an empty project or an existing project.

## Executing Agent
This skill is executed by the PM subagent (executed directly, no subagent launched). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when launching this skill)
1. This skill does not launch a subagent; it is executed directly by the PM.
2. Execution context: the absolute path of the project root (projectRoot); the determination result (empty project/existing project/initialized) MUST be passed as context to the subsequent steps.
3. Completion requirement: the isinit progress row is backfilled uniformly by the impm-init-version step; after this step, feed the determination conclusion back to the user and the subsequent steps.

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
### Step 1: Determine whether the project has been initialized
Call impm_isinit(projectRoot) to determine whether docs/project.md and docs/sad.md both exist and are non-empty:
- If both exist and are non-empty: the project is initialized; this skill ends without creating or modifying any file; output the determination to the user (initialized, skip the initialization phase).
- Otherwise, continue to step 2.

### Step 2: Determine the project type
Check whether the current project has substantive code or project structure (source code directories, configuration files, runnable programs, etc.):
- No substantive code or project structure: determine it as an empty project and initialize it as such — write each document as an empty structure per the template.
- Has substantive code or project structure: determine it as an existing project and reverse-engineer to complete it — reverse-engineer each document from the existing code and documents.

### Step 3: Output the determination and record progress
Output the initialization determination to the user, including: whether the project is initialized, the project type (empty project / existing project), and the subsequent initialization mode (write as empty structure / reverse-engineer and complete for an existing project). Call impm_progress(projectRoot, {project abbreviation}, {current version}, add, impm-init-isinit, completed) to record this step as complete; if version_progress.md does not yet exist (impm-init-version not yet executed), skip the progress record, inform the user, and let impm-init-version backfill it uniformly.

## Deliverables
- Initialization determination (text output to the user; no files are produced)

## Next Steps
- To continue with the next step, enter /impm-init-git
- To continue with all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
