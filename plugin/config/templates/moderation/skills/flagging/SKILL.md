---
name: flagging
description: >-
  Flag content and apply initial auto-actions based on severity classification.
  Triggers on "flag content", "apply moderation action", "queue for review", "auto-moderate".
  NOT for final enforcement — use enforcement after human review.
  NOT for scanning — use content-scanning first.
argument-hint: [classified content to flag and act on]
allowed-tools: Read, Write
---

Flag and apply initial actions to the following classified content:
<request>$ARGUMENTS</request>

## When to Use

- Content has been classified and needs initial automated action
- Flagged content needs routing to the appropriate review queue
- Notifications need to be sent to affected users or moderation teams

## When NOT to Use

- Content has not been scanned yet — use **content-scanning** first
- Content has not been classified yet — use **classification** first
- Human review decision is needed — use **review**
- Final enforcement after review decision — use **enforcement**

## Instructions

1. **Read the classification results** — use Read to load the classification output including severity and category
2. **Apply the auto-action based on severity**:
   - **Critical severity** — hide the content immediately, add to urgent review queue, alert the moderation team, notify legal if required
   - **High severity** — hide the content, add to priority review queue, alert the moderation team
   - **Medium severity** — keep content visible but add to standard review queue, monitor for escalation
   - **Low severity** — log the flag, add to bulk review queue, set up monitoring for pattern detection
3. **Update content status** — write the new status (hidden/flagged/queued/monitored) to the moderation record
4. **Assign queue position** — route to the correct queue based on severity and category, assign position and team
5. **Send notifications**:
   - Notify the content author that their content is under review (for hidden content)
   - Alert the moderation team with case summary
   - Escalate to legal if the violation involves legal risk (CSAM, credible threats, subpoena-relevant content)
6. **Write flagging results** — output using the format below

## Output

```markdown
## Flagging Action

### Content ID: [id]

### Status Change
- Previous: [active]
- New: [hidden/flagged/queued/monitored]
- Reason: [severity level — category]

### Actions Taken
- [x/blank] Content hidden from public view
- [x/blank] Added to review queue
- [x/blank] Author notified
- [x/blank] Moderation team alerted
- [x/blank] Legal team notified
- [x/blank] Appeal option enabled

### Queue Assignment
- Queue: [urgent/priority/standard/bulk]
- Position: #[n]
- Assigned to: [team or auto]
- SLA deadline: [timestamp]

### Notifications Sent
- Author: [sent/not required]
- Moderation team: [alerted/not required]
- Legal: [notified/not required]
```
