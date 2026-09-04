# Operational Audit Log Checkpoint Report
**Project Name**: **Check Date**: **Checker**: TL **Standard Basis**: GB/T 22239-2019 "Information Security Technology - Baseline Requirements for Classified Protection of Cybersecurity" Level 3 Security Requirements — Security Audit (8.1.4.3)

## Usage Instructions
1. This report conducts item-by-item checks on key operational audit log checkpoints required by the Level 3 classified protection "Security Audit" control point.
2. The check scope covers six major categories of key operational scenarios: user authentication, permission changes, data export, sensitive configuration changes, critical business operations, and exceptions/security events.
3. Each check item result can only take one of three values:
   - **Pass**: Code, configuration, or documentary evidence shows that the operational scenario has implemented audit logging, with complete log fields and adequate protective measures;
   - **Fail**: No audit log checkpoint evidence found, or log fields are incomplete and protective measures are missing; the specific reason for failure must be stated in the explanation;
   - **Not Applicable**: The current project genuinely does not have this operational scenario; the rationale must be stated in the explanation.
4. Check evidence must include file path (with line number), log framework configuration location, or code implementation location.

## 1. Check Summary
| Category | Check Items | Pass | Fail | Not Applicable |
| --- | --- | --- | --- | --- |
| User Authentication Audit |  |  |  |  |
| Permission Change Audit |  |  |  |  |
| Data Export Audit |  |  |  |  |
| Sensitive Configuration Change Audit |  |  |  |  |
| Critical Business Operation Audit |  |  |  |  |
| Exception and Security Event Audit |  |  |  |  |
| Audit Log Protection and Operations |  |  |  |  |

Overall Conclusion: (All Passed / Fail Items Requiring Remediation)

## 2. User Authentication Audit
### Corresponding Standard: Secure Computing Environment 8.1.4.3
| ID | Check Point | Result | Explanation (Evidence Location/Reason for Failure) |
| --- | --- | --- | --- |
| AUD-LOG-01 | Are audit logs recorded for user login operations (including username/IP/timestamp/login result) |  |  |
| AUD-LOG-02 | Are audit logs recorded for user logout operations |  |  |
| AUD-LOG-03 | Are audit logs recorded for login failures (wrong password/account lockout/timeout) |  |  |
| AUD-LOG-04 | Are audit logs recorded for password change/reset operations |  |  |
| AUD-LOG-05 | Are audit logs recorded for Token refresh/invalidation/revocation operations |  |  |
| AUD-LOG-06 | Are audit logs recorded for multi-factor authentication (MFA) verification operations |  |  |

## 3. Permission Change Audit
### Corresponding Standard: Secure Computing Environment 8.1.4.3
| ID | Check Point | Result | Explanation (Evidence Location/Reason for Failure) |
| --- | --- | --- | --- |
| AUD-LOG-07 | Are audit logs recorded for user role/permission assignment and changes (including operator/target user/permissions before and after change) |  |  |
| AUD-LOG-08 | Are audit logs recorded for user account enable/disable/delete operations |  |  |
| AUD-LOG-09 | Are audit logs recorded for administrator privilege grant/revoke operations |  |  |
| AUD-LOG-10 | Are audit logs recorded for permission policy/rule change operations |  |  |

## 4. Data Export Audit
### Corresponding Standard: Secure Computing Environment 8.1.4.3
| ID | Check Point | Result | Explanation (Evidence Location/Reason for Failure) |
| --- | --- | --- | --- |
| AUD-LOG-11 | Are audit logs recorded for data export/download operations (including operator/export data scope/export time) |  |  |
| AUD-LOG-12 | Are audit logs recorded for batch data query/export operations (including query conditions/returned count/time taken) |  |  |
| AUD-LOG-13 | Are audit logs recorded for sensitive data access/view operations |  |  |
| AUD-LOG-14 | Are audit logs recorded for report generation/sending operations |  |  |

## 5. Sensitive Configuration Change Audit
### Corresponding Standard: Secure Computing Environment 8.1.4.3
| ID | Check Point | Result | Explanation (Evidence Location/Reason for Failure) |
| --- | --- | --- | --- |
| AUD-LOG-15 | Are audit logs recorded for system configuration parameter changes (including values before and after change) |  |  |
| AUD-LOG-16 | Are audit logs recorded for security policy/rule changes |  |  |
| AUD-LOG-17 | Are audit logs recorded for API access control policy changes |  |  |
| AUD-LOG-18 | Are audit logs recorded for database connection/data source configuration changes |  |  |

## 6. Critical Business Operation Audit
### Corresponding Standard: Secure Computing Environment 8.1.4.3
| ID | Check Point | Result | Explanation (Evidence Location/Reason for Failure) |
| --- | --- | --- | --- |
| AUD-LOG-19 | Are audit logs recorded for critical business transactions/order operations (including operator/operation type/amount/time) |  |  |
| AUD-LOG-20 | Are audit logs recorded for data deletion operations (physical deletion/logical deletion) |  |  |
| AUD-LOG-21 | Are audit logs recorded for data modification operations (critical field changes) |  |  |
| AUD-LOG-22 | Are audit logs recorded for third-party system/external API call operations |  |  |

## 7. Exception and Security Event Audit
### Corresponding Standard: Secure Computing Environment 8.1.4.3
| ID | Check Point | Result | Explanation (Evidence Location/Reason for Failure) |
| --- | --- | --- | --- |
| AUD-LOG-23 | Are audit logs recorded for system exceptions/error operations (including exception type/stack trace summary) |  |  |
| AUD-LOG-24 | Are audit logs recorded for unauthorized access attempts (horizontal privilege escalation/vertical privilege escalation) |  |  |
| AUD-LOG-25 | Are audit logs recorded for illegal requests/attack behaviors (injection, XSS etc.) |  |  |
| AUD-LOG-26 | Are alert records generated when the audit log process is interrupted/abnormally stopped |  |  |

## 8. Audit Log Protection and Operations
### Corresponding Standard: Secure Computing Environment 8.1.4.3
| ID | Check Point | Result | Explanation (Evidence Location/Reason for Failure) |
| --- | --- | --- | --- |
| AUD-LOG-27 | Is the audit log append-only (cannot be tampered with/deleted) |  |  |
| AUD-LOG-28 | Is access to audit logs controlled (regular users cannot read/write audit logs) |  |  |
| AUD-LOG-29 | Is there a periodic backup strategy for audit logs |  |  |
| AUD-LOG-30 | Are audit log fields complete (timestamp/operator/IP/operation type/operation result) |  |  |
| AUD-LOG-31 | Is the audit log in a structured format (facilitating search and analysis) |  |  |
| AUD-LOG-32 | Does the audit log avoid recording sensitive information (passwords, PINs, complete ID numbers etc. in plaintext) |  |  |

## 9. Remediation Priority
List mandatory remediation items (high risk, clearly violating standard clauses) and recommended improvement items, and provide brief remediation direction.

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
