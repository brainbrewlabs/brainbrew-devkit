---
name: code-scanning
description: >-
  Scan code for quality issues, anti-patterns, complexity, and dependency problems.
  Triggers on 'scan code', 'check code quality', 'pre-commit check', 'analyze changes'.
  NOT for security-specific scanning (use security-auditor) or compliance (use compliance-review).
allowed-tools: Read, Grep, Bash
---

## When to Use
- Pre-commit or pre-merge code quality checks
- Reviewing changed files for anti-patterns or complexity
- Auditing dependencies for outdated or vulnerable packages
- Detecting large files, secrets, or dead code

## When NOT to Use
- Deep security vulnerability analysis -- use `security-auditor`
- Compliance framework reviews -- use `compliance-review`
- Fixing the issues found -- use `code-fixing`
- Running test suites -- use `testing`

## Instructions

### 1. Identify changed files

Run `git diff --name-only HEAD~1` via `Bash` to determine the scope. If no git history, scan the full project.

### 2. Analyze code quality

Use `Grep` and `Read` to check each changed file for:
- Anti-patterns (deeply nested callbacks, god functions > 100 lines, unused imports)
- Complexity hotspots (excessive branching, long parameter lists)
- Code duplication across changed files

### 3. Check dependencies

Run the appropriate audit command via `Bash`:
```bash
# Node.js
npm audit --audit-level=moderate

# Python
pip check

# Go
go mod verify
```

### 4. Detect secrets and large files

Use `Grep` to search for patterns: `password`, `secret`, `api_key`, `token` in source files. Check for files over 1MB that should not be in version control.

### 5. Classify findings

- **CRITICAL**: Exposed secrets, broken imports, syntax errors
- **HIGH**: Anti-patterns that cause bugs (race conditions, unhandled errors)
- **MEDIUM**: Complexity issues, code smells
- **LOW**: Style inconsistencies, minor improvements

## Output

```
## Code Scan Report

### Changed Files
- [file1] (+X/-Y lines)
- [file2] (+X/-Y lines)

### Findings
| # | Severity | Category | Location | Description |
|---|----------|----------|----------|-------------|
| 1 | CRITICAL | Secret | config.js:5 | Hardcoded API key |
| 2 | HIGH | Pattern | utils.js:42 | Unhandled promise rejection |

### Dependencies
- Added: [dep1], [dep2]
- Vulnerabilities: [count by severity]

### Verdict
[PASS / WARN / FAIL] - [reason]
```
