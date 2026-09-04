---
name: impm-project-update
description: Scans the project source code directories to generate a project map, and updates the project map section of docs/project.md
---

# impm-project-update Skill

## Trigger Words
project map, update project, project.md, scan code, project-update

## When to Use
Use in Phase 4, after the code review is complete, when the project map needs to be updated according to the current code structure.

## Execution Role
This skill is executed by the System Architect (subagent_type=sa) subagent. Use the Skill tool to load this skill when executing.

## Dispatch Notes (MUST be followed by the PM/upper-level orchestrator when starting this skill)
1. Startup method: start the subagent with the task tool; subagent_type MUST be `sa`; the PM or orchestrator is forbidden from performing this skill's content on their behalf.
2. The prompt MUST include the following context (none may be missing): project root absolute path (projectRoot), project English abbreviation ({Project Abbreviation}), current version number ({Current Version Number}), the original user input $ARGUMENTS (including the file paths mentioned by the user), the skill name (impm-project-update, require the subagent to load this skill with the Skill tool first before executing).
3. Completion requirement: after the subagent returns the completion result, verify the produced files and the version_progress.md progress records; only proceed to the next step when all are correct.

## Key Variable Definitions and Values
| Variable | Description | How to Obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to concatenate all document paths | Read from docs/project.md via impm_project_info |
| Current Version Number | The version number currently being executed | Get via impm_version action=current, or infer from the version directory name |

## Execution Requirements
1. Strictly execute in the content and order of the execution steps: no skipping, no reordering, no parallel execution, no merging of any step.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths MUST be concatenated with {Project Abbreviation} and {Current Version Number}; do not fabricate file names.
4. Use impm_* tools to obtain information; do not fabricate tool return results.
5. Use English throughout.
6. After each step completes, verify that the produced files exist and the content is correct.

## Execution Steps
### Step 1: Scan the source code directories to generate the project map
1. Read docs/project.md, and determine the project source code directories (such as src, backend, frontend, scripts, etc.) and the directories to exclude (such as node_modules, dist, build, .git, etc.).
2. Call impm_project_analyzer (sourceDirs, excludeDirs) to scan the source code directories and generate the project map Markdown content.
3. Verify the project map content: whether the directory structure, main modules, and key files are consistent with the actual code; if there are obvious missing or redundant items, adjust the scan parameters and rescan.

### Step 2: Update the project map section of docs/project.md
1. Read the existing content of docs/project.md.
2. Only update the project map section: replace the old project map with the newly generated one, and keep the other sections unchanged.
3. Call impm_doc_writer (docType=project, target=main) to write docs/project.md.
4. Verify the file exists and the content is correct, and the project map is consistent with the actual code structure.

### Step 3: Record progress
1. Call impm_progress add (impm-project-update, completed) to record this skill's completion status in version_progress.md.
2. Verify that this step status has been recorded in version_progress.md.

## Deliverables
- docs/project.md (project map section updated)
- version_progress.md progress records

## Completion Hints
- To continue with the next step, enter /impm-doc-merge
- To continue with all subsequent steps of this phase, enter /impm-finish

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->