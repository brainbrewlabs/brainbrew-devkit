---
name: analysis
description: >-
  Analyze collected research data to identify patterns, themes, and conclusions.
  Triggers on "analyze this research", "find patterns", "what does the data show", "interpret these findings".
  NOT for quantitative data dashboards — use data/data-analysis instead.
  NOT for collecting sources — use source-gathering instead.
argument-hint: [path to research data or description of what to analyze]
allowed-tools: Read, Grep, Write
---

Analyze the following research data:
<data>$ARGUMENTS</data>

## When to Use

- User has gathered research sources and needs them analyzed for patterns
- User wants qualitative thematic analysis of text-based research
- User needs to identify trends, contradictions, or consensus across sources
- User wants evidence evaluated and conclusions drawn

## When NOT to Use

- User wants to collect sources first — use **source-gathering**
- User wants quantitative data processing or dashboards — use **data/data-analysis**
- User wants findings combined into a narrative — use **synthesis**
- User wants a formatted final report — use **report-writing**

## Instructions

1. **Read gathered sources** — use Read to load all research materials, source collections, and prior research briefs referenced in `$ARGUMENTS`
2. **Code the content** — identify recurring concepts, arguments, and evidence across sources; tag each with descriptive labels
3. **Identify patterns** — look for themes that appear across multiple sources, noting frequency and consistency
4. **Detect contradictions** — flag areas where sources disagree, noting the nature of the disagreement and the strength of evidence on each side
5. **Assess evidence strength** — evaluate how well-supported each finding is based on source quality, sample size, methodology, and replication
6. **Draw conclusions** — state what the evidence supports, what it does not support, and what remains uncertain
7. **Document limitations** — note methodological constraints, gaps in the evidence, and caveats that affect interpretation
8. **Write analysis report** — output findings using the format below

## Output

Write the analysis report to a file using this structure:

```markdown
## Analysis Report: [Topic]

### Methodology
- Approach: [qualitative thematic analysis / comparative analysis / etc.]
- Sources analyzed: [count and types]
- Analytical framework: [description of how content was coded and evaluated]

### Key Findings
1. **[Finding 1]**: [description]
   - Evidence: [supporting data points and sources]
   - Strength: [strong/moderate/weak]
   - Significance: [why this matters]

2. **[Finding 2]**: [description]
   - Evidence: [supporting data points and sources]
   - Strength: [strong/moderate/weak]
   - Significance: [why this matters]

### Patterns and Themes
- **[Theme 1]**: [description, frequency across sources]
- **[Theme 2]**: [description, frequency across sources]

### Contradictions
- **[Area of disagreement]**: [Source A says X, Source B says Y; assessment of which is better supported]

### Conclusions
- [What the evidence clearly supports]
- [What remains uncertain or contested]

### Limitations
- [Limitation 1]: [impact on conclusions]
- [Limitation 2]: [impact on conclusions]
```
