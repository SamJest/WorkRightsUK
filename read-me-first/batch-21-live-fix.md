# Batch 21 live fix

## Issue fixed
Nested pages such as `/tools/.../index.html` were linking CSS, JS, favicon, and some nav links with paths that were one level too shallow.

## What was changed
- fixed asset paths on nested pages from `../assets/...` to `../../assets/...`
- fixed top navigation links on nested pages from `../...` to `../../...`
- fixed nested cross-section links where needed
- updated review tracking with a live-fix marker

## Files fixed
- tools/redundancy-pay-calculator/index.html
- tools/notice-period-calculator/index.html
- tools/holiday-entitlement-calculator/index.html
- tools/statutory-maternity-pay-calculator/index.html
- tools/statutory-paternity-pay-calculator/index.html
- tools/settlement-agreement-tax-checker/index.html
- tools/unfair-dismissal-compensation-estimator/index.html
- guides/statutory-redundancy-pay-guide/index.html
- guides/notice-period-rules-guide/index.html
- guides/holiday-entitlement-rules-guide/index.html
- guides/maternity-rights-guide/index.html
- guides/paternity-rights-guide/index.html
- guides/settlement-agreement-guide/index.html
- guides/paternity-pay-and-leave-guide/index.html
- guides/maternity-pay-and-leave-guide/index.html
- help/final-pay-and-leaving-a-job/index.html
- help/what-to-do-next-after-a-redundancy-offer/index.html
- help/what-to-do-next-if-you-may-not-qualify-for-smp-or-spp/index.html
- help/what-to-check-before-relying-on-a-settlement-package-figure/index.html
- compare/redundancy-vs-settlement-vs-final-pay/index.html
- compare/paternity-vs-maternity-vs-shared-parental/index.html
- compare/maternity-vs-paternity-vs-shared-parental/index.html
- about/how-workrightsuk-builds-pages/index.html
- data/reviews/review-status.json
