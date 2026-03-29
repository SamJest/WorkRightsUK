# Batch 79 updates

This batch is the final mobile and rendered-state QA sweep before the Batch 80 full checkpoint.

## What changed

- improved shared result scrolling so results land more reliably below the sticky header
- added a second delayed scroll pass after result reveal to reduce cases where the result sits slightly too high on mobile
- added same-page anchor scrolling with sticky-header offset support for in-page help links and hash targets
- improved result action rows so buttons and links stack more cleanly on smaller screens
- improved FAQ summary tap areas and open-state styling for better rendered usability
- added broader `scroll-padding-top` / `scroll-margin-top` safeguards for anchored sections

## Files changed

- `assets/css/base.css`
- `assets/js/base.js`

## Notes

- JS syntax checked after editing
- No scope expansion in this batch
- GA4 left untouched
