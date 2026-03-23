---
name: data-collection
description: >-
  Collect data from sources (APIs, databases, files). Triggers on 'collect data',
  'pull data', 'extract data', 'ingest data'. NOT for qualitative research or
  web research — use research/source-gathering.
allowed-tools: Bash, Read, Write
---

## When to Use

- Extracting data from APIs, databases, or file systems
- Building ETL/data ingestion pipelines
- Pulling structured data from multiple sources into a unified format
- Scraping or fetching data for downstream analysis

## When NOT to Use

- Qualitative or web-based research — use research/source-gathering
- Cleaning or transforming already-collected data — use data-cleaning
- Analyzing data — use data-analysis

## Instructions

1. Parse `$ARGUMENTS` to identify the target data sources (API endpoints, database connections, file paths, URLs).
2. For each source, determine the connection method:
   - APIs: use `curl`, `httpie`, or language-specific HTTP clients
   - Databases: use CLI clients (`psql`, `mysql`, `sqlite3`) or scripts
   - Files: read directly from disk (CSV, JSON, Parquet, XML)
3. Connect to each source and extract the data. Handle authentication, pagination, and rate limits.
4. Validate the extracted data:
   - Confirm expected schema (columns, fields, types)
   - Check record counts against expectations
   - Flag any connection failures or partial extractions
5. Write the collected data to the output location. Use structured formats (CSV, JSON, Parquet).
6. Produce a collection summary: sources accessed, record counts, errors encountered, output file paths.

## Output

```markdown
## Data Collection Summary

### Sources
| Source | Type | Records | Status |
|--------|------|---------|--------|
| ... | ... | ... | ... |

### Output Files
- [file paths and formats]

### Errors
- [any failures or warnings]
```
