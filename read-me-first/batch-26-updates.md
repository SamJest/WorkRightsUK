# Batch 26 updates

## Summary
Batch 26 is a competitor-informed redundancy calculator interpretation pass.

## What changed
- Reworked the redundancy calculator page so the result behaves more like a decision aid, not just a number.
- Added a pre-result quick-action checklist near the calculator.
- Replaced weaker explanatory blocks with clearer practical panels on what the estimate means, what to ask HR/payroll, why figures differ, and what page to use next.
- Upgraded the redundancy result output in `assets/js/base.js` to show:
  - what the estimate includes
  - what it does not include
  - why the real figure may differ
  - what to do next
  - a clearer deadline reminder
- Added supporting CSS for richer result cards and checklists.
- Switched the redundancy calculator page to safer root-relative links for its own assets and core navigation routes.

## GA tag
- Left the existing GA4 tag in place.
- Did not duplicate the gtag snippet.

## Deploy note
Deploy the full zip so the updated page, JS and CSS ship together.
