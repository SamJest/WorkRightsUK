/* DOM adapters for pure calculations; no entered values leave this page. */
(function () {
  'use strict';
  const C = window.WorkRightsCalculations;
  const pounds = n => new Intl.NumberFormat('en-GB', {style:'currency',currency:'GBP',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  const value = id => document.getElementById(id)?.value ?? '';
  function element(tag, text, parent) {
    const el = document.createElement(tag); el.textContent = text;
    if (parent) parent.append(el); return el;
  }
  function line(parent, name, text) { element('li', name + ': ' + text, parent); }
  function link(parent, text, href) {
    const p = element('p', '', parent), a = element('a', text, p); a.href = href;
  }
  function startResult(result, heading) {
    result.replaceChildren(); element('h2', heading, result);
  }
  function errorResult(form, result, error, fields) {
    startResult(result, 'Check your entries');
    element('p', error.message, result);
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    const input = document.getElementById(fields[error.field]);
    result.hidden = false;
    if (input) {
      const details = input.closest('details'); if (details) details.open = true;
      input.setAttribute('aria-invalid','true'); input.setAttribute('aria-describedby',result.id);
      input.focus();
    } else revealResult(result);
  }
  function bind(tool, resultId, read, calculate, render, fields) {
    const form = document.querySelector('[data-tool="' + tool + '"]');
    if (!form) return;
    const result = document.getElementById(resultId);
    form.noValidate = true;
    form.addEventListener('input', () => {
      result.hidden = true; result.replaceChildren();
      form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      try {
        form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
        const input = read(), output = calculate(input);
        render(result, output, input); revealResult(result);
        if(output.complete===false&&(tool==='maternity-pay'||tool==='paternity-pay')) {
          window.WorkRightsAnalytics?.track('tool_validation_error',{tool_name:toolNames[tool],error_code:output.earnings_screen_passed?'unsupported_payment_period':'earnings_below_threshold'});
        } else window.WorkRightsAnalytics?.track('tool_calculate',{tool_name:toolNames[tool],mode:input.mode});
      } catch (error) {
        errorResult(form, result, error, fields);
        window.WorkRightsAnalytics?.track('tool_validation_error',{tool_name:toolNames[tool],error_code:error.code});
      }
    });
  }
  const toolNames = {'redundancy-pay':'redundancy_pay_calculator','notice-period':'notice_period_calculator','final-pay':'final_pay_calculator','unfair-dismissal':'unfair_dismissal_estimator','maternity-pay':'maternity_pay_calculator','paternity-pay':'paternity_pay_calculator'};
  function claimHelp(result) {
    element('p', 'Act promptly if pay or dismissal is disputed. This tool does not calculate claim deadlines: the claim type, event date, transition rules and early conciliation can affect time limits.',result);
    link(result,'Check official tribunal guidance','https://www.gov.uk/employment-tribunals/make-a-claim');
  }
  function showBands(result, r) {
    const list = element('ul','',result);
    line(list,'Full service years used (last 20 maximum)',r.service_year_cap);
    line(list,'Weeks for years under 22',r.age_band_weeks.under_22);
    line(list,'Weeks for years aged 22–40',r.age_band_weeks.age_22_to_40);
    line(list,'Weeks for years aged 41+',r.age_band_weeks.age_41_plus);
    line(list,'Weekly pay used',pounds(r.capped_weekly_pay_gbp));
    line(list,'Weekly cap',pounds(r.pay_cap_gbp));
  }
  window.initialiseCoreTools = function () {
    for(const [kind,tool,resultId,ids] of [
      ['maternity','maternity-pay','maternityResult',{due:'maternityDueDate',start:'maternityPayStartDate',earnings:'maternityAvgWeeklyEarnings',weeks:'maternityWeeksRequested',confirmation:'maternityEligibilityConfirmed'}],
      ['paternity','paternity-pay','paternityResult',{due:'dueOrBirthDate',start:'paternityPayStartDate',second:'paternitySecondWeekStartDate',earnings:'avgWeeklyEarnings',weeks:'weeksChosen',confirmation:'paternityEligibilityConfirmed'}]
    ]) {
      bind(tool,resultId,()=>({due_date:value(ids.due),pay_start_date:value(ids.start),second_week_start_date:value(ids.second),
        average_weekly_earnings_gbp:value(ids.earnings),weeks:value(ids.weeks),eligibility_confirmed:document.getElementById(ids.confirmation).checked}),
        input=>C.familyPay(kind,input),(result,output)=>renderFamilyPay(result,output,kind),
        {due_date:ids.due,pay_start_date:ids.start,second_week_start_date:ids.second,average_weekly_earnings:ids.earnings,weeks:ids.weeks,eligibility_confirmed:ids.confirmation});
    }
    const paternityWeeks=document.getElementById('weeksChosen');
    if(paternityWeeks) {
      const update=()=>{document.getElementById('paternitySecondWeek').hidden=paternityWeeks.value!=='2';};
      paternityWeeks.addEventListener('change',update);update();
    }
    bind('redundancy-pay','redundancyResult',()=>({birth_date:value('birthDate'),start_date:value('employmentStartDate'),relevant_date:value('dismissalDate'),gross_weekly_pay_gbp:value('weeklyPay')}), C.redundancy,
      (result,r)=>{
        startResult(result,r.normally_eligible ? 'Estimated gross statutory redundancy pay: '+pounds(r.gross_estimate_gbp) : 'Normally less than two years’ service: check eligibility');
        showBands(result,r);
        element('p','Great Britain employees only. Assumes ordinary continuous service and the confirmed relevant date, without disputed notice/PILON adjustments. Enhanced terms, notice, holiday and wages are separate. This is an estimate, not a decision on entitlement.',result);
        link(result,'Official redundancy rules and calculator','https://www.gov.uk/redundancy-your-rights/redundancy-pay');
        link(result,'How notice/PILON affects the relevant date','https://www.acas.org.uk/your-rights-during-redundancy/redundancy-pay');
        claimHelp(result);
      },{birth_date:'birthDate',start_date:'employmentStartDate',relevant_date:'dismissalDate',gross_weekly_pay:'weeklyPay'});
    bind('notice-period','noticeResult',()=>({direction:value('noticeDirection'),service_years:value('noticeYears'),service_months:value('noticeMonths'),contract_weeks:value('contractWeeks'),notice_start_date:value('noticeStartDate')}), C.notice,
      (result,r,input)=>{
        startResult(result,'Estimated notice: '+r.notice_weeks+' week(s)');
        const list=element('ul','',result);
        line(list,'Direction',input.direction === 'employee_resigning' ? 'You resigning' : 'Employer dismissal or redundancy');
        line(list,'General statutory minimum',r.statutory_minimum_weeks+' week(s)');
        line(list,'Contractual weeks entered for this direction',input.contract_weeks || 'None');
        if(r.illustrative_last_day) line(list,'Illustrative last notice day, counting inclusively from your confirmed first day',new Intl.DateTimeFormat('en-GB',{timeZone:'UTC'}).format(C.date(r.illustrative_last_day,'notice_start_date')));
        element('p','Great Britain employees only. Check the clause for this direction: resignation and dismissal clauses may differ. Gross misconduct, serious breach, agreed changes, disputed service and notice receipt/start rules need separate advice. This is a length estimate, not a definitive end date.',result);
        link(result,'Acas: notice when resigning','https://www.acas.org.uk/notice-periods/notice-when-resigning');
        link(result,'Acas: dismissal and redundancy notice','https://www.acas.org.uk/notice-periods/notice-when-being-dismissed-or-made-redundant');
        link(result,'Check wages, holiday and notice in final pay','/tools/final-pay-calculator/');
      },{direction:'noticeDirection',service_years:'noticeYears',service_months:'noticeMonths',contract_weeks:'contractWeeks',notice_start_date:'noticeStartDate'});
    bind('unfair-dismissal','unfairDismissalResult',()=>({birth_date:value('unfairBirthDate'),start_date:value('unfairStartDate'),dismissal_date:value('unfairDismissalDate'),gross_weekly_pay_gbp:value('unfairWeeklyPay'),weeks_loss:value('unfairWeeksLoss'),new_weekly_pay_gbp:value('unfairNewWeeklyPay'),other_losses_gbp:value('unfairOtherLosses')}), C.unfairDismissal,
      (result,r)=>{
        startResult(result,'Illustrative award framework: '+pounds(r.total_estimate_gbp));
        const list=element('ul','',result);
        line(list,'Basic award before individual adjustments',pounds(r.basic_award_gbp));
        line(list,'Loss estimate after ordinary cap',pounds(r.estimated_compensatory_gbp));
        line(list,'Ordinary compensatory cap used (lower of statutory limit and 52 weeks’ pay)',pounds(r.compensatory_cap_used_gbp));
        showBands(result,r);
        element('p',r.ordinary_qualification_met ? 'The entered service meets the general two-year ordinary qualifying period for supported dates.' : 'Less than two full years: ordinary eligibility may not be met. Automatically unfair dismissal and other claims have different rules. This illustration does not establish eligibility.',result);
        element('p','Great Britain, ordinary cases only, effective termination dates from 6 April 2025 to 31 December 2026. Reductions, mitigation, Acas Code adjustments and special awards are not modelled. Not a tribunal prediction. Seek advice on disputed effective dates or notice/PILON extensions.',result);
        link(result,'Official unfair dismissal guidance','https://www.gov.uk/dismissal/unfair-and-constructive-dismissal');
        claimHelp(result);
      },{birth_date:'unfairBirthDate',start_date:'unfairStartDate',dismissal_date:'unfairDismissalDate',relevant_date:'unfairDismissalDate',gross_weekly_pay:'unfairWeeklyPay',weeks_loss:'unfairWeeksLoss',new_weekly_pay:'unfairNewWeeklyPay',other_losses:'unfairOtherLosses'});
    bind('final-pay','finalPayResult',readFinalPay,C.finalPay,renderFinalPay,{
      pay_basis:'finalPayBasis',gross_rate:'finalPayRate',period_workdays:'finalPayPeriodDays',worked_workdays:'finalPayWorkedDays',
      annual_holiday_days:'finalHolidayAllowance',holiday_months:'finalHolidayMonths',holiday_taken_days:'finalHolidayTaken',holiday_carry_days:'finalHolidayCarry',
      notice:'finalNoticePay',other:'finalOtherPay',separate_package:'finalSeparatePackage',employer_quote:'finalEmployerQuote',holiday_pattern:'finalHolidayPattern',holiday_day_rate:'finalHolidayDayRate',day_basis:'finalDayBasis',holiday_rate_confirmed:'finalHolidayRateConfirmed'
    });
    const finalForm = document.querySelector('[data-tool="final-pay"]');
    if (finalForm) {
      document.getElementById('finalMode').addEventListener('change', () => {
        document.getElementById('finalDetailed').open = value('finalMode') === 'detailed';
      });
      const updateHoliday = () => {
        const regular = value('finalHolidayPattern') === 'regular';
        document.getElementById('finalHolidayFields').hidden = !regular;
      };
      document.getElementById('finalHolidayPattern').addEventListener('change', updateHoliday);
      const updateBasis = () => {
        const daily = value('finalPayBasis') === 'daily';
        const period = document.getElementById('finalPayPeriodDays');
        period.disabled = daily;
        period.closest('label').hidden = daily;
      };
      document.getElementById('finalPayBasis').addEventListener('change', updateBasis);
      updateHoliday(); updateBasis();
    }
  };
  function renderFamilyPay(result,r,kind) {
    const label=kind==='maternity'?'SMP':'SPP';
    startResult(result,!r.earnings_screen_passed?'No payable estimate: earnings screen needs checking':r.complete?
      'Estimated gross '+label+' for '+r.weeks.length+' complete payment week(s): '+pounds(r.total_gbp):'Full-period '+label+' total unavailable');
    element('p','Qualifying week: '+r.qualifying_week_start+' to '+r.qualifying_week_end+'. Earnings threshold at the end of that week: '+pounds(r.lower_earnings_limit_gbp)+' per week. The due date determines this screen; it does not select a single rate for the whole pay period.',result);
    if(!r.earnings_screen_passed) {
      element('p','Your entered average earnings are below that threshold. No payable estimate is shown. Check the relevant earnings period and any pay-rise or special-case rules with payroll or HMRC; this is not a final eligibility decision.',result);
    } else {
      if(!r.complete) {
        element('p',r.unpriced_weeks+' requested week(s) cannot be priced by this model. No full-period total is shown. April 2027 rates and paternity weeks spanning the 6 April 2026 change need an individual check; old rates have not been carried forward.',result);
        if(r.known_subtotal_gbp!==null) element('p','Subtotal for '+(r.weeks.length-r.unpriced_weeks)+' priced week(s) only: '+pounds(r.known_subtotal_gbp)+'. This excludes the unpriced weeks and is not the amount for the whole period.',result);
      }
      const details=element('details','',result);element('summary','Payment-week breakdown',details);
      const list=element('ol','',details);
      for(const w of r.weeks) element('li',w.start_date+' to '+w.end_date+': '+(w.gross_gbp===null?'Amount withheld — '+(w.reason==='uprating_week_review'?'2026 paternity uprating week needs review.':'rate for this week has not been verified.'):
        pounds(w.gross_gbp)+'; '+w.basis+(kind==='maternity'&&w.week<=6?'':'; standard rate '+pounds(w.standard_rate_gbp))) ,list);
    }
    element('p','Assumptions: ordinary birth route in Great Britain, eligibility and average earnings checked separately, confirmed first payment-week dates, unchanged earnings and one full weekly payment per week. Fractional pennies round upwards on each weekly payment. Monthly/part-week payroll allocation, pay rises, early-birth exceptions, work during leave, adoption/surrogacy, enhanced pay, tax and National Insurance are outside this estimate. Dates and earnings stay in this page; they are not sent in analytics.',result);
    link(result,'HMRC current rates and thresholds','https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027');
    link(result,'Official '+label+' guidance',kind==='maternity'?'https://www.gov.uk/maternity-pay-leave/pay':'https://www.gov.uk/paternity-pay-leave/pay');
    link(result,'Check eligibility using the official employer calculator','https://www.gov.uk/maternity-paternity-calculator');
    link(result,'Next steps if SMP or SPP may not fit','/help/what-to-do-next-if-you-may-not-qualify-for-smp-or-spp/');
    element('p','Calculation scope checked 1 November 2026. This is an estimate, not individual legal or payroll approval.',result);
  }
  function readFinalPay() {
    return {pay_basis:value('finalPayBasis'),gross_rate_gbp:value('finalPayRate'),period_workdays:value('finalPayPeriodDays'),worked_workdays:value('finalPayWorkedDays'),
      annual_holiday_days:value('finalHolidayAllowance'),holiday_months:value('finalHolidayMonths'),holiday_taken_days:value('finalHolidayTaken'),holiday_carry_days:value('finalHolidayCarry'),
      notice_gbp:value('finalNoticePay'),other_gbp:value('finalOtherPay'),separate_package_gbp:value('finalSeparatePackage'),
      mode:value('finalMode'),day_basis:value('finalDayBasis'),holiday_pattern:value('finalHolidayPattern'),holiday_day_rate_gbp:value('finalHolidayDayRate'),
      holiday_rate_confirmed:document.getElementById('finalHolidayRateConfirmed').checked,
      written_deduction_agreed:document.getElementById('finalWrittenAgreement').checked,employer_quote_gbp:value('finalEmployerQuote')};
  }
  function renderFinalPay(result,r,input) {
    startResult(result,'Estimated gross payroll subtotal: '+pounds(r.gross_payroll_subtotal_gbp));
    const table=element('table','',result);table.className='pay-breakdown';
    element('caption','Gross estimate — amounts rounded to pennies',table);
    const body=element('tbody','',table);
    for(const [label,amount] of [
      ['Wages earned',r.gross_wages_gbp],['Illustrative unused holiday',r.illustrative_holiday_value_gbp],
      ['Notice/PILON entered',r.notice_gbp],['Other earned pay entered',r.other_gbp],
      [input.written_deduction_agreed ? 'Excess-holiday deduction (prior written agreement confirmed)' : 'Excess-holiday deduction (not included)',r.deduction_gbp ? -r.deduction_gbp : 0],
      ['Gross payroll subtotal',r.gross_payroll_subtotal_gbp],['Separate redundancy/settlement amount entered',r.separate_package_gbp],
      ['Combined illustration, including separate package',r.illustrative_combined_gbp]
    ]) {const row=element('tr','',body);element('th',label,row).scope='row';element('td',pounds(amount),row);}
    if(r.quote_difference_gbp!==null) {
      element('h3','Employer figure comparison',result);
      element('p','Employer gross payroll figure entered: '+pounds(r.employer_quote_gbp)+'. Difference (entered employer figure minus payroll estimate): '+(r.quote_difference_gbp>0?'+':'')+pounds(r.quote_difference_gbp)+'. Compare like-for-like gross payroll lines only, excluding the separate package. An arithmetic difference is not a legal finding of underpayment.',result);
    }
    element('h3','How the maths works',result);
    element('p',input.pay_basis==='daily' ? 'Wages = '+pounds(Number(input.gross_rate_gbp))+' daily rate × '+input.worked_workdays+' days paid.' : 'Wages = '+pounds(Number(input.gross_rate_gbp))+' '+input.pay_basis+' gross rate ÷ '+input.period_workdays+' days in the period × '+input.worked_workdays+' days paid. Day basis selected: '+input.day_basis+'. Use the same basis for both counts and confirm payroll’s contractual method.',result);
    element('p',input.holiday_pattern==='none' ? 'Holiday excluded by your selection. This subtotal is incomplete if holiday pay is due.' : 'Holiday uses the illustrative annual allowance × months / 12, plus eligible carry-over, less days taken. Holiday balance: '+r.holiday_balance_days.toFixed(2)+' days. Daily value confirmed for this illustration: '+pounds(r.holiday_day_rate_gbp)+'. Check payroll’s lawful holiday-pay basis; fractional months and normal earnings can change the result.',result);
    if(r.potential_deduction_gbp>0) element('p','Possible excess-holiday deduction: '+pounds(r.potential_deduction_gbp)+'. '+(r.deduction_gbp>0?'Included because you confirmed prior written agreement.':'Not deducted: prior written agreement has not been confirmed.')+' A contract or written agreement beforehand is required; check its terms with payroll.',result);
    element('p','Great Britain, regular fixed pay and equal working days only. Gross illustration, not take-home pay or confirmed entitlement. Variable pay, irregular hours, part-year work, contract enhancements and Northern Ireland require separate guidance.',result);
    link(result,'Acas: holidays and final pay','https://www.acas.org.uk/final-pay-when-someone-leaves-a-job/how-holidays-affect-final-pay');
    link(result,'GOV.UK: holiday pay and working patterns','https://www.gov.uk/holiday-entitlement-rights/holiday-pay');
    link(result,'What to check on your last payslip','/help/final-pay-and-leaving-a-job/');
    link(result,'Check notice direction and length','/tools/notice-period-calculator/');
    link(result,'Check regular-pattern holiday entitlement','/tools/holiday-entitlement-calculator/');
    element('h3','Ask payroll next',result);
    element('p','Request the pay-period divisor, days paid, leave-year dates, normal holiday-pay rate, eligible carry-over, prior written deduction agreement and a line-by-line gross breakdown. Keep notice/PILON and redundancy or settlement lines separate. Raise discrepancies promptly; do not wait for a perfect estimate if a claim deadline may apply.',result);
    element('p','WorkRightsUK — calculation scope checked 1 November 2026. No individual legal/payroll approval. Rounded per money line to the nearest penny.',result);
    const resultText = Array.from(result.children).map(el => el.tagName === 'TABLE'
      ? Array.from(el.querySelectorAll('tr')).map(row=>Array.from(row.children).map(cell=>cell.textContent).join(': ')).join('\n')
      : el.textContent).join('\n\n');
    const summary = 'WorkRightsUK — gross final-pay estimate\n'+resultText+'\nSources:\nhttps://www.acas.org.uk/final-pay-when-someone-leaves-a-job/how-holidays-affect-final-pay\nhttps://www.gov.uk/holiday-entitlement-rights/holiday-pay';
    const actions=element('div','',result); actions.className='result-actions';
    const print=element('button','Print summary',actions); print.type='button';
    print.addEventListener('click',()=>{
      window.WorkRightsAnalytics?.track('tool_result_print',{tool_name:'final_pay_calculator'});
      window.print();
    });
    const copy=element('button','Copy summary',actions);copy.type='button';
    const feedback=element('p','',actions); feedback.setAttribute('role','status');
    copy.addEventListener('click',async()=>{
      try {
        await navigator.clipboard.writeText(summary); feedback.textContent='Summary copied. It contains pay amounts; share it only where you choose.';
        window.WorkRightsAnalytics?.track('tool_result_copy',{tool_name:'final_pay_calculator'});
      }
      catch(error) {
        feedback.textContent='Clipboard access unavailable. Select and copy the summary below.';
        let fallback=actions.querySelector('textarea');
        if(!fallback) { fallback=element('textarea','',actions);fallback.readOnly=true;fallback.setAttribute('aria-label','Summary to copy'); }
        fallback.value=summary;fallback.focus();fallback.select();
      }
    });
  }
}());
