---
name: deployment
description: >-
  Deploy applications to target environments with build, tag, deploy, and health verification steps.
  Triggers on 'deploy to', 'release to staging', 'push to production', 'deploy this'.
  NOT for rollbacks (use rollback) or monitoring after deploy (use monitoring).
allowed-tools: Bash
---

## When to Use
- Deploying to staging, production, or other environments
- Building and tagging release artifacts
- Running health checks after deployment

## When NOT to Use
- Rolling back a failed deployment -- use `rollback`
- Monitoring after deployment -- use `monitoring`
- Running tests before deploy -- use `testing`
- Investigating deployment alerts -- use `alert-handling`

## Safety Checks

**Before ANY deployment, verify:**
1. Confirm the target environment with the user (staging vs production)
2. Ensure tests have passed (check with user or CI status)
3. Never deploy directly to production without explicit user confirmation
4. Check that the working directory is clean (`git status`)

## Instructions

### 1. Build artifacts

Run the project build command via `Bash`:
```bash
# Node.js
npm run build

# Docker
docker build -t [image]:[tag] .

# Go
go build ./...
```

Verify the build succeeds before proceeding. If it fails, stop and report.

### 2. Tag the release

Create a git tag for the release version:
```bash
git tag -a v[version] -m "Release v[version]"
```

### 3. Deploy to target environment

Execute the deployment command for the target platform:
```bash
# Kubernetes
kubectl apply -f k8s/

# Docker
docker push [image]:[tag]

# Cloud platforms
vercel deploy / netlify deploy / aws deploy
```

### 4. Verify with health checks

Run health checks to confirm the deployment is healthy:
```bash
curl -f https://[app-url]/health
```

Wait up to 60 seconds for the service to become healthy. If health check fails after retries, report failure and suggest using the `rollback` skill.

### 5. Handle failure

If deployment or health checks fail, do NOT attempt automatic rollback. Instead, report the failure clearly and recommend invoking the `rollback` skill.

## Output

```
## Deployment Report

### Environment
- Target: [staging/production]
- Version: [tag/commit]
- Time: [timestamp]

### Steps
- [ ] Build: [PASS/FAIL]
- [ ] Tag: [version]
- [ ] Deploy: [PASS/FAIL]
- [ ] Health check: [PASS/FAIL]

### Endpoints
- App: [url]
- Health: [url]

### Verdict
[SUCCESS / FAILED] - [details]
```
