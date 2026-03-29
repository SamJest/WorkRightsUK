# Batch 29 - Mobile-first header, logo and top-layout polish

## What changed
- Switched the shared header logo image from the favicon asset to the full logo SVG for better visibility and fewer broken-logo cases on live pages.
- Added a mobile-friendly header treatment so navigation becomes a horizontally scrollable pill row instead of wrapping into a tall stacked block.
- Tightened top-of-page spacing and card padding on small screens so core pages feel less cramped.
- Added a skip link and `id="main-content"` target for better accessibility and keyboard navigation.
- Standardised the homepage header links to root-relative URLs for cleaner routing.
- Left the existing GA4 tag in place without duplicating it.

## Why this batch
The biggest remaining quality issue after the wording cleanup was perceived polish on mobile: the header, logo treatment and above-the-fold spacing were making the site feel less finished than it should. This batch improves that without changing the product scope.
