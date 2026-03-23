---
name: performance-analysis
description: >-
  Analyze application performance, identify bottlenecks, and compare against baselines.
  Triggers on 'check performance', 'analyze latency', 'profile app', 'bundle size check'.
  NOT for runtime monitoring (use monitoring) or fixing issues (use code-fixing).
allowed-tools: Bash, Read
---

## When to Use
- Measuring response times, latency percentiles, or throughput
- Checking bundle size or build output size
- Comparing current metrics against known baselines
- Identifying performance bottlenecks before or after deployment

## When NOT to Use
- Ongoing runtime monitoring -- use `monitoring`
- Fixing performance issues in code -- use `code-fixing`
- Handling alerts about performance degradation -- use `alert-handling`
- Security scanning -- use `security-auditor`

## Instructions

### 1. Collect metrics

Run measurement commands via `Bash`:

```bash
# Measure HTTP response time (inline format string, no external file)
curl -w "\n  time_namelookup: %{time_namelookup}s\n  time_connect: %{time_connect}s\n  time_appconnect: %{time_appconnect}s\n  time_starttransfer: %{time_starttransfer}s\n  time_total: %{time_total}s\n  http_code: %{http_code}\n  size_download: %{size_download} bytes\n" -s -o /dev/null [url]

# Check build/bundle size
du -sh dist/ build/ out/ 2>/dev/null

# Node.js bundle analysis (if available)
npm run analyze 2>/dev/null || npx webpack-bundle-analyzer stats.json 2>/dev/null

# Container resource usage
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null
```

### 2. Compare against baselines

If baseline values are known (from previous reports, CI artifacts, or documentation), compare current metrics:
- Response time regression: flag if P95 increased by > 20%
- Bundle size regression: flag if size increased by > 10%
- Memory regression: flag if usage increased by > 25%

Use `Read` to check for baseline files (e.g., `performance-baseline.json`, CI artifacts).

### 3. Identify bottlenecks

Analyze collected data for:
- Slow endpoints (response time > 500ms)
- Large bundles (> 200KB gzipped for web apps)
- Memory leaks (steadily increasing usage)
- Database query hotspots (if query logs are available)

### 4. Prioritize recommendations

Rank optimization opportunities by impact:
- **HIGH**: Blocking deployment (SLA violations, major regressions)
- **MEDIUM**: Worth fixing soon (noticeable user impact)
- **LOW**: Nice to have (minor optimizations)

## Output

```
## Performance Analysis Report

### Metrics
| Metric | Current | Baseline | Delta | Status |
|--------|---------|----------|-------|--------|
| P50 latency | Xms | Xms | +X% | OK/WARN |
| P95 latency | Xms | Xms | +X% | OK/WARN |
| Bundle size | XKB | XKB | +X% | OK/WARN |
| Memory | XMB | XMB | +X% | OK/WARN |

### Bottlenecks
| Priority | Component | Issue | Impact |
|----------|-----------|-------|--------|
| HIGH | [component] | [issue] | [impact] |

### Recommendations
1. [Actionable optimization with expected impact]

### Verdict
[PASS / OPTIMIZE / BLOCK] - [reason]
```
