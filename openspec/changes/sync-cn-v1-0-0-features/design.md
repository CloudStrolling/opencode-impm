# Design: sync-cn-v1-0-0-features

## Overview

Port the functional content of `opencode-impm-cn` v1.0.0 into the English `opencode-impm` repository, translating Chinese to English while preserving behavior, and aligning version + the cpc-level3 rename.

## Goals

- Functional parity between EN v1.0.0 (after sync) and CN v1.0.0 for all git-tracked source (src/, assets/, scripts/, docs/, root config).
- Only language differs (EN uses English; CN uses Chinese).
- No dangling references after renames.

## Constraints

- Package name must remain `opencode-impm` (not `-cn`).
- The `.opencode/` installed dir is NOT git-tracked → not modified in this change.
- Keep the repo's existing English tone/conventions for all content we produce.
- Version = 1.0.0.

## Technical Approach

Work directly from the CN repo at HEAD (`8ccdccc`, v1.0.0) as source-of-truth. For each file group:

1. **Code (src/)**: Take the CN file as the behavioral base and re-apply the English naming/strings that already exist in the EN file for unchanged logic; where CN added logic, translate the new CN logic to English. The EN file already differs from CN only by language for most files — verify each CN diff and merge.
2. **Assets (skills/commands/agents/templates)**: For files changed in CN since EN's baseline, re-express the CN content in English, matching the EN skill's existing style. Create new `impm-init-review`. Rename `impm-cpc-level3` → `impm-tools-cpc-level3` and template.
3. **Scripts**: Port CN install-core/install/uninstall behavior into the EN `.mjs`/`.ps1` files, keeping PACKAGE_NAME = `opencode-impm` and English messages.
4. **Config/docs**: Bump version to 1.0.0 in package.json/lock/readme/CHANGELOG; port CN docs/requirement.md changes to EN (requirement.en.md if present); update readme/agent.
5. **Cross-reference sweep**: After edits, grep for `impm-cpc-level3`, `CPC-LEVEL3-TEMPLATE`, `opencode-impm-cn`, `1.0.0` and fix all references.

Order of work (to keep references resolvable):
1. Version bump + CHANGELOG (R1)
2. Rename cpc-level3 (R3) — do first so later edits reference the new names
3. Templates (DBD/PRD/URS/RTM/TESTCASE/TOOLS-CPC-LEVEL3) (R4/R5/R9)
4. Tool code fixes (R7)
5. Install scripts (R8)
6. Skills + commands (R2/R4/R5/R6/R9) including new `impm-init-review`
7. Docs/readme/agent (R9)
8. Final cross-reference + fileset verification (AC8/AC9)

## Alternatives Considered

- **Full automated file copy from CN then translate in place**: rejected — risks importing Chinese strings/comments into the EN repo and would not preserve existing EN customizations.
- **Two-phase diff/re-merge**: chosen — preserves EN language while importing functional deltas.

## Impacted Files / Modules

- `package.json`, `package-lock.json`, `readme.md`, `CHANGELOG.md`, `agent.md`
- `src/` (index.ts, tools/*, utils/*, types/*)
- `assets/agents/*` (ba, te), `assets/commands/*`, `assets/skills/*`, `assets/skills/template/*`
- `scripts/install*.mjs`, `scripts/*.ps1`
- `docs/requirement.md`, `docs/requirement.en.md` (if changed)

## Risks and Mitigations

- **Translation fidelity**: Compare edited files against CN for behavior; use existing EN file as base to keep language consistent.
- **Renames left dangling**: Run grep sweep (AC9) before finishing.
- **Missing file parity**: Run fileset diff (AC8) to confirm no CN file is absent in EN.
- **Large diff**: perform per-area commits/todos and verify each area.
