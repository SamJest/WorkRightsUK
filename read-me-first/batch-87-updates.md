# Batch 87 — unfair-dismissal maturity pass

## What changed
- tightened the unfair-dismissal page so it is more clearly document-led
- rewrote the top copy so users know to stay on this page only when the dismissal itself is the real issue
- added a clearer first-route chooser from dismissal letter / payslip / settlement / redundancy paperwork
- strengthened the unfair-dismissal result wording in `assets/js/base.js`
- improved compare-page unfair-dismissal routing
- improved final-pay signposting into unfair dismissal
- updated the tools-hub unfair-dismissal card
- refreshed review-status data for the unfair-dismissal, compare, final-pay and tools routes

## Files changed
- `tools/unfair-dismissal-compensation-estimator/index.html`
- `assets/js/base.js`
- `compare/redundancy-vs-settlement-vs-final-pay/index.html`
- `help/final-pay-and-leaving-a-job/index.html`
- `tools/index.html`
- `data/reviews/review-status.json`

## Verification
- ran `node --check assets/js/base.js`
- ran `python scripts/verify_static_site.py`
