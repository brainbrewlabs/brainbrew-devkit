---
name: seo
description: >-
  Optimize content and pages for search engine visibility and ranking.
  Triggers on "improve SEO", "optimize for search", "fix meta tags", "add structured data",
  "keyword optimization", "search engine optimization". NOT for content creation or analytics.
allowed-tools: Read, Grep, Glob, Edit, Write
---

## When to Use

- Optimizing existing content for search rankings
- Auditing pages for technical SEO issues
- Adding or fixing meta tags, canonical URLs, structured data
- Improving heading structure and keyword placement
- Creating or updating XML sitemaps and robots.txt

## When NOT to Use

- Writing new content from scratch (use `content-creator` skill)
- Writing ad copy or CTAs (use `copywriter` skill)
- Analyzing traffic and performance data (use `analytics` skill)
- Publishing content to platforms (use `publishing` skill)

## Instructions

### 1. Technical SEO Audit

Check these critical elements first:
- HTTPS enabled
- robots.txt allows crawling of important pages
- No `noindex` on pages that should rank
- Canonical URLs set to prevent duplicate content
- XML sitemap present and submitted

See `references/technical_seo.md` for robots.txt, sitemap, and URL structure patterns.

### 2. On-Page Optimization

For each page, optimize:
- **Title tag**: 50-60 chars, primary keyword near beginning, unique per page
- **Meta description**: 150-160 chars, compelling CTA, includes keyword
- **Heading structure**: Single H1, logical hierarchy, keywords in H2s
- **Image SEO**: Descriptive filenames, alt text, lazy loading
- **Internal links**: Descriptive anchor text, link to relevant pages

See `references/on_page_seo.md` for examples and guidelines.

### 3. Structured Data

Add JSON-LD structured data for rich results. Common types:
- Organization, Article, Product, FAQ, BreadcrumbList

See `references/structured_data.md` for JSON-LD templates.

### 4. Mobile and International

- Verify responsive viewport meta tag
- Check tap target sizes (minimum 48x48px)
- Add hreflang tags for multi-language sites

See `references/mobile_international_seo.md` for implementation details.

### 5. SEO Audit Checklist

**Critical**: HTTPS, robots.txt, no accidental noindex, title tags, single H1
**High**: Meta descriptions, sitemap, canonicals, mobile-responsive
**Medium**: Structured data, internal linking, image alt text, breadcrumbs
**Ongoing**: Fix crawl errors, update sitemap, monitor rankings, fix broken links

## Output

Deliver an SEO report with:
- Issues found (critical/high/medium)
- Specific fixes applied or recommended
- Before/after for changed elements

## References

- `references/technical_seo.md` -- crawlability, sitemaps, URLs, HTTPS
- `references/on_page_seo.md` -- title tags, meta, headings, images, links
- `references/structured_data.md` -- JSON-LD templates for rich results
- `references/mobile_international_seo.md` -- responsive, tap targets, hreflang
