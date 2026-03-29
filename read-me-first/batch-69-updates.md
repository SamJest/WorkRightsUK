# Batch 69 updates

This batch is the final mobile and rendered-state QA sweep before the Batch 70 checkpoint.

## What changed
- improved shared result scrolling so calculated results land below the sticky header instead of hiding under it
- made result reveal scrolling work across screen sizes and respect reduced-motion preferences
- tightened shared small-screen spacing and full-width action behaviour for inline links and button rows
- improved FAQ summary behaviour and visual affordance on rendered pages
- added safer overflow and wrapping rules for rendered result cards and mobile modules
- added reduced-motion CSS handling for smoother accessibility and more predictable rendered states

## Main files changed
- `assets/css/base.css`
- `assets/js/base.js`

## Notes
- This batch is cumulative on top of Batch 68
- Batch 70 should be the full checkpoint zip carrying everything from 56 to 69
