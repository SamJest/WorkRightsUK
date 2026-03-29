# Batch 54 — Mobile-first UX micro-polish

## What changed

This batch focuses on small-screen usability and scan speed before the Batch 55 redeploy checkpoint.

### Shared UX improvements
- increased tap-target consistency across buttons, nav pills and quick links
- added stronger focus states for inputs, buttons and links
- improved input focus styling for clearer active-field feedback
- added `scroll-margin-top` so anchored sections and revealed results do not tuck under the sticky header
- ensured hidden result boxes stay fully hidden until needed
- added a light reveal animation for result panels
- improved overflow handling on cards and result panels so long text wraps more safely on narrow screens

### Mobile improvements
- set mobile form fields to `16px` sizing to avoid browser zoom jumps on phones
- tightened section spacing and reduced heavy panel padding on smaller screens
- reduced text-density issues in helper text and notes
- made compare rows easier to scan on mobile by visually separating stacked cells
- reduced footer spacing for a cleaner mobile finish

### Result behaviour
- added automatic smooth scroll and focus to the result box after calculation on mobile
- this applies across the shared calculator script so users land on the result instead of staying above it after tapping calculate

## Files changed
- `assets/css/base.css`
- `assets/js/base.js`

## Why this batch matters
The site already reads much better than before, but on mobile the difference between a usable calculator and a frustrating one is often tiny: tap target size, input zoom behaviour, result visibility, and how fast users can see the answer after submit.

This batch improves those details without changing scope or adding new public content.
