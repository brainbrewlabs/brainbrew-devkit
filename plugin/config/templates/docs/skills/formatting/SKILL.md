---
name: formatting
description: >-
  Format and clean up documentation files for publication. Applies style rules,
  fixes markdown issues, and validates links. Triggers on "format docs",
  "clean up docs", "fix markdown". NOT for writing content (use doc-generation)
  or reviewing accuracy (use doc-review).
allowed-tools: Read, Edit, Bash
---

## When to Use

- Before publishing to apply consistent formatting
- After doc-generation to polish output
- When docs have inconsistent heading levels, code blocks, or whitespace
- To run linters and auto-fix formatting issues

## When NOT to Use

- Writing new documentation content (use doc-generation)
- Checking technical accuracy (use doc-review)
- Deploying docs to a platform (use doc-publishing)

## Instructions

1. **Detect documentation format.** Use Read to examine a sample of doc files. Determine the primary format: Markdown, reStructuredText, or AsciiDoc. Note any existing style conventions (heading style, list markers, code fence language tags).

2. **Run markdown linter.** Execute markdownlint to find issues:
   ```
   Run: npx markdownlint "docs/**/*.md" --json 2>&1 || true
   ```
   Parse the output to identify fixable issues.

3. **Auto-fix formatting issues.** Apply fixes with prettier:
   ```
   Run: npx prettier --write "docs/**/*.md" 2>&1 || true
   ```
   If prettier is not available, use Edit to manually fix issues.

4. **Apply style rules.** Use Read and Edit to enforce:
   - Consistent heading hierarchy (no skipped levels)
   - Code blocks have language tags (```js, ```python, etc.)
   - Lists use consistent markers (all `-` or all `*`)
   - Single blank line between sections
   - No trailing whitespace
   - Files end with a newline

5. **Validate links.** Check internal links resolve:
   ```
   Run: npx markdown-link-check docs/**/*.md 2>&1 || true
   ```
   If the tool is unavailable, use Read to manually verify referenced files exist.

6. **Fix broken links.** Use Edit to correct any broken internal links found in step 5.

## Output

```markdown
## Formatting Report

### Files Processed
- [list of files with pass/fail status]

### Fixes Applied
- Fixed N heading level issues
- Formatted N code blocks
- Fixed N broken links
- Normalized N list markers

### Remaining Warnings
- [issues that require manual review]
```
