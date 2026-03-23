# Mobile and International SEO

## Responsive Design

```html
<!-- Bad: fixed width -->
<meta name="viewport" content="width=1024">

<!-- Good: responsive viewport -->
<meta name="viewport" content="width=device-width, initial-scale=1">
```

## Tap Targets

```css
/* Bad: too small for mobile */
.small-link {
  padding: 4px;
  font-size: 12px;
}

/* Good: adequate tap target */
.mobile-friendly-link {
  padding: 12px;
  font-size: 16px;
  min-height: 48px;
  min-width: 48px;
}
```

## Font Sizes

```css
/* Bad: too small on mobile */
body { font-size: 10px; }

/* Good: readable without zooming */
body { font-size: 16px; line-height: 1.5; }
```

## Hreflang Tags (International)

```html
<!-- For multi-language sites -->
<link rel="alternate" hreflang="en" href="https://example.com/page">
<link rel="alternate" hreflang="es" href="https://example.com/es/page">
<link rel="alternate" hreflang="fr" href="https://example.com/fr/page">
<link rel="alternate" hreflang="x-default" href="https://example.com/page">
```

## Language Declaration

```html
<html lang="en">
<!-- or for regional variants -->
<html lang="es-MX">
```

## International SEO Checklist

- [ ] Correct hreflang tags on all language variants
- [ ] x-default set for language selector page
- [ ] Language declared in HTML tag
- [ ] Content properly translated (not machine-only)
- [ ] Local domain or subdirectory structure consistent
