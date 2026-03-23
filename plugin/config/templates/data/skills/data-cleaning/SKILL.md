---
name: data-cleaning
description: >-
  Clean and transform raw data for analysis. Triggers on 'clean data',
  'fix data quality', 'normalize data', 'preprocess data'. NOT for
  data collection — use data-collection.
allowed-tools: Bash, Read, Write, Edit
---

## When to Use

- Raw data has quality issues (nulls, duplicates, inconsistent formats)
- Data types need conversion or normalization before analysis
- Merging datasets that need schema alignment
- Preparing data for a downstream analysis or visualization pipeline

## When NOT to Use

- Data has not been collected yet — use data-collection first
- You need to analyze clean data — use data-analysis
- You need narrative text editing — use a writing/editing skill

## Instructions

1. Load the dataset from the path or source specified in `$ARGUMENTS`.
2. Profile the data to identify quality issues:
   - Count nulls and missing values per column
   - Detect duplicate rows
   - Check for format inconsistencies (dates, currencies, encodings)
   - Identify outliers and invalid ranges
3. Apply cleaning operations in order:
   - Remove or flag exact duplicate rows
   - Handle missing values (drop, impute with mean/median/mode, or forward-fill as appropriate)
   - Fix data types (strings to numbers, date parsing, boolean normalization)
   - Normalize text fields (trim whitespace, lowercase, remove special characters)
   - Standardize formats (ISO dates, consistent currency, uniform units)
4. Validate the cleaned output:
   - Confirm no remaining nulls in required fields
   - Verify record count delta is expected (document removals)
   - Spot-check transformed values against originals
5. Write the cleaned dataset to the output location.
6. Produce a cleaning report documenting every change.

## Output

```markdown
## Data Cleaning Report

### Input
- File: [path]
- Records: [count]
- Columns: [count]

### Issues Found & Actions Taken
| Issue | Count | Action |
|-------|-------|--------|
| ... | ... | ... |

### Output
- File: [path]
- Records: [count after cleaning]
- Quality score: [percentage of clean rows]
```
