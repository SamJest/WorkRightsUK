# Batch 60 - Holiday mode-selector pass

## Focus
Make the holiday route behave more like a real chooser for regular-pattern checks, instead of one flat calculator with a disclaimer.

## Main changes
- tightened the holiday page title and description around route choice
- added a visible mode-selector block for:
  - standard
  - starter
  - leaver
  - use GOV.UK instead
- added a dynamic holiday-mode callout and mode-specific input hint
- improved the holiday result so it shows the selected mode more clearly
- added a mode-specific “best next page” card in the result
- strengthened the holiday FAQ/schema around mode choice and handoff
- updated CSS for the new mode-selector cards and active state
- checked shared JS syntax after editing

## Files changed
- `tools/holiday-entitlement-calculator/index.html`
- `assets/js/base.js`
- `assets/css/base.css`

## Deploy note
This is cumulative and should be applied on top of Batch 59.
