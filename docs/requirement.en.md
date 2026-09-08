# Project Overview
**Chinese Name: 我是项目经理 (I am the Project Manager)**
**English Name: opencode-impm**
**Abbreviation: impm**
**Description: An opencode plugin that implements the traditional waterfall development process, including the complete documentation workflow, detailed development design, and testing process.**
**Core Requirement: The project must strictly follow the core workflow.**

# Document Terminology
| Abbreviation | Document Name | Chinese Name | Description |
| :--: | :--: | :--: | :-- |
| URS | User Requirement Specification | 用户需求说明书 | Business goals, user roles, business scenarios, functional requirements (high-level), non-functional requirements (high-level), constraints, assumptions and dependencies |
| PRD | Product Requirement Document | 产品需求文档 | Product background, target users, feature list, detailed feature descriptions, business flow diagrams, page prototypes, data requirements, acceptance criteria, version planning, appendix (glossary, reference documents) |
| SAD | System Architecture Design | 系统架构设计 | Design goals and constraints, technology stack selection and rationale, system context diagram, container diagram, component diagram, deployment architecture diagram, security architecture, performance architecture, data flow diagram, architecture decision records |
| DBD | Database Design Document | 数据库设计文档 | Design goals, database selection, ER diagram (Mermaid), logical model, physical model, table structure definitions, index design, view/stored procedure/trigger design, data dictionary, backup and recovery strategy, security strategy |
| API | API Design Document | 接口设计文档 | API list, API versioning strategy, authentication and authorization mechanisms, common error code definitions, detailed interface definitions (URL/Method/Header/Body/Response), status code mapping, rate limiting strategy, example code |
| LLD | Low-Level Design Document | 详细设计文档 | Detailed design of the overall business logic: module overview, module division and responsibilities, class diagrams (Mermaid), core business process sequence diagrams (Mermaid), state diagrams, core business logic pseudocode/flowcharts, business rules and constraints, business data flows, data structure definitions, exception handling strategy, logging conventions, performance optimization points, unit test strategy (interface details are the responsibility of the API Design Document and are not repeated in the LLD) |
| TestCase | Test Case Document | 测试用例 | Test case ID, test case name, module, priority, preconditions, test steps, expected results, test data, related requirement ID, test type (functional/API/performance/security) |

# Global-Unique Requirement Numbering Rule
The functional requirements (FR) and non-functional requirements (NFR) in the URS, as well as the feature numbers (F) and user story numbers (US) in the PRD, must be **globally unique across all versions of the entire project** — they must not be numbered only within a single version. The numbering format is uniformly "prefix-vVersion-sequential", for example: FR-v0.0.1-001, NFR-v0.0.1-001, F-v0.0.1-001, US-v0.0.1-001.
- The sequential number increments from 001 within the version where it is first assigned;
- Requirements / features / user stories that remain unchanged across versions keep their historical number and are not renumbered; only newly added or changed requirements take on a new number within the new version;
- Other numbers (TASK-xxx, TC-xxx, RTM-xxx) only need to be unique within a version and are not affected by this rule.
- If new categories such as extended functional requirements (EFR) appear later, they all use the same format "EFR-vVersion-sequential".

# Project Organization Structure
The project's skills, commands, and agents should first be placed under the assets directory.
When installed to a project or globally, copy them to the corresponding .opencode directory.
Under skills there is a template directory, which is the template directory that stores the templates needed by skills to generate files.

# Project Core Content
1. The project includes a group of agents, each corresponding to a member of a traditional waterfall development project team. PM is the main agent, and the others are all subagents.
2. The entire project uses the PM agent as the scheduling core, and based on the preset waterfall development process, invokes different subagents to execute different skills, completing the full waterfall development workflow.
3. Every step of the waterfall development is made into an opencode skill. It consists of a group of dozens of skills.
4. Each skill corresponds to a command, making it convenient to execute step by step.
5. There is a master skill /impm responsible for executing the full workflow.
6. Based on the overall situation of skills, commands, and agents, consider writing some functions as code in the form of TS plugins.
7. Overall consideration should be given to improving AI compliance, ensuring the AI strictly follows the process sequence, no parallel execution, no skipping, no out-of-order execution.

# IMPM Project Team Members - Agents
## List of Agents to Implement
Every member of the traditional project team is defined as an agent. PM is a regular agent, and the others are subagents.
| agent | English Name | Chinese Name | Role and Responsibilities |
|-----|-----|-----|-----|
| PM | Project Manager | 项目经理 | Acts as the master agent, does not handle specific tasks, assigns other subagents to execute specific tasks. |
| BA | Business Analyst | 业务分析师 | Responsible for collecting URS requirements and transforming vague business requests into clear, acceptable, and traceable PRDs. |
| SA | System Architect | 系统架构师 | Responsible for system architecture design, project structure setup, and technical decisions. Writes the SAD. You determine the skeleton and veins of the system. |
| TL | Tech Lead | 技术负责人 | Responsible for detailed design and generation of task lists. |
| DBA | Database Architect | 数据库架构设计师 | You are a senior Database Architect, proficient in business modeling, relational databases, NoSQL, distributed databases, and performance optimization. |
| TE | Test Engineer | 测试工程师 | Responsible for writing test cases, test functions, and automated test scripts. |
| SCM | Software Configuration Management | 软件配置工程师 | Responsible for version management, change management, and release management. |
| DW | Document Writer | 文档编写 | Responsible for writing various general technical documents. |
| CS | Code Searcher | 本地代码查询 | Queries local code as required. |
| WS | Web Searcher | 网络查询 | Searches relevant official documentation, application cases, and technical materials as required. |
| SSE | Senior Software Engineer | 高级软件工程师 | Has rich experience and can handle requirements with complex business logic. |
| FEE | Front-End Engineer | 前端工程师 | Has rich front-end experience and can design front-end pages that conform to modern aesthetics. |
| BEE | Back-End Engineer | 后端工程师 | Has rich back-end experience, interface planning and development experience. |

## Things to Define in Each Agent
1. Header information conforming to opencode standards.
2. Role: Detailed description of the role from the agent list.
3. Core capabilities: The main work capabilities of the role in the agent list, what work it can handle.
4. Way of thinking: What aspects the role in the agent list needs to consider during work.
5. Work conventions: What processing conventions the role in the agent list needs during work, what it can do, and what it cannot do.
6. Inputs and outputs: What materials the role in the agent list receives and what materials it outputs.

## Where Agents Are Stored
1. In the project, place the above group of agents under assets/agents
2. When installing, place the agents into .opencode/agents. If installing per-project, place them in the project directory's .opencode/agents. If installing globally, place them in the global configuration directory.

# IMPM Core Workflow
The core workflow mainly consists of 4 phases.

## 1. IMPM Project Initialization Phase
Based on the current project documentation and code, reverse-engineer the necessary information, execute initialization tasks in sequence, and complete project initialization.
### a) Check Whether Already Initialized
- Skill: impm-init-isinit
- agent: PM
- Handling: 1. Check whether docs/project.md and docs/sad.md exist. If both files exist, the project is already initialized; skip the initialization phase directly. 2. Check whether the current project has substantive coding or project structure. If not, it is an empty project, and subsequent initialization proceeds as for an empty project. 3. If it has substantive coding, it is an existing project; complete all documentation, design, and testing content by reverse-engineering from the documents and code.
### b) Git Initialization
- Skill: impm-init-git
- agent: SCM
- Handling: 1. Check whether the current project directory is under git management. If not, bring it under git management. 2. Based on the operating system, the programming languages, and the requirements of various development tools, create a git exclusion file. 3. Finally, make a commit.
### c) Project Initialization
- Skill: impm-init-project
- agent: SA
- Handling: 1. Read the PROJECT-TEMPLATE.MD template file from the template directory (the TEMPLATE directory at the parent level of the skill's directory). 2. Generate docs/project.md based on the current project's documents and code. 3. If the project is newly created, or the current documents/code cannot cover the content of project.md, or there are other unclear situations, ask the user questions through conversation.
### d) Version Initialization
- Skill: impm-init-version
- agent: SA
- Handling: Create a new directory under docs: {project-abbreviation}-v0.0.1. The project abbreviation is obtained from project.md.

### e) User Requirement Specification Initialization
- Skill: impm-init-urs
- agent: BA
- Handling:
  1. Read the URS-TEMPLATE.MD template file from the template directory.
  2. Reverse-engineer the User Requirement Specification from the current project's code and documents, filling it in according to the template file format.
  3. Store the reverse-engineered requirement specification at docs/{project-abbreviation}-v0.0.1/ {project-abbreviation}-urs-v0.0.1.md. If the project is an empty project, write an empty MD.
  4. Do not copy the full content to docs/{project-abbreviation}-urs.md. Instead, extract a summary from the current version's URS (requirement number / name / description summary / priority, plus a summary of business goals / scenarios / constraints / assumptions, including a version-evolution table and a full-document index) and write it to docs/{project-abbreviation}-urs.md. The summary body is **not grouped by version number**; it is reorganized by "project → module → business scenario" and ordered by business logic (main flow first, then side flows). Version information is carried by the source-version column and the version-evolution table. The full content stays in the version-directory document.
  5. The functional requirements (FR) and non-functional requirements (NFR) in the URS are numbered globally unique to the project, in the format "prefix-vVersion-sequential", e.g. FR-v0.0.1-001.

### f) Product Requirement Document Initialization
- Skill: impm-init-prd
- agent: BA
- Handling:
  1. Read the PRD-TEMPLATE.MD template file from the template directory.
  2. Reverse-engineer the Product Requirement Document from the current project's code and documents, as well as the URS document, filling it in according to the template file format.
  3. Store the reverse-engineered requirement document at docs/{project-abbreviation}-v0.0.1/ {project-abbreviation}-prd-v0.0.1.md. If the project is an empty project, write an empty MD.
  4. Do not copy the full content to docs/{project-abbreviation}-prd.md. Instead, extract a summary from the current version's PRD (feature list F number/name/module/priority/version range, user story US number/title/summary/priority, plus a summary of product background / target users / data requirements / acceptance criteria, including a version-evolution table and a full-document index) and write it to docs/{project-abbreviation}-prd.md. The summary body is **not grouped by version number**; the feature list is grouped by "project → module" and ordered by business logic within each module, and user stories are grouped by their parent feature/module and logically ordered. Version information is carried by the source-version/version-range columns and the version-evolution table. The full content stays in the version-directory document.
  5. The feature numbers (F) and user story numbers (US) in the PRD are numbered globally unique to the project, in the format "prefix-vVersion-sequential", e.g. F-v0.0.1-001, US-v0.0.1-001.

### g) Architecture Design Initialization
- Skill: impm-init-sad
- agent: SA
- Handling:
  1. Read the SAD-TEMPLATE.MD template file from the template directory.
  2. Reverse-engineer the System Architecture Design document from the current project's code and documents, as well as the previously generated PRD, filling it in according to the template file format.
  3. Store the reverse-engineered architecture design document at docs/{project-abbreviation}-sad.md. If the project is an empty project, write an empty MD.

### h) Database Design Initialization
- Skill: impm-init-dbd
- agent: DBA
- Handling:
  1. Based on project.md and the SAD, determine whether the current project needs a database, and the specific database product and version. If no database is needed, skip the database design initialization.
  2. Read the DBD-TEMPLATE.MD template file from the template directory.
  3. Reverse-engineer the Database Design Document from the current project's code and documents, as well as the previously generated PRD and SAD, filling it in according to the template file format. Also reverse-engineer the SQL statements for project initialization.
  4. Store the reverse-engineered database design document at docs/{project-abbreviation}-v0.0.1/ {project-abbreviation}-dbd-v0.0.1.md and docs/{project-abbreviation}-v0.0.1/ {project-abbreviation}-dbd-v0.0.1.sql. If the project is an empty project, write an empty MD and an empty SQL.
  5. Copy docs/{project-abbreviation}-v0.0.1/ {project-abbreviation}-dbd-v0.0.1.md to docs/{project-abbreviation}-dbd.md. Copy docs/{project-abbreviation}-v0.0.1/ {project-abbreviation}-dbd-v0.0.1.sql to docs/{project-abbreviation}-dbd.sql.

### i) API Design Initialization
- Skill: impm-init-api
- agent: SA
- Handling:
  1. Based on project.md and the SAD, determine whether the current project has front-end/back-end separation or involves interface integration, and whether the current project needs API design. If no APIs are needed, skip the API design initialization.
  2. Read the API-TEMPLATE.MD template file from the template directory.
  3. Reverse-engineer the API Design Document from the current project's code and documents, as well as the previously generated PRD and SAD.
  4. Store the reverse-engineered API Design Document at docs/{project-abbreviation}-v0.0.1/ {project-abbreviation}-api-v0.0.1.md. If the project is an empty project, write an empty MD.
  5. Copy docs/{project-abbreviation}-v0.0.1/ {project-abbreviation}-api-v0.0.1.md to docs/{project-abbreviation}-api.md.

### j) Low-Level Design Initialization
- Skill: impm-init-lld
- agent: TL
- Handling:
  1. Read the LLD-TEMPLATE.MD template file from the template directory.
  2. Reverse-engineer the Low-Level Design Document from the current project's code and documents, as well as the previously generated PRD and SAD. The LLD focuses on the detailed design of the overall business logic (module division, business processes, core business logic, business rules, etc.); interface definitions and request/response parameters are the responsibility of the API Design Document and are not repeated in the LLD.
  3. Store the reverse-engineered Low-Level Design Document at docs/{project-abbreviation}-v0.0.1/ {project-abbreviation}-lld-v0.0.1.md. If the project is an empty project, write an empty MD.
  4. Copy docs/{project-abbreviation}-v0.0.1/ {project-abbreviation}-lld-v0.0.1.md to docs/{project-abbreviation}-lld.md.

### k) Task List Initialization
- Skill: impm-init-task
- agent: TL
- Handling:
  1. Read the TASK-TEMPLATE.json template file from the template directory.
  2. Based on the SAD, the current version PRD, and the current version LLD, as well as the API document (when it exists), complete the task list for the current version using the JSON format in the template: docs/{project-abbreviation}-v0.0.1/ {project-abbreviation}-task-v0.0.1.json. If the project is an empty project, leave the tasks array empty.
  3. Version progress file: docs/{project-abbreviation}-v0.0.1/version_progress.md. Add a new first row: step number: previous number + 1, step name: impm-init-task, step status: completed.

### l) Test Cases, Test Functions, and Automated Test Script Initialization
- Skill: impm-init-testcase
- agent: TE
- Handling:
  1. Read the TESTCASE-TEMPLATE.MD template file from the template directory.
  2. Determine the test cases based on the current project's code and documents, as well as the previously generated PRD and LLD.
  3. Store the test case document at docs/{project-abbreviation}-v0.0.1/ {project-abbreviation}-testcase-v0.0.1.md. If the project is an empty project, write an empty MD.
  4. Copy docs/{project-abbreviation}-v0.0.1/ {project-abbreviation}-testcase-v0.0.1.md to docs/{project-abbreviation}-testcase.md.
  5. Complete the test function writing for each test case in the test case document.
  6. Generate automated test scripts based on the completed test functions, expected inputs/outputs, and result values.

### m) Commit Initialization Content
- Skill: impm-init-commit
- agent: SCM
- Handling:
  Commit all content to git, with the comment: {project-abbreviation}-v0.0.1-initialize impm project

## 2. Requirements Analysis and Organization Phase
### a) Create Version
- Skill: impm-version-create
- agent: SCM
- Handling:
  1. First determine the version number: If the content submitted in this user conversation, or the documents mentioned in the content, contains a version number, use that version number directly. If no version number is mentioned at all, take all version directories under docs/, whose format is similar to {project-abbreviation}-v{x.y.z} where x.y.z is the version number. Take the largest version number, then increment the z value by 1, using x.y.z+1 as the new current version number.
  2. First pull the latest code on git, then create a new branch on git: {project-abbreviation}-v{current-version-number}, and switch to that branch.
  3. Create the project version directory: docs/{project-abbreviation}-v{current-version-number}
  4. Create the version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. The file content is a table with 3 columns: step sequence number, step name, step status. Add the first row: step sequence number: 1, step name: impm-version-create, step status: completed.

### b) Generate URS Requirement Document
- Skill: impm-urs-create
- agent: BA
- Handling:
  1. Read the URS-TEMPLATE.MD template file from the template directory.
  2. Based on the user's input, and the files mentioned in the user's input, generate the User Requirement Specification according to the template file format.
  3. Requirement numbers use the project-global-unique format "prefix-v{current-version-number}-sequential", e.g. FR-v{current-version-number}-001, NFR-v{current-version-number}-001; requirements that carry over across versions keep their historical number.
  4. Store the User Requirement Specification in the version file directory: docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-urs-v{current-version-number}.md.
  5. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-urs-create, step status: completed.

### c) Generate PRD Requirement Document
- Skill: impm-prd-create
- agent: BA
- Handling:
  1. Read the PRD-TEMPLATE.MD template file from the template directory.
  2. Based on the user's input, and the files mentioned in the user's input, generate the Product Requirement Document according to the template file format.
  3. Feature numbers (F) and user story numbers (US) use the project-global-unique format "prefix-v{current-version-number}-sequential", e.g. F-v{current-version-number}-001, US-v{current-version-number}-001; features/user stories that carry over across versions keep their historical number.
  4. Store the Product Requirement Document in the version file directory: docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-prd-v{current-version-number}.md.
  5. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-prd-create, step status: completed.

### d) Update SAD System Architecture Design
- Skill: impm-sad-update
- agent: SA
- Handling:
  1. Read the SAD-TEMPLATE.MD template file from the template directory.
  2. Check whether docs/{project-abbreviation}-sad.md is an empty file:
  3. If it is empty, based on the current conversation content and the reference files involved in the current conversation, apply the SAD template format to complete the first draft of the System Architecture Design. Overwrite docs/{project-abbreviation}-sad.md.
  4. If it is not empty, determine whether the System Architecture Design needs modification under the current version's requirements (URS and PRD).
  5. If no modification is needed, version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-sad-create, step status: no modification needed. Then exit the current step and continue with subsequent steps.
  6. If modification is needed, modify docs/{project-abbreviation}-sad.md directly.
  7. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-sad-create, step status: completed.

### e) Generate DBD Database Design
- Skill: impm-dbd-create
- agent: DBA
- Handling:
1. Read the DBD-TEMPLATE.MD template file from the template directory.
2. Check whether docs/{project-abbreviation}-dbd.md exists. If it does not exist, it means the current project does not need a database. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-dbd-create, step status: no database needed. Then skip this step and continue with subsequent steps.
3. Based on the SAD and the current version's PRD, referencing the existing database design: docs/{project-abbreviation}-dbd.md (may be empty), apply the DBD template format to complete the current version's database design: docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-dbd-v{current-version-number}.md.
4. Based on the current database design, complete the database script: docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-dbd-v{current-version-number}.sql.
5. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-dbd-create, step status: completed.

### f) Generate API Design Document
- Skill: impm-api-create
- agent: TL
- Handling:
  1. Read the API-TEMPLATE.MD template file from the template directory.
  2. Check whether docs/{project-abbreviation}-api.md exists. If it does not exist, it means the current project does not need API creation. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-api-create, step status: no API needed. Then skip this step and continue with subsequent steps.
  3. Based on the SAD and the current version's PRD, referencing the existing API design: docs/{project-abbreviation}-api.md (may be empty), apply the API template format to complete the current version's new API design: docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-api-v{current-version-number}.md.
  4. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-api-create, step status: completed.

### g) Generate LLD Low-Level Design Document
- Skill: impm-lld-create
- agent: TL
- Handling:
  1. Read the LLD-TEMPLATE.MD template file from the template directory.
  2. Based on the SAD and the current version's PRD, referencing the existing low-level design: docs/{project-abbreviation}-lld.md (may be empty), apply the LLD template format to complete the low-level design for the current version's new requirements: docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-lld-v{current-version-number}.md. The LLD focuses on the detailed design of the overall business logic (module division, business processes, core business logic, business rules, etc.); interface definitions and request/response parameters are the responsibility of the API Design Document and are not repeated in the LLD.
  3. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-lld-create, step status: completed.

### h) Generate task.json Task List Document
- Skill: impm-task-create
- agent: TL
- Handling:
  1. Read the TASK-TEMPLATE.json template file from the template directory.
  2. Based on the SAD, the current version's PRD, and the current version's LLD, use the JSON format in the template to complete the current version's task list: docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-task-v{current-version-number}.json.
  3. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-task-create, step status: completed.

### i) Commit Requirements Analysis Phase Content
- Skill: impm-analysis-commit
- agent: SCM
- Handling: Commit the files and directories generated during the requirements analysis and organization phase to git.

## 3. Coding and Development Phase

### a) Coding Development Main Flow
- Skill: impm-coding
- agent: PM
- Handling:
  1. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-coding, step status: in progress.
  2. Read all tasks whose status is not "completed" from docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-task-v{current-version-number}.json.
  3. All tasks must strictly follow the upstream-downstream order, executing all subsequent steps in a loop, one after another. No parallel execution, no out-of-order execution, no merged execution.
  4. After the previous task completes all coding tasks, execute the next task, until all tasks are completed.
  5. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-coding, step status: completed.

### b) Task Coding
- Skill: impm-task-coding
- agent: PM
- Handling:
1. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-task-coding, step status: {task-number}-in progress.
2. Start the TL subagent to execute the impm-task-coding-context skill to collect requirement context.
3. Start the CS subagent to execute the impm-task-coding-cs skill to query existing code.
4. Start the WS subagent to execute the impm-task-coding-ws skill to query web resources.
5. Start the DBA subagent to execute the impm-task-coding-dbd skill to write the database design.
6. Determine whether it is a front-end/back-end separated project and whether this is a back-end task. If so, start the BE subagent to execute the impm-task-coding-api skill to design APIs; otherwise skip.
7. Start the TE subagent to execute the impm-task-coding-testcase skill to write test cases.
8. Based on the task type, start the FE/BE/DE subagent to execute the impm-task-coding-code skill.
9. Start the TE subagent to execute the impm-task-coding-writetest skill to write the automated scripts for unit tests and API tests.
10. Start the TE subagent to execute the impm-task-coding-runtest skill to run the tests. If tests fail, fall back to step 1 to re-collect information and code again; if failures reach the upper limit consecutively, abort.
11. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-task-coding, step status: {task-number}-completed.

### c) Organize Requirement Context
- Skill: impm-task-coding-context
- agent: TL
- Handling:
1. Receive the current version number and task number.
2. Locate the task file by version number: docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-task-v{current-version-number}.json
3. Get the corresponding task content in the JSON by task number.
4. Based on the userStoryId in the JSON content, get the related user story content from the current version's PRD (docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-prd-v{current-version-number}.md).
5. Read content related to the current task from files such as docs/{project-abbreviation}-sad.md and docs/project.md.
6. Merge all collected requirement information and write it to: docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/context.md. If the directory does not exist, create it.
7. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-task-coding-context, step status: {task-number}-completed.

### d) Local Code Query
- Skill: impm-task-coding-cs
- agent: CS
- Handling:
1. Receive the current version number and task number.
2. Locate the context file by version number and task number: docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/context.md
3. Read the project map in docs/project.md to find existing source code files and utility classes that may be related to the current development task.
4. Query the parts of the local code related to the current requirements.
5. Merge all collected information and write it to: docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/cs.md. If the directory does not exist, create it.
6. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-task-coding-cs, step status: {task-number}-completed.

### e) Web Resource Query
- Skill: impm-task-coding-ws
- agent: WS
- Handling:
1. Receive the current version number and task number. Locate the context and CS files by version number and task number:
   docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/context.md
   docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/cs.md
2. Based on the above file content, determine which third-party middleware, packages, or SDKs need to be used in the current task.
3. Search the web for the official documentation, usage, and examples of these packages.
4. When searching and collecting, pay attention to whether the version used by the current project is compatible with the version of the materials being queried.
5. Also search and collect web resources related to the current task.
6. Analyze, merge, and summarize the queried content, then place it into: docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/ws.md
7. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-task-coding-ws, step status: {task-number}-completed.

### f) Current Task Database Design Document and Database Script
- Skill: impm-task-coding-dbd
- agent: DBA
- Handling:
1. Receive the current version number and task number.
2. Check whether docs/{project-abbreviation}-dbd.md exists. If it does not exist, it means the current project does not need a database. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-task-coding-dbd, step status: {task-number}-no database needed. Then end this step and continue with subsequent steps.
3. Read the following files by version number and task number:
   docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/context.md,
   docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/cs.md
   docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/ws.md
4. Read the database design files:
   docs/{project-abbreviation}-dbd.md
   docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-dbd-v{current-version-number}.md
5. Based on the current task's context.md, cs.md, and ws.md, determine whether the database design needs modification. If not, version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-task-coding-dbd, step status: {task-number}-database design needs no modification. Then end this step and continue with subsequent steps.
6. If modification is needed, first modify: docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-dbd-v{current-version-number}.md, then synchronously modify: docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-dbd-v{current-version-number}.sql
7. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-task-coding-dbd, step status: {task-number}-database design updated.

### g) Current Task API Design Document
- Skill: impm-task-coding-api
- agent: TL
- Handling:
1. Receive the current version number and task number.
2. Check whether docs/{project-abbreviation}-api.md exists. If it does not exist, it means the current project does not need APIs. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-task-coding-api, step status: {task-number}-no API needed. Then end this step and continue with subsequent steps.
3. Read the following files by version number and task number:
   docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/context.md,
   docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/cs.md
   docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/ws.md
4. Read the API design files:
   docs/{project-abbreviation}-api.md
   docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-api-v{current-version-number}.md
5. Based on the current task's context.md, cs.md, and ws.md, determine whether the API design needs modification. If not, version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-task-coding-api, step status: {task-number}-API design needs no modification. Then end this step and continue with subsequent steps.
6. If modification is needed, modify the interface design document of this version: docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-api-v{current-version-number}.md.
7. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-task-coding-api, step status: {task-number}-API design updated.

### h) Write Test Cases
- Skill: impm-task-coding-testcase
- agent: TE
- Handling:
1. Receive the current version number and task number.
2. Read the following files by version number and task number:
   docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/context.md,
   docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/cs.md
   docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/ws.md
3. Read the database design files (skip if the files do not exist):
   docs/{project-abbreviation}-dbd.md
   docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-dbd-v{current-version-number}.md
4. Read the API design files (skip if the files do not exist):
   docs/{project-abbreviation}-api.md
   docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-api-v{current-version-number}.md
5. Read the previous test cases (skip if the files do not exist):
   docs/{project-abbreviation}-testcase.md
   docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-testcase-v{current-version-number}.md
6. Based on the current task requirements, referencing the current version's test cases, apply the TESTCASE-TEMPLATE.MD template file in the template directory to create the current task's test cases: docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/testcase.md.
7. The test cases should include test types: unit test, API test, functional test, UI test.
8. Separately check the test coverage of the different test types, promptly fix the test case file, strive to increase coverage, and avoid missing tests.
9. Based on the current task's test cases, compare and update the differing test cases in docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-testcase-v{current-version-number}.md.
10. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-task-coding-testcase, step status: {task-number}-completed.

### i) Implement Coding
- Skill: impm-task-coding-code
- agent: SSE, FEE, BEE
- Handling:
1. Receive the current version number and task number.
2. Read the following files by version number and task number:
   docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/context.md,
   docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/cs.md
   docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/ws.md
3. Based on the requirement content, if it is a back-end business requirement of a front-end/back-end separated project, enable the BEE subagent; if it is a front-end business requirement of a front-end/back-end separated project, enable the FEE subagent; if it is not a front-end/back-end business requirement, enable the SSE subagent.
4. Read the database design files (skip if the files do not exist):
   docs/{project-abbreviation}-dbd.md
   docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-dbd-v{current-version-number}.md
   docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-dbd-v{current-version-number}.sql
5. Read the API design files (skip if the files do not exist):
   docs/{project-abbreviation}-api.md
   docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-api-v{current-version-number}.md
6. Read the test cases: docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/testcase.md
7. Use the agent enabled in the previous step to complete the coding. If needed during coding, you may also read docs/{project-abbreviation}-sad.md and docs/project.md, and may also invoke cs and ws to obtain more existing code information and related materials.
8. Write code based on the above file content. The code should be concise, with clear logic, and appropriate function and file sizes, avoiding overly long functions and overly long code files.
9. After writing, first check whether the code has obvious formatting or syntax issues, whether the function and file division of responsibilities is appropriate, and whether the structure is clear and readable.
10. Then check whether the code covers all the requirements in the reference context.
11. Finally, check whether the code has logical loopholes and problems.
12. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-task-coding-code, step status: {task-number}-completed.

### j) Write Test Functions and Automated Test Scripts
- Skill: impm-task-coding-writetest
- agent: TE
- Handling:
1. Receive the current version number and task number.
2. Read the current task's test cases by version number and task number: docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/testcase.md, and write them separately by test type:
a) Unit tests: Write unit test functions directly according to the current development language, following the language's conventions and commonly used test plugins.
b) API tests: Generate a Postman Collection v2.1-format JSON case file, and place it in the current version directory docs/{project-abbreviation}-v{current-version-number}/{project-abbreviation}-api-test-v{current-version-number}.postman_collection.json. Each test script uses a unified entry point (scripts/API-TEST/run_api_test.py).
c) Functional and UI tests: Add a new file under the docs/{project-abbreviation}-v{current-version-number}/ directory: {project-abbreviation}-ui-test-record-v{current-version-number}.md. List everything clearly in it.
3. Based on the completed test functions and scripts, mark the corresponding function location or script location in testcase.md.
4. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-task-coding-writetest, step status: {task-number}-completed.

### k) Run Tests
- Skill: impm-task-coding-runtest
- agent: TE
- Handling:
1. Receive the current version number and task number.
2. Read the current task's test cases by version number and task number: docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/testcase.md.
3. Based on the current task's test cases, find the corresponding test functions and test scripts, and execute the test scripts.
4. After each test completes, update the test pass status in the current task's test cases.
5. After all tests complete, if some tests failed, add the error information to the context, then jump back to step i to re-implement the coding.
6. If all tests pass, it means the current task's coding has been successfully completed.
7. Merge the current task's test cases docs/{project-abbreviation}-v{current-version-number}/task_{current-task-number}/testcase.md and update them into the current version's test cases: docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-testcase-v{current-version-number}.md.
8. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-task-coding-runtest, step status: {task-number}-completed.

### l) Git Commit Version
- Skill: impm-task-coding-gitcommit
- agent: SCM
- Handling:
1. Receive the current version number and task number.
2. Commit all current modifications to git, with the git comment: {project-abbreviation}-v{current-version-number}-{current-task-number}
3. Change the current task's status in task.json to completed.
4. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-task-coding-gitcommit, step status: {task-number}-completed.
5. After the commit is complete, return to step b, get and execute the next task, until all tasks are completed.

## 4. Regression Testing and Version Document Organization
### a) Execute Regression Tests
- Skill: impm-regression-test
- agent: TE
- Handling:
1. Merge the current version's docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-testcase-v{current-version-number}.md into the main test cases: docs/testcase.md
2. Run all unit tests in full based on the current development language and test plugins.
3. Write the unit test results to: docs/{project-abbreviation}-v{current-version-number}/regression-unit-test.md.
4. Run all the API test cases in the current version directory (Postman Collection v2.1, executed with scripts/API-TEST/run_api_test.py), and write the test results to: docs/{project-abbreviation}-v{current-version-number}/regression-api-test.md.
5. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-regression-test, step status: completed.

### b) Code Comments
- Skill: impm-coding-comment
- agent: DW
- Handling:
1. Add comments to all the code updated in this version (determined comprehensively from all git modification records on the current branch).
2. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-coding-comment, step status: completed.

### c) Code Review
- Skill: impm-coding-review
- agent: TL
- Handling:
1. Find problems in the code, not fix them. Only output review opinions; do not modify any files.
2. Find security vulnerabilities (injection, privilege escalation, hardcoded keys, sensitive information leakage).
3. Identify performance traps (N+1 queries, memory leaks, unnecessary loops, full table scans on large data volumes).
4. Check code quality (duplicate code, overly long functions, confusing naming, lack of comments).
5. Verify architecture compliance (clear layering, whether the dependency direction is violated, whether defined interfaces are bypassed).
6. Confirm test coverage (whether critical paths have tests, whether boundary conditions are covered).
7. Read the code review report template from the template directory.
8. Write to: docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-review.md.
9. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-coding-review, step status: completed.

### d) Update the Project Map in project.md
- Skill: impm-project-update
- agent: SA
- Handling:
  Update the project map section based on the source code directories under the current project.
  Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-project-update, step status: completed.

### e) Merge All Documents of the Current Version into the Project Master Documents
- Skill: impm-doc-merge
- agent: DW
- Handling: merging uses "refactor-style merge", organizing the master-document structure by the project's organization, code structure, and system architecture, rather than simple appending.
  1. URS: merge docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-urs-v{current-version-number}.md into docs/{project-abbreviation}-urs.md, merging only the **summary** (requirement numbers FR/NFR, name, one-line description, priority, business ownership), **not grouped by version number**, reorganized by "project → module → business scenario" and ordered by business logic (main flow first, side flows after), with version information carried by the source-version column and the version-evolution table; do not merge the full content; create the master document first if it does not exist. The full content stays in the version-directory document.
  2. PRD: merge docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-prd-v{current-version-number}.md into docs/{project-abbreviation}-prd.md, merging only the **summary** (feature list F, user stories US), **not grouped by version number**; the feature list is grouped by "project → module" and ordered by business logic within each module, and user stories are grouped by their parent feature/module and logically ordered, with version information carried by the source-version/version-range columns and the version-evolution table; do not merge the full content; create the master document first if it does not exist.
  3. API: merge docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-api-v{current-version-number}.md into docs/{project-abbreviation}-api.md, using **module-grouped refactor-style merge**: new interfaces are inserted into their module group, existing interfaces are updated in place with a version annotation, and deprecated interfaces are moved into a decommissioned subsection.
  4. DBD: merge docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-dbd-v{current-version-number}.md into docs/{project-abbreviation}-dbd.md, using **business-domain/module → table refactor-style merge**: new tables are inserted into their business domain, existing tables are updated in place with a change-version annotation, deprecated tables are moved into a decommissioned-table subsection, and the ER diagram is updated accordingly.
  5. SQL: merge docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-dbd-v{current-version-number}.sql into docs/{project-abbreviation}-dbd.sql, using **refactor-style merge**: new tables append CREATE, existing tables generate ALTER or update the original CREATE, keeping it fully executable from scratch with no duplicate conflicts, and each block is annotated with its source version.
  6. LLD: merge docs/{project-abbreviation}-v{current-version-number}/ {project-abbreviation}-lld-v{current-version-number}.md into docs/{project-abbreviation}-lld.md, using **module/business-flow refactor-style merge**: new modules are inserted at a position consistent with the architecture, existing modules are updated in place with a revision-version annotation.
  7. When merging, reference the structural baselines (docs/project.md project map, docs/{project-abbreviation}-sad.md system architecture); maintain a version-evolution table at the head of the master documents to keep versions traceable.
  8. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-doc-merge, step status: completed.

### f) Update readme.md and agent.md
- Skill: impm-doc-update
- agent: DW
- Handling:
1. Create and update in the root directory: readme.md, agent.md.
2. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-doc-update, step status: completed.

### g) Update Build and Deployment Plan
- Skill: impm-deploy-update
- agent: DW
- Handling:
  1. Create or update: deploy/build.md
  2. Create or update: deploy/deploy.md
  3. If build and deployment scripts are generated, place them in the deploy directory (if feasible).
  4. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-deploy-update, step status: completed.

### h) Merge Master Branch and Commit
- Skill: impm-git-merge
- agent: SCM
- Handling:
1. Switch to the master branch.
2. git merge --squash {current-branch-name}
3. Version progress file: docs/{project-abbreviation}-v{current-version-number}/version_progress.md. Add the first row: step sequence number: previous sequence number + 1, step name: impm-git-merge, step status: completed.

## Skills
Each of the above steps of the project is defined as an opencode skill.

### Document-Review-Edition Skills (impm-init-review / impm-docs-review / impm-review-edition)
- Based on the standard impm-init / impm-docs / impm flows, provides a "document review" edition:
  - **impm-init-review**: steps identical to impm-init (isinit→git→project→version→urs→prd→sad→dbd→api→lld→task→testcase→commit), except that after each of the 9 document-generation steps (project/urs/prd/sad/dbd/api/lld/task/testcase) completes, the PM first reads the document, extracts a concise summary, and displays it as text in the dialog (display only, not written to a file), then pops up a prompt box via the question tool to ask the user to review the document; the user proceeds to the next step only by choosing "review approved", and "needs revision" regenerates and re-reviews (re-showing the summary) based on the feedback without advancing the next step in the meantime. Steps judged as "no database needed / no interface needed" that produce no new document do not pop up a prompt box.
  - **impm-docs-review**: steps identical to impm-docs (version creation→URS→PRD→SAD→DBD→API→LLD→task list→RTM→git commit), except that after each of the 7 document-generation steps (urs/prd/sad/dbd/api/lld/task) completes, the PM first reads the document, extracts a concise summary, and displays it as text in the dialog (display only, not written to a file), then pops up a prompt box via the question tool to ask the user to review the document; the user proceeds to the next step only by choosing "review approved", and "needs revision" regenerates and re-reviews (re-showing the summary) based on the feedback without advancing the next step in the meantime. Steps judged as "no change needed / no database needed / no interface needed" that produce no new document do not pop up a prompt box.
  - **impm-review-edition**: fully consistent with the impm full flow, except that the project initialization phase (impm-init) is replaced by impm-init-review and the requirements analysis and organization phase (impm-docs) is replaced by impm-docs-review, implementing per-document user review throughout the full development process.

## Commands
Each skill corresponds to a command.
Additionally, define several commands:
1. /impm — Automatically executes all steps of the 4 phases.
2. /impm-init — Executes all steps of the project initialization phase.
3. /impm-init-review — Executes all steps of the project initialization phase (with project/urs/prd/sad/dbd/api/lld/task/testcase document-by-document user review).
4. /impm-docs — Executes all steps of the requirements analysis and organization phase.
5. /impm-coding — Executes all steps of the coding and development phase.
6. /impm-finish — Executes all steps of the regression testing and version document organization phase.
7. /impm-docs-review — Executes all steps of the requirements analysis and organization phase (with urs/prd/sad/dbd/api/lld/task document-by-document user review).
8. /impm-review-edition — Executes all steps of the 4 phases (document review edition: Phase 1 uses impm-init-review, Phase 2 uses impm-docs-review).

## Plugins
1. Based on the above requirements, decide for yourself which common functions to integrate into a plugin written in TS.
2. This project requires strictly following the designed process in sequence, without skipping, without out-of-order execution, and without hallucination. Consider whether some AI processing can be replaced with code written in TS in a plugin to improve compliance with the process commands.

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
