---
name: customer-support
description: >-
  Handle end-to-end customer support workflows. Triggers on 'support ticket',
  'customer issue', 'help request'. NOT for internal team tasks or engineering bugs.
allowed-tools: Read, Grep, Glob
---

## When to Use
- Processing a new customer support ticket or inquiry
- Coordinating the full support workflow (classify, route, search, draft, review)
- Applying support best practices to a customer interaction

## When NOT to Use
- Internal engineering bug triage (use bug-tracking workflows instead)
- Product feature planning or roadmap work
- Tasks with no customer-facing component

## Instructions

1. **Gather context** -- read the ticket content, customer history, and any prior interactions.
2. **Classify** -- assign a category (Technical, Billing, Account, Feature Request, Bug, General) and priority (P1-P4) using impact/urgency.
3. **Route** -- determine the appropriate team based on category and escalation needs.
4. **Search** -- find relevant KB articles, past resolutions, and product docs.
5. **Draft response** -- write a clear, empathetic reply with solution steps and next actions.
6. **Review** -- verify accuracy, tone, completeness, and policy compliance before sending.

## Tone Guidelines
- Professional but friendly
- Empathetic -- acknowledge the issue before solving it
- Clear and concise -- avoid jargon
- Action-oriented -- tell the customer exactly what to do next

## Escalation Criteria
- P1 (Critical): service outage, data loss, security breach -- escalate immediately
- P2 (High): broken core feature, billing error -- escalate within 1 hour
- P3 (Medium): degraded experience, non-blocking bug -- standard queue
- P4 (Low): general question, feature request -- standard queue

## Output
- Classified ticket with category and priority
- Routing decision with team assignment
- Draft response ready for review
