---
name: rollback
description: >-
  Roll back a deployment to the previous stable version when failures or critical issues occur.
  Triggers on 'rollback', 'revert deployment', 'undo deploy', 'restore previous version'.
  NOT for code-level reverts or database migration rollbacks without explicit confirmation.
allowed-tools: Bash
---

## When to Use
- Deployment health checks are failing
- Critical alerts triggered after a new deployment
- User explicitly requests a rollback
- Service is down or severely degraded after deploy

## When NOT to Use
- **Database migration rollbacks** -- these can cause data loss. Only proceed with explicit user confirmation and a tested down-migration path.
- **Reverting code changes in git** -- use `git revert` manually instead
- **Partial feature rollbacks** -- use feature flags or targeted code fixes instead
- **Issues unrelated to the latest deployment** -- investigate with `alert-handling` first

## Safety Notes
- Always confirm the target rollback version with the user before executing
- Rollback does NOT undo database schema changes -- verify migration state separately
- After rollback, the previous deployment artifacts must still be available (images, binaries)
- Document the rollback reason for post-incident review

## Instructions

### 1. Confirm the rollback target

Identify the previous stable version or deployment:
```bash
# Kubernetes
kubectl rollout history deployment/[app] -n [namespace]

# Docker
docker service ls
docker image ls [app] --format "{{.Tag}}"

# Git tags
git tag --sort=-creatordate | head -5
```

### 2. Execute the rollback

Run the rollback command for the platform:
```bash
# Kubernetes
kubectl rollout undo deployment/[app] -n [namespace]
kubectl rollout status deployment/[app] -n [namespace]

# Docker Swarm
docker service update --rollback [service]

# Cloud platforms
vercel rollback [deployment-id]
```

### 3. Verify health after rollback

Run health checks to confirm the rollback succeeded:
```bash
# HTTP health
curl -sf https://[app-url]/health

# Kubernetes pods
kubectl get pods -n [namespace]

# Docker containers
docker ps --filter name=[app]
```

### 4. Document the incident

Record the rollback details: what failed, when, what version was restored, and current health status.

## Output

```
## Rollback Report

### Trigger
- Reason: [deployment failure / alert / manual request]
- Failed version: [version/tag]
- Rolled back to: [version/tag]
- Time: [timestamp]

### Actions Taken
| Step | Action | Status | Duration |
|------|--------|--------|----------|
| 1 | Identify rollback target | Done | -- |
| 2 | Execute rollback | [OK/FAIL] | Xs |
| 3 | Health check | [PASS/FAIL] | Xs |

### Current State
- Version: [rolled back version]
- Health: [HEALTHY / DEGRADED]
- Traffic: [restored / partial]

### Verdict
[STABLE / ESCALATE] - [reason]
```
