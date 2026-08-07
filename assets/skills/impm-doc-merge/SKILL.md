---
name: impm-doc-merge
description: Merges the current version's URS, PRD, API, DBD, DBD SQL, and LLD documents into the project master documents following the merge principles.
---

# impm-doc-merge Skill

## Trigger Words
Document merge, merge master document, doc-merge, version document merge

## When to Use
Use this skill in Phase 4, after the project map update is complete, when the current version's design documents need to be merged into the corresponding master documents under docs.

## Executing Agent
This skill is executed by the DW subagent (subagent_type=dw). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `dw`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-doc-merge; require the subagent to load this skill with the Skill tool first before executing).
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
Merge principles: merge the content of the current version's documents into the master documents; create the master document first if it does not exist; keep the existing historical content in the master document, and append or update the content newly added or changed in the current version to the corresponding sections; do not overwrite the master document's historical content as a whole.

### Step 1: Merge the URS document
1. If docs/{project abbreviation}-urs.md does not exist, create it first.
2. Merge docs/{project abbreviation}-v{current version}/{project abbreviation}-urs-v{current version}.md into docs/{project abbreviation}-urs.md (impm_doc_writer docType=urs, target=main).
3. Verify the merge result: the master document retains the historical content and contains the current version's content.

### Step 2: Merge the PRD document
1. If docs/{project abbreviation}-prd.md does not exist, create it first.
2. Merge docs/{project abbreviation}-v{current version}/{project abbreviation}-prd-v{current version}.md into docs/{project abbreviation}-prd.md (impm_doc_writer docType=prd, target=main).
3. Verify the merge result: the master document retains the historical content and contains the current version's content.

### Step 3: Merge the API document
1. If docs/{project abbreviation}-api.md does not exist, create it first.
2. Merge docs/{project abbreviation}-v{current version}/{project abbreviation}-api-v{current version}.md into docs/{project abbreviation}-api.md (impm_doc_writer docType=api, target=main).
3. Verify the merge result: the master document retains the historical content and contains the current version's content.

### Step 4: Merge the DBD document
1. If docs/{project abbreviation}-dbd.md does not exist, create it first.
2. Merge docs/{project abbreviation}-v{current version}/{project abbreviation}-dbd-v{current version}.md into docs/{project abbreviation}-dbd.md (impm_doc_writer docType=dbd, target=main).
3. Verify the merge result: the master document retains the historical content and contains the current version's content.

### Step 5: Merge the DBD SQL scripts
1. If docs/{project abbreviation}-dbd.sql does not exist, create it first.
2. Merge docs/{project abbreviation}-v{current version}/{project abbreviation}-dbd-v{current version}.sql into docs/{project abbreviation}-dbd.sql (impm_doc_writer docType=sql, target=main).
3. Verify the merge result: the SQL statements are complete, with no duplicate conflicts, and executable.

### Step 6: Merge the LLD document
1. If docs/{project abbreviation}-lld.md does not exist, create it first.
2. Merge docs/{project abbreviation}-v{current version}/{project abbreviation}-lld-v{current version}.md into docs/{project abbreviation}-lld.md (impm_doc_writer docType=lld, target=main).
3. Verify the merge result: the master document retains the historical content and contains the current version's content.

### Step 7: Record progress
1. Call impm_progress add (impm-doc-merge, completed) to record this skill's completion status in version_progress.md.
2. Verify that this step's status is recorded in version_progress.md.

## Deliverables
- docs/{project abbreviation}-urs.md, docs/{project abbreviation}-prd.md, docs/{project abbreviation}-api.md, docs/{project abbreviation}-dbd.md, docs/{project abbreviation}-dbd.sql, docs/{project abbreviation}-lld.md (the merged master documents)
- The progress records in version_progress.md

## Next Steps
- To continue to the next step, enter /impm-doc-update
- To continue all remaining steps of this phase, enter /impm-finish

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
