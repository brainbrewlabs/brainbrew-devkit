---
name: topic-research
description: >-
  Conduct structured research on a topic using academic and industry sources.
  Triggers on "research this topic", "explore this subject", "investigate this area".
  NOT for collecting sources — use source-gathering instead.
  NOT for analyzing data — use analysis instead.
argument-hint: [topic or research question]
allowed-tools: Read, Grep, Glob, WebSearch, WebFetch, Write
---

Research the following topic:
<topic>$ARGUMENTS</topic>

## When to Use

- User wants to understand a topic, field, or domain
- User needs a structured overview of existing knowledge
- User asks to explore or investigate a subject area
- User wants to identify knowledge gaps or open questions

## When NOT to Use

- User wants to collect and validate specific sources — use **source-gathering**
- User wants to analyze already-gathered data — use **analysis**
- User wants to combine findings into a narrative — use **synthesis**
- User wants a formatted final report — use **report-writing**

## Instructions

1. **Define scope** — extract the research question from `$ARGUMENTS`, identify boundaries (domain, timeframe, geographic scope), and list 3-5 specific sub-questions
2. **Identify search terms** — generate keyword variants, synonyms, and related concepts for comprehensive coverage
3. **Search academic and industry sources** — use WebSearch and WebFetch to find peer-reviewed papers, industry reports, expert commentary, and authoritative references
4. **Evaluate source quality** — assess each source for relevance, recency, authority, and methodology rigor; discard low-quality results
5. **Map key themes** — identify the major themes, debates, and perspectives across sources; note areas of consensus and disagreement
6. **Identify knowledge gaps** — document what is not well covered, where evidence is weak, or where further investigation is needed
7. **Write structured findings** — output a research brief using the format below

## Output

Write the research brief to a file using this structure:

```markdown
## Research Brief: [Topic]

### Scope
- Focus: [specific aspect researched]
- Timeframe: [relevant period]
- Domain: [industry/field]

### Key Questions
1. [Research question 1]
2. [Research question 2]

### Key Themes
- **[Theme 1]**: [summary with source references]
- **[Theme 2]**: [summary with source references]

### Initial Findings
- [Finding 1 with supporting evidence]
- [Finding 2 with supporting evidence]

### Knowledge Gaps
- [Gap 1]: [why this matters]
- [Gap 2]: [why this matters]

### Sources Consulted
- [Source 1]: [brief description]
- [Source 2]: [brief description]
```
