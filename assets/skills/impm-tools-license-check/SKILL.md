---
name: impm-tools-license-check
description: Check all open-source dependency license declarations, detect dependency library license types, detect Copyleft (GPL/AGPL) viral conflict risks, and output a complete check report in the docs directory
---

# impm-tools-license-check Skill

## Trigger Words
license check, open-source compliance, License detection, copyleft check, GPL detection, AGPL detection, open-source license, license compliance, tools-license-check

## When to Use
Use when an open-source license compliance check is needed for all third-party dependencies in the current project, to detect each dependency's license type, identify Copyleft (GPL/AGPL) viral conflict risks, and output a check report. Can be executed independently, or appended after Phase 4 code review.

## Execution Role
This skill is executed by a Technical Lead (subagent_type=tl) subagent, using the Skill tool to load this skill.

## Scheduling Instructions (Must be followed by PM/orchestrator when launching this skill)
1. Launch method: Use the task tool to launch a subagent with subagent_type set to `tl`; the PM or orchestrator must not execute the skill content themselves.
2. Required context in the prompt (all mandatory): absolute path of the project root directory (projectRoot), project English abbreviation ({Project English Abbreviation}), original user input $ARGUMENTS (including file paths mentioned by the user), skill name (impm-tools-license-check, requiring the subagent to load this skill via the Skill tool before executing).
3. Completion requirement: Wait for the subagent to return completion, verify the check report has been generated and is complete, and only terminate after all is correct.

## Key Variable Definitions and Values
| Variable | Description | How to Obtain |
|---|---|---|
| Project Chinese Name | The project's Chinese name | Read from docs/project.md via impm_project_info |
| Project English Abbreviation | The project's English abbreviation, used for constructing report paths | Read from docs/project.md via impm_project_info |
| ClearlyDefined API | License query API | Fixed value: https://api.clearlydefined.io/definitions |

## License Classification Framework
| Category | License List | Risk Level | Description |
|---|---|---|---|
| Permissive | MIT, BSD-2-Clause, BSD-3-Clause, Apache-2.0, ISC, CC0-1.0, Unlicense, 0BSD, BlueOak-1.0.0 | No Risk | Can be used freely, no viral effect |
| Weak Copyleft | LGPL-2.0, LGPL-2.1, LGPL-3.0, MPL-2.0, EPL-1.0, EPL-2.0, CPL-1.0 | Low Risk | Modifying the library requires open-sourcing that library, does not infect the main project (when dynamically linked) |
| Strong Copyleft | GPL-2.0, GPL-3.0, AGPL-3.0 | High Risk | Viral: using/linking requires the entire project to be open-sourced under the same license |
| Commercially Restricted | SSPL-1.0, BSL-1.1, BUSL-1.1, SSPL | High Risk | Commercial use restricted |
| Unidentified | License type cannot be determined | Medium Risk | Requires manual confirmation, potential compliance risk |

## Ecosystem File Mapping Table
| Dependency File | Ecosystem | Local License Retrieval Method | API Query Format |
|---|---|---|---|
| `package.json` | npm | `license` field from `node_modules/{pkg}/package.json` | npm/{pkg}/{version} |
| `package-lock.json` | npm | `license` field from `node_modules/{pkg}/package.json` | npm/{pkg}/{version} |
| `requirements.txt` | PyPI | `License:` field from `{site-packages}/{pkg}-{version}.dist-info/METADATA` | pypi/{pkg}/{version} |
| `pyproject.toml` | PyPI | `License:` field from `{site-packages}/{pkg}-{version}.dist-info/METADATA` | pypi/{pkg}/{version} |
| `pom.xml` | Maven | license node from `{m2_repo}/{group}/{artifact}/{version}/{artifact}-{version}.pom` | maven/{group}/{artifact}/{version} |
| `go.mod` | Go | License from Go module proxy `https://proxy.golang.org/{module}/@v/{version}.mod` | go/{module}/{version} |
| `*.csproj` | NuGet | NuGet API query | nuget/{pkg}/{version} |
| `Cargo.lock` | crates.io | crates.io API query | crates/{pkg}/{version} |
| `Gemfile.lock` | RubyGems | RubyGems API query | gem/{pkg}/{version} |
| `composer.lock` | Packagist | Packagist API query | composer/{pkg}/{version} |

## Execution Requirements
1. Execute strictly in the content and order of the execution steps: no skipping, no reordering, no parallelizing, no merging of any steps.
2. This skill is read-only exploration: only read dependency files, local metadata files, and call external APIs; do not modify any code, configurations, or other documents.
3. API query failures must be recorded truthfully with the failure reason; fabrication of query results is prohibited.
4. If no known dependency files exist in the project root directory, terminate this skill and prompt the user to install dependencies first.
5. All document paths must use {Project English Abbreviation} for construction; filenames must not be fabricated.
6. Use impm_* tools to obtain information; tool return results must not be fabricated.
7. Use English throughout.
8. License identification must be based on actual evidence (local metadata or API returns); speculation or fabrication of license types is prohibited.

## Execution Steps
### Step 1: Obtain Project Information
1. Call impm_project_info to read docs/project.md and obtain the project Chinese name and project English abbreviation; if docs/project.md does not exist (project not initialized), terminate this skill and prompt to execute /impm-init first to complete initialization.

### Step 2: Detect Project's Own License
1. Check whether LICENSE, LICENSE.md, LICENSE.txt, COPYING, COPYING.md and other license files exist in the project root directory.
2. If they exist, read the file content and identify the license type (matching SPDX standard license identifiers).
3. Simultaneously check the `license` field in `package.json` (if it exists) and compare consistency with the LICENSE file.
4. Record the project's own license type as the baseline for subsequent viral conflict detection.

### Step 3: Detect Dependency Files and Extract Dependency List
1. Use Glob to scan the project root directory for known dependency files:
   - `package.json`, `package-lock.json`, `yarn.lock`
   - `requirements.txt`, `pyproject.toml`, `Pipfile.lock`
   - `pom.xml`, `build.gradle`
   - `go.mod`, `go.sum`
   - `*.csproj`, `packages.lock.json`
   - `Gemfile.lock`
   - `Cargo.lock`
   - `composer.lock`
2. If no known dependency files are found, terminate this skill and prompt: "No known dependency files detected in the project root directory; license check cannot be performed."
3. For each found dependency file, parse package names and version numbers according to the "Ecosystem File Mapping Table":
   - **package.json**: Read the `dependencies` and `devDependencies` objects, take each key and the version number in its value (strip `^`, `~`, `>=` and other prefixes, take the first numeric version).
   - **package-lock.json**: Read the `packages` object (skip the empty-string root entry), take the `version` field of each entry; skip if the package name starts with `.pnpm/`.
   - **yarn.lock**: Read the file content, match lines in the format `"package-name":\n  version "x.y.z"`, extract package name and version number.
   - **requirements.txt**: Parse line by line, ignore comments and blank lines; format is `package[extras]==version` or `package==version`, take the version number after `==`; skip the line if no `==` is present.
   - **pyproject.toml**: Read dependency declarations in `[project.dependencies]` or `[tool.poetry.dependencies]`, extract package names and version numbers.
   - **pom.xml**: Read `<dependency>` nodes, take `<groupId>:<artifactId>` as the package name; take the version number if `<version>` exists; skip if no `<version>` (version managed by parent BOM, cannot determine). Skip entries with scope `test`, `provided`, `system`.
   - **build.gradle**: Match `implementation`, `api`, `compile` declarations, parse `group:name:version` format.
   - **go.mod**: Read module paths and version numbers in the `require` block.
   - **go.sum**: Supplementary to go.mod, only take modules not included in go.mod.
   - **csproj**: Match `<PackageReference Include="name" Version="x.y.z" />` format.
   - **packages.lock.json**: Read package name and version separated by `|` in the `libraries` node.
   - **Gemfile.lock**: Read gem declarations under `specs:`, format is `gem-name (x.y.z)`.
   - **Cargo.lock**: Read `[[package]]` nodes, take `name` and `version` fields (skip root packages where name is `""`).
   - **composer.lock**: Read the `packages` and `packages-dev` arrays, take `name` and `version` of each entry.
4. Group all extracted dependencies by ecosystem, deduplicate to form the query list, and record the total package count.

### Step 4: Local-First License Information Retrieval
1. For the dependency list from Step 3, attempt to retrieve licenses locally by ecosystem, package by package:
   - **npm ecosystem**: Check if `node_modules/{pkg}/package.json` exists; if it does, read the `license` field. If it is an array (e.g., `["MIT", "Apache-2.0"]`), take the first element. Also check `node_modules/{pkg}/LICENSE*`, `node_modules/{pkg}/COPYING*` filenames as supplementary identification.
   - **PyPI ecosystem**: Check the `{site-packages}/{pkg}-{version}.dist-info/METADATA` file, read the `License:` field; or check license filenames in the `{site-packages}/{pkg}-{version}.dist-info/license_files/` directory.
   - **Maven ecosystem**: Check the `<licenses><license>` node in the local Maven repository `{user_home}/.m2/repository/{group_path}/{artifact}/{version}/{artifact}-{version}.pom`.
   - **Go ecosystem**: Check the module cache `{gopath}/pkg/mod/{module}@{version}/LICENSE` filename.
   - Other ecosystems: If local retrieval is not directly possible, skip the local step and use API query uniformly.
2. Record the local license retrieval result for each dependency: Retrieved / Not Retrieved.
3. Count the number of packages with locally retrieved and non-retrieved licenses.

### Step 5: API Fallback Query for Missing License Information
1. For dependencies where licenses were not locally retrieved in Step 4, construct ClearlyDefined API query requests:
   - Endpoint: `POST https://api.clearlydefined.io/definitions`
   - Request body format (batch):
     ```json
     {
       "coordinates": [
         "npm/{pkg}/{version}",
         "pypi/{pkg}/{version}",
         ...
       ]
     }
     ```
   - Single query endpoint: `GET https://api.clearlydefined.io/definitions/{type}/{provider}/{name}/{version}`
2. Use the Bash tool to execute curl commands to send requests:
   ```bash
   curl -s -X POST "https://api.clearlydefined.io/definitions" \
     -H "Content-Type: application/json" \
     -d '{"coordinates": ["npm/package-name/1.0.0", ...]}'
   ```
3. Extract the `licensed.declared` field from the response as the license identifier (SPDX format).
4. If the API query fails (network error, package not found, etc.), mark as "Query Failed" in the report and record the failure reason.
5. Merge the API-returned license information with locally retrieved results to form the final license list.

### Step 6: License Classification and Copyleft Conflict Detection
1. For each dependency's license, match its classification and risk level according to the "License Classification Framework":
   - Exact match of SPDX standard identifiers (e.g., `MIT`, `Apache-2.0`, `GPL-3.0-only`).
   - Fuzzy match: licenses containing keywords (e.g., those containing `GPL` are categorized as strong Copyleft, those containing `LGPL` as weak Copyleft).
   - Those that cannot be matched are marked as "Unidentified".
2. Copyleft viral conflict detection:
   - Read the project's own license determined in Step 2.
   - **Scenario 1**: Project uses a non-Copyleft license (MIT/Apache/BSD, etc.), dependencies contain GPL-2.0/GPL-3.0 → Mark as **Viral Conflict** (GPL requires the entire project to be open-sourced).
   - **Scenario 2**: Project uses a non-Copyleft license, dependencies contain AGPL-3.0 → Mark as **Viral Conflict** (AGPL requires network interactions to also be open-sourced).
   - **Scenario 3**: Project uses GPL-2.0, dependencies contain GPL-3.0 or AGPL-3.0 → Mark as **Version Incompatibility Conflict** (GPL-2.0 is only compatible with GPL-2.0+, not AGPL).
   - **Scenario 4**: Project uses GPL-3.0, dependencies contain AGPL-3.0 → Mark as **Viral Conflict** (AGPL is more restrictive than GPL).
   - **Weak Copyleft Conditional Conflict**: LGPL/MPL dependencies that are statically linked (compiled into binaries) are also marked as conditional conflicts; if dynamically linked, only noted as requiring attention.
3. Distinguish between direct and transitive dependencies:
   - Direct dependencies: Packages declared in the main dependency files (package.json/requirements.txt/pom.xml, etc.).
   - Transitive dependencies: Packages only appearing in lock files, introduced by direct dependencies.
   - Transitive dependency Copyleft risk is generally lower than direct dependencies, but still needs assessment at release time.

### Step 7: Generate Check Report
1. Read the check report template: call impm_template_reader (templateName=TOOLS-LICENSE-CHECK-TEMPLATE.MD) to read the full template.
2. Generate report content according to the template format:
   - **Overview**: Project name, check date, checker (TL), dependency file source list, total scanned packages, project's own license.
   - **License Classification Statistics Table**: Grouped by Permissive/Weak Copyleft/Strong Copyleft/Commercially Restricted/Unidentified, counting package numbers in each category.
   - **Dependency License Detail Table**: Each dependency's package name, ecosystem, version, license identifier, classification, risk level, dependency type (direct/transitive), retrieval method (local/API).
   - **Copyleft Viral Conflict Detection**: Conflict dependency list (if any), including package name, version, license, conflict type, impact scope, remediation suggestion.
   - **Conclusions and Recommendations**: Overall compliance assessment, risk level summary, remediation suggestions.
3. Determine report write path: use impm_version action=current to check if a version directory exists. If a version directory exists (e.g., docs/{Project English Abbreviation}-v{version}/), write the report to that version directory; otherwise write to the docs root directory. The report filename is fixed as `{Project English Abbreviation}-license-check.md`.
4. Use the Write tool to write the report to the determined path.
5. Verify the file exists and content is complete: overview, classification statistics, detail table, conflict detection, conclusions and recommendations are all present.

## Deliverables
- docs/{Project English Abbreviation}-license-check.md (Open-Source License Compliance Check Report)

## Post-Completion Instructions
- Report to the user a summary of the check results: total scanned packages, package count by category, Copyleft conflict count (if any), report path.
- If strong Copyleft viral conflicts exist, highlight and remind the user to pay attention to compliance risks, and provide remediation suggestions.
- If running as a standalone command, report to the user the report location and compliance check summary.

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
