# Batch 46 — search presentation and analytics/schema verification pass

## Main aim
Improve how WorkRightsUK presents in search and social previews, and make analytics/schema easier to verify in source files after deployment.

## Changes in this batch
- tightened titles and meta descriptions on the homepage, tools hub, help hub, compare page, about, contact and sources pages
- added stronger social tags across HTML pages and the shared base template:
  - `og:site_name`
  - `og:locale`
  - `og:image:alt`
  - `twitter:image`
  - `twitter:image:alt`
  - `theme-color`
- upgraded the shared base template schema so it now carries both `WebSite` and `Organization` JSON-LD
- added extra schema where useful:
  - homepage `FAQPage`
  - tools/help hubs `WebPage`
  - leaving-work compare page `ItemList`
- lightly tightened homepage, tools hub and help hub intro wording for better snippet alignment

## Analytics verification note
The GA4 snippet with measurement ID `G-YBL4G4K19Y` is already present in the working build and remains in place in this batch.

## Why this batch matters
The post-deploy recrawl suggested the product itself is much stronger than before, but search presentation and verification were still leaving value on the table. This batch improves the visible metadata layer without expanding scope.
