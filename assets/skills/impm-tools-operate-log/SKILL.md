---
name: impm-tools-operate-log
description: Check whether critical operations (login, permission changes, data export, etc.) have audit log instrumentation, and output a check report based on classified protection "Security Audit" control points
---

# impm-tools-operate-log Skill

## Trigger Words
audit log, operation audit, audit log instrumentation, security audit instrumentation, classified protection audit, tools-operate-log

## When to Use
Use when an operation audit log instrumentation check is needed for the current project, to verify that critical operations (login/logout, permission changes, data export, sensitive configuration changes, business-critical operations, exceptional security events) have implemented audit log recording, with complete log fields and adequate protection measures, and to output a check report. Can be executed independently, or appended after Phase 4 code review.

## Execution Role
This skill is executed by a Technical Lead (subagent_type=tl) subagent, using the Skill tool to load this skill.

## Scheduling Instructions (Must be followed by PM/orchestrator when launching this skill)
1. Launch method: Use the task tool to launch a subagent with subagent_type set to `tl`; the PM or orchestrator must not execute the skill content themselves.
2. Required context in the prompt (all mandatory): absolute path of the project root directory (projectRoot), original user input $ARGUMENTS (including file paths mentioned by the user), skill name (impm-tools-operate-log, requiring the subagent to load this skill via the Skill tool before executing).
3. Completion requirement: Wait for the subagent to return completion, verify the check report output file has been generated and is complete, and only terminate after all is correct.

## Key Variable Definitions and Values
| Variable | Description | How to Obtain |
| Project Chinese Name | The project's Chinese name | Read from docs/project.md via impm_project_info |
| Project English Abbreviation | The project's English abbreviation, used for constructing report paths | Read from docs/project.md via impm_project_info |
| Check Report Template | Operation audit log instrumentation check report template | Read via impm_template_reader using TOOLS-OPERATE-LOG-TEMPLATE.MD |

## Execution Requirements
1. Execute strictly in the content and order of the execution steps: no skipping, no reordering, no parallelizing, no merging of any steps.
2. This skill is primarily read-only checks: except for writing the check report, do not modify any code, configurations, or other documents.
3. Check results can only take three values: Pass, Fail, Not Applicable; each determination must have actual evidence; speculation or fabrication of evidence is prohibited.
4. Items determined as Fail must specify the exact reason for failure in the description (including file path and issue description); items determined as Not Applicable must state the rationale in the description.
5. All document paths must use {Project English Abbreviation} for construction; filenames must not be fabricated.
6. Use impm_* tools to obtain information; tool return results must not be fabricated.
7. Use English throughout.

## Execution Steps
### Step 1: Obtain Project Information and Determine Check Scope
1. Call impm_project_info to read docs/project.md and obtain the project Chinese name and project English abbreviation; if docs/project.md does not exist (project not initialized), terminate this skill and prompt to execute /impm-init first to complete initialization.
2. Based on the project map and source code directory structure from docs/project.md, determine the check scope for this run: source code directories, logging framework configuration files, middleware/interceptor code, logging aspect configurations, and design documents under docs.

### Step 2: Read Check Report Template
1. Call impm_template_reader (templateName=TOOLS-OPERATE-LOG-TEMPLATE.MD) to read the full template, obtaining all check items and their check points.

### Step 3: Item-by-Item Audit Log Instrumentation Check
1. Check each item in the order of the template's check items, covering all seven major categories: user authentication audit, permission change audit, data export audit, sensitive configuration change audit, business-critical operation audit, exception and security event audit, audit log protection and operations; skipping any check item is not permitted.
2. Each item must be judged based on actual evidence: use Glob, Grep, Read to search code, configuration, logging framework configuration, interceptor/aspect implementations; read-only commands may be run as needed for auxiliary confirmation (e.g., logging framework initialization configuration), but no files may be modified.
3. Judgment rules:
   - Clear code, configuration, or documentary evidence shows that this operation scenario has implemented audit log recording, with complete log fields and adequate protection measures → Fill in "Pass" in the check result column, noting the evidence location (file path:line number or configuration location) in the description;
   - No audit log instrumentation evidence found, or log fields are incomplete, or protection measures are missing → Fill in "Fail" in the check result column, specifying the exact reason for failure (what instrumentation is missing, what issue exists in which file) in the description;
   - The current project genuinely does not have this operation scenario (e.g., no data export function, no sensitive configuration change API) → Fill in "Not Applicable" in the check result column, stating the basis for this determination in the description.

### Step 4: Generate Check Report
1. Organize the check report strictly according to the TOOLS-OPERATE-LOG-TEMPLATE.MD format: header information (project name, check date, checker=TL, standard basis), category summary statistics table (check item count, pass, fail, not applicable counts), checklist detail (each check item's check result and description), overall conclusion, remediation suggestion priority.
2. Use the Write tool to write the report to docs/{Project English Abbreviation}-operate-log-check.md.
3. Verify the file exists and content is complete: each check item has a check result and description filled in, summary statistics and details are consistent.

## Deliverables
- docs/{Project English Abbreviation}-operate-log-check.md (Operation Audit Log Instrumentation Check Report)

## Post-Completion Instructions
- After all operations of this skill are complete, must immediately terminate and return to the orchestrator (report path, check conclusion statistics, and fail item summary); continuing to execute other skills independently is strictly prohibited.
- If running as a standalone command, report to the user: report location, fail item summary, and remediation suggestions.

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
