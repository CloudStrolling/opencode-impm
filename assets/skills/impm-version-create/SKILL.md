---
name: impm-version-create
description: Determines the current version, creates the version branch, the version directory, and the version progress file version_progress.md, providing the version foundation for the requirements analysis phase.
---

# impm-version-create Skill

## Trigger Words
Version creation, create version, determine version, version directory, impm-version-create, new version

## When to Use
Use at the start of the requirements analysis phase (phase 2); it is the first step of the phase. It determines the current version, creates the git branch {project abbreviation}-v{current version}, the version directory docs/{project abbreviation}-v{current version}, and the version progress file version_progress.md, providing the version foundation for all subsequent steps.

## Executing Agent
This skill is executed by the SCM subagent (subagent_type=scm). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `scm`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-version-create; require the subagent to load this skill with the Skill tool first before executing).
3. Completion requirement: wait for the subagent to return the completion result, verify the output files and the version_progress.md progress records, and only proceed to the next step when everything is correct.

## Key Variables and How to Get Them
| Variable | Description | How to get it |
| Project Chinese name | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project English name | The English name of the project | Read from docs/project.md via impm_project_info |
| Project abbreviation | The project's English abbreviation, used to construct all document paths | Read from docs/project.md via impm_project_info |
| Current version | The version currently being executed | Get via impm_version action=current, or infer from the version directory name |

## Execution Requirements
1. Execute strictly in the order of the content in the execution steps: no skipping, no out-of-order execution, no parallel execution, no merged execution of any step.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths must be constructed with {project abbreviation} and {current version}; do not fabricate file names.
4. Use impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. After each step, verify that the output file exists and its content is correct.

## Execution Steps

### Step 1: Determine the current version
a) Check the content submitted by the user in this conversation, and whether the documents mentioned in it contain a version: if they do, use that version directly as the current version;
b) If no version is mentioned, call impm_version (action=current) to get the maximum version among all version directories under docs (directories are named {project abbreviation}-v{x.y.z}, where x.y.z is the version), then call impm_version (action=next) to increment the z value of the maximum version by 1, using x.y.(z+1) as the current version.

### Step 2: Pull the latest code and create the version branch
Call impm_git (action=log or action=status) to confirm the repository status: if a remote repository is configured, run pull first to fetch the latest code. Then create and switch to the new branch {project abbreviation}-v{current version}, and confirm the branch has been switched successfully.

### Step 3: Create the version directory
Call impm_version (action=init) to create the project version directory docs/{project abbreviation}-v{current version}, record the returned version, and verify the directory has been created.

### Step 4: Initialize the version progress file
Call impm_progress (action=init) to create the version progress file docs/{project abbreviation}-v{current version}/version_progress.md; the file content is a table with 3 columns: step sequence number, step name, step status. Write the first row: step sequence number 1, step name impm-version-create, step status completed.
Verify that the file exists and the first row is correct.

### Step 5: Return the current version
Return the current version to the caller (PM) for use by all subsequent steps.

## Deliverables
- docs/{project abbreviation}-v{current version}/ (version directory)
- docs/{project abbreviation}-v{current version}/version_progress.md (version progress file, including the first row: 1 | impm-version-create | completed)
- Git branch {project abbreviation}-v{current version} (created and switched to)

## Next Steps
- To continue with the next step, enter /impm-urs-create
- To continue with all remaining steps of this phase, enter /impm-docs
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
