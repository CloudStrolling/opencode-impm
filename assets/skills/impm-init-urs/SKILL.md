---
name: impm-init-urs
description: Reads the URS-TEMPLATE.MD template, reverse-engineers the User Requirement Specification from the current project code and documents, writes the full version document and extracts a summary to the master document docs/{project English abbreviation}-urs.md. Use when the user requirements document needs to be written during the initialization phase.
---

# impm-init-urs Skill

## Trigger words
- URS
- User Requirement Specification
- requirements document
- user requirements

## When to use
- When the requirements step of the initialization phase (/impm-init-urs) is executed.
- When the User Requirement Specification (URS) needs to be created or completed.

## Executing role
This skill is executed by the Business Analyst (subagent_type=ba) subagent. When executing, load this skill using the Skill tool.

## Scheduling notes (must comply when PM/upper-level orchestrator starts this skill)
1. Startup method: start the subagent using the task tool, subagent_type must be `ba`; the PM or orchestrator is prohibited from executing this skill's content in place of it.
2. The prompt must pass the context (none may be missing): the absolute path of the project root directory (projectRoot), project English abbreviation ({project English abbreviation}), current version number ({current version number}), the original user input $ARGUMENTS (including file paths mentioned by the user), and the skill name (impm-init-urs, require the subagent to first load this skill using the Skill tool before executing).
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
### Step 1: read the template
Call impm_template_reader(projectRoot, URS-TEMPLATE.MD) to read the User Requirement Specification template, and clarify the template sections: business goals, user roles, business scenarios, functional requirements, non-functional requirements, constraints, assumptions and dependencies.

### Step 2: reverse-engineer the user requirements
Read the existing documents via impm_doc_reader (project, sad, etc.), combine the current project code and documents, and fill in the URS according to the template format:
- Existing project: reverse-engineer the content of each section from the existing code and documents (business goals, user roles, business scenarios, functional requirements, non-functional requirements, constraints, assumptions and dependencies).
- Empty project: write an empty document according to the template structure, keeping the section titles and filling the content with "to be supplemented" or empty values.
- Requirement numbering rule: Functional Requirement (FR) and Non-functional Requirement (NFR) IDs are globally unique across the project, formatted as `prefix-v{version}-sequence` (e.g. FR-v0.0.1-001, NFR-v0.0.1-001), with sequence numbers incrementing sequentially from 001 within each version; requirements that remain unchanged across versions retain their original IDs.

### Step 3: write the version document and extract a summary to the master document
1. Call impm_doc_writer(projectRoot, urs, {project Chinese name}, {current version number}, {task number}, version, full content): write the full version document docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-urs-v0.0.1.md.
2. Extract a summary from the current version URS (summary format below), and call impm_doc_writer(projectRoot, urs, {project Chinese name}, {current version number}, {task number}, main, summary content): write the master document docs/{project English abbreviation}-urs.md (create it if it does not exist). The master document only contains the summary, not the full content.
3. Verify the version document contains full content, the master document contains the summary, and both files exist.

#### URS Summary Format (written to the master document)
- Document header: project name, summary description, version evolution table (version / date / change summary / linked full document path), full document index (list of full URS file paths for each version).
- 1. Requirement List: | Group | Requirement ID | Requirement Name | Requirement Description (one-line summary) | Priority | Source Version |, reorganized by "project → module → business scenario" and sorted by business logic (main flow first, side flows after); when merged in later versions, insert into the belonging business logic position, with globally unique non-repeating IDs.
- 2. Non-functional Requirement List: | ID | Category | Requirement Description (one-line summary) | Metric | Source Version |, grouped and sorted by category (performance/security/availability, etc.).
- 3. Business Goals: group and summarize by business line/goal theme, not by version section.
- 4. Constraints and Assumptions & Dependencies: categorized summary entries by theme, not by version section.
- The body is not sectioned by version number; version information is carried uniformly by the "Source Version" column and the version evolution table.
- At the end, note: full content is in the version directory docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-urs-v0.0.1.md.

### Step 4: record progress
Call impm_progress(projectRoot, {project English abbreviation}, {current version number}, add, impm-init-urs, completed) to record the completion of this step.

## Deliverables
- docs/{project English abbreviation}-v0.0.1/{project English abbreviation}-urs-v0.0.1.md (full User Requirement Specification)
- docs/{project English abbreviation}-urs.md (requirement summary aggregate, not full content)

## Completion tips
- To continue to the next step, enter /impm-init-prd
- To continue executing all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
