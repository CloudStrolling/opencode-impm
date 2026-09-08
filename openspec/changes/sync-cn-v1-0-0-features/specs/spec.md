# Spec: sync-cn-v1-0-0-features

## Requirements

### R1: Version synchronization to 1.0.0
- package.json `version` = "1.0.0"
- package-lock.json top-level `version` = "1.0.0"
- readme.md badges/version references = 1.0.0
- CHANGELOG.md gets an English `[1.0.0]` entry describing the sync
- npm package name stays `opencode-impm` (English) — do not adopt the `-cn` name

### R2: New skill/command immpm-init-review
- Add `assets/skills/impm-init-review/SKILL.md` and `assets/commands/impm-init-review.md` (English translation of CN content)
- Update `impm-init` and `impm-review-edition` to reference `impm-init-review` for the initialization sub-phase (translating the CN flow)

### R3: Rename immpm-cpc-level3 → immpm-tools-cpc-level3
- Rename `assets/skills/impm-cpc-level3/` → `assets/skills/impm-tools-cpc-level3/`
- Rename `assets/commands/impm-cpc-level3.md` → `assets/commands/impm-tools-cpc-level3.md`
- Rename `assets/skills/template/CPC-LEVEL3-TEMPLATE.MD` → `assets/skills/template/TOOLS-CPC-LEVEL3-TEMPLATE.MD`
- Update all cross-references (agent files, manifest plugin refs, opencode.json if needed, other skills)
- Keep the English content of the check instructions (translate any CN changes)

### R4: OpenAPI 3.0 + Swagger UI generation
- `impm-api-create` / `impm-init-api`: generate version-level API doc AND `docs/{abbrev}-v{version}/openapi-v{version}.json` AND Swagger UI `index.html`
- `impm-doc-merge`: when merging API docs, also merge OpenAPI JSON into project-level `docs/openapi.json` and generate `docs/index.html`
- Translate CN implementation/skill changes to English while preserving behavior

### R5: DBD and doc-merge improvements
- Update `DBD-TEMPLATE.MD` per CN changes
- Update `impm-dbd-create`, `impm-init-dbd`, `impm-task-coding-dbd`, `impm-doc-merge` skills to match CN behavior (translated)

### R6: Regression test improvements
- Update `impm-regression-test` per CN changes (translated)
- Update `impm-task-coding-writetest`, `impm-task-coding-testcase`, `impm-sprint-test` as the CN changes require

### R7: Tool code fixes (src/)
- `src/tools/git-helper.ts`: auto main/master branch detection; error when no main branch
- `src/tools/task-manager.ts`: init validation (title/taskType required), case-insensitive task id lookup, pending summary excludes "executing", new inProgress field
- `src/tools/progress.ts`: add known step names (impm-init-review, immpm-rtm-create, immpm-regression-metrics, immpm-docs-review, immpm-review-edition, immpm-hotfix, immpm-hotfix-fix)
- `src/tools/template-reader.ts`: multi-extension template name matching
- `src/tools/doc-reader.ts` / `doc-writer.ts`: add `regression` docType description/mapping
- `src/tools/version.ts`: describe hintVersion semantics in `next`
- `src/utils/git.ts`, `src/utils/paths.ts`: apply CN additions
- `src/types/install-core.d.ts`: add the new field(s)
- Port every CN change into the English source while keeping English comments/strings

### R8: Install script global-dir alignment
- `scripts/install-core.mjs`, `scripts/install.mjs`, `scripts/install.ps1`: global install resource directory = opencode global config dir (~/.config/opencode); manifest merges historical pluginNames and records installedVersion
- Port CN logic into English (keep PACKAGE_NAME = `opencode-impm`)

### R9: Other skill/content/agent/doc updates
- Port CN changes (translated) to: immpm-api-create, immpm-coding, immpm-finish, immpm-git-merge, immpm-init-api, immpm-init-dbd, immpm-init-lld, immpm-init-prd, immpm-init-task, immpm-init-testcase, immpm-init-urs, immpm-prd-create, immpm-rtm-create, immpm-task-coding-api, immpm-task-coding-dbd, immpm-task-coding-runtest, immpm-task-coding, immpm-task-create, immpm-urs-create
- Update templates: PRD-TEMPLATE.MD, URS-TEMPLATE.MD, RTM-TEMPLATE.MD, TESTCASE-TEMPLATE.MD
- Update agents: ba.md, te.md
- Update docs/requirement.md (and requirement.en.md if CN content changed)
- Update readme.md, agent.md

## Behavior

After the sync:
- `opencode-impm` English repo filesets mirror `opencode-impm-cn` filesets for agents/commands/skills/templates (same filenames), except `impm`/`impm-tools-cpc-level3` (all three naming consistent) and package name.
- For every shared file, functional content matches CN with only English vs Chinese language differing.
- Version = 1.0.0 everywhere.
- All cross-references (skills ↔ commands ↔ tools ↔ templates ↔ agents ↔ docs) resolve correctly (no dangling references to `impm-cpc-level3` or `CPC-LEVEL3-TEMPLATE.MD`).

## Acceptance Criteria

- AC1: Setting `npm` version to 1.0.0 is reflected in package.json, package-lock.json, readme.md, CHANGELOG.md; a CHANGELOG `[1.0.0]` entry exists in English.
- AC2: `assets/skills/impm-init-review/` and `assets/commands/impm-init-review.md` exist, translated; `impm-init`/`impm-review-edition` reference it.
- AC3: No `impm-cpc-level3` or `CPC-LEVEL3-TEMPLATE.MD` references remain anywhere; `impm-tools-cpc-level3` and `TOOLS-CPC-LEVEL3-TEMPLATE.MD` exist and are referenced consistently.
- AC4: `impm-api-create`, `impm-init-api`, `impm-doc-merge` skills describe OpenAPI 3.0 JSON + Swagger UI generation consistent with CN behavior (translated).
- AC5: DBD-TEMPLATE.MD, PRD/URS/RTM/TESTCASE templates reflect CN content (translated).
- AC6: src/** files contain the CN functional fixes (git-helper main detection, task-manager case-insensitive/inProgress, progress step names, template-reader multi-extension, doc-reader/writer regression docType, version hintVersion) with English comments.
- AC7: install scripts implement global-dir alignment and manifest history merge, with PACKAGE_NAME = `opencode-impm`.
- AC8: A file-set comparison between CN and EN shows agents/commands/skills/templates have identical filenames (after the rename alignment) and no missing files.
- AC9: grep over the EN repo finds zero references to `impm-cpc-level3`, `CPC-LEVEL3-TEMPLATE`, or `opencode-impm-cn`.
