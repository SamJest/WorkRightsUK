# Deploy Me First

This folder contains the cumulative WorkRightsUK build through Batch 88.

Recommended use:
- deploy directly from the latest cumulative checkpoint zip or the latest cumulative batch zip
- keep the most recent full checkpoint zip untouched as your clean backup
- treat the numbered batch zips as working references between checkpoints

Before deployment:
- you do **not** need to run `python scripts/build.py` for this static pack
- you can optionally run `python scripts/verify_static_site.py` for a local check before deploy
- upload or paste the built files and folders directly to the project root on your host

Suggested checks after deployment:
- homepage, tools, guides, help, compare, sources, contact and about pages load
- unfair dismissal, redundancy, holiday, notice and settlement tool pages load
- `robots.txt` is reachable
- `sitemap.xml` is reachable and includes the current public pages
- view source on the homepage and confirm `G-YBL4G4K19Y` appears once
- view source on the homepage and confirm at least one `application/ld+json` block is present
- in GA4 Realtime, confirm your own visit is detected after opening a few pages
- in Google Search Console, inspect the homepage and one key tool page, then request indexing only if needed
- spot-check one page for canonical, title, description, robots, OG tags and JSON-LD presence

Optional local verification command:
- `python scripts/verify_static_site.py`

Verification outputs written by the script:
- `verify_out.txt`
- `verify-report.json`
