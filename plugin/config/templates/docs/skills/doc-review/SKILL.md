---
name: doc-review
description: >-
  Review existing documentation for accuracy, completeness, and correctness
  against the current codebase. Triggers on "review docs", "check documentation",
  "are docs up to date". NOT for generating new docs (use doc-generation) or
  formatting (use formatting).
allowed-tools: Read, Glob, Grep
---

## When to Use

- After code changes to verify docs still match implementation
- Before a release to audit documentation quality
- When users report confusing or incorrect documentation
- As a QA pass after doc-generation

## When NOT to Use

- Writing new documentation from scratch (use doc-generation)
- Formatting or styling docs (use formatting)
- Finding undocumented code (use code-scanning)

## Instructions

1. **Locate documentation files.** Use Glob to find all doc files (`**/*.md`, `**/docs/**`, `**/*.rst`). Also use Grep to find inline doc comments (`/** */`, `"""`, `///`) in source files.

2. **Cross-reference with source code.** For each documented function/class:
   - Use Grep to find the actual function signature in the codebase
   - Use Read to compare the documented parameters against the real parameters
   - Verify return types match
   - Check that documented behavior matches implementation logic

3. **Verify code examples.** Use Read to examine each code example in documentation. Check that:
   - Function names and signatures match current code
   - Import paths are correct
   - Example output is plausible given the implementation

4. **Check completeness.** For each documented module:
   - Use Grep to list all exported symbols
   - Compare against documented symbols
   - Flag any exports missing from docs

5. **Validate cross-references.** Use Grep to find all internal doc links (`[text](path)`, `:ref:`, etc.). Use Glob to verify referenced files exist.

6. **Produce review report.** Output findings using the format below, with actionable fix suggestions for each issue.

## Output

```markdown
## Documentation Review: [scope]

### Issues Found
| File | Line | Issue | Severity | Suggested Fix |
|------|------|-------|----------|---------------|
| docs/api.md | 15 | Wrong param type for `userId` | High | Change `number` to `string` |
| docs/api.md | 32 | Missing `options` parameter | High | Add options param documentation |
| README.md | 8 | Outdated install command | Medium | Update to `npm install @v2` |

### Completeness
- Documented exports: X / Y total (Z%)
- Files with no docs: [list]

### Accuracy Score
- Parameter accuracy: X/10
- Example correctness: X/10
- Link validity: X/10
- Overall: X/10
```
