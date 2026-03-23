---
name: synthesis
description: >-
  Combine research findings into coherent narratives and integrated frameworks.
  Triggers on "synthesize findings", "connect the dots", "integrate research", "build a framework".
  NOT for final report formatting — use report-writing instead.
  NOT for initial analysis — use analysis instead.
argument-hint: [path to analysis outputs or description of findings to synthesize]
allowed-tools: Read, Write
---

Synthesize the following research findings:
<findings>$ARGUMENTS</findings>

## When to Use

- User has analyzed research and needs findings integrated into a coherent whole
- User wants cross-cutting themes identified across multiple analyses
- User needs a conceptual framework built from disparate findings
- User wants contradictions resolved and a unified narrative constructed

## When NOT to Use

- User needs initial data analysis — use **analysis**
- User wants a formally structured final report — use **report-writing**
- User wants to collect more sources — use **source-gathering**
- User wants to explore a new topic — use **topic-research**

## Instructions

1. **Read all analysis outputs** — use Read to load every analysis report, research brief, and source collection referenced in `$ARGUMENTS`
2. **Map the landscape** — list all findings, themes, and conclusions across all inputs; note which sources support each
3. **Identify cross-cutting themes** — find themes that span multiple analyses or source categories; rank by prevalence and importance
4. **Resolve contradictions** — where analyses disagree, weigh the evidence and state which interpretation is better supported and why
5. **Build narrative framework** — construct a logical structure that connects themes into a coherent story with clear cause-effect or relationship chains
6. **Extract implications** — derive what the integrated findings mean for different stakeholders or decision contexts
7. **Formulate recommendations** — propose actionable next steps grounded in the synthesized evidence
8. **Write synthesis document** — output the integrated narrative using the format below

## Output

Write the synthesis document to a file using this structure:

```markdown
## Synthesis: [Topic]

### Executive Summary
[2-3 sentences capturing the core integrated finding and its significance]

### Cross-Cutting Themes
1. **[Theme 1]**: [description]
   - Supporting evidence from: [list of analyses/sources]
   - Significance: [why this theme matters]

2. **[Theme 2]**: [description]
   - Supporting evidence from: [list of analyses/sources]
   - Significance: [why this theme matters]

### Integrated Framework
[Textual or visual representation of how themes relate to each other]
- [Theme A] + [Theme B] leads to [Insight 1]
- [Theme C] contradicts [Theme D]; resolved by [reasoning]

### Resolved Contradictions
- **[Area]**: [how the contradiction was resolved and what the weight of evidence supports]

### Implications
- For [stakeholder/context 1]: [implication and recommended action]
- For [stakeholder/context 2]: [implication and recommended action]

### Recommendations
1. [Recommendation 1]: [rationale grounded in evidence]
2. [Recommendation 2]: [rationale grounded in evidence]

### Remaining Uncertainties
- [What is still unknown or contested, and what would resolve it]
```
