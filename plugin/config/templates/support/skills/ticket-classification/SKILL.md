---
name: ticket-classification
description: >-
  Classify and prioritize support tickets. Triggers on 'classify ticket',
  'triage', 'what priority'. NOT for routing (use ticket-routing) or drafting responses.
allowed-tools: Read
---

## When to Use
- A new support ticket needs category and priority assignment
- Triaging a batch of unclassified tickets
- Re-prioritizing a ticket after new information

## When NOT to Use
- Deciding which team handles the ticket (use ticket-routing)
- Searching for solutions (use knowledge-search)
- Writing a customer response (use response-drafting)

## Instructions

1. Read the full ticket content including subject, body, and any attachments.
2. Assign exactly one category from the list below.
3. Assess impact (how many users affected, how severely) and urgency (time sensitivity).
4. Assign priority using the matrix below.
5. Note customer sentiment (positive, neutral, negative) and complexity (simple, moderate, complex).

## Categories
- **Technical Issue** -- product not working as expected
- **Billing/Payment** -- charges, invoices, refunds, plan changes
- **Account Access** -- login, permissions, password reset, lockout
- **Feature Request** -- new functionality or enhancement suggestion
- **Bug Report** -- confirmed or suspected defect
- **General Inquiry** -- questions, feedback, how-to

## Priority Matrix

| Impact | Urgency | Priority | Response SLA |
|--------|---------|----------|--------------|
| High   | High    | P1       | 15 min       |
| High   | Low     | P2       | 1 hour       |
| Low    | High    | P3       | 4 hours      |
| Low    | Low     | P4       | 24 hours     |

- **High impact**: multiple users affected, core feature broken, revenue impact
- **High urgency**: security issue, complete blocker, time-sensitive deadline

## Output

```
Category: [category]
Priority: [P1-P4]
Sentiment: [positive/neutral/negative]
Complexity: [simple/moderate/complex]
Reasoning: [one sentence explaining classification]
```
