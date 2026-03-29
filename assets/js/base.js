function getHeaderOffset() {
  const header = document.querySelector('.site-header');
  return header ? header.offsetHeight + 16 : 16;
}

function scrollElementIntoViewWithOffset(element) {
  if (!element || typeof window === 'undefined') return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const top = window.scrollY + element.getBoundingClientRect().top - getHeaderOffset();

  window.scrollTo({
    top: Math.max(0, top),
    behavior: prefersReducedMotion ? 'auto' : 'smooth'
  });
}

function revealResult(result) {
  if (!result) return;
  result.hidden = false;
  result.setAttribute('tabindex', '-1');
  result.setAttribute('aria-live', 'polite');

  const focusResult = function () {
    if (typeof result.focus === 'function') {
      try {
        result.focus({ preventScroll: true });
      } catch (error) {
        result.focus();
      }
    }
  };

  const scrollToResult = function () {
    scrollElementIntoViewWithOffset(result);
    focusResult();
    window.setTimeout(function () {
      scrollElementIntoViewWithOffset(result);
    }, 180);
  };

  if (typeof window !== 'undefined') {
    window.requestAnimationFrame(scrollToResult);
  }
}

function initialiseSamePageAnchorScroll() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const onHashTarget = function (hash) {
    if (!hash || hash === '#') return;
    const target = document.querySelector(hash);
    if (!target) return;
    window.requestAnimationFrame(function () {
      scrollElementIntoViewWithOffset(target);
    });
  };

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      if (window.location.hash !== href) {
        history.replaceState(null, '', href);
      }
      scrollElementIntoViewWithOffset(target);
      if (typeof target.focus === 'function' && !target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
    });
  });

  if (window.location.hash) {
    onHashTarget(window.location.hash);
  }

  window.addEventListener('hashchange', function () {
    onHashTarget(window.location.hash);
  });
}


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

function formatDateUK(date) {
  return date.toLocaleDateString('en-GB');
}

function addMonthsMinusDays(date, monthsToAdd, daysToSubtract) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + monthsToAdd);
  copy.setDate(copy.getDate() - daysToSubtract);
  return copy;
}

document.addEventListener('DOMContentLoaded', function () {
  initialiseSamePageAnchorScroll();
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
          '<p class="result-lead"><strong>Likely not eligible for statutory redundancy pay yet.</strong></p><div class="inline-note">That usually means the statutory redundancy floor is not the main line to test first. Check notice, holiday, wages and any separate discretionary payment instead.</div>' +
          '<div class="result-card-grid">' +
          '<div class="result-card"><h3>What this means</h3><p class="muted">GOV.UK says you normally need at least 2 years with your employer to qualify for statutory redundancy pay. This usually means the statutory redundancy floor is not the main issue yet.</p></div>' +
          '<div class="result-card"><h3>Use the next checks in order</h3><ol class="list-clean action-checklist"><li>Check notice rights and any pay in lieu first.</li><li>Check holiday owed, wages, bonus or commission due on leaving.</li><li>Ask whether any extra sum is discretionary, ex gratia or settlement-style rather than redundancy pay.</li><li>Use final pay or compare if the employer has quoted one combined total.</li></ol></div>' +
          '<div class="result-card"><h3>Best next page</h3><p class="muted">If the problem is one combined leaving-work total, use the final-pay or compare pages next rather than treating this as a redundancy-only issue.</p><p><a href="/help/final-pay-and-leaving-a-job/">Open final-pay page</a> · <a href="/compare/redundancy-vs-settlement-vs-final-pay/">Open compare page</a></p></div>' +
          '</div>' +
          '<div class="site-note">This does not rule out other rights or money due when employment ends.</div>' +
          '</div>';
        revealResult(result);
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

      const capWarning = estimate >= maxTotal
        ? '<div class="inline-note">This estimate reaches the maximum statutory total for the chosen dismissal-date band, so a higher headline package may still need splitting before you know whether the redundancy line itself is enhanced.</div>'
        : '';

      const nextStepGuide =
        '<ol class="list-clean action-checklist">' +
        '<li>Get a written breakdown that separates redundancy pay, notice, holiday, wages and any other sums.</li>' +
        '<li>Compare the redundancy line with this statutory floor before judging the whole package.</li>' +
        '<li>Check your contract, handbook or redundancy policy for any enhanced terms above the statutory minimum.</li>' +
        '<li>Use the notice, final-pay and compare routes if the employer has quoted one combined leaving-work figure.</li>' +
        '<li>Do not sit on an unpaid statutory shortfall if the dates suggest the minimum may have been missed.</li>' +
        '</ol>';

      const splitPackageGuide =
        '<ul class="list-clean">' +
        '<li>Redundancy pay on its own.</li>' +
        '<li>Notice pay or pay in lieu of notice.</li>' +
        '<li>Holiday owed, wages, bonus or commission.</li>' +
        '<li>Any extra severance or settlement-style payment.</li>' +
        '</ul>';

      const routeLinks =
        '<div class="inline-links">' +
        '<a href="/tools/notice-period-calculator/">Check notice</a>' +
        '<a href="/help/final-pay-and-leaving-a-job/">Check final pay</a>' +
        '<a href="/compare/redundancy-vs-settlement-vs-final-pay/">Use compare page</a>' +
        '</div>';

      result.innerHTML =
        '<div class="result-stack">' +
        '<p class="result-lead"><strong>Estimated statutory redundancy floor:</strong> ' + formatMoney(estimate) + '</p>' +
        '<ul class="result-breakdown">' +
        '<li>Dismissal date band used: ' + (useNewRate ? 'from 6 April 2026' : 'before 6 April 2026') + '</li>' +
        '<li>Service used: ' + cappedYears + ' full year(s) (capped at 20)</li>' +
        '<li>Weekly pay used: ' + formatMoney(cappedWeeklyPay) + ' (weekly cap used: ' + formatMoney(weeklyCap) + ')</li>' +
        '<li>Age band used: ' + ageBandLabel + '</li>' +
        '<li>Total weeks of pay in this estimate: ' + totalWeeks.toFixed(1) + '</li>' +
        '<li>Maximum statutory total used for this date band: ' + formatMoney(maxTotal) + '</li>' +
        deadlineHtml +
        '</ul>' +
        '<div class="inline-note">' + usedCapText + '</div>' + capWarning +
        '<div class="result-card-grid">' +
        '<div class="result-card"><h3>What this includes</h3><ul><li>Statutory redundancy pay only.</li><li>The age band, service cap and statutory weekly pay cap for the date entered.</li><li>A simple guide date for the 6-month claim window if you entered a job end date.</li></ul></div>' +
        '<div class="result-card"><h3>What this does not include</h3><ul><li>Notice pay or pay in lieu of notice.</li><li>Holiday owed, unpaid wages, bonus or commission.</li><li>Enhanced contractual redundancy terms or a settlement agreement package.</li></ul></div>' +
        '<div class="result-card"><h3>Use this number in order</h3>' + nextStepGuide + '</div>' +
        '<div class="result-card"><h3>If your employer gave one total</h3><p class="muted">Split the package first before deciding whether the redundancy line is generous or low.</p>' + splitPackageGuide + '<p class="muted">Challenge vague labels such as ex gratia, leaving payment or one single headline total until you can see which line is actually redundancy pay.</p></div>' +
        '<div class="result-card"><h3>Enhanced vs statutory</h3><p class="muted">This figure is the legal floor for statutory redundancy pay. Your real package can be higher if your contract, staff handbook, union agreement or employer policy promises more.</p><p class="muted">A higher headline total is only clearly enhanced redundancy once notice, holiday and any other sums have been separated out.</p><p class="muted"><strong>Practical rule:</strong> compare the redundancy line with this result first, then judge the rest of the package.</p></div>' +
        '<div class="result-card"><h3>Best next page</h3><p class="muted">Use the right follow-up page for the part of the package that is still unclear.</p><p class="muted">If the employer has quoted one combined total, final pay is often the fastest bridge page before you judge the package as a whole.</p>' + routeLinks + '</div>' +
        '<div class="result-card"><h3>Deadline reminder</h3>' + deadlineCardHtml + '</div>' +
        '<div class="result-card"><h3>Why your real figure may differ</h3><ul><li>Your contract or handbook may promise more than the statutory minimum.</li><li>Your employer may be quoting a mixed leaving package rather than redundancy pay on its own.</li><li>Dates, service history, exclusions or capped weekly pay can change the total.</li><li>The package may include notice, holiday or wages that make the headline total look higher without changing the redundancy line itself.</li></ul></div>' +
        '</div>' +
        '<div class="site-note">This tool is a guide only. Contractual enhancements, special cases, exact dates, and disputed facts can change the result.</div>' +
        '</div>';
      revealResult(result);
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
        '<div class="result-card"><h3>What to check next</h3><ul><li>Ask whether notice will be worked, paid in lieu, or affected by garden leave.</li><li>Check the final payslip for holiday owed, wages and any deductions.</li><li>If the whole leaving package is mixed together, move into the final-pay page before judging the total.</li><li>Check the contract wording if the employer is using a longer notice period.</li></ul></div>' +
        '<div class="result-card"><h3>Best next page if the payslip is mixed</h3><p class="muted">Notice is often only one part of the package. Use the final-pay page first if notice sits alongside holiday, wages, deductions, redundancy or settlement wording in the same leaving payment.</p><p><a href="/help/final-pay-and-leaving-a-job/">Open final-pay page</a></p></div>' +
        '<div class="result-card"><h3>Likely end date</h3>' + endDateCard + '</div>' +
        '</div>' +
        '<div class="site-note">This page is aimed at notice you are entitled to receive. Complex dismissal, misconduct, garden leave, or PILON terms can change what happens in practice.</div>' +
        '</div>';
      revealResult(result);
    });
  }

  const holidayForm = document.querySelector('[data-tool="holiday-entitlement"]');
  if (holidayForm) {
    const holidayModeSelect = document.getElementById('holidayMode');
    const holidayModeHint = document.getElementById('holidayModeHint');
    const holidayModeCallout = document.getElementById('holidayModeCallout');
    const holidayModeButtons = document.querySelectorAll('[data-holiday-mode-choice]');
    const holidayMonthsLabel = document.getElementById('holidayMonthsLabel');
    const holidayTakenLabel = document.getElementById('holidayTakenLabel');

    function updateHolidayModeUi(mode) {
      const config = {
        standard: {
          hint: 'Best for a regular weekly pattern and a full-year or simple pro-rata holiday check.',
          title: 'Standard mode: regular-pattern entitlement',
          text: 'Use this when the pattern is regular and you want a straightforward full-year or simple pro-rata estimate before checking final pay or notice separately.',
          monthsLabel: 'Months of the leave year this should cover',
          monthsHint: 'Use 12 for a full leave year or a smaller number for a simple pro-rata estimate.',
          showTaken: false
        },
        starter: {
          hint: 'Use this when someone joined part way through the leave year and you want a simple built-up holiday estimate.',
          title: 'Starter mode: joined during the leave year',
          text: 'Use this when the job began part way through the leave year and you want a regular-pattern estimate of holiday built up so far before comparing it with the employer\'s leave-year dates.',
          monthsLabel: 'Months worked so far in the leave year',
          monthsHint: 'Count the part of the leave year covered so far on the regular pattern being checked.',
          showTaken: false
        },
        leaver: {
          hint: 'Use this when the job is ending and you want a simple accrued-versus-taken balance before checking final pay.',
          title: 'Leaver mode: check holiday before final pay',
          text: 'Use this when someone is leaving and the immediate question is whether holiday may still be owed or has already been taken ahead on a regular pattern.',
          monthsLabel: 'Months covered up to the leaving point',
          monthsHint: 'Count the part of the leave year covered up to the leaving date before checking what payroll has done.',
          showTaken: true
        }
      };
      const current = config[mode] || config.standard;
      if (holidayModeHint) {
        holidayModeHint.textContent = current.hint;
      }
      if (holidayModeCallout) {
        holidayModeCallout.innerHTML = '<strong>' + current.title + '</strong><p class="muted">' + current.text + '</p>';
      }
      if (holidayMonthsLabel) {
        const labelTextNode = holidayMonthsLabel.childNodes[0];
        if (labelTextNode) {
          labelTextNode.textContent = '\n          ' + current.monthsLabel + '\n          ';
        }
        const hint = holidayMonthsLabel.querySelector('.input-hint');
        if (hint) {
          hint.textContent = current.monthsHint;
        }
      }
      if (holidayTakenLabel) {
        holidayTakenLabel.hidden = !current.showTaken;
      }
      holidayModeButtons.forEach(function (button) {
        button.classList.toggle('active', button.getAttribute('data-holiday-mode-choice') === mode);
      });
    }

    if (holidayModeSelect) {
      updateHolidayModeUi(holidayModeSelect.value || 'standard');
      holidayModeSelect.addEventListener('change', function () {
        updateHolidayModeUi(holidayModeSelect.value || 'standard');
      });
    }

    holidayModeButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        const chosenMode = button.getAttribute('data-holiday-mode-choice') || 'standard';
        if (holidayModeSelect) {
          holidayModeSelect.value = chosenMode;
          updateHolidayModeUi(chosenMode);
        }
        holidayForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const daysInput = document.getElementById('daysPerWeek');
        if (daysInput) {
          daysInput.focus();
        }
      });
    });

    holidayForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const daysPerWeek = Number(document.getElementById('daysPerWeek').value || 0);
      const monthsCoveredInput = Number(document.getElementById('monthsCovered').value || 12);
      const monthsCovered = Math.max(1, Math.min(12, monthsCoveredInput));
      const mode = document.getElementById('holidayMode').value || 'standard';
      const takenDays = Number(document.getElementById('takenDays').value || 0);
      const carryOverDays = Number(document.getElementById('carryOverDays').value || 0);
      const bankHolidaysIncluded = document.getElementById('bankHolidaysIncluded').checked;
      const result = document.getElementById('holidayResult');

      if (daysPerWeek <= 0 || daysPerWeek > 7) {
        result.innerHTML =
          '<div class="result-stack">' +
          '<p class="result-lead"><strong>Enter the average number of days worked each week.</strong></p>' +
          '<div class="result-card-grid">' +
          '<div class="result-card"><h3>What to enter</h3><p class="muted">Use the average number of days worked in a normal week on a regular pattern. Someone working 5 days a week usually has 28 days of statutory paid holiday in a full leave year.</p></div>' +
          '<div class="result-card"><h3>Use GOV.UK instead when</h3><p class="muted">The hours or working year are irregular, the worker is part-year, or the holiday pattern changes too much for a simple weekly-days estimate.</p></div>' +
          '</div>' +
          '</div>';
        revealResult(result);
        return;
      }

      const fullYearDays = Math.round((daysPerWeek * 5.6) * 100) / 100;
      const fraction = addMonthsFraction(monthsCovered);
      const proRataDays = Math.round((fullYearDays * fraction) * 100) / 100;
      const adjustedForCarryOver = Math.round((proRataDays + carryOverDays) * 100) / 100;

      let leadLabel = 'Estimated statutory holiday entitlement:';
      let modeLabel = 'Standard mode';
      let explanation = 'This is a simple statutory holiday estimate for a regular working pattern.';
      let actionIntro = 'Check whether bank holidays are included in the annual total your employer uses and whether any carry-over rules apply.';
      let nextSteps = [
        'Check the employer’s holiday year dates and whether bank holidays sit inside the allowance.',
        'Use the final-pay page if the real issue is the whole leaving-work package rather than holiday on its own.',
        'Switch to the official GOV.UK route if the pattern is irregular or part-year.'
      ];
      let extraRows = '';
      let statusCard = '<p class="muted">This estimate is best used as a first check before you rely on payroll figures or contract wording.</p>';
      let routeCardTitle = 'Best next page';
      let routeCardHtml = '<p class="muted">Use the final-pay page when holiday is only one part of the leaving-work question, especially if the last payslip also includes notice, wages, deductions, redundancy or settlement wording.</p><p><a href="/help/final-pay-and-leaving-a-job/">Open final-pay page</a></p>';

      if (mode === 'starter') {
        leadLabel = 'Estimated holiday built up so far:';
        modeLabel = 'Starter mode';
        explanation = 'This is a simple starter estimate based on how much of the leave year the job covers so far.';
        actionIntro = 'Check the leave year dates used by the employer and whether the contract gives more than the statutory minimum.';
        nextSteps = [
          'Check the exact leave-year start date used by the employer, not just the calendar year.',
          'Check whether any holiday was already approved or carried over into the current leave year.',
          'If the pattern is irregular, stop here and use the official GOV.UK calculator instead.'
        ];
        statusCard = '<p class="muted">Starter checks are often most useful when HR or payroll has quoted a small accrued balance and you want to sense-check it against a regular weekly pattern.</p>';
        routeCardTitle = 'Best next page after a starter check';
        routeCardHtml = '<p class="muted">Use the final-pay page only if the worker is now leaving. Otherwise, keep this as a simple holiday accrual sense-check and compare it with the employer\'s leave-year dates.</p><p><a href="/help/final-pay-and-leaving-a-job/">Open final-pay page</a></p>';
      } else if (mode === 'leaver') {
        const remaining = Math.round((adjustedForCarryOver - takenDays) * 100) / 100;
        leadLabel = remaining >= 0 ? 'Estimated holiday still to account for:' : 'Estimated holiday potentially taken ahead:';
        modeLabel = 'Leaver mode';
        extraRows += '<li>Holiday already taken entered: ' + takenDays + ' day(s)</li>';
        extraRows += '<li>Simple balance after time taken: ' + remaining + ' day(s)</li>';
        explanation = remaining >= 0
          ? 'This suggests there may still be accrued statutory holiday left to account for in final pay.'
          : 'This suggests more holiday may have been taken than this simple estimate covers, so the final-pay position needs checking carefully.';
        actionIntro = 'Check the leaving date, holiday already taken, and whether the final payslip includes any untaken statutory holiday that still had to be paid. If holiday is only one line inside a bigger leaving package, use the final-pay page before judging the whole total.';
        nextSteps = [
          'Check the final payslip for separate lines covering holiday, notice, wages and any deductions.',
          'Check whether the employer uses a different leave year, carry-over rule or bank-holiday treatment.',
          'Use the final-pay page next if holiday, notice, wages or other leaving-work items are mixed together.'
        ];
        statusCard = remaining >= 0
          ? '<p class="muted">A positive balance suggests holiday may still be owed, but the money due can still change once notice, payroll timing and employer policy are checked.</p>'
          : '<p class="muted">A negative balance does not prove a lawful deduction. The contract, leave year and payroll records still need checking carefully.</p>';
        routeCardTitle = 'Best next page after a leaver check';
        routeCardHtml = '<p class="muted">Use the final-pay page next if holiday, notice, wages or deductions are mixed together on the leaving payslip. Use the notice page separately if PILON or the end date is the real dispute.</p><p><a href="/help/final-pay-and-leaving-a-job/">Open final-pay page</a></p>';
      }

      extraRows += '<li>Full-year statutory entitlement on the days entered: ' + fullYearDays + ' day(s)</li>';
      extraRows += '<li>Months of the leave year used: ' + monthsCovered + ' of 12' + (monthsCovered !== monthsCoveredInput ? ' (entry trimmed to fit a 12-month leave year)' : '') + '</li>';
      extraRows += '<li>Carry-over days added: ' + carryOverDays + ' day(s)</li>';
      extraRows += '<li>' + (bankHolidaysIncluded ? 'Bank holidays appear to be included in the allowance being checked.' : 'Bank holidays may need checking separately against the allowance being used.') + '</li>';

      const nextStepHtml = '<ol class="list-clean action-checklist"><li>' + nextSteps.join('</li><li>') + '</li></ol>';

      result.innerHTML =
        '<div class="result-stack">' +
        '<p class="result-lead"><strong>' + leadLabel + '</strong> ' + adjustedForCarryOver + ' day(s)</p>' +
        '<ul class="result-breakdown">' + extraRows + '</ul>' +
        '<div class="result-card-grid">' +
        '<div class="result-card"><h3>What this means</h3><p class="muted"><strong>' + modeLabel + '.</strong> ' + explanation + '</p></div>' +
        '<div class="result-card"><h3>What is included</h3><ul><li>A simple statutory holiday estimate for a regular working pattern.</li><li>Pro-rata timing based on the months entered.</li><li>Carry-over days if you added them.</li></ul></div>' +
        '<div class="result-card"><h3>What is not included</h3><ul><li>Irregular-hours or part-year worker calculations.</li><li>Every holiday pay rate dispute.</li><li>The whole final-pay calculation on its own.</li></ul></div>' +
        '<div class="result-card"><h3>What to check next</h3><p class="muted">' + actionIntro + '</p>' + nextStepHtml + '</div>' +
        '<div class="result-card"><h3>When to switch route</h3><ul><li>Use the final-pay page when holiday is only one line in a wider leaving package.</li><li>Use the notice page when the real issue is PILON, notice length or the end date.</li><li>Use GOV.UK instead for irregular-hours and part-year accrual.</li></ul><p><a href="https://www.gov.uk/calculate-your-holiday-entitlement">Open GOV.UK holiday calculator</a></p></div>' +
        '<div class="result-card"><h3>Why the money due may differ</h3><ul><li>Holiday already taken can change the final balance.</li><li>Carry-over rules and bank-holiday treatment can alter the figure used by payroll.</li><li>The contract may give more than the statutory minimum.</li></ul></div>' +
        '<div class="result-card"><h3>How to use this result</h3>' + statusCard + '</div>' +
        '<div class="result-card"><h3>' + routeCardTitle + '</h3>' + routeCardHtml + '</div>' +
        '</div>' +
        '<div class="site-note">For irregular-hours or part-year workers, stop here and use the official GOV.UK calculator route rather than relying on this simpler regular-pattern tool.</div>' +
        '</div>';
      revealResult(result);
    });
  }



  const maternityForm = document.querySelector('[data-tool="maternity-pay"]');
  if (maternityForm) {
    maternityForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const dueDate = document.getElementById('maternityDueDate').value;
      const avgWeeklyEarnings = Number(document.getElementById('maternityAvgWeeklyEarnings').value || 0);
      const weeksRequested = Number(document.getElementById('maternityWeeksRequested').value || 39);
      const result = document.getElementById('maternityResult');

      if (avgWeeklyEarnings <= 0) {
        result.innerHTML =
          '<div class="result-stack">' +
          '<p class="result-lead"><strong>Enter average weekly earnings to build the estimate.</strong></p>' +
          '<div class="site-note">Use gross average weekly earnings rather than net or monthly pay.</div>' +
          '</div>';
        revealResult(result);
        return;
      }

      const rateChangeDate = new Date('2026-04-06');
      const chosenDueDate = dueDate ? new Date(dueDate) : null;
      const useNewRate = chosenDueDate && chosenDueDate >= rateChangeDate;
      const weeklyRate = useNewRate ? 194.32 : 187.18;
      const lowerEarningsLimit = useNewRate ? 129 : 125;
      const firstSixWeekly = avgWeeklyEarnings * 0.9;
      const laterWeekly = Math.min(firstSixWeekly, weeklyRate);
      const firstSixWeeks = Math.min(weeksRequested, 6);
      const laterWeeks = Math.max(weeksRequested - 6, 0);
      const totalEstimate = (firstSixWeeks * firstSixWeekly) + (laterWeeks * laterWeekly);
      const meetsThreshold = avgWeeklyEarnings >= lowerEarningsLimit;

      let thresholdText = meetsThreshold
        ? 'The average weekly earnings entered are at or above the lower earnings limit used for this date band.'
        : 'The average weekly earnings entered are below the lower earnings limit used for this date band, so SMP eligibility needs checking carefully.';

      let fallbackText = meetsThreshold
        ? 'Check your qualifying week, notice and paperwork as well as the pay figure.'
        : 'If SMP may not fit, check Maternity Allowance quickly rather than stopping at this figure.';

      result.innerHTML =
        '<div class="result-stack">' +
        '<p class="result-lead"><strong>Estimated Statutory Maternity Pay:</strong> ' + formatMoney(totalEstimate) + '</p>' +
        '<ul class="result-breakdown">' +
        '<li>Average weekly earnings entered: ' + formatMoney(avgWeeklyEarnings) + '</li>' +
        '<li>Lower earnings limit used: ' + formatMoney(lowerEarningsLimit) + ' a week</li>' +
        '<li>First 6 weeks at 90% of average weekly earnings: ' + formatMoney(firstSixWeekly) + ' a week</li>' +
        '<li>Remaining ' + laterWeeks + ' week(s) at the lower of the standard rate or 90% of average weekly earnings: ' + formatMoney(laterWeekly) + ' a week</li>' +
        '<li>Rate band used: ' + (useNewRate ? 'from 6 April 2026' : 'before 6 April 2026') + '</li>' +
        '</ul>' +
        '<div class="result-card-grid">' +
        '<div class="result-card"><h3>What this means</h3><p class="muted">This is a simple SMP estimate for the weeks entered, not a full leave or eligibility decision.</p></div>' +
        '<div class="result-card"><h3>What is included</h3><ul><li>The first 6 weeks at 90% of average weekly earnings.</li><li>The standard weekly SMP rate after that, or 90% if lower.</li><li>The correct rate band for the due date entered where available.</li></ul></div>' +
        '<div class="result-card"><h3>What is not included</h3><ul><li>Employer-enhanced maternity pay schemes.</li><li>A full qualifying-week or notice audit.</li><li>Shared parental leave planning or Maternity Allowance calculations.</li></ul></div>' +
        '<div class="result-card"><h3>Eligibility check</h3><p class="muted">' + thresholdText + '</p></div>' +
        '<div class="result-card"><h3>What to check next</h3><ul><li>Check the qualifying week, notice given and any MATB1 requirements.</li><li>Check whether your employer offers enhanced maternity pay.</li><li>' + fallbackText + '</li></ul></div>' +
        '<div class="result-card"><h3>Pay timing reminder</h3><p class="muted">SMP is usually paid in the same way as wages and tax and National Insurance can still be deducted.</p></div>' +
        '</div>' +
        '<div class="site-note">Use this figure as a first check before looking at leave dates, eligibility details and any employer enhancement.</div>' +
        '</div>';
      revealResult(result);
    });
  }

  const paternityForm = document.querySelector('[data-tool="paternity-pay"]');
  if (paternityForm) {
    paternityForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const dueOrBirthDate = document.getElementById('dueOrBirthDate').value;
      const avgWeeklyEarnings = Number(document.getElementById('avgWeeklyEarnings').value || 0);
      const weeksChosen = Number(document.getElementById('weeksChosen').value || 1);
      const result = document.getElementById('paternityResult');

      if (avgWeeklyEarnings <= 0) {
        result.innerHTML =
          '<div class="result-stack">' +
          '<p class="result-lead"><strong>Enter average weekly earnings to build the estimate.</strong></p>' +
          '<div class="site-note">Use gross average weekly earnings rather than net pay.</div>' +
          '</div>';
        revealResult(result);
        return;
      }

      const rateChangeDate = new Date('2026-04-06');
      const chosenDate = dueOrBirthDate ? new Date(dueOrBirthDate) : null;
      const useNewRate = chosenDate && chosenDate >= rateChangeDate;
      const weeklyRate = useNewRate ? 194.32 : 187.18;
      const lowerEarningsLimit = useNewRate ? 129 : 125;
      const weeklyPayUsed = Math.min(avgWeeklyEarnings * 0.9, weeklyRate);
      const totalEstimate = weeklyPayUsed * weeksChosen;
      const meetsThreshold = avgWeeklyEarnings >= lowerEarningsLimit;

      result.innerHTML =
        '<div class="result-stack">' +
        '<p class="result-lead"><strong>Estimated Statutory Paternity Pay:</strong> ' + formatMoney(totalEstimate) + '</p>' +
        '<ul class="result-breakdown">' +
        '<li>Weeks chosen: ' + weeksChosen + '</li>' +
        '<li>Weekly pay used: ' + formatMoney(weeklyPayUsed) + '</li>' +
        '<li>Average weekly earnings entered: ' + formatMoney(avgWeeklyEarnings) + '</li>' +
        '<li>Lower earnings limit used: ' + formatMoney(lowerEarningsLimit) + ' a week</li>' +
        '<li>Rate band used: ' + (useNewRate ? 'from 6 April 2026' : 'before 6 April 2026') + '</li>' +
        '</ul>' +
        '<div class="result-card-grid">' +
        '<div class="result-card"><h3>What this means</h3><p class="muted">This is a simple SPP estimate based on the current weekly statutory rate or 90% of average weekly earnings if lower.</p></div>' +
        '<div class="result-card"><h3>What is included</h3><ul><li>1 or 2 weeks of statutory paternity pay.</li><li>The correct weekly rate band for the date entered where available.</li><li>A simple lower earnings limit check.</li></ul></div>' +
        '<div class="result-card"><h3>What is not included</h3><ul><li>Employer-enhanced paternity pay.</li><li>A full notice and eligibility audit.</li><li>Shared Parental Pay or longer leave planning.</li></ul></div>' +
        '<div class="result-card"><h3>Earnings check</h3><p class="muted">' + (meetsThreshold ? 'The average weekly earnings entered are at or above the lower earnings limit used for this date band.' : 'The average weekly earnings entered are below the lower earnings limit used for this date band, so eligibility needs checking carefully.') + '</p></div>' +
        '<div class="result-card"><h3>What to check next</h3><ul><li>Check the notice timing and employment requirements.</li><li>Check whether 1 week or 2 separate weeks is the better fit.</li><li>If the real question is longer shared leave, compare the paternity route with Shared Parental Leave next.</li></ul></div>' +
        '<div class="result-card"><h3>Pay timing reminder</h3><p class="muted">SPP is usually paid in the same way as wages and tax and National Insurance can still be deducted.</p></div>' +
        '</div>' +
        '<div class="site-note">Use this figure as a quick check before reviewing notice, eligibility and any enhanced family-pay policy.</div>' +
        '</div>';
      revealResult(result);
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
        revealResult(result);
        return;
      }

      const chosenDismissalDate = dismissalDate ? new Date(dismissalDate) : null;
      const limitDate2026 = new Date('2026-04-06');
      const qualifyingDate2027 = new Date('2027-01-01');
      const use2026Limits = chosenDismissalDate && chosenDismissalDate >= limitDate2026;
      const uses2027Qualification = chosenDismissalDate && chosenDismissalDate >= qualifyingDate2027;

      const weekPayCap = use2026Limits ? 751 : 719;
      const compensatoryStatutoryCap = use2026Limits ? 123543 : 118223;
      const ordinaryQualificationYears = uses2027Qualification ? 0.5 : 2;
      const ordinaryQualificationLabel = uses2027Qualification ? '6 months' : '2 years';
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
        ? 'On the service entered, the usual service rule for ordinary unfair dismissal is less likely to be the main problem.'
        : 'On the service entered, the usual service rule for ordinary unfair dismissal may be the main warning point. Automatic-unfair and some other routes can work differently.';

      let qualificationNextStep = ordinaryQualificationMet
        ? 'Focus next on the fairness of the dismissal process, the stated reason, the appeal trail and the evidence of financial loss.'
        : 'Check urgently whether the facts point to automatic unfair dismissal, discrimination, whistleblowing or another route with different qualification rules.';

      let dateBandText = dismissalDate
        ? (use2026Limits ? 'Dismissal date entered is in the from-6-April-2026 limits band.' : 'Dismissal date entered is in the pre-6-April-2026 limits band.')
        : 'No dismissal date entered, so the pre-6-April-2026 cap is used as a cautious default.';

      const weeklyLossText = weeklyLoss > 0
        ? 'Estimated weekly loss used: ' + formatMoney(weeklyLoss) + ' after replacement earnings.'
        : 'No ongoing weekly loss is being used beyond the entered direct losses.';

      let timeLimitBreakdown = '<li>No dismissal date entered, so no guide date is shown for the usual tribunal limit.</li>';
      let timeLimitCard = '<p class="muted">Enter the dismissal date to show a simple guide date for the usual tribunal time limit.</p>';
      if (chosenDismissalDate) {
        const usualLimit = addMonthsMinusDays(chosenDismissalDate, 3, 1);
        const usualLimitLabel = formatDateUK(usualLimit);
        timeLimitBreakdown = '<li>Usual tribunal time-limit guide from the dismissal date entered: ' + usualLimitLabel + '</li>';
        timeLimitCard = '<p class="muted">Guide date from the dismissal date entered: <strong>' + usualLimitLabel + '</strong>.</p><p class="muted">Do not leave it until the last minute. Early conciliation can affect the clock, so use this as an act-now prompt rather than a safe final date.</p>';
      }

      result.innerHTML =
        '<div class="result-stack">' +
        '<p class="result-lead"><strong>Estimated unfair-dismissal award framework:</strong> ' + formatMoney(totalEstimate) + '</p>' +
        '<ul class="result-breakdown">' +
        '<li>Estimated basic-award element: ' + formatMoney(basicAward) + '</li>' +
        '<li>Estimated compensatory-loss element after cap: ' + formatMoney(estimatedCompensatory) + '</li>' +
        '<li>Basic-award service used: ' + cappedYears + ' full year(s), capped at 20</li>' +
        '<li>Capped week\'s pay used for the basic-award framework: ' + formatMoney(cappedWeekPay) + ' (statutory cap: ' + formatMoney(weekPayCap) + ')</li>' +
        '<li>Compensatory cap used: ' + formatMoney(compensatoryCapUsed) + ' (lower of statutory cap and 52 weeks\' gross pay)</li>' +
        '<li>Usual service-rule guide used: ' + ordinaryQualificationLabel + '</li>' +
        '<li>' + weeklyLossText + '</li>' +
        '<li>' + dateBandText + '</li>' +
        timeLimitBreakdown +
        '</ul>' +
        '<div class="result-card-grid">' +
        '<div class="result-card"><h3>What this means</h3><p class="muted">This is a first-pass unfair-dismissal framework, not a tribunal prediction. The compensatory side is often the bigger moving part because it depends on real financial loss and evidence.</p></div>' +
        '<div class="result-card"><h3>Qualification guide</h3><p class="muted">' + qualificationText + '</p><p class="muted">' + qualificationNextStep + '</p></div>' +
        '<div class="result-card"><h3>What is included</h3><ul><li>A basic-award framework using age, service and a capped week\'s pay.</li><li>A compensatory-loss framework using lost earnings and direct loss.</li><li>The current cap structure for the date band used.</li></ul></div>' +
        '<div class="result-card"><h3>What is not included</h3><ul><li>Any uplift or reduction for Acas Code issues.</li><li>Reductions for contributory conduct, failure to mitigate, or the chance the dismissal would still have happened.</li><li>Discrimination, whistleblowing or injury-to-feelings awards.</li></ul></div>' +
        '<div class="result-card"><h3>What to do next, in order</h3><ol><li>Check the route first: ordinary unfair dismissal, automatic unfair dismissal, discrimination, redundancy, settlement or final pay.</li><li>Keep the dismissal letter, appeal documents, notes of meetings, policy documents and evidence of job-search efforts together.</li><li>Check whether the loss figure still looks realistic after replacement earnings and other income.</li><li>Start the Acas early-conciliation process quickly if you may need a claim.</li></ol></div>' +
        '<div class="result-card"><h3>Usual time-limit guide</h3>' + timeLimitCard + '</div>' +
        '<div class="result-card"><h3>Best next page</h3><p class="muted">Stay on unfair dismissal if the main document is the dismissal letter or appeal outcome and the real dispute is the fairness of the dismissal. Move to final pay first if the urgent problem is notice, holiday, wages or deductions on the payslip. Move to redundancy or settlement if the argument is really about those specific package lines.</p><p><a href="/help/final-pay-and-leaving-a-job/">Open final-pay bridge page</a> · <a href="/compare/redundancy-vs-settlement-vs-final-pay/">Open compare page</a></p></div>' +
        '</div>' +
        '<div class="site-note">Use this figure to organise the conversation and documents, not as a promise of what a tribunal or settlement will award.</div>' +
        '</div>';
      revealResult(result);
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
        revealResult(result);
        return;
      }

      let packageMeaning = 'This package looks mixed. Check each label carefully before relying on the headline total.';
      let routeTitle = 'Best next page';
      let routeHtml = '<p class="muted">If the package still feels unclear after this split, use the comparison page to work out whether redundancy, settlement, final pay or dismissal-fairness is the main issue first.</p><p><a href="/compare/redundancy-vs-settlement-vs-final-pay/">Open comparison page</a></p>' ;

      if (earningsTotal === 0 && qualifyingTermination > 0) {
        packageMeaning = 'This package looks mainly compensation-based, so the written wording, the package labels and the combined £30,000 threshold are likely to matter most.';
        routeHtml = '<p class="muted">Use the redundancy calculator next if the package is mainly statutory redundancy or a redundancy offer. Stay on the settlement route if the agreement is really about an agreed exit package and claim waiver.</p><p><a href="/tools/redundancy-pay-calculator/">Open redundancy calculator</a></p>';
      } else if (earningsTotal > 0 && qualifyingTermination === 0) {
        packageMeaning = 'This package looks mainly earnings-based, so it is closer to a final-pay check than to a simple tax-free settlement question.';
        routeHtml = '<p class="muted">Use the final-pay page next if the real issue is notice, PILON, holiday, wages or other payroll items rather than compensation.</p><p><a href="/help/final-pay-and-leaving-a-job/">Open final-pay page</a></p>';
      } else if (earningsTotal >= qualifyingTermination) {
        packageMeaning = 'A large part of this package looks like normal taxable earnings, so the take-home figure may be much lower than the headline total shown in the offer.';
        routeHtml = '<p class="muted">Use the final-pay page first, then come back to the settlement route once the payroll-style items have been separated from any compensation.</p><p><a href="/help/final-pay-and-leaving-a-job/">Open final-pay page</a></p>';
      }

      const legalAdviceText = legalAdvicePaid
        ? 'You indicated the employer is covering independent legal advice costs, which is common on many settlement agreements.'
        : 'If this is a settlement agreement, check whether the employer is also covering independent legal advice costs in writing.';

      const thresholdText = qualifyingTermination > 0
        ? 'The £30,000 figure is a combined threshold across qualifying termination-payment elements, not a separate allowance for each item.'
        : 'No qualifying termination-payment amount was entered, so the £30,000 threshold is not doing any work in this version of the package.';
      const payrollShare = totalPackage > 0 ? Math.round((earningsTotal / totalPackage) * 100) : 0;
      const compensationShare = totalPackage > 0 ? Math.round((qualifyingTermination / totalPackage) * 100) : 0;
      const takeHomeText = earningsTotal > 0
        ? 'At least ' + formatMoney(earningsTotal) + ' of the headline figure looks like payroll-style pay. If that chunk is large, the take-home figure can feel much lower than the headline total because those lines are usually the part that goes through payroll first.'
        : 'No payroll-style items were entered, so the headline figure is being driven by compensation-style amounts rather than notice, wages or holiday.';
      const takeHomeSplitHtml = '<ul><li>Payroll-style share of the package: ' + payrollShare + '%</li><li>Compensation-style share of the package: ' + compensationShare + '%</li><li>Use this split to decide whether the real next step is final pay, redundancy or written-agreement checking.</li></ul>';
      const takeHomeRiskLabel = earningsTotal > 0
        ? 'Start by treating about ' + formatMoney(earningsTotal) + ' as the part most likely to reduce take-home pay through normal payroll deductions.'
        : 'This version of the package is being driven by compensation-style lines rather than payroll-style pay.';

      const writingChecksHtml = '<ol class="list-clean action-checklist"><li>Ask for a written breakdown that lists PILON, holiday pay, wages or bonus separately from compensation-style sums.</li><li>Check whether statutory redundancy pay and any extra severance are labelled clearly and not merged into one vague amount such as compensation or ex gratia.</li><li>Check whether the draft agreement says who is paying for independent legal advice, what limit applies and whether the labels match payroll treatment.</li><li>Check whether the same labels are likely to appear on the final payslip or payroll breakdown.</li></ol>';
      const nextStepOrderHtml = '<ol class="list-clean action-checklist"><li>Separate the payroll-style lines first, because they are usually the part most likely to drag the take-home figure down.</li><li>Then check the compensation-style lines against redundancy wording, settlement wording and the combined £30,000 threshold.</li><li>If the package is still mixed or unclear, move to the final-pay bridge page before you judge the whole offer.</li><li>Only compare the headline figure once each line has a clear label.</li></ol>';

      result.innerHTML =
        '<div class="result-stack">' +
        '<p class="result-lead"><strong>Package total entered:</strong> ' + formatMoney(totalPackage) + '</p>' +
        '<ul class="result-breakdown">' +
        '<li>Payroll-style items usually taxed as earnings: ' + formatMoney(earningsTotal) + ' (PILON, holiday pay, wages, bonus or similar)</li>' +
        '<li>Compensation-style items to check against termination-payment rules: ' + formatMoney(qualifyingTermination) + '</li>' +
        '<li>Potentially within the combined £30,000 threshold: ' + formatMoney(thresholdUsed) + '</li>' +
        '<li>Potential qualifying amount above £30,000: ' + formatMoney(aboveThreshold) + '</li>' +
        '</ul>' +
        '<div class="inline-note">' + thresholdText + '</div>' +
        '<div class="result-card-grid">' +
        '<div class="result-card"><h3>Headline total versus take-home risk</h3><p class="muted">' + takeHomeText + '</p><p class="muted"><strong>' + takeHomeRiskLabel + '</strong></p>' + takeHomeSplitHtml + '</div>' +
        '<div class="result-card"><h3>What this likely means</h3><p class="muted">' + packageMeaning + '</p></div>' +
        '<div class="result-card"><h3>What to do next, in order</h3>' + nextStepOrderHtml + '</div>' +
        '<div class="result-card"><h3>Payroll-style lines to separate first</h3><ul><li>PILON</li><li>Holiday pay</li><li>Unpaid wages</li><li>Bonus or commission already earned</li></ul></div>' +
        '<div class="result-card"><h3>Compensation-style lines to check separately</h3><ul><li>Statutory redundancy pay</li><li>Additional severance or ex-gratia style sums</li><li>Amounts that are not really notice, wages or holiday</li></ul></div>' +
        '<div class="result-card"><h3>What this does not decide</h3><ul><li>Whether payroll has applied the tax correctly.</li><li>Whether the offer is fair overall.</li><li>Whether every clause in the agreement is acceptable.</li></ul></div>' +
        '<div class="result-card"><h3>What to verify in writing</h3>' + writingChecksHtml + '</div>' +
        '<div class="result-card"><h3>Independent advice check</h3><p class="muted">' + legalAdviceText + '</p></div>' +
        '<div class="result-card"><h3>' + routeTitle + '</h3>' + routeHtml + '</div>' +
        '</div>' +
        '<div class="site-note">This is a first-pass categorisation tool. Use the written agreement, official guidance and professional advice for the final tax position, especially if the package mixes payroll items with compensation.</div>' +
        '</div>';
      revealResult(result);
    });
  }

  const reviewStamp = document.getElementById('reviewYearBadge');
  if (reviewStamp) {
    reviewStamp.textContent = 'Reviewed against 2026 official guidance';
  }
});
