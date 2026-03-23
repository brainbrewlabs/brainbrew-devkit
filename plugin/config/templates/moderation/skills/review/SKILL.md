---
name: review
description: >-
  Support human moderation review of flagged content with context and policy references.
  Triggers on "review flagged content", "moderation review", "review case", "human review".
  NOT for code review — use code-review instead.
  NOT for initial scanning — use content-scanning instead.
argument-hint: [flagged content case to review]
allowed-tools: Read, Write
---

Prepare and support human review for the following flagged content:
<request>$ARGUMENTS</request>

## When to Use

- Flagged content needs a human moderation decision
- Edge cases need human judgment with full context
- Auto-moderation decisions need human verification
- Escalated cases need senior reviewer attention

## When NOT to Use

- Reviewing code changes for quality — use **code-review**
- Content has not been scanned yet — use **content-scanning** first
- Content has not been classified yet — use **classification** first
- Enforcement action needs execution — use **enforcement**

## Instructions

1. **Read the case files** — use Read to load the original content, scan results, classification, and flagging records
2. **Present the content safely** — display the flagged content with appropriate context but clearly marked as under review; redact extreme content and show only relevant excerpts
3. **Compile context** — gather and present:
   - Author information and account history
   - Number of prior violations and outcomes
   - Number of user reports on this content
   - Content reach and audience size
   - Related content from the same author
4. **Show AI assessment** — present the automated classification results: category, severity, confidence score, and similar past cases if available
5. **Reference relevant policies** — quote the specific policy sections that apply to this violation type
6. **Present decision options** — offer the reviewer these choices:
   - **Approve** — no violation found, restore content if hidden
   - **Remove** — violation confirmed, proceed to enforcement
   - **Warn** — minor violation, issue warning without removal
   - **Escalate** — needs senior review or legal consultation
7. **Record the decision** — write the reviewer's decision, reasoning, and any notes to the case file
8. **Write review case** — output using the format below

## Output

```markdown
## Review Case

### Content ID: [id]
### Reviewer: [name/role]

### Content Under Review
> [Safely displayed content excerpt]

### Context
- Author: [username, account age, account standing]
- Prior violations: [count and types]
- Reports on this content: [count]
- Content reach: [audience size/visibility]

### AI Assessment
- Category: [violation type]
- Severity: [level]
- Confidence: [percentage]
- Similar past cases: [outcomes of similar cases]

### Applicable Policy
> [Quoted policy section]

### Decision
- [ ] Approve — no violation
- [ ] Remove — violation confirmed
- [ ] Warn — minor violation
- [ ] Escalate — needs senior review

### Reviewer Notes
[Reasoning and observations]
```
