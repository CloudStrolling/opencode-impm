# Agent Usage Guide

opencode-impm orchestrates 13 professional AI Agents, coordinated by the PM Agent (Project Manager) following the impm engineering workflow (Initialization → Requirements Analysis → Coding Development → Regression Testing and Version Documentation) to complete development tasks; it also provides two lightweight flows (agile sprint `/impm-sprint`, hotfix `/impm-hotfix`) for small-batch iterations and urgent bug fixes, with fewer steps and lower token consumption, plus a document review edition (`/impm-review-edition`) in which every design document is reviewed and confirmed by the user as it is generated.

---

## Agent Overview

| Agent | Role | Core Responsibilities | Dispatched By |
|-------|------|---------|---------|
| PM | Project Manager | Workflow orchestration, progress tracking, subagent dispatch | User (via the `/impm` command) |
| BA | Business Analyst | Generates URS and PRD requirement documents | PM |
| SA | Software Architect | System architecture design (SAD), project basic information and project map | PM |
| TL | Tech Lead | Low-level design (LLD), API design, task breakdown, requirement traceability matrix, code review, compliance checks | PM |
| DBA | Database Administrator | Database design (DBD), SQL scripts and database changes | PM |
| TE | Test Engineer | Test cases, test functions, automated tests and regression tests | PM |
| SCM | Release Manager | Version management, git branches, commits and merges | PM |
| DW | Technical Writer | Code comments, document merging, readme/agent/deployment document maintenance | PM |
| CS | Local Code Searcher | Queries local code and outputs existing code and utility class information | PM |
| WS | Web Resource Searcher | Queries official documentation and application examples, verifies version compatibility | PM |
| FEE | Front-End Engineer | Implements front-end task coding | PM |
| BEE | Back-End Engineer | Implements back-end task coding | PM |
| SSE | Senior Software Engineer | Implements common/general task coding | PM |

---

## PM Agent (Project Manager)

**File:** `assets/agents/pm.md`

The PM is the core orchestrator of the impm workflow. It does not write feature code directly but dispatches each professional subagent to complete the work.

**Core responsibilities:**
- Orchestrates the development process step by step according to the impm workflow (four phases: Initialization, Requirements Analysis, Coding Development, Regression Testing and Version Documentation)
- Maintains the version progress table version_progress.md and task statuses, ensuring steps execute in order
- Builds precise context for each subagent
- Verifies the progress records after each step and only proceeds after confirmation
- In the document review edition (`/impm-docs-review` / `/impm-review-edition`), completes the per-document "user review confirmation" round directly (popping up a prompt box via the question tool) after each of urs/prd/sad/dbd/api/lld/task is generated

**Dispatch relationships:**
```
PM → BA / SA / TL / DBA / TE / SCM / DW / CS / WS / FEE / BEE / SSE
```

**Usage:** Enter `/impm` in OpenCode to start the full workflow, or enter a subcommand to execute a specific phase (e.g., `/impm-init`, `/impm-docs`, `/impm-coding`, `/impm-finish`); for per-document review of the requirements analysis use `/impm-docs-review` or the whole-flow `/impm-review-edition`; for lightweight requirements enter `/impm-sprint` (agile sprint), for urgent bugs enter `/impm-hotfix` (hotfix).

---

## BA Agent (Business Analyst)

**File:** `assets/agents/ba.md`

**Skills executed:** `impm-init-urs`, `impm-init-prd`, `impm-urs-create`, `impm-prd-create`

**Responsibilities:**
- Collects and organizes the user's raw requirements, identifying business goals, user roles, and business scenarios
- Writes the URS User Requirement Specification (business goals, user roles, business scenarios, functional requirements, non-functional requirements, constraints, assumptions and dependencies)
- Writes the PRD Product Requirement Document (including User Stories and acceptance criteria)
- Reverse-engineers requirement documents from the code and documents of existing projects (initialization phase)

**Inputs:** user requirement descriptions, URS/PRD templates, reference documents
**Outputs:** `docs/{abbreviation}-v{version}/{abbreviation}-urs-v{version}.md`, `{abbreviation}-prd-v{version}.md`

---

## SA Agent (Software Architect)

**File:** `assets/agents/sa.md`

**Skills executed:** `impm-init-project`, `impm-init-version`, `impm-init-api`, `impm-init-sad`, `impm-sad-update`, `impm-project-update`

**Responsibilities:**
- Generates/maintains the project basic information docs/project.md (project info, coding conventions, project map)
- Designs the system architecture (SAD), determining module breakdown, technology selection, and data flow
- Analyzes the code structure of existing projects during initialization and completes them by reverse-engineering
- Updates the project map (scans the source code with impm_project_analyzer)

**Inputs:** PRD documents, source code structure
**Outputs:** `docs/project.md`, `docs/sad.md`

---

## TL Agent (Tech Lead)

**File:** `assets/agents/tl.md`

**Skills executed:** `impm-init-lld`, `impm-init-task`, `impm-api-create`, `impm-lld-create`, `impm-task-create`, `impm-rtm-create`, `impm-task-coding-context`, `impm-task-coding-api`, `impm-coding-review`, `impm-cpc-level3`, `impm-regression-metrics`

**Responsibilities:**
- Writes the API Design Document and the Low-Level Design Document (LLD, focusing on the overall business logic design; interface details are the responsibility of the API document)
- Breaks development requirements down into an executable task list (task JSON, including upstream/downstream dependencies)
- Establishes the requirement traceability matrix (RTM) for the current version, recording the many-to-many relationships among requirements (FR/NFR), user stories (US), design and tasks, and performing the coverage-completeness check
- Collects the requirement context during the coding phase (context.md)
- Performs code quality review (security vulnerabilities, performance traps, code quality, architecture compliance, test coverage), fixing the issues that ought to be fixed
- Backfills the Phase-2 review quality metrics (issue count, severity distribution, fix rate, defect density, DRE) into the regression quality report
- Performs the classified-protection level-3 security compliance check (GB/T 22239-2019 item-by-item check against a CheckList, outputting the check report)

**Inputs:** PRD, SAD, DBD, API documents
**Outputs:** `{abbreviation}-api-v{version}.md`, `{abbreviation}-lld-v{version}.md`, `{abbreviation}-task-v{version}.json`, `{abbreviation}-rtm-v{version}.md`, `task_{id}/context.md`, `{abbreviation}-review.md`, `{abbreviation}-cpc-level3-check.md`, `regression.md` (Phase 2 backfill)

---

## DBA Agent (Database Administrator)

**File:** `assets/agents/dba.md`

**Skills executed:** `impm-init-dbd`, `impm-dbd-create`, `impm-task-coding-dbd`

**Responsibilities:**
- Generates the Database Design Document (DBD) and SQL scripts (`{abbreviation}-dbd-v{version}.sql`)
- Records the "no database needed" progress and skips when there is no database requirement
- Evaluates database changes during the coding phase and outputs change SQL

**Inputs:** PRD, SAD, task requirements
**Outputs:** `{abbreviation}-dbd-v{version}.md`, `{abbreviation}-dbd-v{version}.sql`

---

## TE Agent (Test Engineer)

**File:** `assets/agents/te.md`

**Skills executed:** `impm-init-testcase`, `impm-task-coding-testcase`, `impm-task-coding-writetest`, `impm-task-coding-runtest`, `impm-regression-test`, `impm-sprint-test` (agile testing, merging writetest+runtest)

**Responsibilities:**
- Writes test cases by template (normal paths, boundary conditions, exception paths)
- Writes unit test functions and automated test scripts
- Writes API test scripts in Python (scripts/API-TEST/, unified entry point)
- Executes tests and updates test results, rolling back the coding on failure; before running API interface tests, detects and confirms an available python environment in the order "shell python → conda → uv" (reports the missing python to the dispatcher when none is available)
- Runs regression tests (full unit tests + all API test scripts), backfills the test cases (TC) into the RTM by their related requirements/user stories and checks the coverage, and outputs the Phase-1 quality metrics (`regression.md`) and the regression reports

**TDD flow:**
1. Before coding: write the test case document
2. After coding: write and execute the test scripts
3. Test failure → roll back and re-code (abort after 3 consecutive failures)
4. Tests pass → proceed to the next step

**Inputs:** context.md, cs.md, ws.md, test templates, coded code
**Outputs:** `task_{id}/testcase.md`, unit tests, `scripts/API-TEST/{abbreviation}-api-test-v{version}.py`, `{abbreviation}-ui-test-record-v{version}.md`, `regression.md` (Phase 1), regression test reports

---

## SCM Agent (Release Manager)

**File:** `assets/agents/scm.md`

**Skills executed:** `impm-init-git`, `impm-init-commit`, `impm-version-create`, `impm-analysis-commit`, `impm-task-coding-gitcommit`, `impm-git-merge`

**Responsibilities:**
- Initializes the git repository and creates the version branch `{abbreviation}-v{version}`
- Creates the version directory and the version progress table
- Commits code by phase/task and updates task statuses to completed
- Merges the version branch into the main branch (master or main) with `git merge --squash`

**Inputs:** version number, project name, files to commit
**Outputs:** git branches, commit records, merge results

---

## DW Agent (Technical Writer)

**File:** `assets/agents/dw.md`

**Skills executed:** `impm-coding-comment`, `impm-doc-merge`, `impm-doc-update`, `impm-deploy-update`

**Responsibilities:**
- Adds clear comments to the code updated in this version based on git change records
- Merges the version URS/PRD/API/DBD/DBD SQL/LLD documents into the corresponding master documents under docs
- Creates or updates readme.md and agent.md in the root directory
- Creates or updates deploy/build.md and deploy/deploy.md, and generates build/deployment scripts when necessary

**Inputs:** version documents, completed code, git change records
**Outputs:** code comments, merged master documents, readme.md, agent.md, deployment documents

---

## CS Agent (Local Code Searcher)

**File:** `assets/agents/cs.md`

**Skills executed:** `impm-task-coding-cs`

**Responsibilities:**
- Reads the task context (context.md) and the project map (docs/project.md)
- Queries the existing code, utility classes, and reusable components in the local code related to the current requirements
- Summarizes the query results into cs.md in the task directory, marking file paths and key functions

**Inputs:** task ID, context.md, project map
**Outputs:** `task_{id}/cs.md`

---

## WS Agent (Web Resource Searcher)

**File:** `assets/agents/ws.md`

**Skills executed:** `impm-task-coding-ws`

**Responsibilities:**
- Determines the third-party middleware, packages, or SDKs the task needs to use
- Queries official documentation, usage, and application examples, and verifies version compatibility
- Summarizes and analyzes the results into ws.md in the task directory

**Inputs:** task ID, context.md, cs.md
**Outputs:** `task_{id}/ws.md`

---

## FEE / BEE / SSE Agents (Development Engineers)

**Files:** `assets/agents/fee.md`, `assets/agents/bee.md`, `assets/agents/sse.md`

**Skills executed:** `impm-task-coding-code`, `impm-sprint-code` (agile coding, skipping the prerequisite documents), `impm-hotfix-fix` (hotfix coding, minimal change)

**Responsibilities:**
- Implements feature code based on the coding context (context.md/cs.md/ws.md) and the test cases (waterfall flow)
- Agile sprint: codes directly from the requirements-brief points passed in by the dispatcher, skipping the context/cs/ws/testcase prerequisite steps
- Hotfix: makes a minimal-change fix from the root-cause analysis and fix plan passed in by the dispatcher, and adds a regression test
- Front-end business requirements → FEE Agent
- Back-end business requirements → BEE Agent
- Common/general requirements → SSE Agent
- Code should be concise and clear, verifying requirement coverage and logical correctness

**Inputs:** context.md, cs.md, ws.md, testcase.md
**Outputs:** feature code

---

## Collaboration Flow

```
User → [/impm] → PM
                    │
                    ├── [Phase 1 Initialization] /impm-init
                    │   ├── PM   → determines the project type (empty/existing)
                    │   ├── SCM  → git init, version directory, progress table, commit
                    │   ├── SA   → project.md, sad.md
                    │   ├── BA   → urs.md, prd.md
                    │   ├── DBA  → dbd.md / no database needed
                    │   ├── TL   → api.md, lld.md
                    │   └── TE   → testcase.md
                    │
                    ├── [Phase 2 Requirements Analysis] /impm-docs
                    │   ├── SCM  → version branch + version directory + progress table
                    │   ├── BA   → URS, PRD (including user stories)
                    │   ├── SA   → SAD update
                    │   ├── DBA  → DBD + SQL
                    │   ├── TL   → API, LLD, task list, RTM (requirement traceability matrix)
                    │   └── SCM  → commit
                    │   (in the /impm-docs-review edition, the PM asks the user to
                    │    review and confirm each of urs/prd/sad/dbd/api/lld/task)
                    │
                    ├── [Phase 3 Coding Development] /impm-coding
                    │   └── for each task (impm_task_manager next):
                    │       ├── TL   → context.md
                    │       ├── CS   → cs.md
                    │       ├── WS   → ws.md
                    │       ├── DBA  → database changes
                    │       ├── TL   → API changes
                    │       ├── TE   → testcase.md
                    │       ├── FEE/BEE/SSE → coding
                    │       ├── TE   → write tests, run tests (roll back on failure)
                    │       └── SCM  → commit, mark the task status as completed
                    │
                    └── [Phase 4 Regression Testing and Version Documentation] /impm-finish
                        ├── TE   → regression tests (with Phase-1 quality metrics + RTM coverage check)
                        ├── DW   → code comments
                        ├── TL   → code review (with issue fixing)
                        ├── TL   → quality metrics backfill (regression.md Phase 2)
                        ├── SA   → project map update
                        ├── DW   → document merging, readme/agent, deployment documents
                        └── SCM  → merge the main branch

Lightweight flows (independent of the four phases):
  ├── [Agile Sprint] /impm-sprint
  │   ├── PM   → requirements brief, version & tasks, summary & archive (done directly with the impm_* tools), maintaining the agile requirements summary master doc docs/{abbreviation}-sprint.md at the docs root
  │   ├── FEE/BEE/SSE → coding (impm-sprint-code, skipping the prerequisite documents)
  │   ├── TE   → testing (impm-sprint-test, merging writetest+runtest)
  │   └── SCM  → commit & merge (reusing impm-git-merge)
  └── [Hotfix] /impm-hotfix
      ├── PM   → locate & analyze, commit for the record (no version directory, committed directly on the main branch)
      └── FEE/BEE/SSE → fix & code (impm-hotfix-fix, minimal change)

Document review edition (same as /impm; Phase 2 uses /impm-docs-review):
  ├── [Phase 2 with review] /impm-docs-review
  │   └── after each of urs/prd/sad/dbd/api/lld/task is generated, the PM pops up a
  │       prompt box (via the question tool) to ask the user to review and confirm;
  │       the next step is entered only after the review is approved
  └── full flow → /impm-review-edition
```

---

## Notes

1. **Strict sequential execution**: the steps of the four phases have a fixed order — no skipping, no out-of-order execution, no parallel execution, no merged execution; verify the version progress table records after each step.
2. **Lightweight-flow trade-offs**: the agile sprint skips the six design documents URS/PRD/SAD/DBD/API/LLD and the task-level context/cs/ws/testcase documents, embeds the requirement details in the task list, leaves a trace with the requirements brief + summary, and maintains the agile requirements summary master doc docs/{abbreviation}-sprint.md (one section appended per sprint); the hotfix only maintains the append-only docs/{abbreviation}-hotfix.md record. Both pursue speed; for formal archiving, add the corresponding `/impm-docs` and `/impm-finish` steps as needed.
3. **Context isolation**: each subagent only receives the materials required for its task; no irrelevant information is passed along.
4. **Deliverable-driven**: steps are connected through document deliverables at the standard paths.
5. **TDD first**: the coding steps strictly follow the "test-first" principle; nothing is committed unless the tests pass; the lightweight flows at least complete a regression verification (add regression cases when there is a test framework).
6. **Subagents do not communicate directly**; all dispatch is orchestrated by the PM Agent.
7. **All outputs use English.**
8. All progress and statuses are based on the records in the version progress table version_progress.md and the task list task JSON; completion is never merely claimed verbally.

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->