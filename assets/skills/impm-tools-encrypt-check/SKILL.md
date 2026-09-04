---
name: impm-tools-encrypt-check
description: Check cryptographic algorithm compliance in project code and configurations, verify whether SM algorithms (SM2/SM3/SM4) are used, detect residual weak algorithms (MD5, DES, 3DES, RC4, SHA-1, etc.), and output a cryptographic algorithm compliance check report
---

# impm-tools-encrypt-check Skill

## Trigger Words
cryptographic algorithm compliance, SM algorithms, SM2, SM3, SM4, weak algorithms, MD5, DES, SHA-1, encryption algorithm check, crypto assessment, encrypt check, crypto compliance, tools-encrypt-check

## When to Use
Use when a cryptographic algorithm compliance check is needed for the current project, to verify whether the encryption/hashing/signing algorithms used in code and configurations comply with SM algorithm compliance requirements (using SM2/SM3/SM4 and other SM algorithms), and to detect whether residual weak algorithms such as MD5, DES, 3DES, RC4, SHA-1 are present. Can be executed independently, or appended after Phase 4 code review. Complements classified protection level-3 (impm-cpc-level3) and secrets leak detection (impm-tools-secrets-scanning).

## Execution Role
This skill is executed by a Technical Lead (subagent_type=tl) subagent, using the Skill tool to load this skill.

## Scheduling Instructions (Must be followed by PM/orchestrator when launching this skill)
1. Launch method: Use the task tool to launch a subagent with subagent_type set to `tl`; the PM or orchestrator must not execute the skill content themselves.
2. Required context in the prompt (all mandatory): absolute path of the project root directory (projectRoot), project English abbreviation ({Project English Abbreviation}), original user input $ARGUMENTS (including file paths mentioned by the user), skill name (impm-tools-encrypt-check, requiring the subagent to load this skill via the Skill tool before executing).
3. Completion requirement: Wait for the subagent to return completion, verify the check report has been generated and is complete, and only terminate after all is correct.

## Key Variable Definitions and Values
| Variable | Description | How to Obtain |
|---|---|---|
| Project Chinese Name | The project's Chinese name | Read from docs/project.md via impm_project_info |
| Project English Abbreviation | The project's English abbreviation, used for constructing report paths | Read from docs/project.md via impm_project_info |
| Check Rule Template | Cryptographic algorithm compliance check rule list and report template | Read via impm_template_reader using TOOLS-ENCRYPT-CHECK-TEMPLATE.MD |

## Algorithm Compliance Assessment Framework
> This check is based on the Cryptography Law of the PRC, GB/T 39786-2021 "Information Security Technology - Basic Requirements for Cryptographic Application of Information Systems", GB/T 32905-2016 (SM3), GB/T 32907-2016 (SM4), GB/T 32918-2016 (SM2) and other cryptographic assessment standards.

| Category | Algorithm | Verdict | Description |
|---|---|---|---|
| SM Public Algorithms | SM2 (asymmetric/signing/key exchange), SM3 (hash), SM4 (symmetric block) | ✅ Compliant | Recommended SM algorithms, meeting cryptographic assessment requirements |
| SM1, SM9 | SM Algorithms | ✅ Compliant (Notice) | SM1/SM9 require hardware cryptographic modules or dedicated cryptographic machines |
| Strong Algorithms (International) | AES-256, AES-128, RSA-2048+, SHA-256, SHA-384, SHA-512, ECDSA, Ed25519, HMAC-SHA256, PBKDF2, bcrypt, scrypt, Argon2, etc. | ✅ Compliant (Optional Alternative) | Sufficient technical strength, can serve as transitional solutions, but cryptographic assessment favors SM algorithms |
| Weak Hash/Deprecated Hash | MD5, SHA-1, SHA0, MD2, MD4 (used in security contexts) | ⚠️ Medium/High Risk | Collision attacks exist; prohibited for signing/password storage and other security contexts; downgraded to notice for checksum/compatibility non-security contexts |
| Weak Symmetric Encryption | DES, 3DES (used for encryption), RC4, Blowfish, IDEA, TEA/XTEA, etc. | 🔴 High Risk | Confirmed insecure; prohibited for data encryption/transport protection |
| Recoverable/Insecure Keys | RSA-1024, DSA-1024, RC2, Skipjack | 🔴 High Risk | Insufficient key strength or deprecated algorithms |
| Insecure Random Numbers | Math.random(), rand() (non-cryptographically secure) used in security contexts | ⚠️ Medium Risk | Must use CSPRNG (crypto.getRandomValues, SecureRandom, etc.) |

## Cross-Language Common Algorithm API Mapping Table
> Used to guide cross-language regex scanning and manual review, identifying call names and their categories.

| Algorithm | Python | Java | Node.js/JS | Go | C#/.NET | C/C++ |
|---|---|---|---|---|---|---|
| MD5 | hashlib.md5 | MessageDigest.getInstance("MD5") | crypto.createHash('md5') / md5 | crypto/md5.Sum | MD5.Create() | MD5() / md5 |
| SHA-1 | hashlib.sha1 | MessageDigest.getInstance("SHA-1") | crypto.createHash('sha1') | crypto/sha1.Sum | SHA1.Create() | SHA1() |
| SHA-256 | hashlib.sha256 | MessageDigest.getInstance("SHA-256") | crypto.createHash('sha256') | crypto/sha256.Sum256 | SHA256.Create() | SHA256() |
| SM3 | gmssl.sm3 / pysmx | BouncyCastle SM3Digest | sm-crypto sm3 | tjfoc/gmsm/sm3 | BouncyCastle SM3 | gmssl SM3() |
| DES | pyDes / Crypto.Cipher.DES | Cipher.getInstance("DES") | crypto.createCipheriv('des-') | crypto/des / tjfoc sm1 | DESCryptoServiceProvider | DES_cbc |
| 3DES | Crypto.Cipher.DES3 | Cipher.getInstance("DESede") | crypto.createCipheriv('des-ede3') | crypto/des.NewTripleDES | TripleDES | DES_ede3 |
| RC4 | Crypto.Cipher.ARC4 | Cipher.getInstance("RC4") | crypto.createCipheriv('rc4') | RC4 | RC4CryptoServiceProvider | RC4 |
| AES | Crypto.Cipher.AES | Cipher.getInstance("AES") | crypto.createCipheriv('aes-') | crypto/aes | Aes.Create() | AES_xxx |
| SM4 | gmssl.sm4 / pysmx | BouncyCastle SM4Engine | sm-crypto sm4 / @antv | tjfoc/gmsm/sm4 | BouncyCastle SM4 | SM4() |
| RSA | rsa / cryptography | Cipher.getInstance("RSA") | crypto.publicEncrypt | crypto/rsa | RSACryptoServiceProvider | RSA |
| SM2 | gmssl.sm2 | BouncyCastle SM2 | sm-crypto sm2 | tjfoc/gmsm/sm2 | BouncyCastle SM2 | gmssl SM2() |
| HMAC | hmac / hashlib | Mac.getInstance("HmacSHA256") | crypto.createHmac('sha256') | crypto/hmac | HMACSHA256 | HMAC() |
| Random | random / secrets | new Random() | Math.random() | math/rand | new Random() | rand() |

## Execution Requirements
1. Execute strictly in the content and order of the execution steps: no skipping, no reordering, no parallelizing, no merging of any steps.
2. This skill is read-only exploration: only read code, configurations, and dependency lists; do not modify any code, configurations, or other documents.
3. Risk levels for findings can only take four values: High, Medium, Low, Notice; each finding must have actual matching evidence (algorithm call code snippets); speculation or fabrication is prohibited.
4. The check target is the actual algorithm calls and usage contexts in code; determine whether an algorithm is used in a "security context" (such as password storage, data encryption, signing, random number key generation) based on context. Mechanical determination based solely on API names is not allowed:
   - MD5/SHA-1 used in **non-security contexts** (file checksums, idempotency/deduplication hashing, cache keys, shard identifiers) are downgraded to "Notice" or "Low" with the context noted.
   - MD5/SHA-1 used in **security contexts** (password storage, message signing, certificate fingerprint verification) are marked as "High" or "Medium".
5. Weak algorithm findings must specify the exact file path, line number, algorithm call code snippet, and usage context analysis.
6. All document paths must use {Project English Abbreviation} for construction; filenames must not be fabricated.
7. Use impm_* tools to obtain information; tool return results must not be fabricated.
8. Use English throughout.

## Execution Steps
### Step 1: Obtain Project Information and Determine Check Scope
1. Call impm_project_info to read docs/project.md and obtain the project Chinese name and project English abbreviation; if docs/project.md does not exist (project not initialized), terminate this skill and prompt to execute /impm-init first to complete initialization.
2. Based on the project map, code language, and structure from docs/project.md, determine the check scope for this run: source code directories, encryption/security-related utility classes, algorithm parameters in configuration files (such as cipher names, digest names in cryptographic algorithms).
3. Determine the exclusion directory list (must exclude): node_modules, .git, dist, build, vendor, __pycache__, .next, .nuxt, target, bin, obj and other build/dependency artifact directories.
4. Determine the project's primary language and related ecosystem, as the basis for subsequent scan focus and "Algorithm API Mapping Table" selection.

### Step 2: Read Check Rule Template
1. Call impm_template_reader (templateName=TOOLS-ENCRYPT-CHECK-TEMPLATE.MD) to read the full template, obtaining the report format and check rule list.

### Step 3: Scan by Algorithm Category
1. Scan each category from the "Algorithm Compliance Assessment Framework" using the Grep tool with regex patterns within the check scope:
   - **SM Algorithms (Positive Scan)**: SM2 / SM3 / SM4 (including algorithm constants like "SM2", "SM3", "SM4", 'sm4', SM4Engine, sm-crypto, pysmx, gmssl, tjfoc/gmsm, etc.), confirming existence and usage context.
   - **Weak Hash (Negative Scan)**: MD5, SHA-1 (sha1), MD2, MD4, SHA0, etc., distinguishing security/non-security contexts.
   - **Weak Symmetric Encryption (Negative Scan)**: DES, 3DES (desede/triple DES), RC4, RC2, Blowfish, IDEA, TEA/XTEA, etc.
   - **Short Keys (Negative Scan)**: RSA-1024, DSA-1024 and other insufficient key strength usage.
   - **Insecure Random Numbers (Negative Scan)**: Use of Math.random(), random, rand() and other non-CSPRNG for key/IV/salt/token generation in security contexts.
   - **Strong Algorithms (Transitional Check)**: AES, RSA-2048+, SHA-256, etc., recorded as compliance baseline information.
2. For each match record: file path, line number, algorithm call code snippet, algorithm category, usage context.
3. False positive exclusion:
   - Skip dependency directories like node_modules.
   - Skip algorithm names in comments, string literals, and documentation examples that are not actual calls.
   - Skip algorithm calls in test directories used to construct test data (but if test data represents production behavior, retain and note).

### Step 4: Usage Context and Risk Level Determination
1. For each match, determine the usage context based on context:
   - **Security Context**: password/passphrase storage, message signing, data encryption/decryption, key negotiation, random number generation for keys/IVs/salts/tokens, certificate fingerprint verification.
   - **Non-Security Context**: file checksums, idempotency/deduplication, cache keys, object shard identifiers, compatibility demos.
2. Determine risk level based on the "Algorithm Compliance Assessment Framework" and context:
   - **High**: Weak algorithms used in security contexts (MD5/SHA-1 password storage, DES/3DES/RC4 data encryption, RSA-1024 signing/encryption, Math.random generating keys) or use of deprecated insecure algorithms.
   - **Medium**: Weak algorithms used in semi-security/transitional contexts (e.g., SHA-1 certificate fingerprints, weak random numbers for non-key purposes).
   - **Low**: Weak algorithms used in clear non-security contexts (e.g., MD5 file checksums, deduplication hashing), with no security impact.
   - **Notice**: Strong algorithms (AES/RSA-2048/SHA-256) present as transitional solutions but replaceable with SM algorithms; SM1/SM9 require hardware support; no SM algorithm usage found.
3. Each finding must include context analysis and judgment rationale; mechanical classification by algorithm name is prohibited.

### Step 5: SM Algorithm Coverage Assessment
1. Count the actual usage locations and contexts of SM algorithms (SM2/SM3/SM4) in the code.
2. Based on project functionality (login authentication, data storage encryption, communication transport, digital signatures, etc.), provide an SM algorithm coverage assessment (Full Coverage / Partial Coverage / Not Covered).
3. For scenarios using international strong algorithms but not SM algorithms, mark as "Transitional Solution Replaceable" and provide replacement suggestions (e.g., AES→SM4, SHA-256→SM3, RSA/ECDSA→SM2).

### Step 6: Generate Check Report
1. Organize the check report strictly according to the TOOLS-ENCRYPT-CHECK-TEMPLATE.MD format:
   - Header information (project name, check date, checker=TL, tool basis).
   - Check conclusion summary table (findings count by algorithm category and risk level, including SM algorithm usage status).
   - Check scope description.
   - Algorithm usage list (positive scan: algorithms used, their contexts, and risk levels).
   - Weak algorithm and compliance issue detail table (each finding includes: ID, rule ID, algorithm, risk level, file path, line number, code snippet, context analysis, and remediation suggestion).
   - SM algorithm coverage assessment.
   - Remediation suggestion priority (grouped by High/Medium/Low).
2. Use the Write tool, following the license-check report path rules to determine the write location: use impm_version action=current to check if a version directory exists; if it exists (e.g., docs/{Project English Abbreviation}-v{version}/), write to that version directory, otherwise write to the docs root directory. The report filename is fixed as `{Project English Abbreviation}-encrypt-check.md`.
3. Verify the file exists and content is complete: summary statistics and detail counts match, each finding contains the necessary path, line number, code snippet, context analysis, and remediation suggestion.

### Step 7: Summary and Report
1. Count the findings and risk level distribution for each algorithm category (SM/international strong/weak algorithms).
2. If high-risk findings exist, highlight and list the top 3 most critical findings at the end of the report; if no SM algorithms are used at all but the project requires cryptographic assessment, clearly state the necessity of SM algorithm migration.

## Deliverables
- docs/{Project English Abbreviation}-encrypt-check.md (Cryptographic Algorithm Compliance Check Report)

## Post-Completion Instructions
- After all operations of this skill are complete, must immediately terminate and return to the orchestrator (report path, algorithm usage statistics summary, and high-risk items summary); continuing to execute other skills independently is strictly prohibited.
- If running as a standalone command, report to the user: report location, algorithm usage statistics (SM/international strong/weak algorithm counts), risk level distribution, weak algorithm residual details and remediation suggestions, SM algorithm coverage assessment and remediation suggestions.

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
