---
name: impm-project-update
description: Scans the project source code directories to generate a project map, and updates the project map section of docs/project.md.
---

# impm-project-update Skill

## Trigger Words
Project map, update project, project.md, scan code, project-update

## When to Use
Use this skill in Phase 4, after code review is complete, when the project map needs to be updated based on the current code structure.

## Executing Agent
This skill is executed by the SA subagent (subagent_type=sa). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `sa`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-project-update; require the subagent to load this skill with the Skill tool first before executing).
3. Completion requirement: wait for the subagent to return the completion result, verify the output files and the version_progress.md progress records, and only proceed to the next step when everything is correct.

## Key Variables and How to Get Them
| Variable | Description | How to Get |
| Chinese project name | The Chinese name of the project | Read from docs/project.md via impm_project_info |
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
### Step 1: Scan the source code directories to generate the project map
1. Read docs/project.md to determine the project's source code directories (e.g., src, backend, frontend, scripts, etc.) and directories to exclude (e.g., node_modules, dist, build, .git, etc.).
2. Call impm_project_analyzer (sourceDirs, excludeDirs) to scan the source code directories and generate the project map Markdown content.
3. Verify the project map content: whether the directory structure, main modules, and key files are consistent with the actual code; if there are obvious missing or redundant items, adjust the scan parameters and rescan.

### Step 2: Update the project map section of docs/project.md
1. Read the existing content of docs/project.md.
2. Only update the project map section: replace the old project map with the newly generated one, and keep everything else unchanged.
3. Call impm_doc_writer (docType=project, target=main) to write docs/project.md.
4. Verify that the file exists, its content is correct, and the project map is consistent with the actual code structure.

### Step 3: Record progress
1. Call impm_progress add (impm-project-update, completed) to record this skill's completion status in version_progress.md.
2. Verify that this step's status is recorded in version_progress.md.

## Deliverables
- docs/project.md (the project map section updated)
- The progress records in version_progress.md

## Next Steps
- To continue to the next step, enter /impm-doc-merge
- To continue all remaining steps of this phase, enter /impm-finish

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
