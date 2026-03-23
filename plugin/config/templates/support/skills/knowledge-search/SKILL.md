---
name: knowledge-search
description: >-
  Search knowledge base and documentation for solutions to customer issues.
  Triggers on 'find answer', 'search KB', 'look up solution'. NOT for classifying or routing tickets.
allowed-tools: Read, Grep, Glob, WebSearch
---

## When to Use
- Looking up a solution for a classified and routed ticket
- Checking if a known resolution exists before drafting a response
- Identifying knowledge gaps when no article matches

## When NOT to Use
- Ticket has not been classified yet (use ticket-classification first)
- Writing the customer response (use response-drafting after finding the answer)
- Routing the ticket (use ticket-routing)

## Instructions

1. Extract key terms from the ticket (error messages, feature names, symptoms).
2. Search local knowledge base files using Grep and Glob for matching articles.
3. If no local match, use WebSearch to find product documentation or known solutions.
4. Read the top matching articles fully to verify relevance.
5. Check for past tickets with similar issues if a ticket history directory exists.
6. If no solution exists, flag the topic as a knowledge gap.

## Search Strategy
- **First**: Grep for exact error messages or codes in KB files
- **Second**: Glob for articles by category or product area
- **Third**: Grep for related keywords and synonyms
- **Fourth**: WebSearch for external documentation if local search yields nothing

## Relevance Criteria
- Matches the exact issue or error -- high relevance
- Matches the product area but different symptom -- medium relevance
- Tangentially related -- low relevance, include only if nothing better exists

## Output

```
Query: [search terms used]
Best Match: [article title or path] -- [one-line summary]
Additional Matches:
  - [article 2] -- [summary]
  - [article 3] -- [summary]
Knowledge Gap: [topic with no coverage, if any]
Recommended Solution: [brief answer extracted from best match]
```
