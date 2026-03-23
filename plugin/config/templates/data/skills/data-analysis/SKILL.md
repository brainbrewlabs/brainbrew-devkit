---
name: data-analysis
description: >-
  Analyze structured datasets (CSV, databases, numerical data). Triggers on
  'analyze data', 'compute statistics', 'find patterns in data'. NOT for
  qualitative research — use research/analysis.
allowed-tools: Bash, Read, Write
---

## When to Use

- Computing descriptive statistics on structured data (CSV, TSV, databases)
- Identifying trends, correlations, or anomalies in numerical datasets
- Testing hypotheses with data evidence
- Segmenting or grouping records by attributes

## When NOT to Use

- Qualitative or literature-based research analysis — use research/analysis
- Data has not been cleaned yet — use data-cleaning first
- You need charts or visual output — use visualization
- You need a formatted report — use reporting

## Instructions

1. Load the dataset specified in `$ARGUMENTS`. Confirm the file exists and inspect its schema (columns, types, row count).
2. Compute descriptive statistics:
   - Central tendency: mean, median, mode for numeric columns
   - Spread: standard deviation, min, max, percentiles
   - Counts and frequencies for categorical columns
3. Identify patterns:
   - Compute correlations between numeric variables
   - Detect trends over time-series data (if timestamps present)
   - Flag anomalies or outliers (values beyond 2-3 standard deviations)
4. Test hypotheses if specified in `$ARGUMENTS`:
   - State the hypothesis clearly
   - Select appropriate test (t-test, chi-square, regression)
   - Report results with confidence levels
5. Segment the data if grouping criteria are specified:
   - Group by relevant dimensions
   - Compare metrics across segments
6. Summarize findings with supporting evidence (specific numbers, not vague claims).

## Output

```markdown
## Analysis Results

### Dataset Overview
- Records: [count]
- Period: [date range if applicable]
- Key columns: [list]

### Key Metrics
| Metric | Value | Notes |
|--------|-------|-------|
| ... | ... | ... |

### Findings
1. **[Finding]**: [Evidence with numbers]
2. **[Finding]**: [Evidence with numbers]

### Correlations
- [variable A] <-> [variable B]: [coefficient]

### Anomalies
- [description with specific values]
```
