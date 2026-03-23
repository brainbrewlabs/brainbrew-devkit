---
name: testing
description: >-
  Run test suites, generate coverage reports, and verify code quality.
  Triggers on 'run tests', 'check coverage', 'test this', 'verify tests pass'.
  NOT for writing new tests (do that manually) or debugging failures (use code-fixing).
allowed-tools: Bash
---

## When to Use
- Running the full test suite or specific test files
- Generating code coverage reports
- Verifying tests pass before deployment
- Checking test results after code changes

## When NOT to Use
- Writing new test cases from scratch -- do that as part of implementation
- Debugging test failures -- use `code-fixing`
- Load or performance testing -- use `performance-analysis`
- Security scanning -- use `security-auditor`

## Instructions

### 1. Detect the test framework

Check for framework indicators and select the appropriate command:

| Indicator | Framework | Command |
|-----------|-----------|---------|
| `package.json` (has "test") | Node/npm | `npm test` |
| `pytest.ini`, `pyproject.toml` | Python/pytest | `python -m pytest -v` |
| `go.mod` | Go | `go test ./... -count=1` |
| `Cargo.toml` | Rust | `cargo test` |
| `Makefile` (has "test") | Make | `make test` |

### 2. Run tests via Bash

Execute the detected test command. Use verbose flags to capture detailed output. If a coverage command is available, run it:
```bash
# Node.js
npm test && npm run test:coverage

# Python
pytest --cov=src tests/ -v

# Go
go test ./... -cover -count=1
```

### 3. Handle failures

If tests fail:
- Capture the full error output
- Identify which tests failed and their error messages
- Report FAIL with evidence -- do NOT attempt to fix code

### 4. Report results

Count total, passed, failed, and skipped tests from the output. Extract coverage percentages if available.

## Done Criteria
- All test commands have been executed
- Raw output is captured and included in the report
- Pass/fail verdict is clearly stated with evidence

## Output

```
## Test Report

**Verdict:** PASS | FAIL

### Summary
- Total: X tests
- Passed: X
- Failed: X
- Skipped: X
- Duration: Xs

### Coverage
- Lines: X%
- Branches: X%
- Functions: X%

### Raw Output
<actual terminal output>

### Failures (if any)
| Test | Error | Location |
|------|-------|----------|
| test_name | error message | file:line |
```
