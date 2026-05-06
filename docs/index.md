---
layout: home
hero:
  name: Brainbrew Devkit
  text: Self-correcting agent chains for Claude Code and opencode
  tagline: Agents take turns — one plans, one codes, one reviews, one tests, one commits. If an agent fails, another fixes it and the chain retries automatically.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Build a Chain
      link: /guide/chain-workflow
    - theme: alt
      text: View on GitHub
      link: https://github.com/brainbrewlabs/brainbrew-devkit
features:
  - title: Self-Correcting Chains
    details: Failures auto-route to a fixer, then re-enter the chain. No babysitting.
  - title: AI-Powered Routing
    details: Haiku reads each agent's output against a `decide:` prompt and picks the next route.
  - title: Auto Context Passing
    details: Each agent's full output is injected into the next agent's prompt — no glue code.
  - title: Agent Teams
    details: Run multiple agents in parallel at a chain step, with coordinated synthesis.
  - title: Memory Bus
    details: Inter-agent state sharing across chain runs and sessions.
  - title: No Vendor Lock-in
    details: Chains live as YAML in your repo. Agents are markdown. Runs on your Claude Code or opencode subscription.
---

