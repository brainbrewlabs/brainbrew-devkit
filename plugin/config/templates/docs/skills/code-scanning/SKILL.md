---
name: code-scanning
description: >-
  Scan codebase to find undocumented functions, classes, and APIs.
  Triggers on "find undocumented code", "scan for doc gaps", "what needs docs".
  This scans code for DOCUMENTATION gaps, NOT security or code quality issues
  (use devops/code-scanning for that).
allowed-tools: Read, Glob, Grep
---

## When to Use

- You need to identify which parts of the codebase lack documentation
- Before a doc-generation pass to build a target list
- After a large feature merge to find new undocumented code
- To prioritize documentation work by impact

## When NOT to Use

- Security scanning or code quality analysis (use devops/code-scanning)
- Generating the actual documentation (use doc-generation)
- Reviewing existing docs for accuracy (use doc-review)

## Instructions

1. **Discover source files.** Use Glob to find all source files in the project (e.g., `**/*.ts`, `**/*.py`, `**/*.js`). Exclude `node_modules`, `dist`, `build`, and vendor directories.

2. **Scan for undocumented exports.** Use Grep to find exported functions, classes, and interfaces. Then Grep for the presence of doc comments (JSDoc `/**`, Python `"""`, etc.) near those definitions. Flag any definition that lacks a doc comment.

3. **Identify public API surfaces.** Use Grep to find route handlers, controller methods, and public module exports. These are highest priority for documentation.

4. **Categorize by priority.**
   - **High**: Public APIs, exported functions, route handlers
   - **Medium**: Internal services, shared utilities, types/interfaces
   - **Low**: Private helpers, internal constants

5. **Read representative files.** Use Read on a sample of flagged files to confirm they truly lack documentation (avoid false positives from minified or generated code).

6. **Produce the documentation targets list.** Output in the format below.

## Output

```markdown
## Documentation Scan Results

### High Priority (Public APIs)
| Name | Type | File | Line |
|------|------|------|------|
| getUserById | Function | src/user.ts | 42 |
| AuthService | Class | src/auth.ts | 15 |

### Medium Priority (Internal Services)
| Name | Type | File | Line |
|------|------|------|------|

### Low Priority (Utilities)
| Name | Type | File | Line |
|------|------|------|------|

### Summary
- Total undocumented: X
- High priority: Y
- Files scanned: Z
```
