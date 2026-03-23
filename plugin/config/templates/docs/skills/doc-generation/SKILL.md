---
name: doc-generation
description: >-
  Generate documentation from source code analysis. Produces JSDoc, docstrings,
  README files, and API reference docs. Triggers on "generate docs", "document this
  code", "add docstrings", "create README". NOT for formatting existing docs (use
  formatting) or reviewing docs (use doc-review).
allowed-tools: Read, Glob, Grep, Write
---

## When to Use

- Generating JSDoc/docstrings for undocumented functions and classes
- Creating or updating README files from project structure
- Producing API reference documentation from code
- Adding inline documentation to complex logic

## When NOT to Use

- Formatting or styling existing documentation (use formatting)
- Reviewing documentation for accuracy (use doc-review)
- Finding what needs documentation (use code-scanning first)
- Publishing docs to a platform (use doc-publishing)

## Instructions

1. **Identify targets.** If given specific files, use Read to load them. If given a scan results list, work through it in priority order. If no targets specified, use Glob to find source files and Grep to locate undocumented exports.

2. **Analyze code signatures.** For each target file, use Read to examine:
   - Function/method signatures (parameters, return types)
   - Class structure (properties, methods, inheritance)
   - Module exports and their relationships
   - Existing comments or partial documentation

3. **Determine documentation format.** Match the project's existing conventions:
   - TypeScript/JavaScript: JSDoc (`/** ... */`)
   - Python: Google-style or NumPy-style docstrings (`"""..."""`)
   - No existing convention: default to JSDoc for JS/TS, Google-style for Python

4. **Generate documentation.** Use Write to create doc files or Edit to add inline docs. Follow this structure for each documented item:
   - One-line summary of purpose
   - Parameter descriptions with types
   - Return value description with type
   - Usage example when non-obvious
   - Thrown errors/exceptions if applicable

5. **Generate README if requested.** Use Glob to survey project structure, then Write the README with: project name, description, installation, quick start, usage, API reference links, contributing, license.

## Output

After generation, list:
- Files created or modified
- Number of functions/classes documented
- Any items skipped (with reason)

### API Doc Format

```markdown
## functionName(param1, param2)

Brief description of what the function does.

### Parameters
| Name | Type | Default | Description |
|------|------|---------|-------------|
| param1 | string | - | Description |
| param2 | number | 0 | Description |

### Returns
`ReturnType` - Description of return value.

### Example
```js
const result = functionName("value", 42);
```

### Throws
- `ValidationError` - When param1 is empty
```
