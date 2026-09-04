---
name: impm-version-create
description: Determines the current version number, creates the version branch, the version directory, and the version progress file version_progress.md, providing the version foundation for the requirements analysis phase.
---

# impm-version-create Skill

## Trigger Phrases
version creation, create version, determine version number, version directory, impm-version-create, new version

## When to Use
Used at the beginning of the requirements analysis phase (Phase 2), as the first step of the phase. It determines the current version number, creates the git branch {project abbreviation}-v{current version number}, the version directory docs/{project abbreviation}-v{current version number}, and the version progress file version_progress.md, providing the version foundation for all subsequent steps.

## Execution Role
This skill is executed by the Software Configuration Manager (subagent_type=scm) subagent, using the Skill tool to load this skill.

## Dispatch Instructions (PM/orchestrator must comply when launching this skill)
1. Launch method: Use the task tool to launch the subagent; subagent_type must be `scm`; the PM or orchestrator is prohibited from executing this skill's content in place of the subagent.
2. Required context in the prompt (all mandatory): absolute path of the project root directory (projectRoot), project abbreviation ({project abbreviation}), current version number ({current version number}), user input $ARGUMENTS verbatim (including file paths mentioned by the user), skill name (impm-version-create, requiring the subagent to load this skill with the Skill tool before executing).
3. Completion requirement: After the subagent returns the completion result, verify the output files and version_progress.md progress record; proceed to the next step only after all checks pass.

## Key Variable Definitions and Values
| Variable | Description | How to Obtain |
| Project Name (Chinese) | The Chinese name of the project | Read via impm_project_info from docs/project.md |
| Project Name (English) | The English name of the project | Read via impm_project_info from docs/project.md |
| Project Abbreviation | The English abbreviation of the project, used to construct all document paths | Read via impm_project_info from docs/project.md |
| Current Version Number | The version number currently being executed | Obtained via impm_version action=current, or inferred from the version directory name |

## Execution Requirements
1. Execute strictly in the content and order of the execution steps below: no skipping, no reordering, no parallelizing, no merging of any steps.
2. Only execute the operations defined by this skill; do not perform work unrelated to the task.
3. All document paths must be constructed using {project abbreviation} and {current version number}; never fabricate file names.
4. Use impm_* tools to obtain information; never fabricate tool return results.
5. Use English throughout.
6. After each step completes, verify that the output file exists and the content is correct.

## Execution Steps

### Step 1: Determine the Current Version Number
a) Check the content submitted by the user in this conversation, and whether any documents mentioned in the content contain a version number: if so, use that version number as the current version number directly;
b) If no version number is mentioned in either place, call impm_version (action=current) to obtain the maximum version number from all version directories under the docs directory (directory format: {project abbreviation}-v{x.y.z}, where x.y.z is the version number), then call impm_version (action=next) to increment the z value of the maximum version number by +1, using x.y.(z+1) as the current version number.

### Step 2: Pull Latest Code and Create Version Branch
Call impm_git (action=log or action=status) to confirm repository status: if a remote repository is configured, first execute pull to fetch the latest code. Then create and switch to the new branch {project abbreviation}-v{current version number}, confirming that the current branch has been switched successfully.

### Step 3: Create Version Directory
Call impm_version (action=init) to create the project version directory docs/{project abbreviation}-v{current version number}, record the returned version number and verify the directory has been created.

### Step 4: Initialize Version Progress File
Call impm_progress (action=init) to create the version progress file docs/{project abbreviation}-v{current version number}/version_progress.md. The file content is a table with 10 columns: Step No., Step Name, Step Status, Start Time, Duration (s), Input tokens, Output tokens, Cache read, Cache write, Total tokens. Write the first row: Step No. 1, Step Name impm-version-create, Step Status completed (start time is automatically recorded as the current time).
Verify the file exists and the first row content is correct.

### Step 5: Return the Current Version Number
Return the current version number to the caller (PM) for use in all subsequent steps.

## Deliverables
- docs/{project abbreviation}-v{current version number}/ (version directory)
- docs/{project abbreviation}-v{current version number}/version_progress.md (version progress file, containing first row: 1 | impm-version-create | completed)
- git branch {project abbreviation}-v{current version number} (created and switched to)

## Post-completion Notes
- To proceed with the next step, enter /impm-urs-create
- To execute all subsequent steps in this phase, enter /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
