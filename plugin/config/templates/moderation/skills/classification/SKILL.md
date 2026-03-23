---
name: classification
description: >-
  Classify flagged content by violation type and severity for moderation queue.
  Triggers on "classify content", "assess severity", "categorize violation", "prioritize moderation".
  NOT for support tickets — use ticket-classification instead.
  NOT for scanning content — use content-scanning first.
argument-hint: [flagged content or scan results to classify]
allowed-tools: Read
---

Classify the following flagged content:
<request>$ARGUMENTS</request>

## When to Use

- Content has been flagged by content-scanning and needs severity assessment
- Moderation queue needs prioritization based on risk level
- Flagged content needs violation type categorization for routing

## When NOT to Use

- Classifying or routing support tickets — use **ticket-classification**
- Content has not been scanned yet — use **content-scanning** first
- Content needs human review decision — use **review**
- Enforcement action needs to be taken — use **enforcement**

## Instructions

1. **Read the scan results** — use Read to load the content-scanning output and any related context
2. **Determine the primary violation category** — identify the most relevant category: hate speech, violence, adult content, spam, misinformation, PII exposure, or copyright
3. **Assess severity** — assign a severity level based on these criteria:
   - **Critical** (SLA: 15 min) — immediate harm potential: credible threats, CSAM, active doxxing, imminent danger
   - **High** (SLA: 1 hour) — clear policy violation: explicit hate speech, graphic violence, confirmed PII leak
   - **Medium** (SLA: 4 hours) — likely violation requiring context: borderline hate speech, potentially misleading content, partial PII
   - **Low** (SLA: 24 hours) — possible violation needing review: ambiguous language, satire vs. hate, minor spam patterns
4. **Evaluate context factors** — consider these to adjust severity:
   - User history: clean account vs. repeat offender (escalate severity for repeat offenders)
   - Content type: public post vs. private message (public = higher reach = higher risk)
   - Reach/audience: viral content vs. limited distribution
   - Immediate harm potential: yes/no
   - Legal risk: yes/no
5. **Assign queue priority** — map severity to queue: immediate (critical/high), standard (medium), bulk (low)
6. **Write classification results** — output using the format below

## Output

```markdown
## Content Classification

### Content ID: [id]

### Classification
- Primary category: [hate/violence/spam/adult/misinfo/pii/copyright]
- Severity: [critical/high/medium/low]
- Confidence: [percentage]

### Context Analysis
- User history: [clean/warned/repeat offender — N prior violations]
- Content type: [post/comment/message/profile]
- Reach: [public/limited/private]

### Risk Assessment
- Immediate harm: [yes/no — explanation]
- Viral potential: [high/medium/low]
- Legal risk: [yes/no — explanation]

### Priority
- Queue: [immediate/standard/bulk]
- SLA: [15 min/1 hour/4 hours/24 hours]
```
