---
name: enforcement
description: >-
  Execute moderation decisions and handle user appeals.
  Triggers on "enforce decision", "execute moderation", "handle appeal", "apply sanctions".
  NOT for initial flagging — use flagging for auto-actions.
  NOT for human review — use review first.
argument-hint: [moderation decision to enforce or appeal to handle]
allowed-tools: Read, Write, Bash
---

Execute the following moderation decision:
<request>$ARGUMENTS</request>

## When to Use

- A human reviewer has made a moderation decision that needs execution
- A user has submitted an appeal that needs processing
- Sanctions (warning, suspension, ban) need to be applied
- Content needs to be restored after an approved appeal

## When NOT to Use

- Content has not been reviewed yet — use **review** first
- Initial auto-actions on flagged content — use **flagging**
- Scanning content for violations — use **content-scanning**
- Classifying content severity — use **classification**

## Instructions

1. **Read the review decision** — use Read to load the reviewer's decision, case file, and any appeal documentation
2. **Execute the decision based on type**:
   - **Remove** — delete or permanently hide the content, send the author a warning with the specific policy violated, record a strike on the author's account, enable the appeal option with a 30-day window
   - **Warn** — send the author a formal warning message citing the specific violation, log the warning on their account, do not remove the content
   - **Suspend** — temporarily disable the author's account for the specified duration, notify the author with the reason, suspension length, and appeal process, set an automatic reactivation date
   - **Ban** — permanently disable the author's account, remove or hide all their content, notify the author with the reason and appeal process, flag the account to prevent re-registration
   - **Approve** — restore the content if it was hidden during review, clear the flag from the author's record, notify the author that their content has been restored
3. **Send user communication** — every enforcement action must include:
   - Clear statement of what action was taken and why
   - Reference to the specific policy section violated
   - Information about the appeal process and timeline
   - Any applicable deadlines (appeal window, suspension end date)
4. **Record the action** — write the enforcement record with case ID, reviewer, timestamp, decision, and whether it sets precedent
5. **Update metrics** — log the action for moderation reporting (daily counts, user strike counts)
6. **Handle appeals** — if processing an appeal:
   - Read the original case and the appeal submission
   - Verify the appeal is within the allowed window
   - Route to a different reviewer than the original decision-maker
   - Execute the appeal outcome (uphold, modify, or overturn)
7. **Write enforcement report** — output using the format below

## Output

```markdown
## Enforcement Report

### Content ID: [id]
### Decision: [remove/warn/suspend/ban/approve]

### Actions Executed
- [x/blank] Content removed/restored
- [x/blank] User notified
- [x/blank] Strike recorded ([current]/[max])
- [x/blank] Appeal option sent
- [x/blank] Account suspended/banned
- [x/blank] Reactivation date set

### User Notification
> Your content was [action] for violating our [policy name].
>
> Reason: [specific reason with policy reference]
>
> [Appeal information and timeline]

### Case Record
- Case ID: [id]
- Reviewer: [name]
- Timestamp: [datetime]
- Decision: [decision]
- Precedent: [yes/no — explanation if yes]

### Metrics Update
- Action type: [+1 removal/warning/suspension/ban]
- User strikes: [current]/[max before escalation]
```
