---
name: analytics
description: >-
  Analyze content performance, generate insights, and recommend optimizations.
  Triggers on "analyze performance", "content metrics", "what's working", "traffic report",
  "engagement analysis", "ROI report", "content audit". NOT for creating or publishing content.
allowed-tools: Read, Glob, Grep, Write
---

## When to Use

- Reviewing content performance metrics (traffic, engagement, conversions)
- Identifying top-performing and underperforming content
- Generating periodic performance reports
- Recommending content optimizations based on data
- Conducting content audits to find gaps and opportunities

## When NOT to Use

- Writing new content (use `content-creator` skill)
- Optimizing content for SEO (use `seo` skill)
- Editing content for quality (use `editing` skill)
- Publishing or distributing content (use `publishing` skill)

## Instructions

### 1. Gather Metrics

Collect data across these categories:

**Traffic**: Page views, unique visitors, bounce rate, time on page, traffic sources
**Engagement**: Likes, shares, comments, saves, click-through rate
**Conversion**: Form submissions, signups, downloads, purchases, revenue attributed
**SEO**: Keyword rankings, impressions, organic clicks, position changes

### 2. Analyze Trends

- Compare current period to previous period (week-over-week, month-over-month)
- Identify upward and downward trends
- Correlate spikes/drops with specific content or events
- Segment by content type, channel, and audience

### 3. Identify Patterns

- Which content types get the most engagement?
- Which channels drive the most conversions?
- What topics consistently perform well?
- What posting cadence works best?
- Which CTAs have the highest click-through rate?

### 4. Generate Recommendations

For each finding, provide an actionable recommendation:
- **Top performers**: Explain why they work, suggest how to replicate
- **Underperformers**: Diagnose the issue, suggest fix or retirement
- **Gaps**: Identify topics or formats not yet covered
- **Opportunities**: Suggest experiments based on data

### 5. Build Report

Structure every report consistently:
1. Executive summary (3-5 key takeaways)
2. Metrics dashboard (table of KPIs vs targets)
3. Top performers (with analysis of why)
4. Underperformers (with diagnosis)
5. Recommendations (prioritized action items)
6. Next steps (specific tasks with owners)

## Output

Deliver a structured performance report in markdown with:
- Period covered
- Key metrics table
- Ranked content list
- Prioritized recommendations (high/medium/low impact)
