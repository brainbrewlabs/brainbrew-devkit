---
name: security-auditor
description: >-
  Scan code for security vulnerabilities against OWASP Top 10 and common insecure patterns.
  Triggers on 'security audit', 'check for vulnerabilities', 'scan for secrets', 'OWASP check'.
  NOT for compliance framework reviews (use compliance-review) or runtime alert handling (use alert-handling).
allowed-tools: Read, Grep, Bash
---

## When to Use
- Reviewing code changes that touch auth, API, or database layers
- Before deployments or commits to check for vulnerabilities
- When dependency files change (package.json, requirements.txt, go.mod)
- When user asks about security, vulnerabilities, or secret exposure

## When NOT to Use
- Compliance framework audits (GDPR, SOC2, HIPAA) -- use `compliance-review`
- Handling runtime alerts or incidents -- use `alert-handling`
- Fixing identified vulnerabilities -- use `code-fixing`
- Performance or load testing -- use `performance-analysis`

## Instructions

### 1. Identify scan scope

Determine which files changed or which scope the user wants scanned. Use `Grep` and `Read` to inspect relevant files.

### 2. Scan for OWASP Top 10 patterns

Search for these vulnerability classes:

**SQL Injection** -- string-concatenated queries, unsanitized user input in SQL:
```bash
# Search for string interpolation in SQL contexts
```

**XSS** -- innerHTML assignments, unsanitized template rendering, dangerouslySetInnerHTML.

**Authentication issues** -- hardcoded JWT secrets, weak password storage, missing MFA checks.

**Sensitive data exposure** -- hardcoded passwords, API keys, connection strings in source code.

**Broken access control** -- endpoints missing auth middleware, missing ownership checks.

### 3. Scan for secrets

Search for hardcoded credentials, API keys, tokens, and private keys using `Grep`:
- Patterns: `password =`, `secret =`, `api_key`, `sk_live_`, `-----BEGIN.*KEY-----`
- Check `.env` files are in `.gitignore`

### 4. Run dependency audit

Run the appropriate package audit command via `Bash`:
```bash
# Node.js: npm audit
# Python: pip-audit
# Go: govulncheck ./...
```

### 5. Classify findings by severity

- **CRITICAL**: Exploitable vulnerabilities (injection, exposed secrets, auth bypass)
- **HIGH**: Security weaknesses that need prompt attention (weak crypto, missing HTTPS)
- **MEDIUM**: Potential issues worth investigating (permissive CORS, verbose errors)
- **LOW**: Best practice improvements (missing security headers, logging gaps)

## Output

```
## Security Audit Report

### Severity Summary
- CRITICAL: X
- HIGH: X
- MEDIUM: X
- LOW: X

### Findings
| # | Severity | Type | Location | Description | Remediation |
|---|----------|------|----------|-------------|-------------|
| 1 | CRITICAL | SQLi | file.js:42 | String-concatenated query | Use parameterized queries |

### Dependency Audit
- [output from npm audit / pip-audit / govulncheck]

### Verdict
[PASS / FAIL] - [reason]
```
