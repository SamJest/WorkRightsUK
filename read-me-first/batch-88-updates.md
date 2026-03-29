# Batch 88 updates

## Focus
Search surface and instrumentation verification.

## What changed
- expanded the local static-site verifier to check robots directives, OG/Twitter image tags, theme color and favicon presence
- added machine-readable verification output at `verify-report.json`
- refreshed `verify_out.txt` from the updated verifier
- updated README and deployment notes with explicit source-view checks for GA4 and JSON-LD
- added a dedicated Batch 88 verification checklist
- standardised robots directives across public pages to support fuller snippet and image-preview behaviour

## Deployment note
No build step is required. This remains a direct static upload pack.
