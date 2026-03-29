# WorkRightsUK

Static UK employment-rights site focused on practical calculators, comparison pages, help routes and source-backed guides.

## Current state
This pack contains the cumulative working build through Batch 78.

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

## Post-deploy checks
Check the homepage, core tools, compare page, sources page, `robots.txt`, and `sitemap.xml`. Then verify GA4 is receiving visits and spot-check canonicals, metadata and structured data on the main pages.


## Optional local verification
Run `python scripts/verify_static_site.py` if you want a quick local check for GA4, JSON-LD, canonicals, metadata and sitemap coverage before deploying.
