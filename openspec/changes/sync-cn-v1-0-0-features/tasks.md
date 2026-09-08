# Tasks: sync-cn-v1-0-0-features

## Implementation

- [ ] 1.1 Version bump to 1.0.0: package.json, package-lock.json, readme.md badges, CHANGELOG.md [English 1.0.0 entry]
- [ ] 1.2 Rename immpm-cpc-level3 → immpm-tools-cpc-level3 (skill dir, command, template CPC-LEVEL3→TOOLS-CPC-LEVEL3) + update all references
- [ ] 1.3 Port template changes: DBD-TEMPLATE.MD, PRD-TEMPLATE.MD, URS-TEMPLATE.MD, RTM-TEMPLATE.MD, TESTCASE-TEMPLATE.MD
- [ ] 1.4 Port src/ tool code fixes (git-helper, task-manager, progress, template-reader, doc-reader/writer, version, utils/git, utils/paths, types/install-core.d.ts, index.ts) — English
- [ ] 1.5 Port install scripts global-dir alignment + manifest history merge (install-core.mjs, install.mjs, install.ps1; keep PACKAGE_NAME=opencode-impm)
- [ ] 1.6 Create immpm-init-review skill + command; update immpm-init and immpm-review-edition to reference it
- [ ] 1.7 Port OpenAPI 3.0 + Swagger UI skill changes: immpm-api-create, immpm-init-api, immpm-doc-merge (English)
- [ ] 1.8 Port remaining skill/command updates: immpm-regression-test, DBD skills, task-coding skills, immpm-git-merge, immpm-finish, immpm-rtm-create, immpm-prd-create, immpm-urs-create, immpm-task-create, immpm-init-* skills, immpm-coding, immpm-sprint-test (English)
- [ ] 1.9 Update agents (ba, te) and docs (requirement.md / requirement.en.md), readme.md, agent.md
- [ ] 1.10 Cross-reference sweep: grep for immpm-cpc-level3, CPC-LEVEL3-TEMPLATE, opencode-impm-cn, and 1.0.0; fix all dangling references

## Verification

- [ ] 2.1 Fileset comparison: CN vs EN assets/agents, assets/commands, assets/skills, assets/skills/template have identical filenames (after rename alignment)
- [ ] 2.2 Grep EN repo for `impm-cpc-level3`, `CPC-LEVEL3-TEMPLATE`, `opencode-impm-cn` — zero matches
- [ ] 2.3 Verify version 1.0.0 across package.json, package-lock.json, readme.md, CHANGELOG.md
- [ ] 2.4 Verify immpm-init-review skill+command exist and immpm-init/immpm-review-edition reference it
- [ ] 2.5 Confirm functional parity: for the ~20 src files, EN differs from CN only by language (no behavior gaps)
