# Changelog

This project follows Semantic Versioning (SemVer): MAJOR.MINOR.PATCH.

## [1.0.0] - 2026-09-08

### Updated
- Project version unified to 1.0.0 (package.json, package-lock.json, readme.md badge). First stable release of the English edition, synced with opencode-impm-cn v1.0.0 (all functionality functionally equivalent except for language).

## [0.9.7] - 2026-09-08

### Updated
- Documentation skill refinements: impm-doc-merge merge logic simplified; detail improvements for impm-init-lld, impm-init-testcase, impm-regression-test, impm-task-coding-testcase.

### Fixed
- API test cases (Postman Collection v2.1) uniformly stored under the version directory `docs/{project abbreviation}-v{current version}/`, executed via the unified `scripts/API-TEST/run_api_test.py` entry; readme/agent/related skills/test skills synced.
- impm_progress known step names completed: impm-init-review, impm-rtm-create, impm-regression-metrics, impm-docs-review, impm-review-edition, impm-hotfix, impm-hotfix-fix.
- impm_doc_reader/impm_doc_writer docType description supplemented with `regression`.
- impm_task_manager: init validation strengthened (title/taskType required), task id lookup case-insensitive, pending summary excludes "in progress" and adds an `inProgress` field.
- impm_git merge: auto-determine the main branch (main/master); error instead of silently continuing when no main branch exists.
- impm_template_reader: template name matching supports multiple extensions.
- impm_version: `next` description clarifies the hintVersion semantics.
- Install scripts (install.mjs / install.ps1 / install-core.mjs): global-install resource directory aligned (~/.config/opencode); install manifest merges historical pluginNames and records installedVersion.

## [0.9.6] - 2026-09-08

### Added
- Initialization document review skill (impm-init-review / /impm-init-review): on top of impm-init, adds a "user review confirmation" round after each of project/urs/prd/sad/dbd/api/lld/task/testcase document steps is generated; the next step is entered only after review approval; when changes are needed the document is regenerated and reviewed again.
- The document-review-edition full-workflow skill now also covers the initialization phase: impm-review-edition phase one uses impm-init-review instead of impm-init (per-document reviewed project initialization), phase two still uses impm-docs-review.

### Updated
- impm-docs-review and impm-init-review skills, before popping up the review prompt, first read the document under review to extract a concise summary and show it as text in the dialog (display only, not written to any file) for quick preview before review.

## [0.9.5] - 2026-09-07

### Updated
- impm-git-merge pre-commit check: if the commit conditions are not met (abnormal changes in the working tree, etc.), it does not commit.

## [0.9.4] - 2026-09-07

### Updated
- DBD document handling improved: impm-dbd-create, impm-doc-merge, impm-init-dbd, impm-task-coding-dbd skills and the DBD template (DBD-TEMPLATE.MD) optimized.

## [0.9.3] - 2026-09-07

### Added
- API document OpenAPI 3.0 conversion and Swagger UI: while generating the version-level API document, also generate OpenAPI 3.0 JSON (`docs/{abbrev}-v{version}/openapi-v{version}.json`) and a Swagger UI entry (`index.html`); impm-doc-merge merges the API documentation and co-merges the OpenAPI JSON and generates project-level `docs/openapi.json` and `docs/index.html` (referencing the latest merged result).
- API numbering globally unique: generation syntax impm-api-create/impm-init-api first reads the project-level API document to determine the current maximum number, new interfaces within a version number increment from there; when merging, conflicting numbers are remapped by the master document's maximum number to guarantee cross-version global uniqueness.
- Project-level API document reorganized by module + business logic: impm-doc-merge merges API documents not sectioned by version, but organized by "module → business logic" order, with each interface keeping a source-version / last-modified-version column.
- impm_doc_reader/impm_doc_writer add `openapi` and `swagger` document types, wiring the standard paths to the version-level and project-level OpenAPI JSON/Swagger HTML.

## [0.9.2] - 2026-09-06

### Added
- URS/PRD requirement numbering globally unique across the project: functional requirement (FR), non-functional requirement (NFR), function number (F), and user story (US) numbering format unified to "prefix-v{version}-sequence" (e.g. FR-v0.0.1-001, US-v0.0.2-003); requirements unchanged across versions keep their original numbers, only new/changed ones use the new numbering; URS/PRD/RTM/TESTCASE templates and impm-urs-create/impm-prd-create/impm-init-urs/impm-init-prd/impm-rtm-create/impm-task-create/impm-init-task/impm-regression-test skills apply this rule.
- URS/PRD master-document summarization: during the initialization phase and impm-doc-merge, the full content is not written; instead a summary is extracted from the current version (global requirement/function/user-story lists, per-version overview of business goals/scenarios/constraints, version evolution table) and written to `docs/{project abbreviation}-urs.md`, `docs/{project abbreviation}-prd.md`, while the full content stays in the version-directory documents.
- impm-doc-merge refactored merge: master-document structure organized by project organization, code structure, and system architecture — URS/PRD summarized merge; API grouped by module, updated in place, deprecated interfaces moved to a sunset section; DBD merged by business domain/module → table, deprecated tables retained; DBD SQL new-table CREATE/existing-table ALTER stays re-executable; LLD merged by module/business flow and sections refactored as architecture evolves; document headers uniformly maintain a version evolution table.

## [0.9.0] - 2026-09-04

### Added
- Plugin startup version-aware auto-install (`ensureInstalled`): when opencode auto-installs the plugin via npm (its installer uses `ignoreScripts:true` and does not execute postinstall), the plugin entry function compares the `installedVersion` in `.opencode/impm-manifest.json` with the current plugin version on every startup; on first install or version upgrade it automatically syncs agents/commands/skills assets, cleans stale files, and updates opencode.json; when versions match it skips with zero overhead.
- Install core logic extracted into a standalone module `scripts/install-core.mjs` (exports `runInstall`/`loadManifest`/`saveManifest`/`AGENT_TYPES`), shared between the CLI entry (`scripts/install.mjs`) and the plugin entry (`src/index.ts` → `ensureInstalled`), ensuring consistent behavior across `npm install` and opencode auto-install paths.
- Install manifest adds the `installedVersion` field to record the plugin version corresponding to the installed assets, driving the "first-install / upgrade / skip" three-state determination.

## [0.8.9] - 2026-09-03

### Added
- Cryptographic algorithm compliance check skill and command (impm-tools-encrypt-check / `/impm-tools-encrypt-check`, executed by the TL): based on the Cryptography Law of the PRC, GB/T 39786-2021 "Information Security Technology — Basic Requirements for Cryptographic Application of Information Systems" and other crypto-compliance standards, it checks the cryptographic algorithms used in code and configuration, verifies whether national crypto algorithms (SM2/SM3/SM4) are used, detects residual weak algorithms (MD5, SHA-1, DES, 3DES, RC4, etc.), and checks for overly short keys and insecure random numbers, outputting the check report `docs/{project abbreviation}-encrypt-check.md`.
- Algorithm compliance classification system and check report template (`TOOLS-ENCRYPT-CHECK-TEMPLATE.MD`): covers national public algorithms (SM2/SM3/SM4), international strong algorithms, weak hashes (MD5/SHA-1/MD2/MD4), weak symmetric encryption (DES/3DES/RC4/RC2), overly short keys / deprecated algorithms (RSA-1024), and insecure random numbers — six categories in total; provides a multi-language algorithm API mapping table (Python/Java/Node/Go/C#/C/C++) for cross-language identification; classifies weak algorithms by usage context (security vs. non-security) rather than by algorithm name alone; outputs national-crypto coverage assessment and tiered remediation recommendations.
- Together with the classified-protection level-3 check (impm-tools-cpc-level3) and secrets scanning (impm-tools-secrets-scanning), forms the security/compliance tool suite.

## [0.8.8] - 2026-09-03

### Added
- Personal information protection compliance check skill and command (impm-tools-personal-info / `/impm-tools-personal-info`, executed by the TL): based on the Personal Information Protection Law of the PRC (PIPL), it performs item-by-item compliance checking across the full lifecycle of personal information — collection, transfer, storage (including deletion and rights protection) — and outputs the check report `docs/{project abbreviation}-personal-info-check.md`.
- Check list and report template (`TOOLS-PERSONAL-INFO-TEMPLATE.MD`): 37 check items organized by core legal provisions, covering basic principles and general rules (7 items, corresponding to Articles 5/6/7/9/51/47), collection (9 items, corresponding to Articles 13/14/15/17/28/29), transfer (9 items, corresponding to Articles 22/23/24/38/39/40/41/51), and storage (12 items, corresponding to Articles 19/40/45/47/51/55/56/57); check results are Pass / Fail / Not Applicable, with failed items carrying evidence locations and remediation recommendations.

## [0.8.4] - 2026-09-01

### Added
- Version quality metrics report (`regression.md`): the regression testing phase (impm-regression-test) adds a Phase-1 quality metrics output, summarizing the number and pass rate of unit/API test cases and the test coverage (requirements/user-story case coverage), written into `docs/{project abbreviation}-v{current version}/regression.md`.
- Quality metrics backfill skill and command (impm-regression-metrics / `/impm-regression-metrics`, executed by the TL): after the code review (impm-coding-review) completes, it backfills the Phase-2 review quality metrics — counting the number of code-review issues, their severity distribution and fix rate — and calculates the defect density, the defect removal efficiency (DRE), and the quantified-target attainment determination; together with Phase 1 it forms the complete regression quality metrics report.
- The `regression.md` mapping adds the new docType (`regression`) to the standard doc_reader/doc_writer paths (version-directory `regression.md`), template `REGRESSION-TEMPLATE.MD`.
- The impm-finish Phase-4 flow adds the impm-regression-metrics step (placed after coding-review); the Phase-4 sub-steps increase from 8 to 9.
- Requirements-analysis document review skill (impm-docs-review / `/impm-docs-review`): on the basis of impm-docs, it adds a "user review confirmation" round after each of the urs/prd/sad/dbd/api/lld/task document steps is generated (the PM pops up a prompt box via the question tool); the next step is entered only after the review is approved, and when changes are needed the document is regenerated and reviewed again per the user feedback.
- Full-workflow document-review-edition skill (impm-review-edition / `/impm-review-edition`): fully consistent with the impm full workflow, the only difference being that the requirements-analysis phase uses impm-docs-review instead of impm-docs, implementing per-document user review throughout the whole development process.

### Updated
- impm-regression-test skill description and execution requirements adjusted accordingly, clarifying that the Phase-1 test metrics and the Phase-2 review metrics (impm-regression-metrics) cooperate to generate the same `regression.md`.
- The Phase-4 step list of the impm master-flow skill adds impm-regression-metrics (regression testing → code comments → code review → quality metrics backfill → project map update → document merge → readme/agent → deployment plan → merge to main branch).

## [0.8.3] - 2026-09-01

### Added
- Requirement traceability matrix (RTM) skill and command (impm-rtm-create / `/impm-rtm-create`, executed by the TL): adds a step after impm-task-create, establishing the many-to-many "requirement → design → task" traceability matrix from the current version's URS requirements (FR/NFR), PRD user stories (US), LLD design, and task list, generating `docs/{project abbreviation}-v{current version}/{project abbreviation}-rtm-v{current version}.md`, and executing a coverage-completeness check and outputting an issue list.
- The impm master-flow skill and the impm-docs phase orchestration skill now include the impm-rtm-create step (version creation → URS → PRD → SAD → DBD → API → LLD → task list → RTM → git commit, 10 steps in total).
- The impm_regression_test (regression test) adds an RTM test-case backfill and coverage check round: test cases (TC) are backfilled into rtm.md by the related requirements/user stories, and every original requirement and user story is verified to have a design, tasks, and test cases; gaps are marked in the RTM issue list.
- The RTM document type is wired into the standard doc_reader/doc_writer paths (`{abbreviation}-rtm-v{version}.md` / master doc `{abbreviation}-rtm.md`), template `RTM-TEMPLATE.MD`.

## [0.8.2] - 2026-08-26

### Added
- Classified-protection level-3 check skill and command (impm-tools-cpc-level3 / `/impm-tools-cpc-level3`, executed by the TL): based on GB/T 22239-2019 "Information Security Technology — Baseline for Classified Protection of Cybersecurity" level-3 security requirements, it organizes the core clauses related to software development into a code-review checklist template (`TOOLS-CPC-LEVEL3-TEMPLATE.MD`, covering development process management, identity authentication, access control, security audit, intrusion prevention, data security, personal information protection, and testing & acceptance — 38 items in total).
- When the skill executes, it checks the current project item by item and outputs the check report `docs/{project abbreviation}-cpc-level3-check.md`; the check results are Pass / Fail / Not Applicable, and failed items carry a specific explanation (file location and problem description).

## [0.8.1] - 2026-08-26

### Added
- The impm_progress step-completion output now carries the current time: on init writing the first row, add inserting/deduplicating, and finalize settling, the returned message uniformly appends "current time: yyyy-MM-dd HH:mm:ss", and a `currentTime` field is added, ensuring that every step-completion dialog output shows the current time.

## [0.8.0] - 2026-08-25

### Added
- The code-review skill (impm-coding-review) adds an issue-fixing round: after the review completes, issues that are necessary to fix or are fixable and easy to fix are fixed directly.
- The review-report template (`REVIEW-TEMPLATE.MD`) issue list adds a "fix status" column; fixed issues are marked "fixed", unfixed issues are marked "unfixed" with the reason.

### Updated
- impm-coding-review skill description and execution requirements adjusted accordingly: from "review only, do not fix" to "review first, fix as a supplement".

## [0.7.3] - 2026-08-22

### Added
- Before running API interface tests, the python environment is auto-detected (in the order "shell python → conda → uv"); when none is available, a prompt tells the user to install python first (official installer / conda / uv all acceptable).
- The readme environment requirements, the API test runtime environment description, and agent.md (TE) add the python environment description.

## [0.7.1] - 2026-08-21

### Fixed
- The API test files and the interface-case scripts in the initialization phase are modified accordingly.

## [0.7.0] - 2026-08-21

### Updated
- Adjusted the API testing approach.

## [0.6.4] - 2026-08-16

### Changed
- A parallel batch can commit multiple tasks in one commit, instead of requiring one commit per task.

## [0.6.3] - 2026-08-15

### Optimized
- Optimized the descriptions used when invoking subsequent skills.

## [0.6.2] - 2026-08-14

### Optimized
- Updated the default models used to reduce cost.

## [0.6.1] - 2026-08-13

### Added
- Added support for Apifox (`/impm-apifox`), generating an OpenAPI (Swagger) import file and a Postman case-test import file, plus the corresponding templates.

## [0.6.0] - 2026-08-11

### Added
- Parallel scheduling of tasks during the coding development phase: tasks run concurrently by upstream/downstream dependency (up to 5 tasks in parallel), with Git commits serialized.
- The task list adds a Task Manager (tm) orchestration for the single-task coding flow, and a file write-lock (`withFileLock`) prevents concurrent lost updates of shared files such as version_progress.md and the task-list JSON.

## [0.5.4] - 2026-08-13

### Other
- Placeholder empty commit (0.5.3 already includes the rewritten parallel-task feature).

## [0.5.3] - 2026-08-13

### Fixed
- The `impm_progress` version progress table was missing the agile-sprint (impm-sprint) step names in its known step list, which made the `/impm-sprint` progress recording fail.
- `impm_progress` now automatically uses the latest version directory when version is not passed explicitly, consistent with the documentation tools.

### Optimized
- Cleaned up unused code (VERSIONED_DOC_TYPES, TASK_DOC_TYPES, isDirEmpty, extractVersionFromFileName).
- The directory exclusion list EXCLUDED_DIRS was consolidated into a single source in utils/paths.ts.
- readme updates: version badge, skill/command/template counts, and parallel scheduling of the coding phase.
- prompt-recorder runtime artifacts (docs/prompts/) are no longer committed.

## [0.5.2] - 2026-08-13

### Other
- Install scripts (install.mjs / install.ps1) and readme updates.

## [0.5.1] - 2026-08-09

### Optimized
- The version progress table adds total-duration and token-usage statistics (input/output/cache-hit/cache-write/total tokens).

## [0.5.0] - 2026-08-05

### Added
- Agile sprint flow `/impm-sprint` (requirements brief, version & tasks, coding, testing, summary & archive, commit & merge).
- Hotfix flow `/impm-hotfix` (locate & analyze, fix & code, commit for the record; committed directly on the main branch).
- prompt-recorder built-in capability: prompt recording, token backfill, and conversation export.

## [0.4.3] - 2026-08-01

### Fixed
- readme documentation updates and stability fixes for the install scripts (install.mjs / install.ps1).

## [0.4.2] - 2026-07-28

### Added
- Code-comment skill `/impm-coding-comment`: adds clear comments to the version-updated code.

## [0.4.1] - 2026-07-25

### Other
- Added the Apache License 2.0 to the whole project.