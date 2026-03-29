# Batch 88 verification checklist

Use this after uploading the static files.

## Browser-source checks
- homepage source contains `G-YBL4G4K19Y` exactly once
- homepage source contains at least one `application/ld+json` block
- one core tool page contains canonical, title, meta description, OG tags and Twitter tags
- 404 page contains `noindex,follow`

## Search / indexing checks
- `robots.txt` loads
- `sitemap.xml` loads
- Search Console can inspect the homepage and one core tool page
- sitemap covers unfair dismissal, redundancy, holiday, settlement, final pay and compare routes

## Analytics checks
- GA4 Realtime shows your own visit after opening several pages
- no duplicate pageviews are obvious from repeated test navigation

## Local pre-deploy checks
- run `python scripts/verify_static_site.py`
- open `verify_out.txt`
- optionally inspect `verify-report.json` for duplicates or missing tags
