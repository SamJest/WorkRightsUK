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

function syncHeaderOffsetVariable() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const offset = getHeaderOffset();
  root.style.setProperty('--header-offset', offset + 'px');
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
    window.setTimeout(function () {
      scrollElementIntoViewWithOffset(result);
    }, 420);
  };

  if (typeof window !== 'undefined') {
    let resizeTimer = null;
    const onResize = function () {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(function () {
        scrollElementIntoViewWithOffset(result);
      }, 90);
    };

    window.requestAnimationFrame(scrollToResult);
    window.addEventListener('resize', onResize, { once: true });
  }
}

function getSamePageHash(href) {
  if (!href || typeof window === 'undefined') return '';
  if (href.charAt(0) === '#') return href;

  try {
    const url = new URL(href, window.location.href);
    if (url.origin === window.location.origin && url.pathname === window.location.pathname && url.hash) {
      return url.hash;
    }
  } catch (error) {
    return '';
  }

  return '';
}

function openAncestorDetails(target) {
  if (!target || typeof target.closest !== 'function') return;
  let details = target.closest('details');
  while (details) {
    details.open = true;
    details = details.parentElement ? details.parentElement.closest('details') : null;
  }
}

function initialiseSamePageAnchorScroll() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const onHashTarget = function (hash) {
    if (!hash || hash === '#') return;
    const target = document.querySelector(hash);
    if (!target) return;
    openAncestorDetails(target);
    window.requestAnimationFrame(function () {
      scrollElementIntoViewWithOffset(target);
    });
  };

  document.querySelectorAll('a[href*="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      const href = link.getAttribute('href');
      const hash = getSamePageHash(href);
      if (!hash || hash === '#') return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      openAncestorDetails(target);
      if (window.location.hash !== hash) {
        history.replaceState(null, '', hash);
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


function initialiseDetailsToggleAssist() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  document.querySelectorAll('details').forEach(function (detail) {
    detail.addEventListener('toggle', function () {
      if (!detail.open) return;
      const summary = detail.querySelector('summary');
      if (!summary) return;
      window.requestAnimationFrame(function () {
        const top = summary.getBoundingClientRect().top;
        if (top < getHeaderOffset() + 8) {
          scrollElementIntoViewWithOffset(detail);
        }
      });
    });
  });
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0
  }).format(value);
}

document.addEventListener('DOMContentLoaded', function () {
  syncHeaderOffsetVariable();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', syncHeaderOffsetVariable);
    window.addEventListener('orientationchange', syncHeaderOffsetVariable);
  }
  initialiseSamePageAnchorScroll();
  initialiseDetailsToggleAssist();
  if (typeof initialiseCoreTools === 'function') initialiseCoreTools();
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
      const monthsCoveredInput = Number(document.getElementById('monthsCovered').value);
      const monthsCovered = monthsCoveredInput;
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
        window.WorkRightsAnalytics?.track('tool_validation_error', {tool_name: 'holiday_entitlement_calculator', error_code:'invalid_input'});
        revealResult(result);
        return;
      }

      let holidayEstimate;
      try {
        holidayEstimate = window.WorkRightsCalculations.regularHoliday({days_per_week:daysPerWeek,months:document.getElementById('monthsCovered').value,carry:carryOverDays,taken:takenDays,mode});
      } catch (error) {
        result.textContent=error.message;
        window.WorkRightsAnalytics?.track('tool_validation_error',{tool_name:'holiday_entitlement_calculator',error_code:'invalid_input'});
        revealResult(result);return;
      }
      const fullYearDays = holidayEstimate.full_year_days;

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
        const remaining = holidayEstimate.remaining_days;
        leadLabel = remaining >= 0 ? 'Estimated holiday still to account for:' : 'Estimated holiday potentially taken ahead:';
        modeLabel = 'Leaver mode';
        extraRows += '<li>Holiday already taken entered: ' + takenDays + ' day(s)</li>';
        extraRows += '<li>Simple balance after time taken: ' + remaining + ' day(s)</li>';
        explanation = remaining >= 0
          ? 'This suggests there may still be accrued statutory holiday left to account for in final pay.'
          : 'This suggests more holiday may have been taken than this simple estimate covers, so the final-pay position needs checking carefully.';
        actionIntro = 'Check the leaving date, holiday already taken, and whether the final payslip includes any untaken statutory holiday that still had to be paid. If holiday is only one line inside a bigger leaving package, use the final-pay page before judging the whole total or arguing about the wider package.';
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
        '<p class="result-lead"><strong>' + leadLabel + '</strong> ' + holidayEstimate.headline_days + ' day(s)</p>' +
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
      window.WorkRightsAnalytics?.track('tool_calculate', {tool_name: 'holiday_entitlement_calculator'});
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
        window.WorkRightsAnalytics?.track('tool_validation_error', {tool_name: 'settlement_tax_checker', error_code:'invalid_input'});
        revealResult(result);
        return;
      }

      let packageMeaning = 'This package looks mixed. Split the lines before you rely on the headline total or compare the offer with another figure.';
      let routeTitle = 'Best next page';
      let routeHtml = '<p class="muted">If the package still feels unclear after this split, use the comparison page to work out whether redundancy, settlement, final pay or dismissal-fairness is the main issue first.</p><p><a href="/compare/redundancy-vs-settlement-vs-final-pay/">Open comparison page</a></p>' ;

      if (earningsTotal === 0 && qualifyingTermination > 0) {
        packageMeaning = 'This package looks mainly compensation-based, so the written wording, the package labels and the combined £30,000 threshold are likely to matter most before you judge the offer.';
        routeHtml = '<p class="muted">Use the redundancy calculator next if the package is mainly statutory redundancy or a redundancy offer. Stay on the settlement route if the agreement is really about an agreed exit package and claim waiver.</p><p><a href="/tools/redundancy-pay-calculator/">Open redundancy calculator</a></p>';
      } else if (earningsTotal > 0 && qualifyingTermination === 0) {
        packageMeaning = 'This package looks mainly earnings-based, so it is closer to a final-pay check than to a simple tax-free settlement question about the whole headline number.';
        routeHtml = '<p class="muted">Use the final-pay page next if the real issue is notice, PILON, holiday, wages or other payroll items rather than compensation. That is usually the fastest bridge when the offer still feels like one mixed total.</p><p><a href="/help/final-pay-and-leaving-a-job/">Open final-pay page</a></p>';
      } else if (earningsTotal >= qualifyingTermination) {
        packageMeaning = 'A large part of this package looks like normal taxable earnings, so the take-home figure may be much lower than the headline total shown in the offer once payroll deductions are applied.';
        routeHtml = '<p class="muted">Use the final-pay page first, then come back to the settlement route once the payroll-style items have been separated from any compensation. Do not judge the headline total until that split is on paper.</p><p><a href="/help/final-pay-and-leaving-a-job/">Open final-pay page</a></p>';
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
      const headlineRiskText = earningsTotal > 0
        ? 'Read the headline total as a mixed number, not as likely take-home pay. The payroll-style chunk is usually the first place to look when the offer feels much lower in net terms than it looks on paper.'
        : 'With no payroll-style items entered, the headline total is being driven by compensation-style lines rather than the usual payslip-style deductions.';
      const takeHomeSplitHtml = '<ul><li>Payroll-style share of the package: ' + payrollShare + '%</li><li>Compensation-style share of the package: ' + compensationShare + '%</li><li>Use this split to decide whether the real next step is final pay, redundancy or written-agreement checking.</li></ul>';
      const takeHomeRiskLabel = earningsTotal > 0
        ? 'Start by treating about ' + formatMoney(earningsTotal) + ' as the part most likely to reduce take-home pay through normal payroll deductions.'
        : 'This version of the package is being driven by compensation-style lines rather than payroll-style pay.';

      const writingChecksHtml = '<ol class="list-clean action-checklist"><li>Ask for a written breakdown that lists PILON, holiday pay, wages or bonus separately from compensation-style sums.</li><li>Check whether statutory redundancy pay and any extra severance are labelled clearly and not merged into one vague amount such as compensation or ex gratia.</li><li>Check whether the draft agreement says who is paying for independent legal advice, what limit applies and whether the labels match payroll treatment.</li><li>Check whether the same labels are likely to appear on the final payslip or payroll breakdown.</li></ol>';
      const nextStepOrderHtml = '<ol class="list-clean action-checklist"><li>Separate the payroll-style lines first, because they are usually the part most likely to drag the take-home figure down.</li><li>Then check the compensation-style lines against redundancy wording, settlement wording and the combined £30,000 threshold.</li><li>If the package is still mixed or unclear, move to the final-pay bridge page before you judge the whole offer or negotiate on the headline total.</li><li>Only compare the headline figure once each line has a clear label and you know which part is likely to reduce take-home pay.</li></ol>';

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
        '<div class="result-card"><h3>Headline total versus take-home risk</h3><p class="muted">' + takeHomeText + '</p><p class="muted">' + headlineRiskText + '</p><p class="muted"><strong>' + takeHomeRiskLabel + '</strong></p>' + takeHomeSplitHtml + '</div>' +
        '<div class="result-card"><h3>What this likely means</h3><p class="muted">' + packageMeaning + '</p></div>' +
        '<div class="result-card"><h3>What to do next, in order</h3>' + nextStepOrderHtml + '</div>' +
        '<div class="result-card"><h3>Payroll-style lines to separate first</h3><ul><li>PILON</li><li>Holiday pay</li><li>Unpaid wages</li><li>Bonus or commission already earned</li></ul></div>' +
        '<div class="result-card"><h3>Compensation-style lines to check separately</h3><ul><li>Statutory redundancy pay</li><li>Additional severance or ex-gratia style sums</li><li>Amounts that are not really notice, wages or holiday</li></ul></div>' +
        '<div class="result-card"><h3>What this does not decide</h3><ul><li>Whether payroll has applied the tax correctly.</li><li>Whether the offer is fair overall.</li><li>Whether every clause in the agreement is acceptable.</li></ul></div>' +
        '<div class="result-card"><h3>What to verify in writing</h3>' + writingChecksHtml + '</div>' +
        '<div class="result-card"><h3>Independent advice check</h3><p class="muted">' + legalAdviceText + '</p></div>' +
        '<div class="result-card"><h3>What to verify in writing first</h3><p class="muted">Ask for the written breakdown before you negotiate on the headline number. The right next page depends on whether the offer is really being driven by payroll-style lines or compensation-style lines.</p></div>' +
        '<div class="result-card"><h3>' + routeTitle + '</h3>' + routeHtml + '</div>' +
        '</div>' +
        '<div class="site-note">This is a first-pass categorisation tool. Use the written agreement, official guidance and professional advice for the final tax position, especially if the package mixes payroll items with compensation.</div>' +
        '</div>';
      window.WorkRightsAnalytics?.track('tool_calculate', {tool_name: 'settlement_tax_checker'});
      revealResult(result);
    });
  }

  const reviewStamp = document.getElementById('reviewYearBadge');
  if (reviewStamp) {
    reviewStamp.textContent = 'Check each page’s source and review notes';
  }
});
