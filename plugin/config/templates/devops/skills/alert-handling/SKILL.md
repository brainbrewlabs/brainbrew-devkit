---
name: alert-handling
description: >-
  Triage and respond to monitoring alerts by assessing severity, diagnosing root cause, and deciding on action.
  Triggers on 'handle alert', 'investigate alert', 'service is down', 'error rate spike', 'incident response'.
  NOT for proactive monitoring (use monitoring) or executing rollbacks (use rollback).
allowed-tools: Bash, Read
---

## When to Use
- A monitoring alert has fired and needs triage
- A service is reported down or degraded
- Error rates or latency have spiked
- An incident needs initial investigation and response decision

## When NOT to Use
- Proactive health checks with no active alert -- use `monitoring`
- Executing a rollback -- use `rollback` (this skill decides IF rollback is needed, but does not execute it)
- Performance profiling or optimization -- use `performance-analysis`
- Security vulnerability scanning -- use `security-auditor`

## How This Differs from Related Skills
- **monitoring**: Proactively checks health. Alert-handling reacts to a triggered alert.
- **rollback**: Executes the rollback. Alert-handling investigates and recommends whether rollback is needed.
- **performance-analysis**: Deep profiling. Alert-handling does quick triage to determine urgency.

## Instructions

### 1. Assess the alert

Gather context about the alert -- what service, what metric, when it started:
```bash
# Check service status
kubectl get pods -n [namespace]
docker ps -a

# Check recent logs for errors
kubectl logs -l app=[app] --tail=100 -n [namespace]
docker logs [container] --tail=100 --since=10m
```

### 2. Classify severity

- **CRITICAL**: Service down, data loss risk, security breach, SLA violation. Requires immediate action.
- **HIGH**: Error rate spike, latency degradation, resource exhaustion. Requires urgent investigation.
- **MEDIUM**: Warning thresholds crossed, capacity concerns. Schedule investigation.
- **LOW**: Informational, trend anomalies. Monitor and log.

### 3. Correlate with recent changes

Check if the alert correlates with a recent deployment or configuration change:
```bash
# Recent deployments
kubectl rollout history deployment/[app] -n [namespace]
git log --oneline -5

# Recent config changes
kubectl get events -n [namespace] --sort-by='.lastTimestamp' | tail -10
```

### 4. Determine response action

Based on severity and root cause analysis:
- **CRITICAL + recent deploy**: Recommend `rollback` skill
- **CRITICAL + no recent deploy**: Escalate to human operator
- **HIGH**: Investigate further, check if self-healing, recommend fix
- **MEDIUM/LOW**: Log findings, continue monitoring

### 5. Execute or recommend

For non-destructive diagnostic actions, execute them directly. For destructive actions (rollback, restart, scale-down), recommend the appropriate skill or escalate.

## Output

```
## Alert Response Report

### Alert Details
- Severity: [CRITICAL / HIGH / MEDIUM / LOW]
- Service: [service name]
- Metric: [what triggered the alert]
- Started: [timestamp]
- Duration: [Xm]

### Diagnosis
| Check | Status | Details |
|-------|--------|---------|
| Service health | OK/FAIL | [details] |
| Error rate | OK/ELEVATED | [X%] |
| Latency | OK/DEGRADED | [Xms] |
| Recent deploy | YES/NO | [version] |

### Root Cause (preliminary)
[Initial analysis based on logs and metrics]

### Action
[What was done or what is recommended]

### Verdict
[RESOLVED / ROLLBACK / ESCALATE / MONITOR] - [reason]
```
