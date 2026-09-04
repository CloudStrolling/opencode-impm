---
name: impm-doc-merge
description: Merges the current version's URS, PRD, API, DBD, DBD SQL, and LLD documents into the project master documents per the merge principles
---

# impm-doc-merge Skill

## Trigger Words
document merge, merge master documents, doc-merge, version document merge

## When to Use
Use in Phase 4, after the project map update is complete, when the current version's design documents need to be merged into the corresponding master documents under docs.

## Execution Role
This skill is executed by the Document Writer (subagent_type=dw) subagent. Use the Skill tool to load this skill when executing.

## Dispatch Notes (MUST be followed by the PM/upper-level orchestrator when starting this skill)
1. Startup method: start the subagent with the task tool; subagent_type MUST be `dw`; the PM or orchestrator is forbidden from performing this skill's content on their behalf.
2. The prompt MUST include the following context (none may be missing): project root absolute path (projectRoot), project English abbreviation ({Project Abbreviation}), current version number ({Current Version Number}), the original user input $ARGUMENTS (including the file paths mentioned by the user), the skill name (impm-doc-merge, require the subagent to load this skill with the Skill tool first before executing).
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
Merge principles: merge the current version document content into the master documents; create the master documents first if they do not exist; keep the historical content already in the master documents, append or update the content newly added or changed in the current version to the corresponding sections, and do not overwrite the historical content of the master documents as a whole.

### Step 1: Merge the URS document
1. If docs/{Project Abbreviation}-urs.md does not exist, create it first.
2. Merge docs/{Project Abbreviation}-v{Current Version Number}/{Project Abbreviation}-urs-v{Current Version Number}.md into docs/{Project Abbreviation}-urs.md (impm_doc_writer docType=urs, target=main).
3. Verify the merge result: the master document keeps the historical content and contains the current version content.

### Step 2: Merge the PRD document
1. If docs/{Project Abbreviation}-prd.md does not exist, create it first.
2. Merge docs/{Project Abbreviation}-v{Current Version Number}/{Project Abbreviation}-prd-v{Current Version Number}.md into docs/{Project Abbreviation}-prd.md (impm_doc_writer docType=prd, target=main).
3. Verify the merge result: the master document keeps the historical content and contains the current version content.

### Step 3: Merge the API document
1. If docs/{Project Abbreviation}-api.md does not exist, create it first.
2. Merge docs/{Project Abbreviation}-v{Current Version Number}/{Project Abbreviation}-api-v{Current Version Number}.md into docs/{Project Abbreviation}-api.md (impm_doc_writer docType=api, target=main).
3. Verify the merge result: the master document keeps the historical content and contains the current version content.

### Step 4: Merge the DBD document
1. If docs/{Project Abbreviation}-dbd.md does not exist, create it first.
2. Merge docs/{Project Abbreviation}-v{Current Version Number}/{Project Abbreviation}-dbd-v{Current Version Number}.md into docs/{Project Abbreviation}-dbd.md (impm_doc_writer docType=dbd, target=main).
3. Verify the merge result: the master document keeps the historical content and contains the current version content.

### Step 5: Merge the DBD SQL script
1. If docs/{Project Abbreviation}-dbd.sql does not exist, create it first.
2. Merge docs/{Project Abbreviation}-v{Current Version Number}/{Project Abbreviation}-dbd-v{Current Version Number}.sql into docs/{Project Abbreviation}-dbd.sql (impm_doc_writer docType=sql, target=main).
3. Verify the merge result: the SQL statements are complete, without duplicate conflicts, and executable.

### Step 6: Merge the LLD document
1. If docs/{Project Abbreviation}-lld.md does not exist, create it first.
2. Merge docs/{Project Abbreviation}-v{Current Version Number}/{Project Abbreviation}-lld-v{Current Version Number}.md into docs/{Project Abbreviation}-lld.md (impm_doc_writer docType=lld, target=main).
3. Verify the merge result: the master document keeps the historical content and contains the current version content.

### Step 7: Record progress
1. Call impm_progress add (impm-doc-merge, completed) to record this skill's completion status in version_progress.md.
2. Verify that this step status has been recorded in version_progress.md.

## Deliverables
- docs/{Project Abbreviation}-urs.md, docs/{Project Abbreviation}-prd.md, docs/{Project Abbreviation}-api.md, docs/{Project Abbreviation}-dbd.md, docs/{Project Abbreviation}-dbd.sql, docs/{Project Abbreviation}-lld.md (merged master documents)
- version_progress.md progress records

## Completion Hints
- To continue with the next step, enter /impm-doc-update
- To continue with all subsequent steps of this phase, enter /impm-finish

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->