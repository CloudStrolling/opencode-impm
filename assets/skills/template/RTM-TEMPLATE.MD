# Requirement Traceability Matrix (RTM)
**Project Name**:
**Version**:
**Date**:
**Author**: TL

> Note: RTM (Requirement Traceability Matrix) records the bidirectional traceability relationship of "Requirement → Design → Task → Test Case".
> Requirement source: functional requirements (FR-xxx) and non-functional requirements (NFR-xxx) from the URS; user story source: user stories (US-xxx) from the PRD;
> Design source: design content (module/business process) from the LLD; task source: task list (TASK-xxx); test case source: TestCase (TC-xxx).
> The relationship among requirements, user stories, designs, tasks, and test cases is many-to-many; one record is one association; the same requirement may appear in multiple rows.

## 1. Requirement/User Story List (complete set of original requirements and user stories)
| ID | Type (URS Requirement/PRD User Story) | Name | Description Summary | Priority |
| --- | --- | --- | --- | --- |
| FR-001 | URS Requirement |  |  |  |
| US-001 | PRD User Story |  |  |  |

## 2. Traceability Matrix (many-to-many association records)
### 2.1 Requirement/User Story → Design
| Record ID | Requirement/User Story ID | LLD Design Content (Module/Process) | Coverage |
| --- | --- | --- | --- |
| RTM-001 | FR-001 | Module A / Process X | Covered / Missing |
### 2.2 Requirement/User Story → Task
| Record ID | Requirement/User Story ID | Task ID | Task Name | Coverage |
| --- | --- | --- | --- | --- |
| RTM-002 | US-001 | TASK-001 |  | Covered / Missing |
### 2.3 Requirement/User Story → Test Case
| Record ID | Requirement/User Story ID | Test Case ID | Test Case Name | Coverage |
| --- | --- | --- | --- | --- |
| RTM-003 | US-001 | TC-001 |  | Covered / Missing |

## 3. Coverage Completeness Check
| Item | ID | Has Design | Has Task | Has Test Case | Issue Annotation |
| --- | --- | --- | --- | --- | --- |
| Requirement/User Story | FR-001 | Yes/No | Yes/No | Yes/No | Normal / Missing Design / Missing Task / Missing Test Case |

## 4. Issue List (items that fail the check)
| Issue ID | Related ID | Issue Description | Handling Suggestion | Status |
| --- | --- | --- | --- | --- |
| P-001 | FR-001 | This requirement is missing design/task/test case |  | Pending / Handled |

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
