---
name: impm-init-git
description: Brings the current project under git management, reads the GITIGNORE-TEMPLATE template and creates/updates .gitignore with the full template content (line-by-line, without trimming any entries), and makes the initial commit. Use when a git baseline needs to be established during the initialization phase.
---

# impm-init-git Skill
## Trigger Words
- git initialization
- Initial commit
- .gitignore
- Bring under version control

## When to Use
- When the git step of the initialization phase (/impm-init-git) is executed.
- When the project is not yet under git management and a git baseline and initial commit need to be established.

## Executing Agent
This skill is executed by the SCM subagent. Load this skill with the Skill tool when executing.

## Key Variables and How to Get Them
| Variable | Description | How to get it |
| Project Chinese name | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project English name | The English name of the project | Read from docs/project.md via impm_project_info |
| Project abbreviation | The project's English abbreviation, used to construct all document paths | Read from docs/project.md via impm_project_info |
| Current version | The version currently being executed (fixed at 0.0.1 during the initialization phase) | Get via impm_version, or infer from the version directory name |
| Project programming language | The project's programming language, used to determine .gitignore entries | Read from docs/project.md via impm_project_info |

## Execution Requirements
1. Execute strictly in the order of the content in the execution steps: no skipping, no out-of-order execution, no parallel execution, no merged execution of any step.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths must be constructed with {project abbreviation} and {current version}; do not fabricate file names.
4. Use impm_* tools to obtain information; do not fabricate tool results.
5. Use English throughout.
6. After each step, verify that the output file exists and its content is correct.

## Execution Steps
### Step 1: Check and bring under git management
Call impm_git(projectRoot, status) to determine whether the current project directory is under git management:
- Already under git management: skip the enrollment step and continue to step 2.
- Not under git management: call impm_git(projectRoot, init) to bring the project under git management, and verify that the git repository was initialized successfully.

### Step 2: Create/update .gitignore
Call impm_template_reader(projectRoot, GITIGNORE-TEMPLATE) to read the .gitignore template from the skills template directory (.opencode/skills/template/, or assets/skills/template/ as fallback). The template provides ignore entries grouped by operating system, IDE/editors, AI development tools, and programming language.
Create or update .gitignore in the project root directory by copying the template content line by line without any trimming:
- The generated .gitignore must contain all the template entries, compared line by line against the template content, including the entries for irrelevant programming languages, other platforms' system files, unused IDE/editors, and AI development tools that are not in use.
- Do not remove, filter, or cut any template line; each line of the template must be present in the final .gitignore.
- The environment and secrets entries (.env, .env.*, .env.local, etc.) are kept as-is from the template; secret-type files are never committed.
- If .gitignore already exists, update it by comparing it line by line with the template, so that the updated .gitignore fully covers the template content.
Verify that .gitignore covers every line of the template: every entry in the template content exists in .gitignore.

### Step 3: Initial commit
Call impm_git(projectRoot, commit, null, Initialize impm project) to make an initial commit of all current initialization content, and verify the commit succeeded via impm_git(projectRoot, status) or log.

### Step 4: Record progress
If version_progress.md exists, call impm_progress(projectRoot, {project abbreviation}, {current version}, add, impm-init-git, completed) to record this step as complete; if version_progress.md does not yet exist (impm-init-version not yet executed), skip the progress record and let impm-init-version backfill it uniformly.

## Deliverables
- Git repository (if the project was not under git management before)
- .gitignore in the project root directory
- Initial commit record (message: Initialize impm project)

## Next Steps
- To continue with the next step, enter /impm-init-project
- To continue with all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
