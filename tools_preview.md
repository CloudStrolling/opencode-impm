Security/Compliance (Complementary to Existing Tools)

Dependency License Scanning — Scans all third-party packages for open-source license types (MIT/Apache/GPL, etc.), detects license conflicts or compliance risks; critical for commercial projects
SBOM (Software Bill of Materials) Generation — Outputs complete dependency inventory per CycloneDX/SPDX standards, satisfying supply chain security compliance requirements (e.g., classified protection, Xinchuang)

Code Quality
3. Code Complexity Metrics — Scans source code to calculate cyclomatic complexity, function line count, duplication rate, and other metrics; outputs quality report to aid refactoring decisions
4. Dead Code Detection — Scans for unreferenced functions/classes/variables to clean up technical debt

Architecture/DevOps
5. API Documentation Consistency Check — Compares actual code interfaces against API design documents (api.md) to detect documentation drift
6. Dependency Update Detection — Checks all dependencies for new versions, listing upgradeable items and breaking change risks


This is a great direction! The two existing tools (vulnerability scanning + classified protection level-3 check) already cover the **core security compliance** domain. Below is a brainstorm of practical tool plugins organized by the full software project management lifecycle:

---

## I. Code Quality & Standards

| Plugin Name | Description | Value |
|--------|----------|--------|
| **Code Standards Scanner** | Integrates ESLint/Checkstyle/SpotBugs, etc. to automatically detect code style, cyclomatic complexity, and duplicate code | Maintains codebase consistency and reduces maintenance cost |
| **Commit Message Validator** | Checks whether commit messages comply with Conventional Commits specification; auto-links Jira/TAPD tickets | Auto-generates CHANGELOG; traces requirement sources |
| **Code Review Assistant** | Pre-reviews PR/MR automatically based on rules or AI, marks potential issues, suggests reviewers | Reduces manual review burden and improves merge efficiency |
| **Technical Debt Dashboard** | Scans TODO/FIXME/HACK comments; generates debt inventory by priority and file churn | Prevents "temporary solutions" from becoming "permanent solutions" |
| **Code Change Impact Analysis** | Analyzes dependency chains of code changes; auto-marks affected modules, test cases, and interfaces | Precise regression testing; avoids missed tests |

---

## II. Testing & Quality Assurance

| Plugin Name | Description | Value |
|--------|----------|--------|
| **Automated Test Coverage Gate** | Integrates JaCoCo/Istanbul; enforces unit test coverage compliance before PR merge | Prevents coverage regression |
| **API Contract Testing Tool** | Automatically compares Swagger/OpenAPI definitions against actual code implementation | Prevents documentation-code drift |
| **UI Automated Regression Testing** | Integrates Playwright/Cypress; automatically executes critical path screenshot comparison in CI | Captures visual regression issues |
| **Performance Benchmark Testing** | Automatically runs performance benchmarks after each build (response time, memory usage); generates trend charts | Early detection of performance degradation |
| **Flaky Test Detector** | Records test execution history; identifies unstable (intermittent) test cases | Improves CI credibility |

---

## III. Dependencies & Supply Chain Security (Complementary to Existing Tools)

| Plugin Name | Description | Value |
|--------|----------|--------|
| **SBOM Generation & Audit** | Automatically generates software bill of materials; detects dependency license conflicts (GPL/AGPL, etc.) | Open-source compliance; avoids legal risks |
| **Dependency Obsolescence Reminder** | Monitors Maven/NPM/PyPI dependency versions; flags packages with known CVEs or that are deprecated | Proactive upgrades; reduces technical debt |
| **Private Repository Mirror Verification** | Verifies integrity of internal Nexus/Artifactory mirrors (hash/signature) | Prevents supply chain poisoning |
| **Container Image Security Scanning** | Scans Docker image layers; detects base image vulnerabilities and sensitive information leakage | Cloud-native security baseline |

---

## IV. Documentation & Knowledge Management

| Plugin Name | Description | Value |
|--------|----------|--------|
| **API Documentation Auto-Generation** | Automatically generates Swagger/ReDoc documentation from code comments/annotations and syncs to knowledge base | Docs-as-code; reduces maintenance cost |
| **Architecture Decision Record (ADR) Tracking** | Requires ADR submission for major technical changes; links to code changes | Preserves technical decision context |
| **README/CHANGELOG Auto-Generation** | Generates changelogs and release notes automatically from commits and PRs | Reduces manual pre-release preparation work |
| **Code Comment Quality Scoring** | Detects whether public APIs lack documentation comments and parameter descriptions | Improves code maintainability |

---

## V. Performance & Operational Observability

| Plugin Name | Description | Value |
|--------|----------|--------|
| **Resource Consumption Alert** | Monitors build duration, memory usage, disk space; alerts on anomalies | Prevents CI resource abuse |
| **Log Standards Check** | Checks whether code logs contain sensitive information and whether structured logging is used | Security audit + operational friendliness |
| **Health Check Endpoint Generator** | Automatically generates /health, /ready, /metrics endpoint code templates for services | Standardized observability integration |
| **Configuration Drift Detection** | Compares configuration differences across development/testing/production environments; flags potential risks | Prevents "it works on my machine" issues |

---

## VI. Collaboration & Process Governance

| Plugin Name | Description | Value |
|--------|----------|--------|
| **Requirement-Code Traceability Chain** | Requires Commit/PR to link requirement ticket numbers; generates requirement completion reports | Satisfies audit requirements; quantifies delivery efficiency |
| **Code Ownership Mapping** | Generates module responsible person map based on Git Blame and CODEOWNERS | Precise issue accountability |
| **Release Checklist Automation** | Automatically validates before release: tests passed, documentation updated, DB migration scripts, configuration changes | Prevents omission of critical release steps |
| **Work Hours/Efficiency Analysis** | Generates team efficiency reports based on Git activity, PR cycle time, and Review duration | Data-driven process optimization |
| **Multi-Environment Deployment Approval Flow** | Production environment releases require multi-level approval; automatically records approvers and change contents | Compliance + traceability |

---

## VII. Internationalization & Localization

| Plugin Name | Description | Value |
|--------|----------|--------|
| **i18n Completeness Check** | Detects hardcoded Chinese/English in code; compares against multilingual resource files for missing entries | Prevents "bare strings" in the UI |
| **Sensitive/Compliance Word Filtering** | Scans code and content for politically sensitive words and regionally discriminatory language | Content security compliance (essential for overseas markets) |
| **Timezone/Date Format Validation** | Checks whether code hardcodes timezones or date formats; recommends using standard libraries | Globalization quality foundation |

---

## VIII. AI-Assisted Enhancement (Integrated with Orchestration)

| Plugin Name | Description | Value |
|--------|----------|--------|
| **Intelligent Code Summary Generation** | Automatically generates change summaries and potential risk points for PR/MR | Improves review efficiency |
| **Test Case Generator** | Automatically recommends/generates boundary condition test cases based on code changes | Improves test coverage |
| **Fault Root Cause Analysis Assistant** | Combines build failure logs, recent changes, and dependency changes to infer failure root cause | Reduces fault diagnosis time |
| **Code Refactoring Suggestions** | Identifies code smells such as "God class" and "long methods"; provides refactoring plans | Continuous code health |

---

## IX. Compliance & Audit (Extending Existing Classified Protection Tools)

| Plugin Name | Description | Value |
|--------|----------|--------|
| **Data Classification & Grading Marking** | Scans database fields and API parameters in code; auto-marks sensitivity levels (PII/Confidential/Public) | Data Security Law / Personal Information Protection Law compliance |
| **Password Policy Compliance Check** | Detects whether password strength validation, transport encryption, and storage encryption in code meet classified protection/cryptographic assessment requirements | Complements classified protection level-3 check |
| **Operation Audit Log Instrumentation Check** | Checks whether critical operations (login, permission changes, data exports) have audit log records | Classified protection "security audit" control point |
| **Data Cross-Border Compliance Scan** | Detects whether code calls foreign APIs, CDNs, or storage services | Data cross-border security assessment |

---

## X. Recommended Priority Combinations

If resources are limited, recommended batch integration by priority:

| Priority | Plugin Combination | Rationale |
|--------|----------|------|
| **P0 (Do Immediately)** | Code Standards Scanner + Commit Message Validator + SBOM Generation | Low cost, high return, builds team habits |
| **P1 (Do Soon)** | Automated Test Coverage Gate + Dependency Obsolescence Reminder + Requirement-Code Traceability Chain | Quality baseline + supply chain security |
| **P2 (Do Medium-Term)** | Performance Benchmark Testing + Container Image Security Scanning + Data Classification & Grading | Deep security + observability |
| **P3 (Do Long-Term)** | AI-Assisted (Intelligent Summary, Test Generation) + Multi-Environment Deployment Approval Flow | Efficiency improvement + process solidification |

---

On top of the existing "vulnerability scanning + classified protection level-3 check" tools, many more tool plugins can complement the full software project management lifecycle. I'll brainstorm by "development process orchestration" phases, each providing **plugin name + check target + artifacts produced + recommended priority** for you to pick from as needed.

## I. Code & Quality Gate (Adjacent to Existing "Vulnerability Scanning")

### 1. Code Quality & Complexity Check Plugin
- **Check Target**: Cyclomatic complexity, cognitive complexity, duplicate code, code smells, technical debt ratio
- **Underlying Engine**: SonarQube / Qlty (formerly Code Climate) / ESLint / Pylint
- **Artifacts**: Technical debt hours, A-E rating, duplication percentage%, complexity hotspot files
- **Orchestration Timing**: After PR submission / before merge
- **Priority: ★★★★★** (SonarQube is the de facto industry standard; calculates SQALE technical debt ratio and maps to A-E grades)

### 2. AI Code Review Plugin
- **Check Target**: Semantic-level issues in PR diff — null pointer, resource leaks, concurrency bugs, hardcoded keys, business logic risks
- **Underlying Engine**: GitHub Copilot Code Review / CodeRabbit / Sourcery / Semgrep
- **Artifacts**: PR inline comments + summary + improvement suggestions
- **Orchestration Timing**: Auto-triggered on PR creation
- **Priority: ★★★★★** (AI review frees human reviewers from formatting/minor bugs, allowing focus on architecture and business logic)

### 3. Quality Gate Plugin
- **Check Target**: Custom thresholds — coverage ≥80%? Critical defects = 0? Duplication ≤3%? Cyclomatic complexity ≤5?
- **Underlying Engine**: SonarCloud Quality Gate / Jenkins Pipeline Gate
- **Artifacts**: Pass / Fail decision; non-compliance blocks merge
- **Orchestration Timing**: Fixed checkpoint within CI pipeline
- **Priority: ★★★★★** (This is the second layer core of the DevOps "three-layer filter model")

## II. Supply Chain & Security Hardening (Complementary to "Vulnerability Scanning")

### 4. Dependency & SBOM Check Plugin
- **Check Target**: Dependency tree in package.json / pom.xml / go.mod / requirements.txt
- **Underlying Engine**: Syft (generates SBOM) + Grype (scans vulnerabilities) + OWASP Dependency-Check + OWASP Dependency-Track
- **Artifacts**: SBOM in CycloneDX / SPDX format + vulnerability list
- **Orchestration Timing**: Build phase
- **Priority: ★★★★★** (In 2026, SBOM is a mandatory requirement for supply chain security)

### 5. License Compliance Check Plugin
- **Check Target**: License types and compatibility of all open-source dependencies
- **Underlying Engine**: FOSSA / ScanCode / FOSSology / LicenseFinder / SPDX Tool
- **Artifacts**: License inventory + Copyleft conflict alerts (e.g., GPL contagion)
- **Orchestration Timing**: On dependency change / before release
- **Priority: ★★★★☆** (Especially important for domestic government/enterprise and export projects; the Elastic License change incident is a cautionary tale)

### 6. Secret & Sensitive Information Leakage Check Plugin
- **Check Target**: AK/SK, tokens, private keys, passwords in code, config files, and environment variable files
- **Underlying Engine**: Gitleaks / git-secrets / TruffleHog
- **Artifacts**: Leakage locations + risk level
- **Orchestration Timing**: Pre-commit hook / on PR submission (hard gate)
- **Priority: ★★★★★** (Secret scanning is a mandatory hard gate in the minimum viable DevSecOps toolkit)

### 7. Container Image Security Scanning Plugin
- **Check Target**: CVEs in Docker images / base images
- **Underlying Engine**: Trivy / Grype / Snyk Container
- **Artifacts**: Image layer vulnerability report + baseline deviation
- **Orchestration Timing**: After image push to registry
- **Priority: ★★★★☆**

### 8. Infrastructure as Code (IaC) Compliance Check Plugin
- **Check Target**: Terraform / Kubernetes YAML / CloudFormation
- **Underlying Engine**: Checkov / tfsec / OPA (Rego policies)
- **Artifacts**: IaC security policy violation list
- **Orchestration Timing**: IaC change PR
- **Priority: ★★★★☆** (Naturally complements your existing classified protection level-3 check — classified protection checks "policy and configuration baselines"; IaC checks "whether codified infrastructure is compliant")

## III. Testing & Performance

### 9. Test Coverage & Quality Plugin
- **Check Target**: Unit test pass rate, line coverage, branch coverage, mutation testing score
- **Underlying Engine**: JaCoCo / Cobertura / pytest-cov / Jest
- **Artifacts**: Coverage report + uncovered code hotspots
- **Orchestration Timing**: CI test phase
- **Priority: ★★★★☆**

### 10. Performance Regression Check Plugin
- **Check Target**: API response time, concurrency capacity, resource consumption
- **Underlying Engine**: JMeter / k6 / Gatling
- **Artifacts**: Performance baseline comparison + regression alert
- **Orchestration Timing**: Auto-run after pre-production deployment
- **Priority: ★★★☆☆**

### 11. API Contract/Connectivity Check Plugin
- **Check Target**: OpenAPI specification compliance, upstream/downstream interface compatibility
- **Underlying Engine**: Postman / RestAssured / Schemathesis
- **Artifacts**: Contract violation list
- **Orchestration Timing**: Interface change PR
- **Priority: ★★★☆☆**

## IV. Architecture & Technical Debt

### 12. Architecture Debt Analysis Plugin
- **Check Target**: Module coupling, cross-boundary contamination, dependency chain depth, monolith decomposition priority
- **Underlying Engine**: vFunction / NDepend / CAST Highlight
- **Artifacts**: Architecture debt score + modularization recommendations
- **Orchestration Timing**: Major version planning / quarterly health check
- **Priority: ★★★☆☆** (SonarQube cannot see architecture issues above the file level; this type of tool fills the gap)

### 13. Code Hotspot & Behavioral Analysis Plugin
- **Check Target**: Combines git history to identify "which files are both complex and frequently changed"
- **Underlying Engine**: CodeScene
- **Artifacts**: Code Health 1-10 score + hotspot priority
- **Orchestration Timing**: Iteration retrospective
- **Priority: ★★★☆☆**

## V. Project Health & Development Efficiency

### 14. Project Health Check Plugin
- **Check Target**: Schedule variance, budget deviation, risk items, backlog debt, team load
- **Underlying Engine**: Health APIs from ONES / Jira / Asana
- **Artifacts**: Red/Yellow/Green health score + dashboard
- **Orchestration Timing**: Periodic (weekly/bi-weekly) automated inspection
- **Priority: ★★★☆☆**

### 15. Development Efficiency Metrics Plugin
- **Check Target**: DORA four metrics (deployment frequency, change lead time, change failure rate, time to restore) + code equivalent
- **Underlying Engine**: In-house / PingCode / Alibaba Cloud DevOps / Tencent Coding efficiency module
- **Artifacts**: Efficiency trend chart + team benchmarking
- **Priority: ★★★☆☆**

### 16. Documentation & Knowledge Consolidation Check Plugin
- **Check Target**: Whether README, API documentation, Architecture Decision Records (ADR) are complete and in sync with code
- **Underlying Engine**: Swimm / in-house documentation coverage scripts
- **Artifacts**: Documentation gap list
- **Priority: ★★☆☆☆**

## VI. Release & Operational Governance

### 17. Release Gate Plugin
- **Check Target**: Automated release checklist validation — classified protection passed? SBOM available? Artifacts signed? Linked requirements/defects?
- **Underlying Engine**: Argo CD / Spinnaker release gate + custom validation scripts
- **Artifacts**: Go / No-Go decision
- **Orchestration Timing**: Before release window
- **Priority: ★★★★☆**

### 18. Artifact Signing & Integrity Verification Plugin
- **Check Target**: Whether build artifacts are signed and whether signatures are trustworthy
- **Underlying Engine**: cosign / Notary
- **Artifacts**: Signature verification result
- **Orchestration Timing**: After build output + before deployment
- **Priority: ★★★★☆** (Critical link in supply chain attack defense)

### 19. Runtime Drift Detection Plugin
- **Check Target**: Whether production environment configuration/dependencies have deviated from baseline
- **Underlying Engine**: Falco / Cloudaware / Wiz
- **Artifacts**: Drift alert + feedback to next gate policy
- **Priority: ★★★☆☆**

## VII. Recommended Toolset Expansion Priorities

If adding **5 tools** alongside "vulnerability scanning + classified protection level-3 check", I would prioritize:

| Priority | Plugin | Rationale |
|---|---|---|
| 1 | **Code Quality & Complexity Check** | Twin to vulnerability scanning; SonarQube is essentially a standard |
| 2 | **AI Code Review** | Low adoption cost for domestic teams; immediate PR experience improvement |
| 3 | **Dependency & SBOM Check** | "Supply chain security" is a mandatory check item in classified protection level-3; SBOM is the foundation |
| 4 | **Secret Leakage Check** | Pre-commit hard gate; extremely low cost with extremely high return |
| 5 | **Quality Gate** | Aggregates all preceding check results into a single Pass/Fail decision |

These 5 plus your existing 2 form the **DevSecOps Minimum Viable Toolkit**: local/commit layer (secret scanning) → CI gate layer (code quality + AI review + SBOM + vulnerability + classified protection) → release gate layer (quality gate).

> 💡 A note on orchestration: **Don't make all checks "blocking hard gates."** DevSecOps best practice is to only hard-block on "secret leakage, unsigned artifacts, critical policy violations," while the rest (elevated complexity, insufficient coverage, technical debt) use "soft gates + routing to owners + SLA follow-up." Otherwise, the orchestration plugin becomes a shackle for developers and gets bypassed or abandoned.

Would you like me to detail the **specific implementation approach in the opencode plugin** for any of these (e.g., "AI Code Review Plugin" or "SBOM + License Compliance Plugin") — including which engine to call, what inputs, what structured output, and how to correlate with classified protection level-3 check results? This would help you implement faster.

---

# Software Project Management Practical Tool Plugins — Brainstorm

Based on your existing "vulnerability scanning" and "classified protection level-3 check," I'm expanding recommendations across multiple dimensions:

---

## 🔒 I. Security & Compliance (Same Family as Existing Tools)

| Tool | Description |
|------|------|
| **Sensitive Information Leakage Detection** | Scans code for hardcoded keys, tokens, passwords, internal IPs, etc. |
| **Open-Source License Compliance Check** | Detects whether dependency licenses are compatible with the project (GPL contamination, etc.) |
| **Dependency Vulnerability Scanning (SCA)** | Checks third-party components for known CVE vulnerabilities |
| **Personal Information Protection Compliance Check** | Benchmarks against Personal Information Protection Law / GDPR; checks whether data collection, storage, and transmission are compliant |
| **Cryptographic Algorithm Compliance Check** | Checks whether domestic cryptographic algorithms (SM2/SM3/SM4) are used; detects legacy weak algorithms (MD5, DES) |

---

## 📐 II. Code Quality

| Tool | Description |
|------|------|
| **Code Standards Check (Lint)** | Checks coding style per team/industry standards |
| **Code Complexity Analysis** | Alerts on cyclomatic complexity and cognitive complexity exceeding thresholds |
| **Code Duplication Detection** | Identifies copy-paste code; suggests refactoring |
| **Unit Test Coverage Check** | Sets thresholds; blocks pipeline when below threshold |
| **Technical Debt Assessment** | Comprehensive evaluation of code smells; outputs debt report |

---

## 📋 III. Project Management & Process

| Tool | Description |
|------|------|
| **Requirement-Code Traceability Check** | Checks whether each commit/PR links to a requirement or defect ticket |
| **Change Impact Analysis** | Automatically analyzes impact scope of code changes; aids regression testing decisions |
| **Release Checklist Check** | Pre-release automated validation: documentation, test reports, approvals, rollback plans in place |
| **Version Number Standard Check** | Validates SemVer compliance and CHANGELOG updates |
| **Milestone/Checkpoint Check** | Process orchestration stage gates (e.g., cannot enter UAT without passing security scan) |

---

## 🚀 IV. DevOps / Delivery

| Tool | Description |
|------|------|
| **Build Artifact Consistency Check** | Validates build artifact hash and signatures; prevents tampering |
| **Configuration Drift Detection** | Compares configuration differences across environments; prevents "it works on my machine" |
| **Container Image Security Scanning** | Checks Docker images for vulnerabilities and base image compliance |
| **Deployment Rollback Plan Check** | Verifies whether an executable rollback strategy exists |
| **Database Change Review** | Checks SQL scripts for table locking risks and rollback capability |

---

## 📝 V. Documentation & Collaboration

| Tool | Description |
|------|------|
| **API Documentation Consistency Check** | Compares code interfaces against documentation for synchronization |
| **CHANGELOG Auto-Generation** | Generates changelog automatically from commits |
| **Commit Standards Check (Commit Lint)** | Validates commit messages against Conventional Commits |
| **Code Review Quality Check** | Checks whether PRs have sufficient reviewers and linked tests |

---

## 📊 VI. Metrics & Reporting

| Tool | Description |
|------|------|
| **Project Health Dashboard** | Generates health score combining bug rate, coverage, complexity, security vulnerabilities, etc. |
| **Development Efficiency Metrics** | DORA metrics such as requirement delivery cycle, defect fix time, deployment frequency |
| **Risk Early Warning Report** | Predicts potential delays/quality risks based on trends |

---

## 💡 Priority Recommendations

For quick implementation with high value, recommended first:

1. **Sensitive Information Leakage Detection** — Naturally pairs with existing security toolkit; low implementation cost
2. **Release Checklist Check** — Very practical in process orchestration scenarios; prevents "going live with issues"
3. **Requirement-Code Traceability Check** — Directly supports both audit and classified protection requirements
4. **Database Change Review** — High-incident area in production; high checkpoint value
5. **Commit Standards Check** — Extremely low cost with immediate results

---

Would you like me to elaborate on the detailed design approach for any specific tool?
