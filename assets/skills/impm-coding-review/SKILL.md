---
name: impm-coding-review
description: Reviews this version's code for security vulnerabilities, performance traps, code quality, architecture compliance, and test coverage, directly fixes the necessary and easy-to-fix issues, and outputs a review report per the template marking the fix status
---

# impm-coding-review Skill

## Trigger Words
code review, code review, code review, review report, security review

## When to Use
Use in Phase 4, after the code comments are complete, when the whole version's code needs to be comprehensively reviewed and a review report output.

## Execution Role
This skill is executed by the Technical Lead (subagent_type=tl) subagent. Use the Skill tool to load this skill when executing.

## Dispatch Notes (MUST be followed by the PM/upper-level orchestrator when starting this skill)
1. Startup method: start the subagent with the task tool; subagent_type MUST be `tl`; the PM or orchestrator is forbidden from performing this skill's content on their behalf.
2. The prompt MUST include the following context (none may be missing): project root absolute path (projectRoot), project English abbreviation ({Project Abbreviation}), current version number ({Current Version Number}), the original user input $ARGUMENTS (including the file paths mentioned by the user), the skill name (impm-coding-review, require the subagent to load this skill with the Skill tool first before executing).
3. Completion requirement: after the subagent returns the completion result, verify the produced files and the version_progress.md progress records; only proceed to the next step when all are correct.

## Key Variable Definitions and Values
| Variable | Description | How to Obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to concatenate all document paths | Read from docs/project.md via impm_project_info |
| Current Version Number | The version number currently being executed | Get via impm_version action=current, or infer from the version directory name |

## Execution Requirements
1. Strictly execute in the content and order of the execution steps: no skipping, no reordering, no parallel execution, no merging of any step.
2. Only perform the operations specified in this skill; do not do work unrelated to the task. This skill focuses on review with fixing as supplementary: except for the issue fixes specified in step 7, it must not modify any other file.
3. All document paths MUST be concatenated with {Project Abbreviation} and {Current Version Number}; do not fabricate file names.
4. Use impm_* tools to obtain information; do not fabricate tool return results.
5. Use English throughout.
6. After each step completes, verify that the produced files exist and the content is correct.

## Execution Steps
### Step 1: Determine the review scope
1. Call impm_git (action=log, action=status) to determine the list of code files updated in this version.
2. Combined with the URS, PRD, LLD, and test case documents under docs/{Project Abbreviation}-v{Current Version Number}/, clarify the review scope and focus.

### Step 2: Discover security vulnerabilities
1. Check for injection risks (SQL injection, command injection, XSS, etc.).
2. Check for unauthorized access (unchecked permissions, horizontal/vertical privilege escalation).
3. Check for hardcoded keys, passwords, and Tokens.
4. Check for sensitive information leakage (sensitive data leaked in logs, error messages, response bodies).

### Step 3: Identify performance traps
1. Check for N+1 queries and database queries inside loops.
2. Check for memory leak risks (unreleased resources, unclosed connections, unlimited growth of global caches).
3. Check for unnecessary loops and repeated calculations.
4. Check for full table scans on large data volumes and queries on large tables without indexes.

### Step 4: Check code quality
1. Check for duplicated code, over-long functions, and over-long files.
2. Check whether the naming is clear and the readability meets the standard.
3. Check whether the comments are sufficient and consistent with the code.

### Step 5: Verify architecture compliance
1. Check whether the layering is clear and complies with the architecture design in docs/{Project Abbreviation}-sad.md and the LLD.
2. Check for violation of dependency direction (such as lower layers depending on upper layers, or cross-layer direct access).
3. Check for bypassing defined interfaces to operate directly on internal implementations.

### Step 6: Confirm test coverage
1. Check whether the critical paths have corresponding test cases and test code.
2. Check whether boundary conditions and exception paths are covered.
3. Give explicit hints for test gaps.

### Step 7: Fix the necessary and easy-to-fix issues
1. Evaluate the issues found in steps 2 to 6 one by one, and add the ones meeting either of the following conditions to the fix list: necessary to fix (security vulnerabilities, obvious defects, issues that would cause functional errors); fixable and easy to fix (small changes, low risk, issues that do not affect the interface contract and architecture design).
2. Modify the code directly per the fix list to fix them; do not fix issues with large impact, requiring design changes, or that may break existing functionality, and keep them as "not fixed".
3. After the fixes are complete, verify the list of modified files to ensure each fix corresponds one-to-one with the issue description and no new issues are introduced.

### Step 8: Read the code review report template
1. Call impm_template_reader to read the REVIEW-TEMPLATE.MD template content.

### Step 9: Write the review report in the template format
1. Organize the findings of steps 2 to 7 into a review report, strictly filling in per the template format: review scope, issue list (severity, file and location, issue description, modification suggestion, fix status), test coverage assessment, overall conclusion.
2. For fixed issues, mark "fixed" in the "fix status" column of the issue list; for unfixed issues, mark "not fixed" and state the reason.
3. Call impm_doc_writer (docType=review) to write docs/{Project Abbreviation}-v{Current Version Number}/{Project Abbreviation}-review.md.
4. Verify the file exists and the content is correct.

### Step 10: Record progress
1. Call impm_progress add (impm-coding-review, completed) to record this skill's completion status in version_progress.md.
2. Verify that this step status has been recorded in version_progress.md.

## Deliverables
- docs/{Project Abbreviation}-v{Current Version Number}/{Project Abbreviation}-review.md (review report)
- version_progress.md progress records

## Completion Hints
- After all operations of this skill are complete, it MUST end immediately and return to the dispatcher (the deliverables list and the version_progress.md progress status); it is strictly forbidden to continue with subsequent skills on your own; for subsequent steps, please have the dispatcher (PM) enter /impm-project-update, /impm-finish to continue.

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->