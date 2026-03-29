# Batch 89 updates

This batch is the final mobile and rendered-state QA sweep before the Batch 90 checkpoint.

## What changed
- made sticky-header offsets dynamic with a shared `--header-offset` variable
- improved result reveal scrolling with an extra follow-up pass after viewport changes
- added same-page anchor support for full-page hash links and ensured closed FAQ/details parents open before scrolling
- improved FAQ/detail scrolling when a panel is opened near the top of the viewport
- added safer target highlighting and overflow handling for result cards and anchored sections
- standardised small-screen stacking for quick links and inline result links

## Files changed
- `assets/css/base.css`
- `assets/js/base.js`

## Verification run
- `node --check assets/js/base.js`
- `python scripts/verify_static_site.py`
