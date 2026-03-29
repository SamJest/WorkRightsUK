
function formatMoney(value) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0
  }).format(value);
}

function redundancyWeekMultiplier(age) {
  if (age < 22) return 0.5;
  if (age <= 40) return 1;
  return 1.5;
}

function addMonthsFraction(monthsCovered) {
  return Math.max(0, Math.min(12, monthsCovered)) / 12;
}

document.addEventListener('DOMContentLoaded', function () {
  const redundancyForm = document.querySelector('[data-tool="redundancy-pay"]');
  if (redundancyForm) {
    redundancyForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const age = Number(document.getElementById('age').value || 0);
      const years = Number(document.getElementById('years').value || 0);
      const weeklyPay = Number(document.getElementById('weeklyPay').value || 0);
      const dismissalDate = document.getElementById('dismissalDate').value;
      const jobEndDate = document.getElementById('jobEndDate').value;
      const result = document.getElementById('redundancyResult');

      const serviceYears = Math.max(years, 0);
      const cappedYears = Math.min(serviceYears, 20);

      const rateChangeDate = new Date('2026-04-06');
      const chosenDismissalDate = dismissalDate ? new Date(dismissalDate) : null;
      const useNewRate = chosenDismissalDate && chosenDismissalDate >= rateChangeDate;

      const weeklyCap = useNewRate ? 751 : 719;
      const maxTotal = useNewRate ? 22530 : 21570;
      const cappedWeeklyPay = Math.min(Math.max(weeklyPay, 0), weeklyCap);

      if (serviceYears < 2) {
        result.innerHTML =
          '<div class="result-stack">' +
          '<p class="result-lead"><strong>Likely not eligible for statutory redundancy pay yet.</strong></p>' +
          '<div class="result-card-grid">' +
          '<div class="result-card"><h3>What this means</h3><p class="muted">GOV.UK says you normally need at least 2 years with your employer to qualify for statutory redundancy pay.</p></div>' +
          '<div class="result-card"><h3>What to check next</h3><ul><li>Check notice rights and any pay in lieu.</li><li>Check holiday owed, wages, bonus or commission due on leaving.</li><li>Check whether a contract or policy offers something separate from statutory redundancy pay.</li></ul></div>' +
          '</div>' +
          '<div class="site-note">This does not rule out other rights or money due when employment ends.</div>' +
          '</div>';
        result.hidden = false;
        return;
      }

      const multiplier = redundancyWeekMultiplier(age);
      const totalWeeks = cappedYears * multiplier;
      const estimateRaw = totalWeeks * cappedWeeklyPay;
      const estimate = Math.min(estimateRaw, maxTotal);

      let ageBandLabel = '';
      if (age < 22) ageBandLabel = '0.5 week per full year under age 22';
      else if (age <= 40) ageBandLabel = '1 week per full year aged 22 to 40';
      else ageBandLabel = '1.5 weeks per full year aged 41+';

      let deadlineHtml = '';
      let deadlineCardHtml = '<p class="muted">Enter a job end date to show a simple 6-month claim-deadline guide date.</p>';
      if (jobEndDate) {
        const endDate = new Date(jobEndDate);
        const deadline = new Date(endDate);
        deadline.setMonth(deadline.getMonth() + 6);
        const deadlineLabel = deadline.toLocaleDateString('en-GB');
        deadlineHtml = '<li>6-month claim deadline guide date: ' + deadlineLabel + '</li>';
        deadlineCardHtml = '<p class="muted">Guide date shown from the job end date entered: <strong>' + deadlineLabel + '</strong>.</p>';
      }

      const usedCapText = cappedWeeklyPay < weeklyPay
        ? 'The statutory weekly pay cap reduced the pay figure used in this estimate.'
        : 'Your entered weekly pay sits within the statutory weekly cap for the chosen dismissal date.';

      result.innerHTML =
        '<div class="result-stack">' +
        '<p class="result-lead"><strong>Estimated statutory redundancy pay:</strong> ' + formatMoney(estimate) + '</p>' +
        '<ul class="result-breakdown">' +
        '<li>Dismissal date band used: ' + (useNewRate ? 'from 6 April 2026' : 'before 6 April 2026') + '</li>' +
        '<li>Service used: ' + cappedYears + ' full year(s) (capped at 20)</li>' +
        '<li>Weekly pay used: ' + formatMoney(cappedWeeklyPay) + ' (weekly cap used: ' + formatMoney(weeklyCap) + ')</li>' +
        '<li>Age band used: ' + ageBandLabel + '</li>' +
        '<li>Total weeks of pay in this estimate: ' + totalWeeks.toFixed(1) + '</li>' +
        '<li>Maximum statutory total used for this date band: ' + formatMoney(maxTotal) + '</li>' +
        deadlineHtml +
        '</ul>' +
        '<div class="inline-note">' + usedCapText + '</div>' +
        '<div class="result-card-grid">' +
        '<div class="result-card"><h3>What this includes</h3><ul><li>Statutory redundancy pay only.</li><li>The age band, service cap and statutory weekly pay cap for the date entered.</li><li>A simple guide date for the 6-month claim window if you entered a job end date.</li></ul></div>' +
        '<div class="result-card"><h3>What this does not include</h3><ul><li>Notice pay or pay in lieu of notice.</li><li>Holiday owed, unpaid wages, bonus or commission.</li><li>Enhanced contractual redundancy terms or a settlement agreement package.</li></ul></div>' +
        '<div class="result-card"><h3>Why your real figure may differ</h3><ul><li>Your contract or handbook may promise more than the statutory minimum.</li><li>Your employer may be quoting a mixed leaving package rather than redundancy pay on its own.</li><li>Dates, service history, exclusions or capped weekly pay can change the total.</li></ul></div>' +
        '<div class="result-card"><h3>What to do next</h3><ul><li>Ask HR or payroll for a written breakdown of each payment type.</li><li>Check notice separately using the notice calculator.</li><li>Check final pay and holiday owed before accepting the total at face value.</li></ul></div>' +
        '<div class="result-card"><h3>How to use this figure</h3><p class="muted">Use this as a check on the statutory minimum. It is most useful when you want to see whether an employer offer appears to be below the legal floor.</p></div>' +
        '<div class="result-card"><h3>Deadline reminder</h3>' + deadlineCardHtml + '</div>' +
        '</div>' +
        '<div class="site-note">This tool is a guide only. Contractual enhancements, special cases, exact dates, and disputed facts can change the result.</div>' +
        '</div>';
      result.hidden = false;
    });
  }

  const noticeForm = document.querySelector('[data-tool="notice-period"]');
  if (noticeForm) {
    noticeForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const years = Number(document.getElementById('noticeYears').value || 0);
      const months = Number(document.getElementById('noticeMonths').value || 0);
      const contractWeeks = Number(document.getElementById('contractWeeks').value || 0);
      const startDate = document.getElementById('noticeStartDate').value;
      const result = document.getElementById('noticeResult');

      const totalMonths = years * 12 + months;
      let statutoryWeeks = 0;

      if (totalMonths < 1) {
        statutoryWeeks = 0;
      } else if (totalMonths < 24) {
        statutoryWeeks = 1;
      } else if (years >= 12) {
        statutoryWeeks = 12;
      } else {
        statutoryWeeks = Math.max(1, Math.min(years, 12));
      }

      const finalWeeks = Math.max(statutoryWeeks, contractWeeks);
      let endDateHtml = '';

      if (startDate && finalWeeks > 0) {
        const start = new Date(startDate);
        const lastDay = new Date(start);
        lastDay.setDate(lastDay.getDate() + (finalWeeks * 7) - 1);
        endDateHtml =
          '<li>Estimated last day of notice period: ' + lastDay.toLocaleDateString('en-GB') + '</li>' +
          '<li>Total calendar days in this notice estimate: ' + (finalWeeks * 7) + '</li>';
      }

      let noticeMeaning = contractWeeks > statutoryWeeks
        ? 'Your contract appears to give more notice than the statutory minimum, so the contractual figure is likely the more useful working number.'
        : 'The statutory minimum appears to be the main benchmark based on the details entered.';
      let endDateCard = '<p class="muted">Add a notice start date if you want a simple guide to the likely end date.</p>';
      if (startDate && finalWeeks > 0) {
        const start = new Date(startDate);
        const lastDay = new Date(start);
        lastDay.setDate(lastDay.getDate() + (finalWeeks * 7) - 1);
        endDateCard = '<p class="muted">Based on the date entered, the notice period would end on <strong>' + lastDay.toLocaleDateString('en-GB') + '</strong>.</p><p class="muted">That is a guide only. Contract wording, working patterns and how notice is given can affect the exact end date.</p>';
      }
      result.innerHTML =
        '<div class="result-stack">' +
        '<p class="result-lead"><strong>Minimum notice to compare:</strong> ' + finalWeeks + ' week(s)</p>' +
        '<ul class="result-breakdown">' +
        '<li>Statutory minimum based on service entered: ' + statutoryWeeks + ' week(s)</li>' +
        '<li>Contractual notice entered: ' + contractWeeks + ' week(s)</li>' +
        endDateHtml +
        '<li>Whichever is longer usually applies if your contract gives more than the statutory minimum.</li>' +
        '</ul>' +
        '<div class="result-card-grid">' +
        '<div class="result-card"><h3>What this means</h3><p class="muted">' + noticeMeaning + '</p></div>' +
        '<div class="result-card"><h3>What this includes</h3><ul><li>A simple statutory minimum notice check.</li><li>A comparison with any longer contract notice you entered.</li><li>A guide end date if you added a start date.</li></ul></div>' +
        '<div class="result-card"><h3>What this does not include</h3><ul><li>Whether notice will be worked normally or paid in lieu.</li><li>Holiday owed during notice.</li><li>Every dismissal, misconduct, garden-leave or contract dispute issue.</li></ul></div>' +
        '<div class="result-card"><h3>What to check next</h3><ul><li>Ask whether notice will be worked, paid in lieu, or affected by garden leave.</li><li>Check the final payslip for holiday owed, wages and any deductions.</li><li>Check the contract wording if the employer is using a longer notice period.</li></ul></div>' +
        '<div class="result-card"><h3>Leaving-work reminder</h3><p class="muted">Notice is often only one part of the package. Final pay, holiday owed and any redundancy or settlement terms may still need checking separately.</p></div>' +
        '<div class="result-card"><h3>Likely end date</h3>' + endDateCard + '</div>' +
        '</div>' +
        '<div class="site-note">This page is aimed at notice you are entitled to receive. Complex dismissal, misconduct, garden leave, or PILON terms can change what happens in practice.</div>' +
        '</div>';
      result.hidden = false;
    });
  }

  const holidayForm = document.querySelector('[data-tool="holiday-entitlement"]');
  if (holidayForm) {
    holidayForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const daysPerWeek = Number(document.getElementById('daysPerWeek').value || 0);
      const monthsCovered = Number(document.getElementById('monthsCovered').value || 12);
      const mode = document.getElementById('holidayMode').value || 'standard';
      const takenDays = Number(document.getElementById('takenDays').value || 0);
      const carryOverDays = Number(document.getElementById('carryOverDays').value || 0);
      const bankHolidaysIncluded = document.getElementById('bankHolidaysIncluded').checked;
      const result = document.getElementById('holidayResult');

      const fullYearDays = daysPerWeek * 5.6;
      const roundedFullYearDays = Math.round(fullYearDays * 100) / 100;
      const fraction = addMonthsFraction(monthsCovered);
      const proRataDays = Math.round((roundedFullYearDays * fraction) * 100) / 100;

      if (daysPerWeek <= 0) {
        result.innerHTML =
          '<strong>Enter the average number of days worked each week.</strong>' +
          '<div class="site-note">For example, someone working 5 days a week normally has 28 days of statutory paid holiday in a full leave year.</div>';
        result.hidden = false;
        return;
      }

      let explanation = 'This is a simple statutory holiday estimate for a regular working pattern.';
      let actionText = 'Check whether bank holidays are included in the annual total your employer uses and whether any carry-over rules apply.';
      let extraRows = '';
      let adjustedForCarryOver = Math.round((proRataDays + carryOverDays) * 100) / 100;

      if (mode === 'starter') {
        explanation = 'This is a simple pro-rata estimate based on how much of the leave year the job covers.';
        actionText = 'Check the leave year dates used by the employer and whether the contract gives more than the statutory minimum.';
      } else if (mode === 'leaver') {
        const remaining = Math.round((adjustedForCarryOver - takenDays) * 100) / 100;
        extraRows += '<li>Holiday already taken entered: ' + takenDays + ' day(s)</li>';
        extraRows += '<li>Simple remaining balance: ' + remaining + ' day(s)</li>';
        explanation = remaining >= 0
          ? 'This suggests there may still be accrued statutory holiday left to account for in final pay.'
          : 'This suggests more holiday may have been taken than this simple estimate covers, so the final-pay position needs checking carefully.';
        actionText = 'Check the leaving date, holiday already taken, and whether the final payslip includes any untaken statutory holiday that still had to be paid.';
      }

      extraRows += '<li>Full-year statutory entitlement on the days entered: ' + roundedFullYearDays + ' day(s)</li>';
      extraRows += '<li>Months of the leave year used: ' + monthsCovered + ' of 12</li>';
      extraRows += '<li>Carry-over days added: ' + carryOverDays + ' day(s)</li>';
      extraRows += '<li>' + (bankHolidaysIncluded ? 'Bank holidays appear to be included in the allowance being checked.' : 'Bank holidays may need checking separately against the allowance being used.') + '</li>';

      result.innerHTML =
        '<strong>Estimated statutory holiday entitlement:</strong> ' + adjustedForCarryOver + ' day(s)' +
        '<ul class="result-breakdown">' + extraRows + '</ul>' +
        '<div class="result-meaning"><strong>What this likely means:</strong><p class="muted">' + explanation + '</p></div>' +
        '<div class="result-meaning"><strong>What this does not confirm:</strong><p class="muted">It does not settle the whole final-pay calculation, every carry-over rule, or holiday pay rate disputes.</p></div>' +
        '<div class="result-meaning"><strong>What to check next:</strong><p class="muted">' + actionText + ' Use the final-pay page if you need the wider leaving-work picture, including notice pay and other items.</p></div>' +
        '<div class="site-note">For irregular-hours or part-year workers, use the official GOV.UK calculator route rather than relying on this simpler tool.</div>';
      result.hidden = false;
    });
  }





  const unfairDismissalForm = document.querySelector('[data-tool="unfair-dismissal"]');
  if (unfairDismissalForm) {
    unfairDismissalForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const dismissalDate = document.getElementById('unfairDismissalDate').value;
      const age = Number(document.getElementById('unfairAge').value || 0);
      const years = Number(document.getElementById('unfairYears').value || 0);
      const weeklyPay = Number(document.getElementById('unfairWeeklyPay').value || 0);
      const weeksLoss = Number(document.getElementById('unfairWeeksLoss').value || 0);
      const newWeeklyPay = Number(document.getElementById('unfairNewWeeklyPay').value || 0);
      const otherLosses = Number(document.getElementById('unfairOtherLosses').value || 0);
      const result = document.getElementById('unfairDismissalResult');

      if (weeklyPay <= 0) {
        result.innerHTML =
          '<div class="result-stack">' +
          '<p class="result-lead"><strong>Enter weekly pay to build the estimate.</strong></p>' +
          '<div class="site-note">Use gross weekly pay at dismissal rather than a net or monthly figure.</div>' +
          '</div>';
        result.hidden = false;
        return;
      }

      const chosenDismissalDate = dismissalDate ? new Date(dismissalDate) : null;
      const 2026LimitDate = new Date('2026-04-06');
      const 2027QualifyingDate = new Date('2027-01-01');
      const use2026Limits = chosenDismissalDate && chosenDismissalDate >= 2026LimitDate;
      const uses2027Qualification = chosenDismissalDate && chosenDismissalDate >= 2027QualifyingDate;

      const weekPayCap = use2026Limits ? 751 : 719;
      const compensatoryStatutoryCap = use2026Limits ? 123543 : 118223;
      const ordinaryQualificationYears = uses2027Qualification ? 0.5 : 2;
      const ordinaryQualificationMet = years >= ordinaryQualificationYears;

      const cappedYears = Math.min(Math.max(years, 0), 20);
      const cappedWeekPay = Math.min(Math.max(weeklyPay, 0), weekPayCap);
      const basicWeeks = cappedYears * redundancyWeekMultiplier(age);
      const basicAward = basicWeeks * cappedWeekPay;

      const weeklyLoss = Math.max(weeklyPay - newWeeklyPay, 0);
      const rawCompensatoryLoss = (weeklyLoss * weeksLoss) + Math.max(otherLosses, 0);
      const annualPayCap = Math.max(weeklyPay, 0) * 52;
      const compensatoryCapUsed = Math.min(compensatoryStatutoryCap, annualPayCap);
      const estimatedCompensatory = Math.min(rawCompensatoryLoss, compensatoryCapUsed);
      const totalEstimate = basicAward + estimatedCompensatory;

      let qualificationText = ordinaryQualificationMet
        ? 'On the service entered, an ordinary unfair-dismissal qualification check is less likely to be the main problem.'
        : 'On the service entered, an ordinary unfair-dismissal claim may not qualify under the usual service rule. Automatic-unfair and some other claims can be different.';

      let qualificationNextStep = ordinaryQualificationMet
        ? 'Focus on whether the dismissal was actually unfair and how much financial loss you can evidence.'
        : 'Check urgently whether the facts point to automatic unfair dismissal, discrimination, whistleblowing or another route with different qualification rules.';

      let dateBandText = dismissalDate
        ? (use2026Limits ? 'Dismissal date entered is in the from-6-April-2026 limit band.' : 'Dismissal date entered is in the pre-6-April-2026 limit band.')
        : 'No dismissal date entered, so the pre-6-April-2026 cap is used as a cautious default.';

      const weeklyLossText = weeklyLoss > 0
        ? 'Estimated weekly loss used: ' + formatMoney(weeklyLoss) + ' after replacement earnings.'
        : 'No ongoing weekly loss is being used beyond the entered direct losses.';

      result.innerHTML =
        '<div class="result-stack">' +
        '<p class="result-lead"><strong>Estimated unfair-dismissal award framework:</strong> ' + formatMoney(totalEstimate) + '</p>' +
        '<ul class="result-breakdown">' +
        '<li>Estimated basic-award element: ' + formatMoney(basicAward) + '</li>' +
        '<li>Estimated compensatory-loss element after cap: ' + formatMoney(estimatedCompensatory) + '</li>' +
        '<li>Basic-award service used: ' + cappedYears + ' full year(s), capped at 20</li>' +
        '<li>Capped week's pay used for the basic-award framework: ' + formatMoney(cappedWeekPay) + ' (statutory cap: ' + formatMoney(weekPayCap) + ')</li>' +
        '<li>Compensatory cap used: ' + formatMoney(compensatoryCapUsed) + ' (lower of statutory cap and 52 weeks' gross pay)</li>' +
        '<li>' + weeklyLossText + '</li>' +
        '<li>' + dateBandText + '</li>' +
        '</ul>' +
        '<div class="result-card-grid">' +
        '<div class="result-card"><h3>What this means</h3><p class="muted">This is a first-pass unfair-dismissal framework, not a tribunal prediction. The compensatory side is often the bigger moving part because it depends on real financial loss and evidence.</p></div>' +
        '<div class="result-card"><h3>Qualification guide</h3><p class="muted">' + qualificationText + '</p><p class="muted">' + qualificationNextStep + '</p></div>' +
        '<div class="result-card"><h3>What is included</h3><ul><li>A basic-award framework using age, service and a capped week's pay.</li><li>A compensatory-loss framework using lost earnings and direct loss.</li><li>The current cap structure for the date band used.</li></ul></div>' +
        '<div class="result-card"><h3>What is not included</h3><ul><li>Any uplift or reduction for Acas Code issues.</li><li>Reductions for contributory conduct, failure to mitigate, or the chance the dismissal would still have happened.</li><li>Discrimination, whistleblowing or injury-to-feelings awards.</li></ul></div>' +
        '<div class="result-card"><h3>What to check next</h3><ul><li>Appeal letters, dismissal reasons, procedure and any notes of meetings.</li><li>Evidence of lost pay and efforts to find replacement work.</li><li>Whether the real dispute is unfair dismissal, redundancy, settlement or final pay.</li></ul></div>' +
        '<div class="result-card"><h3>Deadline reminder</h3><p class="muted">Ordinary unfair-dismissal claims usually have a short tribunal time limit. Do not wait to perfect every figure before checking the Acas early-conciliation route.</p></div>' +
        '</div>' +
        '<div class="site-note">Use this figure to organise the conversation and documents, not as a promise of what a tribunal or settlement will award.</div>' +
        '</div>';
      result.hidden = false;
    });
  }

  const settlementForm = document.querySelector('[data-tool="settlement-tax"]');
  if (settlementForm) {
    settlementForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const statutoryRedundancy = Number(document.getElementById('statutoryRedundancy').value || 0);
      const enhancedComp = Number(document.getElementById('enhancedComp').value || 0);
      const pilon = Number(document.getElementById('pilon').value || 0);
      const holidayPay = Number(document.getElementById('holidayPay').value || 0);
      const wagesBonus = Number(document.getElementById('wagesBonus').value || 0);
      const legalAdvicePaid = document.getElementById('legalAdvicePaid').checked;
      const result = document.getElementById('settlementTaxResult');

      const earningsTotal = pilon + holidayPay + wagesBonus;
      const qualifyingTermination = statutoryRedundancy + enhancedComp;
      const thresholdUsed = Math.min(qualifyingTermination, 30000);
      const aboveThreshold = Math.max(qualifyingTermination - 30000, 0);
      const totalPackage = earningsTotal + qualifyingTermination;

      if (totalPackage <= 0) {
        result.innerHTML =
          '<div class="result-stack">' +
          '<p class="result-lead"><strong>Enter at least one payment amount to check the package shape.</strong></p>' +
          '<div class="site-note">Start with the written figures your employer has actually listed, even if some are only estimates.</div>' +
          '</div>';
        result.hidden = false;
        return;
      }

      let packageMeaning = 'This package looks mixed. Check each label carefully before relying on the headline total.';
      if (earningsTotal === 0 && qualifyingTermination > 0) {
        packageMeaning = 'This package looks mainly compensation-based, so the written wording and the £30,000 threshold are likely to matter most.';
      } else if (earningsTotal > 0 && qualifyingTermination === 0) {
        packageMeaning = 'This package looks mainly earnings-based, so it is closer to final pay than to a tax-free settlement figure.';
      } else if (earningsTotal >= qualifyingTermination) {
        packageMeaning = 'A large part of this package looks like normal taxable earnings, so the take-home figure may be much lower than the headline total.';
      }

      const legalAdviceText = legalAdvicePaid
        ? 'You indicated the employer is covering independent legal advice costs, which is normal on many settlement agreements.'
        : 'If this is a settlement agreement, check whether the employer is also covering independent legal advice costs.';

      result.innerHTML =
        '<div class="result-stack">' +
        '<p class="result-lead"><strong>Package total entered:</strong> ' + formatMoney(totalPackage) + '</p>' +
        '<ul class="result-breakdown">' +
        '<li>Likely taxed as earnings: ' + formatMoney(earningsTotal) + ' (PILON, holiday pay, wages, bonus or similar)</li>' +
        '<li>Potential qualifying termination-payment elements: ' + formatMoney(qualifyingTermination) + '</li>' +
        '<li>Potentially within the first £30,000 threshold: ' + formatMoney(thresholdUsed) + '</li>' +
        '<li>Potential qualifying amount above £30,000: ' + formatMoney(aboveThreshold) + '</li>' +
        '</ul>' +
        '<div class="result-card-grid">' +
        '<div class="result-card"><h3>What this likely means</h3><p class="muted">' + packageMeaning + '</p></div>' +
        '<div class="result-card"><h3>Usually taxed like earnings</h3><ul><li>PILON</li><li>Holiday pay</li><li>Unpaid wages</li><li>Bonus or commission already earned</li></ul></div>' +
        '<div class="result-card"><h3>May fall within termination-payment rules</h3><ul><li>Statutory redundancy pay</li><li>Additional severance or compensation-style sums</li><li>The written wording still matters</li></ul></div>' +
        '<div class="result-card"><h3>What this does not decide</h3><ul><li>Whether payroll has applied the tax correctly.</li><li>Whether the offer is fair overall.</li><li>Whether every clause in the agreement is acceptable.</li></ul></div>' +
        '<div class="result-card"><h3>What to check next</h3><ul><li>Ask for a written breakdown of every payment label.</li><li>Check whether notice, holiday and wages have been separated from compensation.</li><li>Check whether the agreement says who is paying for independent advice.</li></ul></div>' +
        '<div class="result-card"><h3>Practical reminder</h3><p class="muted">' + legalAdviceText + '</p></div>' +
        '</div>' +
        '<div class="site-note">This is a first-pass categorisation tool. Use the written agreement, official guidance and professional advice for the final tax position.</div>' +
        '</div>';
      result.hidden = false;
    });
  }

  const reviewStamp = document.getElementById('reviewYearBadge');
  if (reviewStamp) {
    reviewStamp.textContent = 'Reviewed against 2026 official guidance';
  }
});
