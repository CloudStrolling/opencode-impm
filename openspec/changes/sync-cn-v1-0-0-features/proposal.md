---
slug: "sync-cn-v1-0-0-features"
createdAt: "2026-09-08T14:59:54.589Z"
---

# Proposal: sync-cn-v1-0-0-features

## Summary

Sync the English `opencode-impm` repository (currently at v0.9.0) with the feature set of the Chinese `opencode-impm-cn` repository at v1.0.0, translating all new/changed Chinese content into English so that both repositories remain functionally equivalent except for language.

## Motivation

The Chinese repository is the source-of-truth project and has advanced from v0.9.0 to v1.0.0 with many bug fixes, new features, and documentation updates. The English repository is a translated fork that has drifted behind. The user wants the English repo to reach functional parity with the Chinese v1.0.0, keeping only language differences.

## Scope

The functional gap between English v0.9.0 and Chinese v1.0.0 includes:

1. **Version bump** to 1.0.0 across package.json, package-lock.json, readme.md badges, CHANGELOG.md, and manifest.
2. **New skill/command**: `impm-init-review` (document review edition initialization) plus integration into `impm-init` and `impm-review-edition`.
3. **Skill rename**: `impm-cpc-level3` → `impm-tools-cpc-level3`, and template `CPC-LEVEL3-TEMPLATE.MD` → `TOOLS-CPC-LEVEL3-TEMPLATE.MD`.
4. **OpenAPI 3.0 support**: `impm-api-create`, `impm-init-api`, `impm-doc-merge` generate version-level OpenAPI JSON + Swagger UI and project-level `docs/openapi.json` + `docs/index.html`.
5. **DBD template and doc-merge improvements** (DBD-TEMPLATE.MD, impm-dbd-create, impm-init-dbd, impm-task-coding-dbd).
6. **Regression test improvements** (`impm-regression-test`) and related test-case skills.
7. **Tool code fixes**: git-helper (auto main/master detection), task-manager (case-insensitive task id, init validation, inProgress field), progress (known step names), template-reader (multi-extension match), doc-reader/doc-writer (regression docType), utils/git, utils/paths.
8. **Install scripts**: global-install resource directory alignment (~/.config/opencode), manifest merges historical pluginNames and records installedVersion (install.mjs, install.ps1, install-core.mjs).
9. **Various skill/content updates** across the ~30 skill files, templates (PRD/URS/RTM/TESTCASE), agent files, and docs/requirement.md.

## Non-Goals

- Do NOT change behavioral semantics differently from the Chinese repo; only the language differs.
- Do NOT rewrite existing already-correct English content unless the Chinese source changed.
- Do NOT modify the `.opencode/` installed artifacts (they are generated at install time, not git-tracked).
- Do NOT commit to git unless requested.

## Risks

- **Scale**: The sync touches ~20 src files, ~30 skill dirs, several commands, templates, scripts, and docs. Errors could cause inconsistency.
- **Translation fidelity**: Must keep English repo English while preserving exact functional behavior of new CN content.
- **Rename ripple**: renaming impm-cpc-level3 affects skill dir name, command, opencode.json plugin references, agent references, and any cross-references.
- **Cross-file references**: skills/commands reference tool names, template filenames, docTypes, and step names; changes must stay consistent.
- **Verification**: Verify by comparing file-sets and key functional markers between the two repos after the sync.
