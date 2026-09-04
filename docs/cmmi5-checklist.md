# CMMI5 Development Documentation & Code Checklist

> Basis: Compiled according to CMMI-DEV V1.3 / V2.0 Model Level 5 (Optimizing) requirements. CMMI5 is a cumulative model that must simultaneously satisfy all related Process Areas (PA) from ML2 through ML5.
> Scope: General requirements for all documentation artifacts and code artifacts in the software development process.
> Date compiled: 2026-08-26

## I. Requirements Documents & Management (REQM Requirements Management / RD Requirements Development)

| ID | Checklist Item | Requirements Description |
|----|----|----|
| R-01 | User Requirements Specification (URS) Documentation | User requirements are documented as a formal URS after investigation and elicitation, covering functional and non-functional requirements (performance, security, compatibility, etc.); non-functional requirements are quantifiable |
| R-02 | Product Requirements Specification (PRD/SRS) Documentation | Product-level requirements specification generated from the URS, including feature lists, priorities, data requirements, preconditions, and acceptance criteria |
| R-03 | Requirements Review & Stakeholder Confirmation | URS/PRD undergoes review (peer review or milestone review) before publication; customers/users participate and provide written confirmation |
| R-04 | Bidirectional Requirements Traceability Matrix (RTM) | Establishes "Requirements → Design → Code → Test Cases" bidirectional traceability evidence; any requirement can be traced to its implementation and verification evidence |
| R-05 | Controlled Management of Requirement Changes | Changes are implemented after impact assessment by a Change Control Board (CCB); requirement document versions are upgraded after changes, and downstream design and testing are updated synchronously |

## II. Design Documents (TS Technical Solution / PI Product Integration)

| ID | Checklist Item | Requirements Description |
|----|----|----|
| D-01 | System Architecture Design Document (SAD/HLD) | Describes system layering, module division, technology selection with rationale, consistent with requirements |
| D-02 | Low-Level Design Document (LLD) | Covers module division, business processes, core business logic; granularity sufficient to guide coding |
| D-03 | Database Design Document (DBD) & SQL Scripts | Table structures, fields, indexes, and constraints are completely designed; SQL scripts are idempotent and repeatable |
| D-04 | Interface Design Document (API/ICD) | Interface definitions are complete (path, method, input/output parameters, error codes); interface compatibility is ensured |
| D-05 | Design Derivation Consistency with Requirements | Design documents can be traced upward to specific requirement items; no design elements without a requirement source |

## III. Coding Requirements (TS Implementation Phase)

| ID | Checklist Item | Requirements Description |
|----|----|----|
| C-01 | Organization-Level Coding Standards | Written coding standards exist (naming, structure, return format, interface style, etc.) and are followed by all team members |
| C-02 | Code Comment Requirements | Methods/key logic must have comments; comments are consistent with code and facilitate maintenance and handover |
| C-03 | Code Conforms to Design & Architecture Compliance | Code complies with SAD/LLD layering and dependency directions; does not bypass defined interfaces |
| C-04 | Secure Coding Checks | No injection risks (SQL/command/XSS), privilege escalation, hardcoded keys, or sensitive information leakage |

## IV. Verification & Validation (VER Verification / VAL Validation)

| ID | Checklist Item | Requirements Description |
|----|----|----|
| V-01 | Test Cases Written & Reviewed Before Coding | Test cases (development cases) are designed based on requirements prior to coding; coverage meets requirements |
| V-02 | Full Unit Test Execution | Unit tests cannot be selectively skipped; execution commands, pass rates, and failure details are recorded |
| V-03 | Automated API Testing | Self-tests pass before API integration (e.g., Postman); automated scripts and acceptance criteria exist |
| V-04 | Functional/UI Testing & Confirmation | Functions are verified against real scenarios to match user expectations; test records are retained |
| V-05 | Regression Test Report | Version-level regression testing produces a formal report: environment, statistical results, failure details, conclusion |
| V-06 | Code Peer Review (Code Review) | Reviewed by peers/technical lead before submission, covering security, performance, quality, architecture compliance, and test coverage; issues are tracked to closure |
| V-07 | Test Gap Identification | Clear identification of uncovered critical paths, boundary conditions, and exception paths |

## V. Configuration Management (CM)

| ID | Checklist Item | Requirements Description |
|----|----|----|
| M-01 | All Work Products Under Configuration Management | Code, documents, test scripts, templates, etc. are managed under a unified version control tool |
| M-02 | Baseline Management | Baselines established at key milestones (version releases, milestones); baseline changes are controlled |
| M-03 | Commit Standards & Traceability | Commits must include remarks (linked tasks/defects); commit history is traceable |
| M-04 | Merge & Integration Control | Branch merge strategy is defined (e.g., squash merge); workspace is verified clean before merging |
| M-05 | Concurrent Modification Conflict Control | When multiple tasks run in parallel, shared product writes have conflict detection and recovery mechanisms |

## VI. Quality Assurance (PPQA)

| ID | Checklist Item | Requirements Description |
|----|----|----|
| Q-01 | Process Compliance Check | Independent QA conducts objective audits of each process activity per checklist; output is documented |
| Q-02 | Product Quality Review | Work products (documents/code) undergo compliance review; review report is produced |
| Q-03 | Non-Conformance Issue Closed-Loop Tracking | Non-conformance items are recorded, assigned, and marked with fix status; unfixed items include explanation and are reported to management |

## VII. Project Planning & Monitoring (PP Project Planning / PMC Project Monitoring & Control)

| ID | Checklist Item | Requirements Description |
|----|----|----|
| P-01 | Task Breakdown & Dependency Ordering (WBS) | Work is decomposed to task level; upstream/downstream dependencies and completion criteria are defined |
| P-02 | Progress Status Recording & Tracking | Each step/task status is recorded in real time; milestone achievement is visible |
| P-03 | Deviation Correction Mechanism | When failures/deviations occur, root cause is identified, retried, or escalated; retry count has an upper limit |
| P-04 | Exception Monitoring & Alerting | Execution exceptions (hang/interrupt) have monitoring, alerting, and automatic recovery measures |

## VIII. Measurement & Analysis (MA)

| ID | Checklist Item | Requirements Description |
|----|----|----|
| A-01 | Process Metric Data Collection & Storage | Progress, effort, duration, and other process data are collected and persistently stored |
| A-02 | Quality/Defect Measurement & Analysis | Defect density, Defect Removal Efficiency (DRE), test coverage, and leakage rate are measured; results are analyzed periodically and communicated |

## IX. Quantitative Management & Statistical Control (OPP Organizational Process Performance / QPM Quantitative Project Management) — ML4/ML5 Core

| ID | Checklist Item | Requirements Description |
|----|----|----|
| N-01 | Organization-Level Process Performance Baseline (PPB) | Mean and upper/lower control limits established for key metrics (defect density, productivity, etc.) based on historical project data |
| N-02 | Organization-Level Process Performance Model (PPM) | Predictable performance model y=f(x) is established to support target achievement prediction in projects |
| N-03 | Project Quantitative Targets & Subprocess Statistical Control | Projects establish quality and process performance targets; key subprocesses are monitored with statistical methods (SPC control charts, etc.) to detect and correct deviations |

## X. Causal Analysis & Continuous Improvement (CAR Causal Analysis & Resolution / OPM/OID Organizational Performance Management & Innovation Deployment) — ML5 Core

| ID | Checklist Item | Requirements Description |
|----|----|----|
| I-01 | Defect Root Cause Analysis (CAR) | Selected defects undergo systematic root cause analysis (5Why/Fishbone diagram); action recommendations are implemented and their effects are evaluated with recorded data |
| I-02 | Defect Prevention & Experience Reuse | Root cause conclusions are consolidated into checklist/specification updates to prevent recurrence of similar defects |
| I-03 | Organization-Level Continuous Process Improvement (OPM/OID) | Process and technology improvement measures are selected and deployed based on quantitative data; improvement effects are measured |

## XI. Other Supporting Areas (RSKM / DAR / SAM / OT / OPD / OPF)

| ID | Checklist Item | Requirements Description |
|----|----|----|
| S-01 | Risk Management (RSKM) | Risks are identified, prioritized, mitigated with plans tracked to closure; risk register is maintained |
| S-02 | Decision Analysis (DAR) | Major decisions (technology selection, etc.) have alternative evaluation records with selection criteria |
| S-03 | Supplier Agreement Management (SAM) | Outsourced/purchased components have agreement management and acceptance criteria |
| S-04 | Organizational Training (OT) | Training needs are identified, plans are implemented, and effectiveness is collected |
| S-05 | Organizational Standard Processes & Process Assets (OPD/OPF) | Organization has defined standard process sets, document template libraries, and historical databases; continuously improved per OPF |
| S-06 | Knowledge Asset Consolidation & Reuse | Lessons learned and reusable components are stored for use by subsequent projects |
