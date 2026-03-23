# On-Page SEO

## Title Tags

```html
<!-- Bad: generic -->
<title>Page</title>

<!-- Good: descriptive with primary keyword -->
<title>Blue Widgets for Sale | Premium Quality | Example Store</title>
```

**Guidelines:**
- 50-60 characters (Google truncates around 60)
- Primary keyword near the beginning
- Unique for every page
- Brand name at end (unless homepage)
- Action-oriented when appropriate

## Meta Descriptions

```html
<!-- Bad: empty or duplicate -->
<meta name="description" content="">

<!-- Good: compelling and unique -->
<meta name="description" content="Shop premium blue widgets with free shipping. 30-day returns. Rated 4.9/5 by 10,000+ customers. Order today and save 20%.">
```

**Guidelines:**
- 150-160 characters
- Include primary keyword naturally
- Compelling call-to-action
- Unique for every page
- Matches page content

## Heading Structure

```html
<!-- Bad: skipped levels, multiple H1s -->
<h2>Welcome</h2>
<h4>Products</h4>
<h1>Contact Us</h1>

<!-- Good: proper hierarchy -->
<h1>Blue Widgets - Premium Quality</h1>
  <h2>Product Features</h2>
    <h3>Durability</h3>
    <h3>Design</h3>
  <h2>Customer Reviews</h2>
  <h2>Pricing</h2>
```

**Guidelines:**
- Single H1 per page (the main topic)
- Logical hierarchy (don't skip levels)
- Include keywords naturally
- Descriptive, not generic

## Image SEO

```html
<!-- Bad -->
<img src="IMG_12345.jpg">

<!-- Good -->
<img src="blue-widget-product-photo.webp"
     alt="Blue widget with chrome finish, side view showing control panel"
     width="800" height="600"
     loading="lazy">
```

**Guidelines:**
- Descriptive filenames with keywords
- Alt text describes the image content
- Compressed and properly sized
- WebP/AVIF with fallbacks
- Lazy load below-fold images

## Internal Linking

```html
<!-- Bad: non-descriptive -->
<a href="/products">Click here</a>

<!-- Good: descriptive anchor text -->
<a href="/products/blue-widgets">Browse our blue widget collection</a>
```

**Guidelines:**
- Descriptive anchor text with keywords
- Link to relevant internal pages
- Reasonable number of links per page
- Fix broken links promptly
- Use breadcrumbs for hierarchy
