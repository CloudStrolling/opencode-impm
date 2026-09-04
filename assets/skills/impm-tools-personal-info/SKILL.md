---
name: impm-tools-personal-info
description: Based on the Personal Information Protection Law of the PRC, perform compliance checks on the project's full lifecycle of personal information collection, transmission, and storage (including deletion and rights protection), and output a check list and complete check report
---

# impm-tools-personal-info Skill

## Trigger Words
personal information protection, PIPL, personal information compliance, Personal Information Protection Law check, data collection compliance, data storage compliance, data transmission compliance, data compliance check, tools-personal-info

## When to Use
Use when a Personal Information Protection Law of the PRC (PIPL) compliance check is needed for the current project, to item-by-item verify the project's legal compliance across personal information collection, transmission, storage (and deletion, rights protection) stages, and to output a complete check report in the docs directory. Can be executed independently, or appended after Phase 4 code review.

## Execution Role
This skill is executed by a Technical Lead (subagent_type=tl) subagent, using the Skill tool to load this skill.

## Scheduling Instructions (Must be followed by PM/orchestrator when launching this skill)
1. Launch method: Use the task tool to launch a subagent with subagent_type set to `tl`; the PM or orchestrator must not execute the skill content themselves.
2. Required context in the prompt (all mandatory): absolute path of the project root directory (projectRoot), project English abbreviation (obtained via impm_project_info), original user input $ARGUMENTS (including file paths mentioned by the user), skill name (impm-tools-personal-info, requiring the subagent to load this skill via the Skill tool before executing).
3. Completion requirement: Wait for the subagent to return completion, verify the check report has been generated and is complete, and only terminate after all is correct.

## Key Variable Definitions and Values
| Variable | Description | How to Obtain |
| --- | --- | --- |
| Project Chinese Name | The project's Chinese name | Read from docs/project.md via impm_project_info |
| Project English Abbreviation | The project's English abbreviation, used for constructing report paths | Read from docs/project.md via impm_project_info |
| Check List and Report Template | Personal information protection check list and report format | Read via impm_template_reader using TOOLS-PERSONAL-INFO-TEMPLATE.MD |

## Execution Requirements
1. Execute strictly in the content and order of the execution steps: no skipping, no reordering, no parallelizing, no merging of any steps.
2. This skill is primarily read-only checks: except for writing the check report, do not modify any code, configurations, or other documents.
3. Check results can only take three values: Pass, Fail, Not Applicable; each check point must be supported by actual evidence (file path and line number); speculation or fabrication is prohibited.
4. Fail items must provide the specific file location and issue description, along with remediation suggestions; Not Applicable items must briefly state the basis for determination.
5. All personal information content in the report must be desensitized; real names, phone numbers, ID card numbers, bank card numbers, etc. must not be fully exposed.
6. All document paths must use {Project English Abbreviation} for construction; filenames must not be fabricated.
7. Use impm_* tools to obtain information; tool return results must not be fabricated.
8. Use English throughout.
9. The check list is based on the articles of the Personal Information Protection Law; when checking, first confirm the corresponding article, then verify the project implementation; speculation beyond the articles is not allowed.

## Execution Steps

### Step 1: Obtain Project Information and Legal Basis
1. Call impm_project_info to read docs/project.md and obtain the project Chinese name and project English abbreviation; if docs/project.md does not exist (project not initialized), terminate this skill and prompt to execute /impm-init first to complete initialization.
2. Clarify the legal basis for this check as the Personal Information Protection Law of the PRC (effective 2021-11-01), involving basic principles and general rules (Articles 5, 6, 7, 9), collection (Articles 13, 14, 15, 17, 28, 29), transmission (Articles 22, 23, 24, 38, 39, 40, 41), and storage and deletion and rights protection (Articles 19, 40, 45, 47, 51, 55, 56, 57) and other provisions.

### Step 2: Read Check List and Report Template
1. Call impm_template_reader (templateName=TOOLS-PERSONAL-INFO-TEMPLATE.MD) to read the full template, obtaining the check list items, check stage divisions, and report format.

### Step 3: Conduct Data Collection (Read-Only Exploration)
1. Based on the project map and source code directory structure from docs/project.md, determine the check scope for this run: source code directories, configuration file directories (config/, conf/, .env*), database design (DBD/SQL), API design, logging configuration, deployment environment, etc.
2. Determine the exclusion directory list (must exclude): node_modules, .git, dist, build, vendor, __pycache__, .next, .nuxt, target, bin, obj and other build/dependency artifact directories.
3. Collect the following evidence based on backend language/framework characteristics (where applicable):
   - User entity/model definitions, registration/login, form collection logic → Assess whether collection fields are minimally necessary;
   - Database table structures and SQL scripts → Assess storage fields, encryption/desensitization status;
   - API interface definitions and implementations → Assess whether transmission uses encrypted channels, whether responses are desensitized;
   - Logging configuration, instrumentation/statistics code → Assess whether logs record and redundantly retain personal information;
   - Cache/storage service (Redis, object storage, etc.) configurations → Assess sensitive information storage protection;
   - Data processing agreements/privacy policy documents → Assess notification and consent mechanisms (record if present).
4. Use Grep / Glob / Read and other tools to collect evidence within the above scope; read-only exploration, do not modify any files.

### Step 4: Item-by-Item Check (Following the Check List)
1. Check each item in the order of the template "Section 2: Personal Information Protection Check List" (PIP-001~PIP-312), covering four stages:
   - Basic principles and general rules (PIP-001~007, corresponding to Articles 5, 6, 7, 9, 51, 47);
   - Collection stage (PIP-101~109, corresponding to Articles 13, 14, 15, 17, 28, 29);
   - Transmission stage (PIP-201~209, corresponding to Articles 22, 23, 24, 38, 39, 40, 41, 51);
   - Storage stage (PIP-301~312, corresponding to Articles 19, 40, 45, 47, 51, 55, 56, 57).
2. For each item, based on collected evidence, determine "Pass / Fail / Not Applicable":
   - **Pass**: Project implementation complies with the corresponding provision (record evidence location);
   - **Fail**: Project implementation violates or does not meet the provision's requirements (record file path, line number, and issue description);
   - **Not Applicable**: The project does not have this scenario (record the basis for determination, e.g., "The project does not involve cross-border data transmission").
3. Skipping any check item is prohibited; if related clues are discovered after completing an item (e.g., an API collects ID card numbers, the storage encryption and transmission desensitization of that field should also be checked), proactively follow up on related stages to supplement evidence.

### Step 5: Summarize and Generate Check Report
1. Compile check results for each stage, fill in the "Section 3: Check Result Summary" table, calculate the total number of check items and Pass/Fail/Not Applicable counts.
2. For all "Fail" items, fill in "Section 4: Fail Item Details and Remediation Suggestions", providing risk levels (High/Medium/Low) and remediation suggestions.
3. Fill in "Section 5: Check Conclusion and Recommendations", providing an overall compliance assessment grade (All Pass / High-Risk Items Exist Requiring Immediate Remediation / Medium-Low Risk Items Exist Suggesting Improvement) and remediation suggestions.
4. Determine the report write path: use impm_version action=current to check if a version directory exists. If a version directory exists (e.g., docs/{Project English Abbreviation}-v{version}/), write the report to that version directory; otherwise write to the docs root directory. The report filename is fixed as `{Project English Abbreviation}-personal-info-check.md`.
5. Use the Write tool to write the report to the determined path.
6. Verify the file exists and content is complete: check overview, four-stage check list, result summary, fail details, conclusion and recommendations are all present; statistical data is consistent throughout.

## Deliverables
- docs/{Project English Abbreviation}-personal-info-check.md (Personal Information Protection Compliance Check Report, including check list and item-by-item check results)

## Post-Completion Instructions
- After all operations of this skill are complete, must immediately terminate and return to the orchestrator (report path, total check items and Pass/Fail/Not Applicable counts, high-risk fail item summary); continuing to execute other skills independently is strictly prohibited.
- If running as a standalone command, report to the user: report location, check result summary, and highlight high-risk fail items and remediation suggestions.

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
