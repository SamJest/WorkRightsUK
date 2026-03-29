# Batch 75 — final-pay bridge-page upgrade

This batch makes the **Final Pay and Leaving a Job** page a stronger first bridge when notice, holiday, PILON, wages, redundancy, settlement, or deductions are mixed together.

## Main changes
- strengthened the final-pay page title, description, schema description, and opening copy
- made the page more direct about using final pay **before** arguing about the whole offer
- improved the package-splitting and last-payslip language
- added one extra FAQ covering what to ask payroll or HR for when the package is unclear
- tightened the help-hub final-pay description
- strengthened compare-page wording so final pay is clearly the **first bridge** when payroll-style lines are mixed
- improved shared result wording in `assets/js/base.js` so:
  - notice results point more clearly to final pay when the leaving package is mixed
  - holiday results point more clearly to final pay when holiday is only one line inside a bigger leaving package
  - settlement results push harder on not judging the headline total until the lines are separated

## Files updated
- `help/final-pay-and-leaving-a-job/index.html`
- `help/index.html`
- `compare/redundancy-vs-settlement-vs-final-pay/index.html`
- `assets/js/base.js`

## Checks
- shared JS syntax checked after editing
