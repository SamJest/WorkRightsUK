# Batch 78 verification checklist

## Local optional check
Run:

```bash
python scripts/verify_static_site.py
```

## Before deploy
- confirm the script reports no missing GA4 or JSON-LD warnings on core public pages
- confirm `sitemap.xml` contains the current public routes
- confirm `robots.txt` still points to the live sitemap

## After deploy
- view source on the homepage and confirm `G-YBL4G4K19Y` appears once
- view source on the homepage and confirm at least one `application/ld+json` block is present
- open GA4 Realtime and check that a page view is detected
- inspect the homepage and one core tool page in Search Console if needed
