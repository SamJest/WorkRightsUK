# WorkRightsUK

Static UK employment-rights site focused on practical calculators, comparison pages, help routes and source-backed guides.

## Current state
This pack contains the cumulative working build through Batch 88.

## Main live routes in the build
- redundancy pay calculator
- notice period calculator
- holiday entitlement calculator
- settlement agreement tax checker
- unfair dismissal compensation estimator
- final pay and leaving a job help page
- redundancy vs settlement vs final pay compare page

## Deployment
This is a static deployment pack. Upload the files and folders directly to the project root on your host.

## Build script
`scripts/build.py` is only a lightweight helper message in this pack. It is not required for deployment.

## Optional local verification
Run `python scripts/verify_static_site.py` before deploy if you want a quick local check for GA4, JSON-LD, canonicals, metadata, robots directives, social tags and sitemap coverage.

This also writes:
- `verify_out.txt` for a readable summary
- `verify-report.json` for a machine-readable verification report

## Post-deploy checks
Check the homepage, core tools, compare page, sources page, `robots.txt`, and `sitemap.xml`. Then verify GA4 is receiving visits, spot-check canonicals, metadata and structured data on the main pages, and inspect the homepage source for the GA4 measurement ID and JSON-LD blocks.
