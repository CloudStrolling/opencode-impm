<div align="center">

# 🤖 opencode-impm

**I am the Project Manager — an AI-driven, engineering-grade full-lifecycle development suite**

<p>
  <a href="#"><img src="https://img.shields.io/badge/version-0.9.0-2ea44f?style=flat-square" alt="version"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue?style=flat-square" alt="license"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node->=%2022.5-339933?style=flat-square&logo=node.js&logoColor=white" alt="node"></a>
  <a href="https://opencode.ai/"><img src="https://img.shields.io/badge/OpenCode-Required-ff6b6b?style=flat-square" alt="opencode"></a>
</p>

<p><i>Built on the OpenCode platform with the "AI Project Manager" at its core, it orchestrates 13 professional Agents through a waterfall-style four-phase workflow to complete the entire software development lifecycle.</i></p>

[🚀 Quick Start](#-quick-start) · [📖 Usage Documentation](#-usage-documentation) · [📂 Project Structure](#-project-structure) · [❓ FAQ](#-faq)

</div>

---

## 📋 Table of Contents

- [Core Features](#-core-features)
- [Architecture Overview](#-architecture-overview)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage Documentation](#-usage-documentation)
  - [Four-Phase Workflow](#four-phase-workflow)
  - [Standard Document Paths](#standard-document-paths)
  - [Complete Command List](#complete-command-list)
- [Project Structure](#-project-structure)
- [Contribution Guide](#-contribution-guide)
- [FAQ](#-faq)
- [Change Log](#-change-log)
- [License](#-license)
- [Appendix](#-appendix)

---

## ✨ Core Features

| Feature | Description |
|:---:|:---|
| 🎭 | **AI Project Manager Orchestration** — uniformly dispatches 13 professional Agents: BA / SA / TL / DBA / TE / SCM / DW / CS / WS / FEE / BEE / SSE |
| 📋 | **4 Phases, 62 Skills + Independent Compliance Check** — every phase runs strictly in order: no skipping, no out-of-order execution; during the coding phase tasks run concurrently by upstream/downstream dependency (up to 5 in parallel), and Git commits are serialized |
| ⚡ | **Two Lightweight Flows** — agile sprint `/impm-sprint` and hotfix `/impm-hotfix`, drastically fewer steps and lower token consumption while keeping reasonable documentation traces |
| 🧪 | **Test-Driven Development (TDD)** — test cases are written before coding, tests are executed after coding, and code is committed only when everything passes |
| 📁 | **Version-Based Management** — each version gets its own directory `docs/{project abbreviation}-v{version}/` plus a dedicated Git branch |
| 📝 | **All-English Workflow** — documents, comments, and reports are all written in English |
| 🔌 | **14 Plugin Tools** — document read/write, version management, task scheduling, Git operations, prompt recording and export, etc. |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        🤖 PM Project Manager                 │
│              (orchestrates and dispatches, does no hands-on work)│
└─────────────┬───────────────────────────────────────────────┘
              │ dispatch tasks
    ┌─────────┼─────────┬─────────┬─────────┐
    ▼         ▼         ▼         ▼         ▼
 ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐
 │ BA  │  │ SA  │  │ TL  │  │ DBA │  │ TE  │
 │Bus. │  │Sys. │  │Tech │  │DB   │  │Test │
 │Anal.│  │Arch.│  │Lead │  │Arch.│  │Eng. │
 └─────┘  └─────┘  └─────┘  └─────┘  └─────┘
 ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐
 │ SCM │  │ DW  │  │ CS  │  │ WS  │  │ SSE │  │ FEE │  │ BEE │
 │Conf.│  │Doc. │  │Code │  │Web  │  │Sr.  │  │Front│  │Back │
 │Mgmt │  │Writ.│  │Sear.│  │Sear.│  │Eng. │  │End  │  │End  │
 └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘

 ═══════════════════════════════════════════════════════════════
  Phase 1       Phase 2       Phase 3       Phase 4
  Init ──────▶  Requirements ──▶ Coding ──▶  Regression & Archive
 ═══════════════════════════════════════════════════════════════
```

---

## 🚀 Quick Start

### One-Key Startup (Recommended)

In OpenCode, enter:

```bash
/impm
```

The PM Agent automatically guides you through all four phases of development.

> ⚡ **Lightweight flows**: use `/impm-sprint` (agile sprint, 6 steps) for small-batch iterative requirements; use `/impm-hotfix` (hotfix, 3 steps) for production bugs. Both have fewer steps, lower token consumption, and are faster, while keeping a requirements brief / fix record for review.
>
> 📝 **Document review edition**: use `/impm-review-edition` when you want each design document (URS/PRD/SAD/DBD/API/LLD/task list) to be reviewed and confirmed by you as it is generated — the requirements-analysis phase then runs `/impm-docs-review`.

### Manual Execution Per Phase

| Phase | Command | Description |
|:----:|:-----|:-----|
| 1 | `/impm-init` | Initialize the project; generate URS/PRD/SAD/DBD/API/LLD/task list/test cases |
| 2 | `/impm-docs` | Confirm the version requirements; update the design documents; create the task list and the requirements traceability matrix |
| 3 | `/impm-coding` | Loop through tasks: context → coding → tests → commit |
| 4 | `/impm-finish` | Regression testing (with quality metrics), code review, document merging, merge the main branch |
| ⚡ | `/impm-sprint` | Agile sprint: requirements brief → version & tasks → coding → tests → summary & archive → commit & merge |
| ⚡ | `/impm-hotfix` | Hotfix: locate & analyze → fix & code → commit for the record (committed directly on the main branch) |

> 💡 **Tip**: when running manually you can monitor each step's result, modify requirements if necessary, or roll back Git and re-run. Each project has its own Git branch, and commits are made automatically at the end of each phase.

---

## 📦 Installation

### Environment Requirements

- [Node.js](https://nodejs.org/) >= 22.5
- [OpenCode](https://opencode.ai/) (a version that supports plugins, skills, and commands)
- [Python](https://www.python.org/) 3.8+ (**interface tests depend on the python environment** — used to run the API test runner and scripts under `scripts/API-TEST/`; it can be provided by any of the system python, a conda environment, or a uv-managed environment, and the runtime auto-detects it in the order "shell python → conda → uv")

### Method 1: Local Installation (⭐ Recommended for development/debugging)

```bash
# Clone the project
git clone <repository-url>
cd opencode-impm

# Install dependencies (postinstall automatically runs the install script)
npm install

# Compile the TypeScript source
npm run build

# Install into a target project
node scripts/install.mjs --target /path/to/project
# Windows PowerShell users:
# .\scripts\install.ps1 -Target D:\path\to\project
```

### Method 2: Install as an npm Dependency

```bash
npm install opencode-impm
```

### Method 3: Global Install (available in every project)

```bash
node scripts/install.mjs --global
# Windows PowerShell users:
# .\scripts\install.ps1 -Global
```

> A global install puts agents/commands/skills into the global config directory (`~/.config/opencode`) and writes the plugin entry into the global `opencode.json`. The model configuration is not cleared or written by default; presets can be applied on demand via `--agent-type`.

### Verify Installation

Restart OpenCode after installation; typing `/impm` shows the PM Agent's welcome message.

### Model Configuration

By default, the install script does **not** touch the model configuration of the impm agents in `opencode.json` at all (your manual settings are preserved). To apply the preset models and reasoning depths to the agents, pass `--agent-type` at install time (available presets are listed in `scripts/agent-models.json`); pass `clear` to clean up the models / reasoning depths previously written by impm:

```bash
node scripts/install.mjs --target /path/to/project --agent-type opencode-go-balance
# Windows PowerShell users:
# .\scripts\install.ps1 -Target D:\path\to\project -AgentType opencode-go-balance
```

All presets come from the `opencode-go` / `opencode-zen` providers and are assigned by role responsibility and cost trade-offs (the `custom` preset does not overwrite the model / reasoning_effort already set manually in the target project). The recommended "balanced" tier `opencode-go-balance`:

| Agent | Model | Reasoning |
|:-----:|:-----|:--------:|
| pm  | opencode-go/deepseek-v4-flash | low |
| scm | opencode-go/deepseek-v4-flash | low |
| ba  | opencode-go/deepseek-v4-pro | high |
| sa  | opencode-go/deepseek-v4-pro | max |
| tl  | opencode-go/deepseek-v4-pro | high |
| dba | opencode-go/deepseek-v4-flash | max |
| te  | opencode-go/deepseek-v4-flash | high |
| cs  | opencode-go/deepseek-v4-flash | low |
| ws  | opencode-go/deepseek-v4-flash | low |
| sse | opencode-go/deepseek-v4-pro | high |
| fee | opencode-go/deepseek-v4-flash | high |
| bee | opencode-go/deepseek-v4-flash | max |
| dw  | opencode-go/deepseek-v4-flash | high |

> After installation you can adjust each agent's model and reasoning depth in the `opencode.json` of the respective project as needed.

---

## ⚙️ Configuration

The install generates the following structure automatically in the target project:

```
project root/
├── .opencode/
│   ├── agents/              # 13 AI Agent definitions
│   ├── commands/            # 56 command definitions
│   ├── skills/              # 56 skills and 20 templates
│   └── plugins/impm/        # compiled plugin entry
└── opencode.json            # OpenCode configuration file
```

**Minimal configuration example** (usually handled automatically by the install script; no manual editing required):

```json
{
  "plugins": [
    {
      "name": "impm",
      "entry": ".opencode/plugins/impm/index.js"
    }
  ]
}
```

---

## 📖 Usage Documentation

### Four-Phase Workflow

```mermaid
flowchart LR
    A[Phase 1: Initialization<br/>/impm-init] --> B[Phase 2: Requirements Analysis<br/>/impm-docs]
    B --> C[Phase 3: Coding Development<br/>/impm-coding]
    C --> D[Phase 4: Regression & Archive<br/>/impm-finish]

    style A fill:#e1f5fe
    style B fill:#fff3e0
    style C fill:#e8f5e9
    style D fill:#fce4ec
```

| Phase | Command | Core Actions |
|:----:|:-----|:---------|
| **1** | `/impm-init` | Determine the project type → create the version directory and progress table → generate all initial documents → commit |
| **2** | `/impm-docs` | Confirm the version requirements → create the version branch → generate/update URS/PRD/SAD/DBD/API/LLD → create the task list and the requirements traceability matrix → commit |
| **3** | `/impm-coding` | Dispatch tasks by wave (up to 5 tasks in parallel, dependent on previously completed upstream): collect context → code search → web search → database/API design → test cases → coding → write tests → run tests → serialize commits |
| **4** | `/impm-finish` | Full regression tests (with Phase-1 quality metrics) → add comments → code review → backfill the review quality metrics → update the project map → merge documents → update README/Agent/deployment docs → merge the main branch |
| **⚡Sprint** | `/impm-sprint` | Requirements brief (one document replacing URS/PRD) → version & tasks (requirements embedded in task descriptions) → coding (skipping context/cs/ws/testcase) → tests → summary & archive → commit & merge |
| **⚡Hotfix** | `/impm-hotfix` | Locate & analyze (write a fix record) → fix & code (minimal change) → commit for the record (main branch, no version directory) |

> **Flow selection advice**: use `/impm` (or the per-phase commands) for formal releases; use `/impm-review-edition` when you want every design document to be reviewed and confirmed by you before proceeding; use `/impm-sprint` for small-batch iterations; use `/impm-hotfix` for urgent bugs. The output of an agile sprint (requirements brief, summary) can be used directly as the URS material for the next formal version's `/impm-docs`.

### Standard Document Paths

| Document Type | Path |
|:---------|:-----|
| Project basic information | `docs/project.md` |
| System architecture design | `docs/sad.md` |
| Version directory | `docs/{project abbreviation}-v{version}/` |
| Version requirement/design documents | `docs/{abbreviation}-v{version}/{abbreviation}-{urs\|prd\|dbd\|api\|lld\|testcase}-v{version}.md` |
| Agile requirements brief | `docs/{abbreviation}-v{version}/{abbreviation}-urs-v{version}.md` (reuses the urs path, brief format) |
| Agile summary | `docs/{abbreviation}-v{version}/{abbreviation}-review.md` (reuses the review path, summary format) |
| Agile requirements summary master doc | `docs/{abbreviation}-sprint.md` (all agile summaries; one section is appended per sprint) |
| Hotfix records | `docs/{abbreviation}-hotfix.md` (append-only; one record per fix) |
| Database scripts | `docs/{abbreviation}-v{version}/{abbreviation}-dbd-v{version}.sql` |
| Task list | `docs/{abbreviation}-v{version}/{abbreviation}-task-v{version}.json` |
| Requirement traceability matrix (RTM) | `docs/{abbreviation}-v{version}/{abbreviation}-rtm-v{version}.md` (generated by `/impm-rtm-create`; master doc `docs/{abbreviation}-rtm.md` after merge) |
| Version progress table | `docs/{abbreviation}-v{version}/version_progress.md` |
| Version quality metrics report | `docs/{abbreviation}-v{version}/regression.md` (Phase-1 test metrics from `/impm-regression-test` + Phase-2 review metrics from `/impm-regression-metrics`) |
| Classified-protection level-3 check report | `docs/{abbreviation}-cpc-level3-check.md` (generated by `/impm-cpc-level3`) |
| API test cases (Postman Collection v2.1) | `scripts/API-TEST/{abbreviation}-api-test-v{version}.postman_collection.json` |
| API test runner | `scripts/API-TEST/run_api_test.py` (copied from the `API-TEST-RUNNER.py` template in `assets/skills/template/`) |
| API test report | `scripts/API-TEST/report/api-test-report.md`, `api-test-report.json` |
| API test runtime | python 3.8+ (auto-detected in the order "shell python → conda → uv" before running API tests; prompts to install python when none is available) |
| Prompt records | `docs/prompts/prompts.md` |
| Build/deployment plans | `deploy/build.md`, `deploy/deploy.md` (generated on demand by `/impm-deploy-update`; skipped when the project has no such directory yet) |

### Complete Command List

<details>
<summary>📋 Click to expand the 56 commands (grouped by phase)</summary>

#### Master Workflow

| Command | Description |
|:-----|:-----|
| `/impm` | I am the Project Manager: orchestrate the full four-phase workflow |
| `/impm-review-edition` | Document review edition: fully consistent with `/impm`, except that Phase 2 runs `/impm-docs-review` (every design document is reviewed and confirmed by the user before proceeding) |

#### Phase 1: Initialization

| Command | Description | Executing Agent |
|:-----|:-----|:----------:|
| `/impm-init` | Orchestrate all steps of the initialization phase | PM |
| `/impm-init-isinit` | Determine whether the project is initialized and whether it is an empty project | PM |
| `/impm-init-git` | Initialize the git repository and create the first commit | SCM |
| `/impm-init-project` | Generate the project basic information `docs/project.md` | SA |
| `/impm-init-version` | Create the version directory and the version progress table | SA |
| `/impm-init-urs` | Generate the User Requirement Specification | BA |
| `/impm-init-prd` | Generate the Product Requirement Document | BA |
| `/impm-init-sad` | Generate the System Architecture Design document | SA |
| `/impm-init-dbd` | Generate the Database Design document and SQL scripts | DBA |
| `/impm-init-api` | Generate the API design document | SA |
| `/impm-init-lld` | Generate the Low-Level Design document | TL |
| `/impm-init-task` | Generate the task list (task JSON) | TL |
| `/impm-init-testcase` | Generate the test case document | TE |
| `/impm-init-commit` | Commit all deliverables of the initialization phase | SCM |

#### Phase 2: Requirements Analysis

| Command | Description | Executing Agent |
|:-----|:-----|:----------:|
| `/impm-docs` | Orchestrate the requirements analysis phase: version creation → URS → PRD → SAD → DBD → API → LLD → task list → RTM → commit | PM |
| `/impm-docs-review` | Document review edition of the requirements analysis phase: the same steps as `/impm-docs`, plus a user review confirmation after each document | PM |
| `/impm-version-create` | Determine the version number; create the version branch, version directory, and progress table | SCM |
| `/impm-urs-create` | Generate the User Requirement Specification (URS) | BA |
| `/impm-prd-create` | Generate the Product Requirement Document (PRD, including user stories and acceptance criteria) | BA |
| `/impm-sad-update` | Evaluate and update the System Architecture Design document (SAD) | SA |
| `/impm-dbd-create` | Generate the Database Design document (DBD) and SQL scripts | DBA |
| `/impm-api-create` | Generate the API design document | TL |
| `/impm-lld-create` | Generate the Low-Level Design document (LLD) | TL |
| `/impm-task-create` | Generate the task list (task JSON) | TL |
| `/impm-rtm-create` | Generate the requirement traceability matrix (RTM, linking requirements/user stories/design/tasks) | TL |
| `/impm-analysis-commit` | Commit all deliverables of the requirements analysis phase | SCM |

#### Phase 3: Coding Development

| Command | Description | Executing Agent |
|:-----|:-----|:----------:|
| `/impm-coding` | Orchestrate the coding development phase: dispatch all tasks by wave | PM |
| `/impm-task-coding` | Orchestrate the full coding workflow of a single task | PM |
| `/impm-task-coding-context` | Collect the task requirement context (context.md) | TL |
| `/impm-task-coding-cs` | Local code search (cs.md) | CS |
| `/impm-task-coding-ws` | Web resource search (ws.md) | WS |
| `/impm-task-coding-dbd` | Database change design | DBA |
| `/impm-task-coding-api` | API change design | TL |
| `/impm-task-coding-testcase` | Write the task test cases | TE |
| `/impm-task-coding-code` | Implement the feature code | SSE/FEE/BEE |
| `/impm-task-coding-writetest` | Write test functions and automated scripts | TE |
| `/impm-task-coding-runtest` | Run the tests and update the results | TE |
| `/impm-task-coding-gitcommit` | Commit the task code and update the task status | SCM |

#### Phase 4: Regression Testing and Version Documentation

| Command | Description | Executing Agent |
|:-----|:-----|:----------:|
| `/impm-finish` | Orchestrate all steps of Phase 4 | PM |
| `/impm-regression-test` | Regression tests (full unit tests + API tests); also outputs the Phase-1 quality metrics (`regression.md`) | TE |
| `/impm-coding-comment` | Add clear comments to the version code | DW |
| `/impm-coding-review` | Code review (security, performance, quality, compliance, test coverage); fixes the issues that ought to be fixed | TL |
| `/impm-regression-metrics` | Backfill the Phase-2 review quality metrics into `regression.md` (issue count, severity distribution, fix rate, defect density, DRE) | TL |
| `/impm-project-update` | Update the project map and `docs/project.md` | SA |
| `/impm-doc-merge` | Merge the version documents into the master documents | DW |
| `/impm-doc-update` | Update `readme.md` and `agent.md` | DW |
| `/impm-deploy-update` | Update the build/deployment plans (`deploy/build.md`, `deploy/deploy.md`) | DW |
| `/impm-git-merge` | Merge the version branch into the main branch | SCM |

#### ⚡ Lightweight Flow: Agile Sprint

| Command | Description | Executing Agent |
|:-----|:-----|:----------:|
| `/impm-sprint` | Orchestrate all sprint steps (requirements brief / version & tasks / coding / tests / summary & archive / commit & merge) | PM |
| `/impm-sprint-code` | Agile coding (skipping the context/cs/ws/testcase prerequisites; the requirement context is passed in by the dispatcher) | SSE/FEE/BEE |
| `/impm-sprint-test` | Agile test (merging writetest + runtest into a single step) | TE |

#### ⚡ Lightweight Flow: Hotfix

| Command | Description | Executing Agent |
|:-----|:-----|:----------:|
| `/impm-hotfix` | Orchestrate all hotfix steps (locate & analyze / fix & code / commit for the record) | PM |
| `/impm-hotfix-fix` | Hotfix coding (minimal change + regression test; root cause and plan are passed in by the dispatcher) | SSE/FEE/BEE |

#### 🛡️ Security Compliance Check (independent)

| Command | Description | Executing Agent |
|:-----|:-----|:----------:|
| `/impm-cpc-level3` | Classified-protection level-3 code review: check item by item against the GB/T 22239-2019 checklist and output `docs/{abbreviation}-cpc-level3-check.md` | TL |

</details>

---

## 📂 Project Structure

```
opencode-impm/
├── 📁 assets/                   # Suite assets (copied to .opencode/ on install)
│   ├── 📁 agents/               # 13 AI Agent definitions (.md)
│   ├── 📁 commands/             # 56 commands (.md)
│   └── 📁 skills/               # 56 skills (one directory per skill) + template/ 20 templates
├── 📁 src/                      # Plugin source (TypeScript)
│   ├── 📁 tools/                # Implementation of the tools (including prompt-recorder)
│   ├── 📁 utils/                # Path / version / git / file-lock / project info utilities
│   └── 📄 index.ts              # Plugin entry point
├── 📁 scripts/
│   ├── 📄 install.mjs           # Install script (Node)
│   ├── 📄 install.ps1           # Install script (Windows PowerShell)
│   ├── 📄 uninstall.mjs         # Uninstall script (Node)
│   ├── 📄 uninstall.ps1         # Uninstall script (Windows PowerShell)
│   ├── 📄 agent-models.json     # Agent model presets (--agent-type)
│   └── 📄 deploy.md             # Build & deployment plan
├── 📁 docs/                     # Project documentation directory (auto-generated by the workflow)
├── 📄 opencode.json             # OpenCode configuration file
├── 📄 LICENSE                   # Apache License 2.0
├── 📄 readme.md                 # This document (maintained by impm-doc-update)
├── 📄 CHANGELOG.md              # Change log (maintained by impm-doc-update)
└── 📄 agent.md                  # Agent usage guide (maintained by impm-doc-update)
```

---

## 🤝 Contribution Guide

Issues and Pull Requests are welcome!

| Type | Requirements |
|:-----|:-----|
| 🐛 **Bug Reports** | Describe the reproduction steps and environment versions (Node.js / OpenCode / OS) |
| 💡 **Feature Suggestions** | Describe the use case and the expected behavior |
| 🔧 **Code Contributions** | Ensure existing tests pass and follow the existing code style |

---

## ❓ FAQ

<details>
<summary><b>Q1: The <code>/impm</code> command does not show up in OpenCode after installation?</b></summary>

Check that `impm*.md` files exist under `.opencode/commands/`, then restart OpenCode.
</details>

<details>
<summary><b>Q2: Is installation different on Windows and macOS?</b></summary>

The core logic is the same. Windows users can additionally install with `scripts/install.ps1`.
</details>

<details>
<summary><b>Q3: What if the OpenCode version is incompatible?</b></summary>

Make sure your OpenCode supports the plugin, skill, and command mechanisms. Upgrading to the latest version is recommended.
</details>

<details>
<summary><b>Q4: How do I debug the plugin?</b></summary>

Modify the source under `src/`, run `npm run build`, then re-run the install script.
</details>

---

## 📜 Change Log

See [CHANGELOG.md](./CHANGELOG.md).

---

## 📄 License

This project is licensed under the [Apache License 2.0](LICENSE).

```
Copyright 2026 jenemy8023 <jenemy8023@163.com>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```

---

## 📎 Appendix

### Document Abbreviations

| Abbr. | Full Name | Description |
|:----:|:---------|:-----|
| **URS** | User Requirement Specification | Business goals, user roles, business scenarios, functional requirements (high level), non-functional requirements (high level), constraints, assumptions and dependencies |
| **PRD** | Product Requirement Document | Product background, target users, feature list, detailed feature descriptions, business flow diagrams, page prototypes, data requirements, acceptance criteria, version planning, appendix |
| **SAD** | System Architecture Design | Design goals and constraints, technology stack selection and rationale, system context diagram, container diagram, component diagram, deployment architecture diagram, security architecture, performance architecture, data flow diagram, architecture decision records |
| **DBD** | Database Design Document | Design goals, database selection, ER diagram (Mermaid), logical model, physical model, table structure definitions, index design, views/stored procedures/triggers design, data dictionary, backup & recovery strategy, security strategy |
| **API** | API Design Document | API list, API versioning strategy, authentication & authorization mechanisms, common error code definitions, detailed API definitions (URL/Method/Header/Body/Response), status code mapping, rate limiting strategy, example code |
| **LLD** | Low-Level Design Document | Module overview, module division and responsibilities, class diagram (Mermaid), core business process sequence diagrams (Mermaid), state diagrams, core business logic pseudocode/flowcharts, business rules and constraints, business data flow, data structure definitions, exception handling strategy, logging conventions, performance optimization points, unit test strategy |
| **RTM** | Requirement Traceability Matrix | Tracks the many-to-many mapping of requirements (FR/NFR in the URS) ↔ user stories (US in the PRD) ↔ design (LLD) ↔ tasks, with a coverage-completeness check |
| **TestCase** | Test Case Document | Case ID, case name, module, priority, preconditions, test steps, expected results, test data, related requirement ID, test type (functional/interface/performance/security) |
| **regression** | Regression Quality Metrics Report | `regression.md` in the version directory: Phase-1 test metrics (test-case count, pass rate, coverage) from `/impm-regression-test` plus Phase-2 review metrics (issue count/severity distribution/fix rate, defect density, DRE) from `/impm-regression-metrics` |

### Agent List

> PM is the main control Agent; the other 12 are Sub-Agents.

| Agent | Full Name | Role & Responsibilities |
|:-----:|:---------|:---------|
| **PM** | Project Manager | Main control Agent; does no hands-on work and dispatches Sub-Agents to execute |
| **BA** | Business Analyst | Collects requirements (URS) and translates business needs into clear, acceptable, traceable PRDs |
| **SA** | System Architect | System architecture design, project structure setup, and technical decisions; writes SAD |
| **TL** | Tech Lead | Detailed design, task list generation, requirements traceability matrix, and code review |
| **DBA** | Database Architect | Business modeling, relational databases, NoSQL, distributed databases, and performance optimization |
| **TE** | Test Engineer | Test cases, test functions, and automated test script writing |
| **SCM** | Software Configuration Management | Version management, change management, release management |
| **DW** | Document Writer | General technical document writing |
| **CS** | Code Searcher | Searches local code as requested |
| **WS** | Web Searcher | Queries official documentation, application examples, and technical materials |
| **SSE** | Senior Software Engineer | Handles complex business logic requirements |
| **FEE** | Front-End Engineer | Designs modern, aesthetically pleasing front-end pages |
| **BEE** | Back-End Engineer | Interface planning and back-end development |

### Skill-Agent Mapping

<details>
<summary>Phase 1: Initialization and Initialization Check</summary>

| Step | Skill | Sub-Agent |
|:---------|:-------|:------:|
| Whether the project is already initialized | `impm-init-isinit` | PM |
| Git initialization | `impm-init-git` | SCM |
| Project information file initialization | `impm-init-project` | SA |
| Version initialization | `impm-init-version` | SA |
| User requirement document initialization | `impm-init-urs` | BA |
| Product requirement document initialization | `impm-init-prd` | BA |
| System architecture design initialization | `impm-init-sad` | SA |
| Database design initialization | `impm-init-dbd` | DBA |
| API design initialization | `impm-init-api` | SA |
| Detailed design initialization | `impm-init-lld` | TL |
| Development task initialization | `impm-init-task` | TL |
| Test case, test function, and test script initialization | `impm-init-testcase` | TE |
| Commit the initialization documents | `impm-init-commit` | SCM |

</details>

<details>
<summary>Phase 2: Requirements and Design Analysis</summary>

| Step | Skill | Sub-Agent |
|:---------|:-------|:------:|
| Requirements analysis orchestration (standard) | `impm-docs` | PM |
| Requirements analysis orchestration (document review edition, one-by-one user review) | `impm-docs-review` | PM |
| Create the version directory | `impm-version-create` | SCM |
| Create the user requirement document for the current version | `impm-urs-create` | BA |
| Create the product requirement document for the current version | `impm-prd-create` | BA |
| Update the architecture design | `impm-sad-update` | SA |
| Create the database design for the current version | `impm-dbd-create` | DBA |
| Create the API design for the current version | `impm-api-create` | TL |
| Create the detailed design for the current version | `impm-lld-create` | TL |
| Create the development task list for the current version | `impm-task-create` | TL |
| Create the requirement traceability matrix (RTM) for the current version | `impm-rtm-create` | TL |
| Commit all previously generated documents | `impm-analysis-commit` | SCM |

</details>

<details>
<summary>Phase 3: Coding Development</summary>

| Step | Skill | Sub-Agent |
|:---------|:-------|:------:|
| Loop through the development task list and start coding | `impm-coding` | PM |
| Start the coding workflow for one specific task | `impm-task-coding` | PM |
| Collect the task-related requirements as context | `impm-task-coding-context` | TL |
| Search the existing code | `impm-task-coding-cs` | CS |
| Search related materials on the web | `impm-task-coding-ws` | WS |
| Adjust the database design per the task | `impm-task-coding-dbd` | DBA |
| Adjust the API design per the task | `impm-task-coding-api` | TL |
| Generate the test cases | `impm-task-coding-testcase` | TE |
| Select the appropriate engineer to complete the development | `impm-task-coding-code` | SSE/FEE/BEE |
| Write tests from the test cases and current code | `impm-task-coding-writetest` | TE |
| Run the tests; on failure, return to rewrite the code | `impm-task-coding-runtest` | TE |
| Commit to Git | `impm-task-coding-gitcommit` | SCM |

</details>

<details>
<summary>Phase 4: Regression Testing and Version Documentation</summary>

| Step | Skill | Sub-Agent |
|:---------|:-------|:------:|
| Regression testing (with Phase-1 quality metrics) | `impm-regression-test` | TE |
| Code comments | `impm-coding-comment` | DW |
| Code review (with issue fixing) | `impm-coding-review` | TL |
| Backfill the review quality metrics into `regression.md` (Phase 2) | `impm-regression-metrics` | TL |
| Project map update | `impm-project-update` | SA |
| Merge the version documents into the master documents | `impm-doc-merge` | DW |
| Update readme.md and agent.md | `impm-doc-update` | DW |
| Update the build/deployment documents | `impm-deploy-update` | DW |
| Merge the current version branch into the main branch | `impm-git-merge` | SCM |

</details>

<details>
<summary>⚡ Lightweight Flow: Agile Sprint</summary>

| Step | Skill | Sub-Agent |
|:---------|:-------|:------:|
| Agile sprint orchestration (the requirements brief / version & tasks / summary are executed directly by the PM) | `impm-sprint` | PM |
| Agile coding (skipping the context/cs/ws/testcase prerequisites) | `impm-sprint-code` | SSE/FEE/BEE |
| Agile testing (merging writetest + runtest) | `impm-sprint-test` | TE |
| Commit & merge (reusing the waterfall merge logic) | `impm-git-merge` | SCM |

</details>

<details>
<summary>⚡ Lightweight Flow: Hotfix</summary>

| Step | Skill | Sub-Agent |
|:---------|:-------|:------:|
| Hotfix orchestration (locate & analyze / commit for the record are executed directly by the PM) | `impm-hotfix` | PM |
| Hotfix coding (minimal change + regression test) | `impm-hotfix-fix` | SSE/FEE/BEE |

</details>

<details>
<summary>📝 Document Review Edition</summary>

| Step | Skill | Sub-Agent |
|:---------|:-------|:------:|
| Full workflow with per-document user review | `impm-review-edition` | PM (orchestrates) |
| Requirements analysis phase with per-document user review | `impm-docs-review` | PM (orchestrates; the document review confirmation is done directly by the PM via a prompt box) |

</details>

<details>
<summary>🛡️ Security Compliance Check (independent)</summary>

| Step | Skill | Sub-Agent |
|:---------|:-------|:------:|
| Classified-protection level-3 code review (GB/T 22239-2019 item-by-item check + check report) | `impm-cpc-level3` | TL |

</details>

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->