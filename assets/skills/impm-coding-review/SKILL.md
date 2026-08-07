---
name: impm-coding-review
description: Reviews the current version's code for security vulnerabilities, performance traps, code quality, architecture compliance, and test coverage, and outputs a review report following the template.
---

# impm-coding-review Skill

## Trigger Words
Code audit, code review, code review, review report, security audit

## When to Use
Use this skill in Phase 4, after code annotations are complete, when the current version's code needs to be comprehensively reviewed and a review report output.

## Executing Agent
This skill is executed by the TL subagent (subagent_type=tl). Load this skill with the Skill tool when executing.

## Dispatch Instructions (MUST be followed when the PM/upper-level orchestrator launches this skill)
1. Launch method: use the task tool to launch a subagent; subagent_type MUST be `tl`; the PM or orchestrator must not execute this skill's content on its own.
2. The task prompt MUST carry the context (indispensable): the absolute path of the project root (projectRoot), the project English abbreviation ({project abbreviation}), the current version ({current version}), the original user input $ARGUMENTS (including the file paths mentioned by the user), and the skill name (impm-coding-review; require the subagent to load this skill with the Skill tool first before executing).
3. Completion requirement: wait for the subagent to return the completion result, verify the output files and the version_progress.md progress records, and only proceed to the next step when everything is correct.

## Key Variables and How to Get Them
| Variable | Description | How to Get |
| Chinese project name | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| English project name | The English name of the project | Read from docs/project.md via impm_project_info |
| Project abbreviation | The English abbreviation of the project, used to build all document paths | Read from docs/project.md via impm_project_info |
| Current version | The version number currently being executed | Get via impm_version action=current, or infer from the version directory name |

## Execution Requirements
1. Follow the steps strictly in the order given in the Execution Steps: no skipping, no out-of-order execution, no parallel execution, no merged execution of any step.
2. Only perform the operations specified in this skill; do not do work unrelated to the task. This skill only reviews, does not fix: do not modify any files.
3. All document paths must be built from {project abbreviation} and {current version}; never invent file names.
4. Use impm_* tools to obtain information; never fabricate tool results.
5. Use English throughout.
6. After each step, verify that the produced files exist and their content is correct.

## Execution Steps
### Step 1: Determine the review scope
1. Call impm_git (action=log, action=status) to determine the list of code files updated in this version.
2. Combined with the URS, PRD, LLD, and test case documents under docs/{project abbreviation}-v{current version}/, clarify the review scope and focus.

### Step 2: Find security vulnerabilities
1. Check for injection risks (SQL injection, command injection, XSS, etc.).
2. Check for privilege escalation (unvalidated permissions, horizontal/vertical privilege escalation).
3. Check for hardcoded keys, passwords, and tokens.
4. Check for sensitive information leakage (sensitive data leaked in logs, error messages, and response bodies).

### Step 3: Identify performance traps
1. Check for N+1 queries and database queries inside loops.
2. Check for memory leak risks (unreleased resources, unclosed connections, unbounded growth of global caches).
3. Check for unnecessary loops and repeated computations.
4. Check for full table scans of large data volumes and queries on large tables without indexes.

### Step 4: Check code quality
1. Check for duplicate code, overly long functions, and overly long files.
2. Check whether naming is clear and readability is adequate.
3. Check whether comments are sufficient and consistent with the code.

### Step 5: Verify architecture compliance
1. Check whether the layering is clear and conforms to the architecture design in docs/{project abbreviation}-sad.md and the LLD.
2. Check for violations of the dependency direction (e.g., lower layers depending on upper layers, direct cross-layer access).
3. Check whether defined interfaces are bypassed to directly manipulate internal implementations.

### Step 6: Confirm test coverage
1. Check whether key paths have corresponding test cases and test code.
2. Check whether boundary conditions and exception paths are covered.
3. Provide clear prompts for test gaps.

### Step 7: Read the code review report template
1. Call impm_template_reader to read the content of the REVIEW-TEMPLATE.MD template.

### Step 8: Write the review report in the template format
1. Organize the findings of Steps 2 through 6 into a review report, filling it out strictly in the template format: review scope, issue list (severity, file and location, issue description, suggested fixes), test coverage assessment, and overall conclusion.
2. Only output review opinions; do not modify any files.
3. Call impm_doc_writer (docType=review) to write docs/{project abbreviation}-v{current version}/{project abbreviation}-review.md.
4. Verify that the file exists and its content is correct.

### Step 9: Record progress
1. Call impm_progress add (impm-coding-review, completed) to record this skill's completion status in version_progress.md.
2. Verify that this step's status is recorded in version_progress.md.

## Deliverables
- docs/{project abbreviation}-v{current version}/{project abbreviation}-review.md (the review report)
- The progress records in version_progress.md

## Next Steps
- To continue to the next step, enter /impm-project-update
- To continue all remaining steps of this phase, enter /impm-finish

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
