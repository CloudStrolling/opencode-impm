---
name: impm-init-git
description: Brings the current project under git management, creates/updates .gitignore based on the operating system and the project programming language, and makes the initial commit. Use when a git baseline needs to be established during the initialization phase.
---

# impm-init-git Skill

## Trigger words
- git initialization
- initial commit
- .gitignore
- bring under version control

## When to use
- When the git step of the initialization phase (/impm-init-git) is executed.
- When the project has not yet been brought under git management and a git baseline and initial commit need to be established.

## Executing role
This skill is executed by the Software Configuration Engineer (subagent_type=scm) subagent. When executing, load this skill using the Skill tool.

## Scheduling notes (must comply when PM/upper-level orchestrator starts this skill)
1. Startup method: start the subagent using the task tool, subagent_type must be `scm`; the PM or orchestrator is prohibited from executing this skill's content in place of it.
2. The prompt must pass the context (none may be missing): the absolute path of the project root directory (projectRoot), project English abbreviation ({project English abbreviation}), current version number ({current version number}), the original user input $ARGUMENTS (including file paths mentioned by the user), and the skill name (impm-init-git, require the subagent to first load this skill using the Skill tool before executing).
3. Completion requirement: after waiting for the subagent to return the completion result, verify the produced files and the version_progress.md progress records; only proceed to the next step when all are correct.

## Key variable definitions and values
| Variable | Description | How to obtain |
| Project Name (Chinese) | The Chinese name of the project | Read from docs/project.md via impm_project_info |
| Project Name (English) | The English name of the project | Read from docs/project.md via impm_project_info |
| Project Abbreviation | The English abbreviation of the project, used to concatenate all document paths | Read from docs/project.md via impm_project_info |
| Current version number | The version number being executed (fixed to 0.0.1 in the initialization phase) | Obtained via impm_version or inferred from the version directory name |
| Project programming language | The programming language of the project, used to determine the .gitignore ignore items | Read from docs/project.md via impm_project_info |

## Execution requirements
1. Execute strictly in the content and order of the execution steps: do not skip, do not reorder, do not run in parallel, do not merge any steps.
2. Only perform the operations specified in this skill; do not do work unrelated to the task.
3. All document paths must be concatenated with {project English abbreviation} and {current version number}; do not fabricate file names.
4. Use the impm_* tools to obtain information; do not fabricate tool return results.
5. Use English throughout.
6. After each step, verify that the produced files exist and the content is correct.

## Execution steps
### Step 1: check and bring under git management
Call impm_git(projectRoot, status) to determine whether the current project directory is under git management:
- Already under git management: skip the inclusion step and continue to step 2.
- Not under git management: call impm_git(projectRoot, init) to bring the project under git management, and verify that the git repository initialization succeeded.

### Step 2: create/update .gitignore
1. Directly read the skill template file `.opencode/skills/template/GITIGNORE-TEMPLATE` (this file is in the same directory level as this skill file, relative path `../template/GITIGNORE-TEMPLATE`), and create or update the .gitignore at the project root based on the template content.
2. The template content must be fully retained; cropping is prohibited:
   - Do not remove any section or entry in the template, including language sections unrelated to the project language (e.g., keep frontend/Node.js, Python, Java, Rust, Go, PHP etc. all), IDE sections, AI development tool sections, etc.;
   - Common sections such as operating system, IDE, AI development tool, etc. remain unchanged;
   - Supplement project-specific exclude items (such as framework artifacts, private configs, etc.) only when necessary; do not omit any content due to cropping the template.
3. If .gitignore already exists, it must be compared and updated line by line against the template content; do not skip:
   - Using the "full template content" as the baseline, compare line by line with the existing .gitignore, checking whether each line of the template (including comment lines and section titles) exists and is consistent in the .gitignore;
   - As long as any line is missing or inconsistent in the template, the update must actually be written: update .gitignore line by line according to the complete template content (fill in missing lines, correct inconsistent lines, keep the order consistent with the template), and list the lines updated/added in this run in the final result;
   - It is prohibited to conclude "no update needed" merely because "key ignore items are included" or "content is complete" - the key-item check in step 4 is only a baseline validation and cannot replace this step's full line-by-line comparison against the template;
   - Preserve existing entries in .gitignore outside the template (such as project-specific custom ignore items), avoiding accidental deletion or overwriting; when existing entries conflict with the template, the template takes precedence.
4. Key item check (baseline validation, cannot replace the full line-by-line comparison against the template in step 3):
   - Dependency directories: node_modules, vendor, .venv, etc. (adjust by programming language)
   - Build artifacts: dist, build, out, target, __pycache__, etc. (adjust by programming language)
   - Tools and config directories: .opencode, .idea, .vscode, *.iml, .DS_Store
   - Logs and temporary files: *.log, tmp, temp, *.tmp
   - Environment and secrets: .env, *.local, .secret (secret-type files are never committed)

### Step 3: initial commit
If .gitignore was created or updated this run (or the project had not been brought under git management before), call impm_git(projectRoot, commit, null, initialize impm project) to commit this change, and verify the commit succeeded via impm_git(projectRoot, status) or log; if there is no change this run, skip the commit.

### Step 4: record progress
If version_progress.md already exists, call impm_progress(projectRoot, {project English abbreviation}, {current version number}, add, impm-init-git, completed) to record the completion of this step; if version_progress.md does not yet exist (impm-init-version has not been executed), skip the progress record, to be back-filled uniformly by impm-init-version.

## Deliverables
- The git repository (if it had not been brought under git management before)
- .gitignore at the project root
- The initial commit record (message: initialize impm project)

## Completion tips
- To continue to the next step, enter /impm-init-project
- To continue executing all remaining steps of this phase, enter /impm-init
<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
