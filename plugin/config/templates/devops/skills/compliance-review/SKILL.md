---
name: compliance-review
description: >-
  Review code and infrastructure for compliance with regulatory frameworks (GDPR, SOC2, HIPAA, PCI-DSS).
  Triggers on 'compliance check', 'GDPR review', 'SOC2 audit', 'PII scan', 'regulatory review'.
  NOT for general security scanning (use security-auditor) or code quality (use code-scanning).
allowed-tools: Read, Grep, Bash
---

## When to Use
- Reviewing code that handles PII, PHI, or payment data
- Preparing for SOC2, HIPAA, or PCI-DSS audits
- Checking data retention, encryption, and access control implementations
- Verifying audit logging and consent management

## When NOT to Use
- General security vulnerability scanning -- use `security-auditor`
- Code quality or pattern analysis -- use `code-scanning`
- Fixing compliance issues -- use `code-fixing`
- Runtime monitoring -- use `monitoring`

## Default Compliance Frameworks

Apply these frameworks by default unless the user specifies otherwise:
- **GDPR/CCPA** -- Data privacy: PII handling, consent, right to deletion, data minimization
- **SOC2** -- Security controls: access control, encryption, audit logging, incident response
- **Internal best practices** -- Secret management, environment variable usage, .gitignore hygiene

Apply these additional frameworks only when explicitly requested or when the codebase clearly handles the relevant data:
- **HIPAA** -- Healthcare: PHI protection, access logging, encryption, BAA requirements
- **PCI-DSS** -- Payment: cardholder data protection, network segmentation, vulnerability management

## Instructions

### 1. Identify data handling patterns

Use `Grep` to search for PII and sensitive data patterns:
```bash
# PII patterns
grep -rn "ssn\|social.security\|date.of.birth\|email.*address" --include="*.{js,ts,py,go,java}" .

# Payment data
grep -rn "credit.card\|card.number\|cvv\|cardholder" --include="*.{js,ts,py,go,java}" .

# Healthcare data (if HIPAA applies)
grep -rn "patient\|diagnosis\|medical.record\|health.info" --include="*.{js,ts,py,go,java}" .
```

### 2. Check encryption and data protection

Use `Grep` to verify encryption usage:
- Data at rest: check for encryption of stored PII/PHI
- Data in transit: verify HTTPS enforcement, TLS configuration
- Secrets: confirm no hardcoded credentials, proper use of environment variables

### 3. Verify access controls

Use `Read` and `Grep` to check:
- RBAC implementation on sensitive endpoints
- Authentication middleware on data-access routes
- Principle of least privilege in service accounts

### 4. Check audit logging

Verify that sensitive operations are logged:
- Data access and modification events
- Authentication events (login, logout, failed attempts)
- Administrative actions

### 5. Check data retention and deletion

Look for data retention policies and deletion mechanisms:
- Automated data expiry or cleanup
- User data deletion endpoints (right to be forgotten)
- Backup retention policies

## Output

```
## Compliance Review Report

### Frameworks Applied
| Framework | Status | Issues |
|-----------|--------|--------|
| GDPR | PASS/FAIL | X |
| SOC2 | PASS/FAIL | X |
| Internal | PASS/FAIL | X |

### Findings
| # | Severity | Framework | Issue | Location |
|---|----------|-----------|-------|----------|
| 1 | HIGH | GDPR | Unencrypted PII storage | models/user.js:25 |

### Checklist
- [ ] PII encrypted at rest
- [ ] PII encrypted in transit
- [ ] Access controls on sensitive data
- [ ] Audit logging for data operations
- [ ] Data retention policy implemented
- [ ] Deletion mechanism available
- [ ] No hardcoded secrets

### Required Remediations
1. [Issue] -- [specific remediation steps]

### Verdict
[APPROVED / REMEDIATE / BLOCK] - [reason]
```
