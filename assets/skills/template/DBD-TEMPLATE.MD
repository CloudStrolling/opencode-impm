# Database Design Document (DBD)
**Project Name**:
**Version**:
**Date**:
**Author**: DBA

## 1. Design Objectives
(State the objectives the database design aims to achieve: supported business, data scale, consistency requirements, etc.)

## 2. Database Selection
**Database Product**:
**Version**:
**Selection Rationale**:

## 3. ER Diagram
(Use Mermaid erDiagram to describe entity relationships.)

## 4. Logical Model
(Describe entities, attributes, and relationships without involving specific storage implementation.)

## 5. Physical Model

> **Table Naming Convention**: `{subsystem_abbreviation}_{module_abbreviation}_{entity_name}`, e.g. `sys_user`, `biz_order`, `pay_transaction`.
> Subsystem and module abbreviations are derived from the SAD module breakdown; entity name is the English abbreviation of the business object.

### 5.1 {Subsystem Abbreviation} — {Subsystem Name}
#### 5.1.1 {Module Abbreviation} — {Module Name}

**{subsystem_abbreviation}_{module_abbreviation}_{entity_name}**
| Field | Type | Length | Nullable | Default | Primary/Foreign Key | Description |
| --- | --- | --- | --- | --- | --- | --- |

## 6. Index Design
| Index Name | Table | Fields | Type | Description |
| --- | --- | --- | --- | --- |

## 7. View / Stored Procedure / Trigger Design
### 7.1 Views
### 7.2 Stored Procedures
### 7.3 Triggers

## 8. Data Dictionary
### Enumeration Value Summary
| Field Path | Value | Description |
| --- | --- | --- |

## 9. Backup and Recovery Strategy
(Backup frequency, method, retention period, recovery drills.)

## 10. Security Strategy
(Account permissions, sensitive data masking, auditing, encryption.)

## 11. Data Initialization
(Describe preset data: enumeration dictionaries, configuration items, initial data, etc., including corresponding INSERT INTO statements.)

### 11.1 Enumeration Dictionary Initialization
| Table | Field | Initial Value | Description |
| --- | --- | --- | --- |

### 11.2 Business Data Initialization
| Table | Initialization Data Description | SQL Statement |
| --- | --- | --- |

### 11.3 System Configuration Initialization
| Table | Configuration Item | Configuration Value | Description |
| --- | --- | --- | --- |

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
