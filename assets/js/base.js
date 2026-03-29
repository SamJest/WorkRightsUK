
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
          '<strong>Likely not eligible for statutory redundancy pay yet.</strong>' +
          '<div class="notice-summary">The GOV.UK rule is that you normally need at least 2 years with your employer to qualify for statutory redundancy pay.</div>';
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
      if (jobEndDate) {
        const endDate = new Date(jobEndDate);
        const deadline = new Date(endDate);
        deadline.setMonth(deadline.getMonth() + 6);
        deadlineHtml = '<li>6-month claim deadline guide date: ' + deadline.toLocaleDateString('en-GB') + '</li>';
      }

      let meaning = 'This looks like the statutory baseline only. The next practical check is whether your contract or staff handbook promises enhanced redundancy terms.';
      let planningNote = estimate > 0
        ? 'Use this as the minimum statutory anchor, not the final package total.'
        : 'Use this as an eligibility screen before spending time on the wider package.';
      result.innerHTML =
        '<strong>Estimated statutory redundancy pay:</strong> ' + formatMoney(estimate) +
        '<ul class="result-breakdown">' +
        '<li>Dismissal date band used: ' + (useNewRate ? 'from 6 April 2026' : 'before 6 April 2026') + '</li>' +
        '<li>Service used: ' + cappedYears + ' full year(s) (capped at 20)</li>' +
        '<li>Weekly pay used: ' + formatMoney(cappedWeeklyPay) + ' (weekly cap used: ' + formatMoney(weeklyCap) + ')</li>' +
        '<li>Age band used: ' + ageBandLabel + '</li>' +
        '<li>Total weeks of pay in this estimate: ' + totalWeeks.toFixed(1) + '</li>' +
        '<li>Maximum statutory total used for this date band: ' + formatMoney(maxTotal) + '</li>' +
        deadlineHtml +
        '</ul>' +
        '<div class="result-meaning"><strong>What this likely means:</strong><p class="muted">' + meaning + '</p><p class="muted">Best next checks: notice position, final pay, and any enhanced contractual redundancy promise.</p><p class="muted">Planning note: ' + planningNote + '</p><p class="muted">Contract check: if your contract or staff handbook says more than the statutory minimum, that higher figure can matter more than this estimate.</p></div>' +
        '<div class="site-note">This tool is a guide only. Contractual enhancements, special cases, and exact dates can change the result.</div>';
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
      result.innerHTML =
        '<strong>Minimum notice to compare:</strong> ' + finalWeeks + ' week(s)' +
        '<ul class="result-breakdown">' +
        '<li>Statutory minimum based on service entered: ' + statutoryWeeks + ' week(s)</li>' +
        '<li>Contractual notice entered: ' + contractWeeks + ' week(s)</li>' +
        endDateHtml +
        '<li>Whichever is longer usually applies if your contract gives more than the statutory minimum.</li>' +
        '</ul>' +
        '<div class="result-meaning"><strong>What this likely means:</strong><p class="muted">' + noticeMeaning + '</p><p class="muted">Best next checks: final pay, holiday owed during notice, and whether the employer is paying notice normally or by PILON.</p></div>' +
        '<div class="site-note">This page is aimed at notice you are entitled to receive. Complex dismissal, misconduct, garden leave, or PILON terms can change what happens in practice.</div>';
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
          '<div class="site-note">For example, someone working 5 days a week has 28 days of statutory paid holiday in a full leave year (5 × 5.6).</div>';
        result.hidden = false;
        return;
      }

      let extraLine = '';
      let meaning = 'This is a simple entitlement estimate for a regular working pattern.';
      let adjustedForCarryOver = Math.round((proRataDays + carryOverDays) * 100) / 100;
      let scenarioLabel = 'regular annual leave check';
      if (mode === 'starter') {
        scenarioLabel = 'starter-style pro rata check';
        meaning = 'This is a simple starter-style pro-rata estimate based on how much of the leave year the job covers.';
      } else if (mode === 'leaver') {
        scenarioLabel = 'leaver-style balance check';
        const remaining = Math.round((adjustedForCarryOver - takenDays) * 100) / 100;
        extraLine = '<li>Holiday already taken entered: ' + takenDays + ' day(s)</li><li>Simple remaining / overused balance: ' + remaining + ' day(s)</li>';
        meaning = remaining >= 0
          ? 'This suggests there may still be accrued statutory holiday left to account for.'
          : 'This suggests the worker may already have taken more holiday than this simple pro-rata estimate plus carry-over covers.';
      }
      extraLine += '<li>Carry-over days added: ' + carryOverDays + ' day(s)</li><li>Bank holidays ' + (bankHolidaysIncluded ? 'appear to be included in the allowance you are checking.' : 'may need checking separately against the allowance you are using.') + '</li>';

      result.innerHTML =
        '<strong>Estimated statutory holiday entitlement:</strong> ' + adjustedForCarryOver + ' day(s)' +
        '<ul class="result-breakdown">' +
        '<li>Scenario label: ' + scenarioLabel + '</li>' +
        '<li>Mode used: ' + mode + '</li>' +
        '<li>Full-year statutory entitlement based on days entered: ' + roundedFullYearDays + ' day(s)</li>' +
        '<li>Months of leave year used: ' + monthsCovered + ' of 12</li>' +
        extraLine +
        '<li>This tool is strongest for regular working patterns and simple starter/leaver checks.</li>' +
        '</ul>' +
        '<div class="result-meaning"><strong>What this likely means:</strong><p class="muted">' + meaning + '</p><p class="muted">Best next checks: holiday pay on leaving, final pay, whether bank holidays are included in the annual total, and whether your employer allows carry-over beyond the simple amount entered here.</p></div>' +
        '<div class="site-note">For irregular-hours or part-year workers, use the official GOV.UK calculator path. Holiday pay itself is a separate question from holiday entitlement.</div>';
      result.hidden = false;
    });
  }

  const reviewStamp = document.getElementById('reviewYearBadge');
  if (reviewStamp) {
    reviewStamp.textContent = 'Reviewed against 2026 official guidance';
  }
});
