---
name: reporting
description: >-
  Generate data-driven reports with metrics, charts, and recommendations.
  Triggers on 'create report', 'generate dashboard report', 'write data report'.
  NOT for narrative research reports — use research/report-writing.
allowed-tools: Read, Write
---

## When to Use

- Creating executive summaries from analysis results
- Building metric-driven reports with tables and charts
- Producing recurring data dashboards (weekly, monthly, quarterly)
- Structuring findings and recommendations for stakeholders

## When NOT to Use

- Writing narrative or literature-based research reports — use research/report-writing
- Data has not been analyzed yet — use data-analysis first
- You need to create charts from scratch — use visualization first, then reporting

## Instructions

1. Gather all analysis results, visualizations, and data artifacts referenced in `$ARGUMENTS`.
2. Structure the report:
   - **Executive Summary**: 2-3 sentences with the most important takeaways
   - **Key Metrics**: table of KPIs with values, trends, and targets
   - **Detailed Analysis**: sections organized by topic or business question
   - **Findings**: numbered list with evidence (specific numbers, not vague claims)
   - **Recommendations**: actionable next steps tied to findings
   - **Appendix**: methodology, data sources, detailed tables
3. Format the report:
   - Embed or reference chart files from visualization outputs
   - Use tables for metric comparisons
   - Use bullet points for actionable items
   - Keep executive summary under 200 words
4. Write the final report to the output location.
5. Summarize deliverables and their file paths.

## Output

```markdown
## Report Deliverables

| Type | File | Description |
|------|------|-------------|
| ... | ... | ... |

### Summary
- Total pages/sections: [count]
- Key recommendations: [count]
```
