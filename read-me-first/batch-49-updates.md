# Batch 49 updates

## Focus
Settlement breakdown polish, mixed-package clarity, and a reliability fix in the shared calculator script.

## Main changes
- Fixed parsing problems in `assets/js/base.js` caused by unescaped apostrophes inside result strings.
- Upgraded the settlement checker result output so it now separates:
  - payroll-style items usually taxed as earnings
  - compensation-style items to check against the qualifying termination-payment rules
  - the part potentially within the combined £30,000 threshold
  - the part above that threshold
- Added clearer ordered checks on the written agreement and a better “best next page” route inside the settlement result.
- Rewrote key settlement-page copy so it explains the job of the checker more clearly and uses stronger public-facing wording.
- Added extra FAQ/schema coverage for PILON, holiday pay, wages and the combined £30,000 threshold.
- Strengthened the final-pay page with a clearer “split the combined offer first” message.
- Tightened the compare page’s settlement-route wording so mixed-package users choose the right first page faster.

## Deployment note
This batch is cumulative on top of Batch 48 and is ready to carry forward into the next offline batches.
