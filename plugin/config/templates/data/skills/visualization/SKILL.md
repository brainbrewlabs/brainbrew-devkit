---
name: visualization
description: >-
  Create data visualizations (charts, plots, dashboards). Triggers on
  'visualize data', 'create chart', 'plot data', 'build dashboard'.
  NOT for written reports — use reporting.
allowed-tools: Bash, Read, Write
---

## When to Use

- Turning analysis results into charts or plots
- Creating dashboards to display KPIs and metrics
- Comparing distributions, trends, or compositions visually
- Generating visual artifacts for inclusion in reports or presentations

## When NOT to Use

- You need a written narrative report — use reporting
- Data has not been analyzed yet — use data-analysis first
- You need to collect raw data — use data-collection

## Instructions

1. Read the data or analysis results specified in `$ARGUMENTS`. Understand the variables, their types, and the story the data tells.
2. Determine the appropriate chart type based on data characteristics:
   - **Trend over time** -> line chart
   - **Comparison across categories** -> bar chart (horizontal for many categories)
   - **Part-of-whole composition** -> pie chart or stacked bar
   - **Distribution of values** -> histogram or box plot
   - **Relationship between variables** -> scatter plot
   - **Geographic data** -> map or choropleth
3. Select a library or approach:
   - Python: matplotlib, seaborn, plotly
   - JavaScript: D3.js, Chart.js
   - CLI: gnuplot, termgraph for quick terminal output
4. Generate the visualization:
   - Set clear title and axis labels
   - Add legend if multiple series
   - Use colorblind-friendly palettes
   - Include data source annotation
5. Annotate with context:
   - Highlight key data points or thresholds
   - Add trend lines or reference lines where useful
   - Include summary statistics on the chart if space permits
6. Save output files and report what was created.

## Output

```markdown
## Visualizations Created

### Charts
| Chart | Type | Data | File |
|-------|------|------|------|
| ... | ... | ... | ... |

### Design Notes
- Color palette: [name]
- Library: [tool used]
- Interactive: [yes/no]
```
