---
name: code-fixing
description: >-
  Fix code issues identified by code-scanning, security-auditor, or linter output.
  Triggers on 'fix these issues', 'apply fixes', 'fix vulnerabilities', 'fix lint errors'.
  NOT for writing new features or refactoring -- only fix identified issues.
allowed-tools: Read, Edit, Write, Bash
---

## When to Use
- Applying fixes for issues found by `code-scanning` or `security-auditor`
- Fixing linting or formatting errors
- Updating vulnerable dependencies
- Patching security vulnerabilities identified in audit reports

## When NOT to Use
- Writing new features or tests -- that is implementation work
- Refactoring code without identified issues -- not a fix
- Rolling back deployments -- use `rollback`
- Investigating performance problems -- use `performance-analysis`

## Instructions

### 1. Review the findings

Read the scan or audit report to understand each issue. Use `Read` and `Grep` to locate the affected code. Prioritize fixes by severity: CRITICAL first, then HIGH, MEDIUM, LOW.

### 2. Apply automated fixes

Run auto-fix tools via `Bash` where available:
```bash
# Node.js linting
npx eslint --fix [files]

# Python formatting
black [files]
isort [files]

# Go formatting
go fmt ./...
goimports -w [files]

# Dependency vulnerabilities
npm audit fix
pip install --upgrade [package]
```

### 3. Apply manual fixes

For issues that cannot be auto-fixed, use `Edit` to modify the code:
- Replace string-concatenated SQL with parameterized queries
- Replace hardcoded secrets with environment variable references
- Add missing input validation or auth checks
- Fix insecure cryptographic usage

### 4. Verify fixes

After applying fixes, run verification:
```bash
# Re-run linting
npm run lint
python -m flake8 [files]

# Re-run tests
npm test
pytest -v
```

### 5. Report results

List every fix applied and any issues that require manual human review.

## Output

```
## Code Fix Report

### Fixes Applied
| # | Issue | File | Fix | Status |
|---|-------|------|-----|--------|
| 1 | SQL injection | db.js:15 | Parameterized query | Fixed |
| 2 | Lint error | utils.py:8 | Auto-formatted | Fixed |

### Manual Fixes Required
- [ ] [issue requiring human judgment]

### Verification
- Lint: [PASS/FAIL]
- Tests: [PASS/FAIL]

### Verdict
[RE-SCAN / READY] - [reason]
```
