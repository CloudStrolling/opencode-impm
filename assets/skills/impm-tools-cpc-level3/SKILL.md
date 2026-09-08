---
name: impm-tools-cpc-level3
description: Check the security compliance of the current project's code and configuration against the GB/T 22239-2019 classified protection level-3 requirements item by item, and output a level-3 classified protection code review inspection report
---

# impm-tools-cpc-level3 skill

## Trigger words
level 3 classified protection, classified protection check, classified protection assessment, compliance check, security compliance, CPC, cpc-level3, tools-cpc-level3

## When to use
When the current project needs a code review and compliance self-check for the software development-related requirements of the network security level-3 classified protection (GB/T 22239-2019), and an inspection report needs to be output. It can be executed independently, or additionally after the stage-4 code review.

## Execution role
This skill is executed by the Tech Lead (subagent_type=tl) subagent, loading this skill with the Skill tool.

## Scheduling instructions (must be followed when the PM/upper-level orchestrator starts this skill)
1. Startup method: use the task tool to start the subagent, with subagent_type that must be `tl`; the PM or the orchestrator is forbidden to execute the content of this skill by itself.
2. The prompt must carry the context (all are required): the absolute path of the project root (projectRoot), the raw user input $ARGUMENTS (including the file paths the user mentioned), the skill name (impm-tools-cpc-level3, the subagent must first load this skill with the Skill tool and then execute it).
3. Completion requirement: after waiting for the subagent to return its completion result, verify that the inspection report produced file has been generated and the content is complete; only finish when all are correct.

## Key variable definitions and values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to construct the report path | Read from docs/project.md via impm_project_info |
| Checklist template | The level-3 classified protection code review checklist | Read TOOLS-CPC-LEVEL3-TEMPLATE.MD via impm_template_reader |

## Execution requirements
1. Strictly execute in the order and content of the execution steps in sequence: do not skip, do not reorder, do not parallelize, do not merge any step.
2. This skill is mainly a read-only inspection: except for writing the inspection report, it must not modify any code, configuration or other documents.
3. The inspection result can only take three values: pass, fail, not applicable; each determination must have actual evidence; guessing or fabricating evidence is forbidden.
4. For the inspection items determined as fail, the specific reasons for the failure must be stated in the description (including the file path and the problem description); for the items determined as not applicable, the reason for the determination must be stated in the description.
5. All document paths must be constructed with {Project Abbreviation}; do not invent file names.
6. Use the impm_* tools to obtain information; do not fabricate tool results.
7. Use English throughout.

## Execution steps
### Step 1: Obtain the project information and determine the inspection scope
1. Call impm_project_info to read docs/project.md and obtain the Project Name (Chinese) and the Project Abbreviation; if docs/project.md does not exist (the project has not been initialized), terminate this skill and prompt that /impm-init should be run first to complete the initialization.
2. Determine the inspection scope for this time together with the project map and the source code directory structure in docs/project.md: the source code directories, the configuration files, the deployment scripts, the dependency lists (such as package.json, requirements.txt, pom.xml, etc.) and the design documents under docs.

### Step 2: Read the level-3 classified protection checklist template
1. Call impm_template_reader (templateName=TOOLS-CPC-LEVEL3-TEMPLATE.MD) to read the full template and obtain all the inspection items and their standard clauses and inspection highlights.

### Step 3: Check the checklist item by item
1. Check the items one by one in the order of the template, covering all nine major categories: development process management (self-developed software development, outsourced software development), identity authentication and session management, access control, security auditing, intrusion prevention and input security, data security, personal information protection, testing and acceptance; no inspection item may be skipped.
2. Each item must be determined based on actual evidence: use Glob, Grep and Read to search the code, configuration, CI/release scripts, dependency lists and documents; if necessary, run read-only commands to assist confirmation (such as dependency audit commands), but no file may be modified.
3. Determination rules:
   - When there is clear code, configuration or document evidence that satisfies the requirement → fill the inspection result with "pass", and state the evidence location in the description (file path:line number or document name);
   - When no evidence satisfying the requirement is found, or there is an obvious non-compliance → fill the inspection result with "fail", and state the specific reason for the failure in the description (what is missing, and what risk exists in which file and at which line);
   - When the scenario really does not exist in the current project (such as no outsourced development, or no personal information collection) → fill the inspection result with "not applicable", and state the reason for the determination in the description.

### Step 4: Generate the inspection report
1. Strictly organize the inspection report according to the format of TOOLS-CPC-LEVEL3-TEMPLATE.MD: the header information (project name, inspection date, inspector=TL, standard basis), the summary statistics table of each category (the number of inspection items, the number of pass/fail/not applicable), the checklist details (the inspection result and description of each item), the overall conclusion, and the priority of the rectification suggestions.
2. Use the Write tool to write the report to docs/{Project Abbreviation}-cpc-level3-check.md.
3. Verify that the file exists and the content is complete: every inspection item has been filled in with an inspection result and a description, and the summary statistics are consistent with the details.

## Deliverables
- docs/{Project Abbreviation}-cpc-level3-check.md (the level-3 classified protection inspection report)

## Notes after completion
- After all the operations of this skill are complete, it must end immediately and return to the scheduling party (the report path, the inspection conclusion statistics and the summary of the failed items); it is strictly forbidden to continue executing other skills by yourself.
- If it is run as a standalone command, report the report location, the summary of the failed items and the rectification suggestions to the user.

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->