---
name: source-gathering
description: >-
  Collect, validate, and organize research sources with proper citations.
  Triggers on "find sources", "gather references", "build bibliography", "collect evidence".
  NOT for topic exploration — use topic-research instead.
  NOT for analyzing source content — use analysis instead.
argument-hint: [topic or specific sources needed]
allowed-tools: Read, WebSearch, WebFetch, Write
---

Gather sources for the following:
<request>$ARGUMENTS</request>

## When to Use

- User needs a curated list of credible sources on a topic
- User wants to build a bibliography or reference list
- User needs to validate existing sources for credibility
- User wants citations formatted in a specific style

## When NOT to Use

- User wants a broad topic overview — use **topic-research**
- User wants to analyze the content of sources — use **analysis**
- User wants to combine findings into a narrative — use **synthesis**
- User wants a formatted final report — use **report-writing**

## Instructions

1. **Identify source types needed** — determine which categories are relevant: academic papers, industry reports, government data, news articles, books, datasets, or expert commentary
2. **Search systematically** — use WebSearch to find sources across multiple databases and repositories; vary search terms to maximize coverage
3. **Fetch and verify** — use WebFetch to access each source; confirm it exists, is accessible, and contains relevant content
4. **Evaluate credibility** — assess each source on: author credentials, publication venue, methodology, citation count, recency, and potential bias
5. **Categorize sources** — organize into primary sources (original research, raw data) and secondary sources (reviews, commentary, summaries)
6. **Format citations** — create properly formatted citations (default APA style unless user specifies otherwise)
7. **Write source list** — output the organized source collection using the format below

## Output

Write the source list to a file using this structure:

```markdown
## Source Collection: [Topic]

### Primary Sources
| # | Title | Author(s) | Year | Type | Credibility | URL |
|---|-------|-----------|------|------|-------------|-----|
| 1 | [Title] | [Author] | [Year] | [Paper/Dataset/Report] | [High/Medium/Low] | [URL] |

### Secondary Sources
| # | Title | Source | Year | Type | URL |
|---|-------|--------|------|------|-----|
| 1 | [Title] | [Publication] | [Year] | [Article/Review/Book] | [URL] |

### Source Evaluation Notes
- **[Source 1]**: [credibility assessment, potential biases, limitations]
- **[Source 2]**: [credibility assessment, potential biases, limitations]

### Formatted Citations (APA)
1. Author, A. B. (Year). Title of work. *Publication*. URL
2. Author, C. D. (Year). Title of work. *Publication*. URL

### Gaps in Available Sources
- [Area where sources are lacking]
- [Type of source that would strengthen the collection]
```
