# Batch 24 updates

## Focus
Batch 24 is a search-presentation and routing pass, not a topic-expansion batch.

## What changed
- confirmed the GA4 tag `G-YBL4G4K19Y` was already present and left it in place rather than duplicating it
- tightened homepage title and description for a clearer SERP proposition
- added structured data to the homepage: `WebSite`, `Organization`, and `ItemList`
- added structured data to the three core tools where justified: `WebApplication` and `BreadcrumbList`
- added FAQ schema to the notice calculator and compare page
- upgraded the compare page title, description, and top-of-page route chooser so users can identify the right path faster
- added extra search-intent framing and route guidance to the redundancy calculator
- kept the batch focused on stronger snippets, clearer routing, and better trust signals rather than adding more pages

## Why this batch matters
Competitors often win the click or reduce bounce by explaining the route more clearly in the SERP and by helping users choose the right page faster once they land. This batch closes that gap without bloating the site.

## Files changed
- `index.html`
- `templates/base.html`
- `tools/redundancy-pay-calculator/index.html`
- `tools/notice-period-calculator/index.html`
- `tools/holiday-entitlement-calculator/index.html`
- `compare/redundancy-vs-settlement-vs-final-pay/index.html`

## Deploy check
After deployment:
1. view source on the homepage and confirm the JSON-LD blocks are present
2. test the compare page and confirm the new quick-chooser cards render correctly
3. inspect the redundancy, notice, and holiday pages to confirm the breadcrumb and web-application schema blocks appear in source
4. confirm GA still appears once in the head rather than being duplicated
