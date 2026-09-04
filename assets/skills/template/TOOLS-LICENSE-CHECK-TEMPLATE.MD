# {Project Chinese Name} Open Source License Compliance Check Report

## 1. Exploration Overview

| Item | Content |
|---|---|
| Project Name | {Project Chinese Name} ({Project English Abbreviation}) |
| Exploration Date | {YYYY-MM-DD} |
| Explorer | TL (Technical Lead) |
| Project's Own License | {License type identified from the project's LICENSE file, e.g., MIT, Apache-2.0; if no LICENSE file found, fill "Not Declared"} |
| Dependency Files | {List of detected dependency files, e.g., package.json, requirements.txt, comma-separated} |
| Total Packages Scanned | {N} |
| Direct Dependencies | {N1} |
| Transitive Dependencies | {N2} |

## 2. License Classification Statistics

| License Category | Package Count | Percentage | Risk Level | Typical Licenses |
|---|---|---|---|---|
| Permissive | {n1} | {p1}% | No Risk | MIT, BSD, Apache-2.0, ISC |
| Weak Copyleft | {n2} | {p2}% | Low Risk | LGPL, MPL-2.0, EPL |
| Strong Copyleft | {n3} | {p3}% | High Risk | GPL, AGPL |
| Commercial Restriction | {n4} | {p4}% | High Risk | SSPL, BSL, BUSL |
| Unidentified | {n5} | {p5}% | Medium Risk | Unable to Determine |
| **Total** | **{N}** | **100%** | — | — |

## 3. Dependency License Details

### Permissive (Total {n1} packages)

| Package Name | Ecosystem | Version | License | Dependency Type | Acquisition Method |
|---|---|---|---|---|---|
| {Package Name} | {Ecosystem} | {Version} | {SPDX License Identifier} | Direct/Transitive | Local/API |
| ... | ... | ... | ... | ... | ... |

### Weak Copyleft (Total {n2} packages)

| Package Name | Ecosystem | Version | License | Dependency Type | Acquisition Method | Notes |
|---|---|---|---|---|---|---|
| {Package Name} | {Ecosystem} | {Version} | {SPDX License Identifier} | Direct/Translicative | Local/API | {Dynamic linking does not require open-sourcing; static linking requires open-sourcing the library} |
| ... | ... | ... | ... | ... | ... | ... |

### Strong Copyleft (Total {n3} packages)

| Package Name | Ecosystem | Version | License | Dependency Type | Acquisition Method | Copyleft Scope |
|---|---|---|---|---|---|---|
| {Package Name} | {Ecosystem} | {Version} | {SPDX License Identifier} | Direct/Transitive | Local/API | {GPL requires the entire work to be open-sourced under GPL; AGPL requires network interactions to be open-sourced} |
| ... | ... | ... | ... | ... | ... | ... |

### Commercial Restriction (Total {n4} packages)

| Package Name | Ecosystem | Version | License | Dependency Type | Acquisition Method | Commercial Restriction Description |
|---|---|---|---|---|---|---|
| {Package Name} | {Ecosystem} | {Version} | {SPDX License Identifier} | Direct/Transitive | Local/API | {SSPL requires providing full service source code; BSL has usage restriction period} |
| ... | ... | ... | ... | ... | ... | ... |

### Unidentified (Total {n5} packages)

| Package Name | Ecosystem | Version | License (Raw) | Dependency Type | Acquisition Method | Reason for Unidentified |
|---|---|---|---|---|---|---|
| {Package Name} | {Ecosystem} | {Version} | {Raw license field value or "Empty"} | Direct/Transitive | Local/API | {Field is empty / Non-standard format / API did not return} |
| ... | ... | ... | ... | ... | ... | ... |

## 4. Copyleft Contamination Conflict Detection

### Project License Baseline

| Item | Content |
|---|---|
| Project's Own License | {MIT / Apache-2.0 / GPL-3.0 / Not Declared etc.} |
| Is Copyleft License | {Yes / No} |

### Conflict Detection Results

{If no conflicts, fill in:}

> This check found no Copyleft contamination conflicts. All dependency licenses are compatible with the project's own license.

{If conflicts exist, fill in the conflict details table:}

| No. | Conflicting Dependency | Version | License | Dependency Type | Conflict Type | Impact Scope | Severity |
|---|---|---|---|---|---|---|---|
| CONFLICT-001 | {Package Name} | {Version} | {GPL-3.0} | Direct/Transitive | {Contamination Conflict / Version Incompatibility / Conditional Conflict} | {If direct dependency, affects entire project; if transitive dependency, affects the module that imports it} | High/Medium/Low |
| ... | ... | ... | ... | ... | ... | ... | ... |

### Conflict Type Description

| Conflict Type | Description |
|---|---|
| Contamination Conflict | Project uses a non-Copyleft license but has GPL/AGPL in dependencies, requiring the entire project to be open-sourced under GPL/AGPL |
| Version Incompatibility | Project uses a specific version of GPL but dependencies use a higher version or AGPL, causing version incompatibility |
| Conditional Conflict | LGPL/MPL dependency is statically linked, requiring Copyleft conditions to be met (open-sourcing the library source code) |

### Conflict Remediation Suggestions

{Provide specific remediation suggestions for each conflicting dependency, examples as follows:}

- **CONFLICT-001**: `{Package Name}` is licensed under GPL-3.0, conflicting with the project's MIT license.
  - Option 1: Find an equivalent alternative package (recommended; check if there is an MIT/Apache-licensed alternative).
  - Option 2: Change the project's license to GPL-3.0 (requires evaluating commercial impact).
  - Option 3: Change the dependency to dynamic linking/independent process invocation to reduce contamination scope (only applicable to weak Copyleft).

## 5. Exploration Conclusions and Recommendations

### Conclusions

This open source license compliance check scanned {N} third-party dependency packages, of which:
- Permissive licenses: {n1} ({p1}%), no compliance risk;
- Weak Copyleft: {n2} ({p2}%), linking method must be noted;
- Strong Copyleft: {n3} ({p3}%), contamination conflict risk exists;
- Commercial Restriction: {n4} ({p4}%), commercial usage restrictions exist;
- Unidentified: {n5} ({p5}%), manual confirmation required.

{Overall compliance assessment: No risk / High-risk items requiring immediate action / Medium-low risk items recommended for improvement}

### Recommendations

{Provide recommendations based on check results, examples as follows:}

- **High Risk (Must Handle Immediately)**:
  - If strong Copyleft contamination conflicts exist, immediately find alternative packages or adjust the project's license to a compatible type.
  - If direct dependencies with commercial restriction licenses exist, evaluate commercial usage scenarios and find alternatives.
- **Medium Risk (Recommended to Handle Soon)**:
  - For packages with unidentified licenses, manually confirm the license type and assess compliance risk.
  - For weak Copyleft dependencies, confirm the linking method (dynamic vs. static) and satisfy license conditions.
- **Low Risk (Recommended for Improvement)**:
  - Periodically (recommended monthly) perform license compliance checks to track dependency changes.
  - Integrate license checking tools into CI/CD (e.g., license-checker, pip-licenses) for automated checking.
  - Maintain a whitelist and blacklist of permitted/prohibited licenses for the project.

---

> This report is automatically generated by the impm-tools-license-check skill. License data is sourced from local dependency metadata and ClearlyDefined.io public API. This report only reflects the license declaration status at the time of scanning and does not constitute legal advice. For legal-level compliance confirmation, please consult a professional legal advisor.

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
