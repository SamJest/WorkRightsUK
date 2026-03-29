# Batch 27 updates

## Main focus
Holiday entitlement + final-pay route clarity, plus nested-page path fixes that were breaking shared assets and nav on live subpages.

## What changed
- Fixed nested page asset and navigation paths by switching key shared references to root-relative URLs on subpages.
- Reworked the holiday calculator page so it now fits leaving-work journeys better instead of reading like a standalone entitlement page only.
- Improved the holiday calculator result copy in `assets/js/base.js` so users get clearer next-step guidance around final pay.
- Expanded the final-pay help page to make it easier to decide when to use holiday, notice, settlement or compare routes.
- Improved the compare page so mixed leaving-work situations route more naturally into final pay, notice and holiday pages.
- Kept the existing GA4 tag in place without duplicating it.

## Files changed
- `assets/js/base.js`
- `tools/holiday-entitlement-calculator/index.html`
- `help/final-pay-and-leaving-a-job/index.html`
- `compare/redundancy-vs-settlement-vs-final-pay/index.html`
- Multiple nested HTML pages updated for root-relative shared asset/navigation paths

## Why this batch matters
Batch 26 improved redundancy interpretation, but subpage asset paths were still unsafe and the holiday/final-pay journey was not yet strong enough for mixed leaving-work scenarios. Batch 27 fixes both.
