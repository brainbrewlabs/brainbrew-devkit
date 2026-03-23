---
name: monitoring
description: >-
  Monitor application health, resource usage, and service availability.
  Triggers on 'check health', 'monitor services', 'check status', 'is the app up'.
  NOT for handling alerts (use alert-handling) or rolling back (use rollback).
allowed-tools: Bash, Read
---

## When to Use
- Checking service health and availability after deployment
- Reviewing resource usage (CPU, memory, disk)
- Gathering metrics for status reports
- Verifying services are running correctly

## When NOT to Use
- Responding to specific alerts or incidents -- use `alert-handling`
- Rolling back a failed deployment -- use `rollback`
- Deep performance profiling -- use `performance-analysis`
- Security scanning -- use `security-auditor`

## Instructions

### 1. Check service health

Run health check commands via `Bash` based on the deployment platform:

```bash
# HTTP health endpoint
curl -sf https://[app-url]/health && echo "HEALTHY" || echo "UNHEALTHY"

# Kubernetes
kubectl get pods -n [namespace]
kubectl get deployments -n [namespace]

# Docker
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
docker stats --no-stream
```

### 2. Check resource usage

```bash
# Container resources
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Kubernetes resources
kubectl top pods -n [namespace]
kubectl top nodes

# System resources
df -h
free -m
```

### 3. Check logs for errors

```bash
# Kubernetes logs
kubectl logs -l app=[app] --tail=50 -n [namespace]

# Docker logs
docker logs [container] --tail=50 --since=1h

# System logs
journalctl -u [service] --since "1 hour ago" --no-pager | tail -50
```

### 4. Assess overall status

Classify the overall system status:
- **HEALTHY**: All services up, resources within thresholds, no errors
- **DEGRADED**: Some services impaired, elevated error rates, resource warnings
- **DOWN**: Critical services unavailable, health checks failing

## Output

```
## Monitoring Report

### Status: [HEALTHY / DEGRADED / DOWN]

### Services
| Service | Status | Latency | Error Rate |
|---------|--------|---------|------------|
| [name] | UP/DOWN | [ms] | [%] |

### Resources
| Resource | Current | Threshold | Status |
|----------|---------|-----------|--------|
| CPU | [%] | 80% | OK/WARN |
| Memory | [MB] | [limit] | OK/WARN |
| Disk | [%] | 90% | OK/WARN |

### Recent Errors (last 1h)
- [error summary from logs]

### Recommendations
- [actionable next steps if any issues found]
```
