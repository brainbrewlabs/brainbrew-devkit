---
name: response-drafting
description: >-
  Draft empathetic, actionable customer support responses. Triggers on 'draft reply',
  'write response', 'compose answer'. NOT for classifying, routing, or searching.
allowed-tools: Read, Write
---

## When to Use
- A ticket has been classified, routed, and a solution has been found
- Drafting an initial response to a customer inquiry
- Revising a response after reviewer feedback

## When NOT to Use
- No solution has been found yet (use knowledge-search first)
- Ticket has not been classified (use ticket-classification first)
- Reviewing an already-drafted response (use the reviewer agent)

## Instructions

1. Read the ticket content, classification, and knowledge search results.
2. Open with a greeting and empathy statement that acknowledges the specific issue.
3. Provide the solution in clear, numbered steps. Avoid jargon.
4. Include any relevant links to documentation or KB articles.
5. State the next steps -- what happens now and what the customer should do.
6. Close with an offer for further help.
7. Match tone to sentiment: apologetic for frustrated customers, enthusiastic for feature requests.

## Response Structure

```
Hi [Name],

[Empathy -- acknowledge their specific issue]

[Solution -- numbered steps or clear answer]

[Next steps -- what happens now]

[Closing -- offer further help]

Best regards,
[Support Team]
```

## Tone Guidelines
- **Frustrated customer**: Lead with apology, validate their experience, then solve
- **Confused customer**: Reassure, explain simply, offer to walk through steps
- **Happy/neutral customer**: Be warm and efficient, match their energy
- **All responses**: No blame language, no passive voice, no "unfortunately" without a follow-up action

## Output

```
Draft Response:
---
[Full response text]
---
Tone: [empathetic/professional/apologetic]
Includes: [solution/workaround/escalation notice]
KB Links: [any included links]
Review Notes: [anything the reviewer should check]
```
