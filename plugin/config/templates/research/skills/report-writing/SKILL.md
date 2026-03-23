---
name: report-writing
description: >-
  Write formal research reports with proper structure, citations, and audience-appropriate language.
  Triggers on "write the report", "create a research report", "draft the final report", "format as a report".
  NOT for data dashboards or metrics reports — use data/reporting instead.
  NOT for integrating findings — use synthesis instead.
argument-hint: [path to synthesis document or description of report requirements]
allowed-tools: Read, Write
---

Write a formal research report based on:
<input>$ARGUMENTS</input>

## When to Use

- User has a completed synthesis and needs it formatted as a formal report
- User wants a polished document with abstract, methodology, findings, and references
- User needs a white paper, research brief, or formal research deliverable
- User wants proper academic or professional citation formatting

## When NOT to Use

- User needs data visualizations or metric dashboards — use **data/reporting**
- User needs findings integrated first — use **synthesis**
- User needs more analysis done — use **analysis**
- User needs more sources collected — use **source-gathering**

## Instructions

1. **Read synthesis and source materials** — use Read to load the synthesis document, analysis reports, and source collections referenced in `$ARGUMENTS`
2. **Determine audience and format** — identify who will read the report (academic, executive, technical) and adjust tone, depth, and structure accordingly
3. **Write the abstract** — summarize the entire report in 150-300 words covering purpose, methodology, key findings, and conclusions
4. **Write the introduction** — establish context, state the research question, explain why it matters, and outline the report structure
5. **Document methodology** — describe the research approach, data collection methods, analytical framework, and any limitations of the methodology
6. **Present findings** — organize findings logically by theme or chronology; support every claim with evidence and citations
7. **Write discussion** — interpret findings, compare with existing knowledge, discuss implications, and acknowledge limitations
8. **Write conclusions and recommendations** — summarize key takeaways and propose actionable next steps
9. **Compile references** — format all citations consistently (default APA unless user specifies otherwise)
10. **Review and polish** — ensure consistent tone, proper heading hierarchy, no unsupported claims, and smooth transitions between sections

## Output

Write the final report to a file using this structure:

```markdown
# [Report Title]

## Abstract
[150-300 word summary of purpose, methodology, findings, and conclusions]

## 1. Introduction
### 1.1 Background
[Context and motivation for the research]
### 1.2 Research Questions
[Specific questions addressed]
### 1.3 Scope
[Boundaries and limitations of the research]

## 2. Methodology
### 2.1 Research Approach
[Qualitative/quantitative/mixed methods description]
### 2.2 Data Collection
[Sources consulted and how they were gathered]
### 2.3 Analysis Methods
[How data was analyzed and interpreted]

## 3. Findings
### 3.1 [Finding Category 1]
[Detailed findings with evidence and citations]
### 3.2 [Finding Category 2]
[Detailed findings with evidence and citations]

## 4. Discussion
### 4.1 Interpretation
[What the findings mean in context]
### 4.2 Implications
[Practical and theoretical implications]
### 4.3 Limitations
[Constraints and caveats]

## 5. Conclusions
[Summary of key takeaways]

## 6. Recommendations
[Actionable next steps with rationale]

## References
[Formatted citation list]
```
