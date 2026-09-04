---
name: impm-tools-vulnscan
description: Based on the language and ecosystem used by the current project, query known vulnerabilities in middleware and third-party packages via the OSV.dev API, and generate a vulnerability scan report in the docs directory
---

# impm-tools-vulnscan Skill

## Trigger Words
vulnerability scan, vulnerability detection, vulnscan, security scan, dependency security, CVE

## When to Use
Use when a known vulnerability scan is needed for all third-party dependencies (middleware, third-party packages) in the current project. Can be executed independently, or appended during the version wrap-up phase.

## Execution Role
This skill is executed by a Technical Lead (subagent_type=tl) subagent, using the Skill tool to load this skill.

## Scheduling Instructions (Must be followed by PM/orchestrator when launching this skill)
1. Launch method: Use the task tool to launch a subagent with subagent_type set to `tl`; the PM or orchestrator must not execute the skill content themselves.
2. Required context in the prompt (all mandatory): absolute path of the project root directory (projectRoot), project English abbreviation ({Project English Abbreviation}), original user input $ARGUMENTS (including file paths mentioned by the user), skill name (impm-tools-vulnscan, requiring the subagent to load this skill via the Skill tool before executing).
3. Completion requirement: Wait for the subagent to return completion, verify the vulnerability scan report has been generated and is complete, and only terminate after all is correct.

## Key Variable Definitions and Values
| Variable | Description | How to Obtain |
|---|---|---|
| Project Chinese Name | The project's Chinese name | Read from docs/project.md via impm_project_info |
| Project English Abbreviation | The project's English abbreviation, used for constructing report paths | Read from docs/project.md via impm_project_info |
| OSV API Endpoint | Vulnerability batch query API | Fixed value: https://api.osv.dev/v1/querybatch |

## Ecosystem File Mapping Table
| Dependency File | OSV Ecosystem | Package Name Format | Version Extraction Method |
|---|---|---|---|
| `package.json` | npm | package.json dependencies + devDependencies keys | Version number from value (strip ^~) |
| `package-lock.json` | npm | dependency names from packages | version field |
| `yarn.lock` | npm | package names parsed from yarn.lock | version field |
| `requirements.txt` | PyPI | package name (strip extras) | version number after == |
| `pyproject.toml` | PyPI | package names from dependencies list | version number from version constraint |
| `Pipfile.lock` | PyPI | package names from default + develop | version field |
| `pom.xml` | Maven | groupId:artifactId | Skip if version not specified (may be managed by parent) |
| `build.gradle` | Maven | implementation/api dependency declarations | version number |
| `go.mod` | Go | module paths in require block | version number |
| `go.sum` | Go | module paths | version number |
| `*.csproj` | NuGet | PackageReference Include | Version attribute |
| `packages.lock.json` | NuGet | package names in packages node | version field |
| `Gemfile.lock` | RubyGems | gem names in specs | version number |
| `Cargo.lock` | crates.io | name in packages | version field |
| `composer.lock` | Packagist | names in packages + packages-dev | version field |

## Execution Requirements
1. Execute strictly in the content and order of the execution steps: no skipping, no reordering, no parallelizing, no merging of any steps.
2. This skill is read-only exploration: only read dependency files and call external APIs; do not modify any code, configurations, or other documents.
3. API query failures must be recorded truthfully with the failure reason; fabrication of query results is prohibited.
4. If no known dependency files exist in the project root directory, terminate this skill and prompt the user to install dependencies first.
5. All document paths must use {Project English Abbreviation} for construction; filenames must not be fabricated.
6. Use impm_* tools to obtain information; tool return results must not be fabricated.
7. Use English throughout.

## Execution Steps
### Step 1: Obtain Project Information
1. Call impm_project_info to read docs/project.md and obtain the project Chinese name and project English abbreviation; if docs/project.md does not exist (project not initialized), terminate this skill and prompt to execute /impm-init first to complete initialization.

### Step 2: Detect Dependency Files and Extract Dependency List
1. Use Glob to scan the project root directory for known dependency files:
   - `package.json`, `package-lock.json`, `yarn.lock`
   - `requirements.txt`, `pyproject.toml`, `Pipfile.lock`
   - `pom.xml`, `build.gradle`
   - `go.mod`, `go.sum`
   - `*.csproj`, `packages.lock.json`
   - `Gemfile.lock`
   - `Cargo.lock`
   - `composer.lock`
2. If no known dependency files are found, terminate this skill and prompt: "No known dependency files detected in the project root directory; vulnerability scan cannot be performed."
3. For each found dependency file, parse package names and version numbers according to the "Ecosystem File Mapping Table":
   - **package.json**: Read the `dependencies` and `devDependencies` objects, take each key and the version number in its value (strip `^`, `~`, `>=` and other prefixes, take the first numeric version).
   - **package-lock.json**: Read the `packages` object (skip the empty-string root entry), take the `version` field of each entry; skip if the package name starts with `.pnpm/`.
   - **yarn.lock**: Read the file content, match lines in the format `"package-name":\n  version "x.y.z"`, extract package name and version number.
   - **requirements.txt**: Parse line by line, ignore comments and blank lines; format is `package[extras]==version` or `package==version`, take the version number after `==`; skip the line if no `==` is present (cannot determine version).
   - **pyproject.toml**: Read dependency declarations in `[project.dependencies]` or `[tool.poetry.dependencies]`, extract package names and version numbers.
   - **pom.xml**: Read `<dependency>` nodes, take `<groupId>:<artifactId>` as the package name; take the version number if `<version>` exists; skip if no `<version>` (version managed by parent BOM, cannot determine). Skip entries with scope `test`, `provided`, `system`.
   - **build.gradle**: Match `implementation`, `api`, `compile` declarations, parse `group:name:version` format; entries with only `group:name` (no version) are skipped.
   - **go.mod**: Read module paths and version numbers in the `require` block.
   - **go.sum**: Supplementary to go.mod, only take modules not included in go.mod.
   - **csproj**: Match `<PackageReference Include="name" Version="x.y.z" />` format.
   - **packages.lock.json**: Read package name and version separated by `|` in the `libraries` node.
   - **Gemfile.lock**: Read gem declarations under `specs:`, format is `gem-name (x.y.z)`.
   - **Cargo.lock**: Read `[[package]]` nodes, take `name` and `version` fields (skip root packages where name is `""`).
   - **composer.lock**: Read the `packages` and `packages-dev` arrays, take `name` and `version` of each entry.
4. Group all extracted dependencies by OSV Ecosystem, deduplicate to form the query list, and record the total package count.

### Step 3: Call OSV.dev API for Batch Query
1. For the dependency list from Step 2, construct query requests by OSV Ecosystem:
   - Use the `POST https://api.osv.dev/v1/querybatch` endpoint.
   - Each request contains at most 100 query items (API single-request limit).
   - Query item format:
     ```json
     {
       "package": {
         "name": "package-name",
         "ecosystem": "Ecosystem"
       },
       "version": "version-number"
     }
     ```
2. Use the Bash tool to execute curl commands to send requests:
   ```bash
   curl -s -X POST "https://api.osv.dev/v1/querybatch" \
     -H "Content-Type: application/json" \
     -d '{"queries": [...]}'
   ```
3. If the total number of dependencies exceeds 100, send requests in batches (100 per batch), merging all response results.
4. Handle pagination: if a query item in the response contains `next_page_token`, subsequent requests must be sent to fetch remaining results (carrying the corresponding query's `page_token`) until all `next_page_token` values are empty.
5. Record the response result for each query:
   - `vulns` is an empty array or does not exist → The package has no known vulnerabilities
   - `vulns` is non-empty → Extract the `id` and `modified` fields of each vulnerability
6. Compile a list of packages with vulnerabilities and a list of packages without vulnerabilities.

### Step 4: Generate Vulnerability Scan Report
1. Read the vulnerability scan report template: call impm_template_reader to read the VULNSCAN-TEMPLATE.MD template content.
2. Generate report content according to the template format:
   - **Header Information**: Project name, scan date, scanner (TL), dependency file source list, total scanned packages, packages with vulnerabilities, total vulnerabilities.
   - **Vulnerability Detail Table**: Grouped by ecosystem, each record includes: package name, ecosystem, version, vulnerability ID, modification time. Sorted by modification time in descending order (newest first).
   - **Vulnerability-Free Dependency List**: List all packages without vulnerabilities, including package name, ecosystem, version.
   - **Recommendations**: Provide brief recommendations based on the number and severity of vulnerabilities (e.g., upgrade promptly, pay attention to high-risk vulnerabilities, etc.).
3. Determine the report write path: use impm_version action=current to check if a version directory exists. If a version directory exists (e.g., docs/{Project English Abbreviation}-v{version}/), write the report to that version directory; otherwise write to the docs root directory. The report filename is fixed as `{Project English Abbreviation}-vulnscan.md`.
4. Use the Write tool to write the report to the determined path (note: impm_doc_writer does not yet support the vulnscan type; use the Write tool directly).
5. Verify the file exists and content is complete: header information is complete, vulnerability details and vulnerability-free list are not missing.

## Deliverables
- docs/{Project English Abbreviation}-vulnscan.md (Vulnerability Scan Report)

## Post-Completion Instructions
- Report to the user a summary of scan results: total scanned packages, packages with vulnerabilities, total vulnerabilities, report path.
- If known vulnerabilities exist, remind the user to pay attention and promptly upgrade affected dependencies.
- If running as a standalone command, report to the user the report location and vulnerability summary.

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
