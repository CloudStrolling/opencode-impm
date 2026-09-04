# Classified Protection Level 3 Code Review Checklist
**Project Name**: **Inspection Date**: **Inspector**: TL **Standard Basis**: GB/T 22239-2019 "Information Security Technology - Baseline for Classified Protection of Cybersecurity" Level 3 Security Requirements

## Usage Instructions
1. This Checklist extracts the clauses directly relevant to software development from the Level 3 security requirements of GB/T 22239-2019, for item-by-item verification during code review.
2. The inspection result of each check item can only take one of three values:
   - Pass: there is evidence in code, configuration, or documentation that the requirement is met;
   - Fail: a non-conformance is found or no evidence is found, and the specific reason for failure must be stated in the description (involving the file location and issue description);
   - Not Applicable: the scenario genuinely does not exist in the current project (e.g., no outsourced development, no collection of personal information), and the reason must be stated in the description.
3. Inspection evidence must provide file paths (including line numbers), configuration locations, or document names.

## 1. Inspection Conclusion Summary
| Category | Number of Check Items | Pass | Fail | Not Applicable |
| --- | --- | --- | --- | --- |
| Development Process Management (in-house/outsourced software development) |  |  |  |  |
| Identity Authentication and Session Management |  |  |  |  |
| Access Control |  |  |  |  |
| Security Auditing |  |  |  |  |
| Intrusion Prevention and Input Security |  |  |  |  |
| Data Security (integrity/confidentiality/backup/remnant information protection) |  |  |  |  |
| Personal Information Protection |  |  |  |  |
| Testing and Acceptance |  |  |  |  |

Overall Conclusion: (All passed / has failing items requiring rectification)

## 2. Development Process Management
### 2.1 In-house Software Development (corresponding standard: Security Construction Management 8.1.9.4)
| ID | Standard Clause | Check Point | Inspection Result | Description (Evidence Location/Failure Reason) |
| --- | --- | --- | --- | --- |
| DEV-01 | The development environment shall be physically separated from the actual operating environment, and test data and test results shall be controlled | Development/test/production environment configuration is separated; test data does not contain un-masked real production sensitive data; test results are managed under control |  |  |
| DEV-02 | A software development management system shall be established, clearly stating the control methods for the development process and the behavioral guidelines for personnel | Whether a development management system document exists (e.g., CONTRIBUTING, development process specification, branch management conventions) and is being followed |  |  |
| DEV-03 | Coding security standards shall be established, requiring developers to write code in accordance with the standards | Whether coding security standards exist and are enforced in the project (input validation, encryption usage, sensitive information handling conventions) |  |  |
| DEV-04 | Software design-related documents and usage guides shall be available, and their use shall be controlled | Whether design documents (SAD/LLD/API) and usage guides are complete and managed under control (stored, versioned) |  |  |
| DEV-05 | Security testing shall be performed during the software development process, and possible malicious code shall be detected before software installation | Security test cases (authentication, injection, privilege escalation, etc.); dependency vulnerability scanning; malicious code detection measures before release/installation |  |  |
| DEV-06 | Modifications, updates, and releases of the program resource library shall be authorized and approved, and strictly version-controlled | Using git and other version control; branch protection/merge review (PR/MR approval); traceable release approval process |  |  |
| DEV-07 | Developers shall be dedicated personnel, and their development activities shall be controlled, monitored, and reviewed | Submission accounts are real and unique, submission records are traceable to individuals; code repository access rights are controlled |  |  |

### 2.2 Outsourced Software Development (corresponding standard: Security Construction Management 8.1.9.5)
| ID | Standard Clause | Check Point | Inspection Result | Description (Evidence Location/Failure Reason) |
| --- | --- | --- | --- | --- |
| OUT-01 | Possible malicious code shall be detected before software delivery | Outsourced deliverables undergo malicious code detection before delivery with records |  |  |
| OUT-02 | The development organization shall provide software design-related documents and usage guides | Outsourced deliverables include design documents and usage guides |  |  |
| OUT-03 | The development organization shall provide the software source code, and the possible backdoors and covert channels in the software shall be reviewed | Outsourced deliverables include source code; the source code has been reviewed or scanned for backdoors and covert channels |  |  |

## 3. Identity Authentication and Session Management
### Corresponding standard: Security Computing Environment 8.1.4.1
| ID | Standard Clause | Check Point | Inspection Result | Description (Evidence Location/Failure Reason) |
| --- | --- | --- | --- | --- |
| AUTH-01 | Logged-in users shall be identified and authenticated; the identity identification shall be unique, and the authentication information shall have complexity requirements and be changed periodically | Unique user identification; password complexity validation and periodic change policy; prohibition of empty and weak passwords |  |  |
| AUTH-02 | Login failure handling shall be provided, such as ending the session, limiting the number of illegal logins, and automatically exiting on login connection timeout | Login failure lockout/limited attempts; session timeout auto-logout configuration |  |  |
| AUTH-03 | Two or more combined authentication technologies shall be used to authenticate users, and at least one shall be implemented using cryptographic technology | Two-factor authentication (e.g., password + SMS/email verification code/OAuth/MFA), enabled at least for system administration users |  |  |
| AUTH-04 | Necessary measures shall be taken to prevent authentication information from being eavesdropped during network transmission | Authentication information is encrypted over HTTPS/TLS; prohibition of transmitting passwords over plaintext HTTP |  |  |

## 4. Access Control
### Corresponding standard: Security Computing Environment 8.1.4.2
| ID | Standard Clause | Check Point | Inspection Result | Description (Evidence Location/Failure Reason) |
| --- | --- | --- | --- | --- |
| ACL-01 | Accounts and permissions shall be assigned to logged-in users | An account and permission management system (RBAC, etc.) exists, and permission assignment has a basis |  |  |
| ACL-02 | Default accounts shall be renamed or deleted, and default passwords of default accounts shall be changed | No default weak-password accounts; no hardcoded accounts/backdoor accounts |  |  |
| ACL-03 | Redundant and expired accounts shall be deleted or deactivated in a timely manner, and shared accounts shall be avoided | No shared accounts; a mechanism exists to clean up redundant/expired accounts |  |  |
| ACL-04 | Management users shall be granted the minimum necessary permissions, and separation of management user permissions shall be achieved | Principle of least privilege; separation of management and business operation permissions (e.g., separation of system administrator and auditor) |  |  |
| ACL-05 | Access control policies shall be configured by authorized subjects, with the granularity of access control reaching the user or process level for subjects and the file or database table level for objects | Server-side enforced authentication; prevention of horizontal and vertical privilege escalation; granularity of access to critical resources reaching user level/table level |  |  |

## 5. Security Auditing
### Corresponding standard: Security Computing Environment 8.1.4.3
| ID | Standard Clause | Check Point | Inspection Result | Description (Evidence Location/Failure Reason) |
| --- | --- | --- | --- | --- |
| AUD-01 | A security auditing function shall be enabled, covering every user, and auditing important user behaviors and important security events | Login/logout, authorization changes, key business operations, and other important events are all recorded |  |  |
| AUD-02 | Audit records shall include the date and time of the event, user, event type, whether the event succeeded, and other audit-related information | Log fields are complete (time, user, event type, result, etc.) |  |  |
| AUD-03 | Audit records shall be protected and backed up periodically to avoid unexpected deletion, modification, or overwriting | Audit logs are tamper-proof (append-only, access control); plaintext sensitive information is not recorded in logs; a backup policy exists |  |  |
| AUD-04 | The audit process shall be protected to prevent unauthorized interruption | The logging/audit process cannot be arbitrarily disabled by ordinary users; abnormal interruption has alerts |  |  |

## 6. Intrusion Prevention and Input Security
### Corresponding standard: Security Computing Environment 8.1.4.4
| ID | Standard Clause | Check Point | Inspection Result | Description (Evidence Location/Failure Reason) |
| --- | --- | --- | --- | --- |
| SEC-01 | A data validity check shall be provided to ensure that content input through the human-machine interface or the communication interface conforms to the system-set requirements | All external input (HTTP parameters, API messages, file uploads, etc.) has server-side validation |  |  |
| SEC-02 | Injection-type attacks shall be prevented (SQL injection, XSS, command injection, path traversal, deserialization, SSRF, etc., falling within the scope of data validity checks and secure coding) | Parameterized queries, output encoding, whitelist validation, and other protective measures are in place |  |  |
| SEC-03 | Possible known vulnerabilities shall be detected, and the system shall only be re-released after patching or other remedial measures | No high-risk known vulnerabilities in third-party dependencies; dependency vulnerability scanning (npm audit/pip-audit/OWASP scanning, etc.) and patching records exist |  |  |
| SEC-04 | Error information security (assessment practice): stack traces, SQL statements, physical paths, and other sensitive information shall not be returned to the client | Global exception handling; debug mode and verbose error output are disabled in production |  |  |
| SEC-05 | The principle of minimal installation shall be followed, installing only necessary components and applications; unnecessary services and high-risk ports shall be closed | Only necessary components, services, and ports are enabled; debug interfaces and management backdoors are disabled |  |  |

## 7. Data Security
### Corresponding standard: Security Computing Environment 8.1.4.7～8.1.4.10
| ID | Standard Clause | Check Point | Inspection Result | Description (Evidence Location/Failure Reason) |
| --- | --- | --- | --- | --- |
| DAT-01 | Verification or cryptographic technology shall be used to ensure the integrity of important data during transmission (authentication data, important business data, important audit data, important configuration data, etc.) | Important data transmission has integrity verification (signature/HMAC/TLS) |  |  |
| DAT-02 | Verification or cryptographic technology shall be used to ensure the integrity of important data during storage | Important data storage has integrity protection (checksum/signature/database constraints) |  |  |
| DAT-03 | Cryptographic technology shall be used to ensure the confidentiality of important data during transmission (authentication data, important business data, and important personal information) | Sensitive data transmission is fully encrypted (TLS); internal service calls do not run plaintext |  |  |
| DAT-04 | Cryptographic technology shall be used to ensure the confidentiality of important data during storage | Passwords are stored with salted slow hashes; sensitive fields are stored encrypted; keys are not hardcoded and not stored in the database |  |  |
| DAT-05 | Local data backup and recovery functions for important data shall be provided; off-site real-time backup shall be provided (where applicable); hot redundancy shall be provided for important data processing systems to ensure high availability | Backup/recovery mechanisms exist (scheduled backup scripts, snapshots, primary-secondary hot standby, etc.) |  |  |
| DAT-06 | The storage space where authentication information resides shall be completely cleared before being released or reallocated; storage space holding sensitive data shall be completely cleared before being released or reallocated | Passwords, tokens, and sensitive data in memory/cache/temporary files are cleared promptly after use and do not remain for a long time |  |  |

## 8. Personal Information Protection
### Corresponding standard: Security Computing Environment 8.1.4.11
| ID | Standard Clause | Check Point | Inspection Result | Description (Evidence Location/Failure Reason) |
| --- | --- | --- | --- | --- |
| PII-01 | Only user personal information necessary for business shall be collected and stored | Collection fields are minimized, with no personal information collection unrelated to business |  |  |
| PII-02 | Unauthorized access and illegal use of user personal information shall be prohibited | Display masking (phone numbers/ID numbers, etc.); query and export have permission control; logs do not leak personal information |  |  |

## 9. Testing and Acceptance
### Corresponding standard: Security Construction Management 8.1.9.7
| ID | Standard Clause | Check Point | Inspection Result | Description (Evidence Location/Failure Reason) |
| --- | --- | --- | --- | --- |
| TEST-01 | A test and acceptance plan shall be formulated, and testing and acceptance shall be carried out according to the plan | A test plan/test case document exists and is executed (unit/integration/regression test records) |  |  |
| TEST-02 | Security testing shall be performed before going live, and a security test report shall be issued | Security testing (penetration testing/vulnerability scanning) was performed before going live and a report exists |  |  |

## 10. Rectification Recommendation Priorities
List items that must be rectified (high risk, clear violation of standard clauses) and recommended improvements, and give brief rectification directions.

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
