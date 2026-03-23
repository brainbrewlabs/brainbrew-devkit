---
name: content-scanning
description: >-
  Scan user-generated content for policy violations (hate speech, spam, PII exposure).
  Triggers on "scan content", "check for violations", "moderate content", "content safety check".
  NOT for code quality — use devops/code-scanning instead.
  NOT for documentation gaps — use docs/code-scanning instead.
argument-hint: [content to scan or content location]
allowed-tools: Read, Grep, Glob
---

Scan the following content for policy violations:
<request>$ARGUMENTS</request>

## When to Use

- User-generated content needs moderation before publishing
- Reported content needs automated policy violation check
- Bulk content needs scanning for compliance
- Content needs pre-screening for hate speech, spam, PII, or other violations

## When NOT to Use

- Scanning source code for bugs or vulnerabilities — use **devops/code-scanning**
- Checking documentation for completeness — use **docs/code-scanning**
- Classifying already-flagged content by severity — use **classification**
- Reviewing content that has already been flagged — use **review**

## Instructions

1. **Locate the content** — use Glob and Read to find and load the content to be scanned
2. **Scan each violation category** — check the content against every category below, using Grep for pattern matching where applicable:
   - Hate speech (slurs, dehumanizing language, targeted harassment)
   - Violence/gore (threats, graphic descriptions, glorification)
   - Adult content (explicit material, suggestive content)
   - Spam/scam (unsolicited promotion, phishing, deceptive links)
   - Misinformation (verifiably false claims, manipulated media references)
   - PII exposure (emails, phone numbers, addresses, SSNs, credit cards)
   - Copyright (verbatim copied content, unauthorized reproductions)
3. **Assign confidence scores** — for each category, assign a confidence score from 0.0 to 1.0 based on how likely the content violates that category
4. **Flag specific elements** — identify the exact text, line, or element that triggered each flag with its location
5. **Determine recommendation** — based on scores and thresholds (0.80 default), recommend PASS (no flags), REVIEW (borderline), or REMOVE (clear violation)
6. **Write scan results** — output using the format below

## Output

```markdown
## Content Scan Results

### Content ID: [id]
- Type: [text/image/video/mixed]
- Source: [platform/user/location]
- Scanned: [timestamp]

### Scan Results
| Category | Score | Threshold | Status |
|----------|-------|-----------|--------|
| Hate speech | [0.00-1.00] | 0.80 | PASS/FLAG |
| Violence | [0.00-1.00] | 0.80 | PASS/FLAG |
| Adult | [0.00-1.00] | 0.80 | PASS/FLAG |
| Spam | [0.00-1.00] | 0.80 | PASS/FLAG |
| Misinformation | [0.00-1.00] | 0.80 | PASS/FLAG |
| PII | [0.00-1.00] | 0.80 | PASS/FLAG |
| Copyright | [0.00-1.00] | 0.80 | PASS/FLAG |

### Flagged Elements
- [Location]: "[excerpt]" - [Category] ([score])

### Recommendation
- Action: [PASS/REVIEW/REMOVE]
- Confidence: [percentage]
- Reason: [brief explanation]
```
