---
name: content-creator
description: >-
  Create marketing content with consistent brand voice and SEO optimization.
  Triggers on "write a blog post", "create content", "brand voice", "content calendar",
  "social media post", "content strategy". NOT for editing existing content or analytics.
allowed-tools: Read, Glob, Grep, Edit, Write
---

## When to Use

- Writing new blog posts, articles, or long-form content
- Establishing or applying brand voice guidelines
- Creating social media content for specific platforms
- Planning content calendars and editorial schedules
- Repurposing content across multiple formats

## When NOT to Use

- Editing or proofreading existing content (use `editing` skill)
- Writing ad copy, headlines, or CTAs (use `copywriter` skill)
- Optimizing existing content for search engines (use `seo` skill)
- Analyzing content performance metrics (use `analytics` skill)
- Publishing or distributing finished content (use `publishing` skill)

## Instructions

### 1. Define Brand Voice

Establish voice before writing. Select 3-5 tone attributes from these dimensions:

- **Formality**: casual, conversational, professional, academic
- **Tone**: friendly, authoritative, playful, serious, empathetic
- **Perspective**: first-person, second-person (recommended for marketing), third-person

See `references/brand_guidelines.md` for voice archetypes and consistency checklist.

### 2. Structure Content

Choose the appropriate framework for your content type:

- Blog post: Hook > Problem > Solution > Examples > CTA
- How-to guide: Overview > Step-by-step > Tips > Next steps
- Listicle: Introduction > Numbered items > Summary
- Case study: Challenge > Approach > Results > Takeaways

See `references/content_frameworks.md` for detailed templates.

### 3. Write the Draft

1. Start with audience pain point or question
2. Write headline with primary keyword
3. Draft body using chosen framework
4. Include 1-3 relevant examples or data points
5. End with clear call-to-action

### 4. Optimize for Platform

Adapt content based on target platform constraints and best practices.
See `references/social_media_optimization.md` for platform-specific guidelines.

### 5. Quality Check

- Readability appropriate for target audience
- Consistent brand voice throughout
- Clear value proposition in first paragraph
- Actionable takeaways for reader
- Proper heading hierarchy (single H1, logical H2/H3)

## Output

Deliver finished content in markdown with:
- Title and meta description suggestion
- Target keyword noted
- Platform adaptation notes (if multi-platform)

## References

- `references/brand_guidelines.md` -- voice archetypes and consistency
- `references/content_frameworks.md` -- templates for each content type
- `references/social_media_optimization.md` -- platform specs and best practices
