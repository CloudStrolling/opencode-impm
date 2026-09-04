---
name: impm-tools-secrets-scanning
description: Scan project code and configuration files for hardcoded keys, tokens, passwords, private keys, AK/SK, intranet IPs, and other sensitive information, and output a leak detection report
---

# impm-tools-secrets-scanning Skill

## Trigger Words
secret leak, sensitive information scan, secrets scanning, secrets detection, hardcoded keys, AK/SK detection, credential scan, tools-secrets-scanning

## When to Use
Use when a sensitive information/secret leak detection scan is needed for the current project, to check whether code and configuration files contain hardcoded keys, tokens, passwords, private keys, AK/SK, intranet IPs, and other sensitive information, and to output a detection report. Can be executed independently, or appended after Phase 4 code review.

## Execution Role
This skill is executed by a Technical Lead (subagent_type=tl) subagent, using the Skill tool to load this skill.

## Scheduling Instructions (Must be followed by PM/orchestrator when launching this skill)
1. Launch method: Use the task tool to launch a subagent with subagent_type set to `tl`; the PM or orchestrator must not execute the skill content themselves.
2. Required context in the prompt (all mandatory): absolute path of the project root directory (projectRoot), original user input $ARGUMENTS (including file paths mentioned by the user), skill name (impm-tools-secrets-scanning, requiring the subagent to load this skill via the Skill tool before executing).
3. Completion requirement: Wait for the subagent to return completion, verify the detection report output file has been generated and is complete, and only terminate after all is correct.

## Key Variable Definitions and Values
| Variable | Description | How to Obtain |
| Project Chinese Name | The project's Chinese name | Read from docs/project.md via impm_project_info |
| Project English Abbreviation | The project's English abbreviation, used for constructing report paths | Read from docs/project.md via impm_project_info |
| Scan Rule Template | Sensitive information scan rule list and report template | Read via impm_template_reader using TOOLS-SECRETS-SCANNING-TEMPLATE.MD |

## Execution Requirements
1. Execute strictly in the content and order of the execution steps: no skipping, no reordering, no parallelizing, no merging of any steps.
2. This skill is primarily read-only scanning: except for writing the detection report, do not modify any code, configurations, or other documents.
3. Risk levels for scan findings can only take three values: High, Medium, Low; each finding must have actual matching evidence; speculation or fabrication is prohibited.
4. High-risk findings must include the exact file path, line number, and match content summary (desensitized) in the remediation suggestion; medium/low-risk findings must provide remediation direction.
5. All document paths must use {Project English Abbreviation} for construction; filenames must not be fabricated.
6. Use impm_* tools to obtain information; tool return results must not be fabricated.
7. Use English throughout.
8. Matched sensitive information content must be desensitized in the report (e.g., truncated, masked); keys/passwords must not be fully exposed in the report.

## Execution Steps
### Step 1: Obtain Project Information and Determine Scan Scope
1. Call impm_project_info to read docs/project.md and obtain the project Chinese name and project English abbreviation; if docs/project.md does not exist (project not initialized), terminate this skill and prompt to execute /impm-init first to complete initialization.
2. Based on the project map and source code directory structure from docs/project.md, determine the scan scope for this run: source code directories, configuration file directories (config/, conf/, .env*), deployment scripts, dependency lists (such as package.json, requirements.txt, pom.xml, etc.).
3. Determine the exclusion directory list (must exclude): node_modules, .git, dist, build, vendor, __pycache__, .next, .nuxt, target, bin, obj and other build/dependency artifact directories.

### Step 2: Read Scan Rule Template
1. Call impm_template_reader (templateName=TOOLS-SECRETS-SCANNING-TEMPLATE.MD) to read the full template, obtaining the report format and scan rule list.

### Step 3: Scan by Rule Category
1. Following the scan rule ID order in the template, use the Grep tool to execute regex scans one by one, covering all eight major categories: API keys/AK/SK, passwords/passphrases, tokens/JWT, private keys, database connection strings, intranet IP addresses, .env/configuration file leaks, other sensitive information.
2. Scan requirements for each rule:
   - Use the Grep tool to search within the scan scope using regex patterns, specifying the `include` parameter to limit file types (e.g., `*.js,*.ts,*.py,*.java,*.go,*.yaml,*.yml,*.json,*.xml,*.env,*.properties,*.toml,*.ini,*.conf,*.cfg,*.sql,*.sh,*.bat,*.ps1,*.tf,*.hcl`, etc., adjusted based on project language).
   - For file path matching rules (e.g., .env file detection), use the Glob tool to find matching files, then use Grep to verify content.
   - Exclude files in excluded directories.
3. Deduplication: the same match on the same line in the same file is recorded only once; if different rules match the same location, record separately but note the rule IDs.
4. False positive exclusion:
   - Skip test credentials in test directories (e.g., example values under test/, tests/, __tests__/, spec/, mock/ directories).
   - Skip dependency directories like node_modules.
   - Skip credentials explicitly marked as examples in comments (e.g., `// example:`, `# placeholder`, `/* test */`).
   - For high-entropy string rules (SEC-SCAN-31), secondary verification is required: exclude known non-key Base64-encoded data (e.g., image data, JWT payload parts, etc.).

### Step 4: Risk Level Determination
1. For each match result, determine the risk level according to the rule list in the template:
   - **High**: Hardcoded passwords/private keys/AK/SK/JWT/Bearer Tokens and other plaintext credentials that can directly lead to unauthorized access (rules SEC-SCAN-01 ~ SEC-SCAN-21).
   - **Medium**: Intranet IPs, database connection strings containing credentials, tracked .env files, hardcoded credentials in configuration files, ID card numbers and other indirect risks (rules SEC-SCAN-22 ~ SEC-SCAN-30, SEC-SCAN-32).
   - **Low**: High-entropy strings, phone numbers and other low-risk findings (rules SEC-SCAN-31, SEC-SCAN-33).

### Step 5: Generate Detection Report
1. Organize the detection report strictly according to the TOOLS-SECRETS-SCANNING-TEMPLATE.MD format:
   - Header information (project name, scan date, scanner=TL, tool basis).
   - Scan conclusion summary table (findings count by risk category and each risk level).
   - Scan scope description.
   - Scan rule list (retaining all rules from the template).
   - Finding detail table (each finding includes: ID, rule ID, risk level, file path, line number, match content summary-desensitized, remediation suggestion).
   - Remediation suggestion priority (grouped by High/Medium/Low).
2. Use the Write tool to write the report to docs/{Project English Abbreviation}-secrets-scanning.md.
3. Verify the file exists and content is complete: summary statistics and detail counts match, each finding contains the necessary path, line number, and remediation suggestion.

### Step 6: Summary and Report
1. Count the findings and risk level distribution for each category.
2. If high-risk findings exist, highlight and list the top 3 most critical findings at the end of the report.

## Deliverables
- docs/{Project English Abbreviation}-secrets-scanning.md (Sensitive Information/Secret Leak Detection Report)

## Post-Completion Instructions
- After all operations of this skill are complete, must immediately terminate and return to the orchestrator (report path, findings statistics summary, and high-risk items summary); continuing to execute other skills independently is strictly prohibited.
- If running as a standalone command, report to the user: report location, total findings and risk level distribution, high-risk items summary, and remediation suggestions.

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
