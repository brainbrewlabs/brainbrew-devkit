---
name: ticket-routing
description: >-
  Route classified tickets to the correct team or agent. Triggers on 'route ticket',
  'assign ticket', 'who handles this'. NOT for classifying (use ticket-classification).
allowed-tools: Read
---

## When to Use
- A classified ticket needs team or agent assignment
- Re-routing a ticket after escalation or misroute
- Balancing workload across support agents

## When NOT to Use
- Ticket has not been classified yet (use ticket-classification first)
- Searching for a solution (use knowledge-search)
- Writing the customer reply (use response-drafting)

## Instructions

1. Read the ticket classification (category, priority, complexity).
2. Match the category to the destination team using the routing table.
3. For P1/P2 tickets, apply escalation rules immediately.
4. Consider agent availability and current workload when assigning.
5. Set SLA targets based on priority level.

## Routing Table

| Category         | Primary Team | Escalation Path       |
|------------------|--------------|-----------------------|
| Technical Issue  | Engineering  | Senior Engineer       |
| Billing/Payment  | Finance      | Finance Manager       |
| Account Access   | Support      | Support Team Lead     |
| Feature Request  | Product      | Product Manager       |
| Bug Report       | QA           | Engineering Dev Team  |
| General Inquiry  | Support      | Support Team Lead     |

## Escalation Rules
- **P1**: Route directly to senior/lead of the destination team. Notify manager.
- **P2**: Route to destination team with escalation flag. Follow up within 1 hour.
- **P3/P4**: Route to destination team queue. Standard SLA applies.
- **VIP customers**: Always escalate one level above default routing.

## Output

```
Team: [team name]
Escalation: [none / level and reason]
SLA Response: [time]
SLA Resolution: [time]
Routing Reason: [one sentence]
```
