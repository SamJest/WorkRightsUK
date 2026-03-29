# Batch 22 updates

## Core goal
Make the live site feel less like an iterating project and more like a polished employment-rights product, while also guaranteeing GA4 is installed sitewide.

## What changed
- inserted GA4 tag `G-YBL4G4K19Y` sitewide across exported HTML pages
- inserted the same GA4 tag into `templates/base.html` so future builds keep it
- rebuilt the homepage structure to fix malformed HTML and remove visible batch/build language
- rewrote the four key user-facing pages for cleaner trust framing and clearer route selection:
  - redundancy pay calculator
  - notice period calculator
  - holiday entitlement calculator
  - redundancy vs settlement vs final pay compare page
- removed visible phrases like `competition-improved`, `build status`, and batch references from those key pages

## Why this batch matters
Competitors often do a better job of sounding finished and trustworthy even when their actual tool logic is weaker. This batch closes that gap by improving presentation, route clarity, and trust cues without broadening site scope.

## Deployment notes
- deploy the full batch zip
- after deploy, hard refresh the live site and check page source for `G-YBL4G4K19Y`
- recheck homepage HTML in the browser because the previous reference build had content appearing after the closing `</html>`

## Suggested next batch
Batch 23 should focus on result-box UX and snippet quality on the settlement, redundancy, and final-pay pages: tighter result explanations, stronger title/meta alignment, and better internal link prompts immediately after calculation results.
