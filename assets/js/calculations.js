/* Pure GB estimation rules. Sources/effective dates: codex/SOURCE_CHECKS.md. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WorkRightsCalculations = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function fail(code, field, message) {
    const error = new Error(message); error.code = code; error.field = field; throw error;
  }
  function number(value, field, options = {}) {
    if (value === '' || value === undefined || value === null) {
      if (options.optional) return 0;
      fail(field + '_required', field, 'Enter ' + field.replaceAll('_', ' ') + '.');
    }
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > 1e9 || (options.positive && n === 0) ||
        (options.integer && !Number.isInteger(n)) || (options.max !== undefined && n > options.max)) {
      fail(options.code || field + '_invalid', field, 'Check ' + field.replaceAll('_', ' ') + ': enter a valid ' + (options.positive ? 'positive' : 'nonnegative') + ' number.');
    }
    return n;
  }
  // UTC is used as a calendar container, never parsed as a local midnight.
  function date(value, field) {
    if (!value) fail(field + '_required', field, 'Enter ' + field.replaceAll('_', ' ') + '.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) fail('invalid_date', field, 'Enter a valid date.');
    const d = new Date(value + 'T00:00:00Z');
    if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== value) fail('invalid_date', field, 'Enter a valid calendar date.');
    return d;
  }
  function shiftedYear(d, offset) {
    const year = d.getUTCFullYear() + offset, month = d.getUTCMonth();
    const day = Math.min(d.getUTCDate(), new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
    return new Date(Date.UTC(year, month, day));
  }
  function fullYears(start, end) {
    let years = end.getUTCFullYear() - start.getUTCFullYear();
    if (shiftedYear(start, years) > end) years--;
    return years;
  }
  function money(value) {
    if (!Number.isFinite(value) || Math.abs(value) > 1e12) fail('amount_out_of_range', 'gross_rate', 'The resulting amount is outside this estimator’s range.');
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
  function rates(value, field = 'relevant_date') {
    date(value, field);
    if (value < '2025-04-06' || value >= '2027-04-06') fail('unsupported_rate_date', field, 'This model supports 6 April 2025 to 5 April 2027 only. Use official guidance for other dates.');
    return value >= '2026-04-06'
      ? { pay_cap_gbp: 751, maximum_gbp: 22530, compensatory_cap_gbp: 123543 }
      : { pay_cap_gbp: 719, maximum_gbp: 21570, compensatory_cap_gbp: 118223 };
  }
  function serviceBands(input) {
    const end = date(input.relevant_date, 'relevant_date');
    const birth = date(input.birth_date, 'birth_date');
    const start = date(input.start_date, 'start_date');
    if (birth >= start || start > end || fullYears(birth, start) < 16 || fullYears(birth, end) > 100) fail('inconsistent_dates', 'start_date', 'Check birth, start and relevant dates. This estimator covers employment from age 16.');
    if (input.birth_date.endsWith('-02-29') || input.start_date.endsWith('-02-29') || input.relevant_date.endsWith('-02-29')) fail('leap_day_review', 'relevant_date', 'Leap-day service or birthday boundaries need individual review; use the official calculator.');
    const years = fullYears(start, end), used = Math.min(years, 20);
    const bands = { under_22: 0, age_22_to_40: 0, age_41_plus: 0 };
    // ERA s162/s119: reckon backwards from the relevant date, latest 20 years.
    for (let i = 1; i <= used; i++) {
      const age = fullYears(birth, shiftedYear(end, -i));
      const band = age < 22 ? 'under_22' : age < 41 ? 'age_22_to_40' : 'age_41_plus';
      bands[band] += age < 22 ? 0.5 : age < 41 ? 1 : 1.5;
    }
    return { service_years: years, service_year_cap: used, age_band_weeks: bands,
      total_weeks: bands.under_22 + bands.age_22_to_40 + bands.age_41_plus };
  }
  function redundancy(input) {
    const rate = rates(input.cap_date || input.relevant_date, input.cap_date ? 'cap_date' : 'relevant_date');
    const bands = serviceBands(input);
    const pay = number(input.gross_weekly_pay_gbp, 'gross_weekly_pay', { positive: true });
    const eligible = bands.service_years >= 2;
    return { ...bands, ...rate, normally_eligible: eligible, capped_weekly_pay_gbp: Math.min(pay, rate.pay_cap_gbp),
      gross_estimate_gbp: eligible ? money(bands.total_weeks * Math.min(pay, rate.pay_cap_gbp)) : 0 };
  }
  function notice(input) {
    if (!['employee_resigning', 'employer_dismissing'].includes(input.direction)) fail('direction_required', 'direction', 'Choose whether you are resigning or your employer is dismissing you.');
    const years = number(input.service_years, 'service_years', { integer: true, max: 100 });
    const months = number(input.service_months, 'service_months', { integer: true, max: 11 });
    const contract = number(input.contract_weeks, 'contract_weeks', { optional: true, integer: true, max: 104 });
    const total = years * 12 + months;
    const statutory = total < 1 ? 0 : input.direction === 'employee_resigning' ? 1 : Math.min(12, Math.max(1, years));
    const notice_weeks=Math.max(statutory, contract);
    let illustrative_last_day=null;
    if(input.notice_start_date) {
      const firstDay=date(input.notice_start_date,'notice_start_date');
      if(notice_weeks>0) illustrative_last_day=new Date(firstDay.getTime()+(notice_weeks*7-1)*86400000).toISOString().slice(0,10);
    }
    return { statutory_minimum_weeks: statutory, notice_weeks, illustrative_last_day };
  }
  function finalPay(input) {
    if (!['monthly', 'weekly', 'daily'].includes(input.pay_basis)) fail('unknown_basis', 'pay_basis', 'Choose monthly, weekly or daily pay.');
    if (input.mode !== undefined && !['quick', 'detailed'].includes(input.mode)) fail('unknown_mode', 'mode', 'Choose a calculation mode.');
    if (input.day_basis !== undefined && !['working','calendar','contracted'].includes(input.day_basis)) fail('day_basis_required', 'day_basis', 'Choose the day basis agreed for your pay period.');
    if (input.holiday_pattern && !['regular', 'none'].includes(input.holiday_pattern)) fail('unsupported_holiday_pattern', 'holiday_pattern', 'Use official holiday guidance for irregular hours, variable pay or part-year work.');
    const rate = number(input.gross_rate_gbp, 'gross_rate', { positive: true });
    const worked = number(input.worked_workdays, 'worked_workdays');
    const period = input.pay_basis === 'daily' ? 1 : number(input.period_workdays, 'period_workdays', { positive: true, code: 'period_workdays_positive' });
    if (input.pay_basis !== 'daily' && worked > period) fail('worked_days_exceed_period', 'worked_workdays', 'Days paid cannot exceed days in the pay period.');
    const holiday = input.holiday_pattern !== 'none';
    if (input.holiday_pattern === 'regular') {
      number(input.annual_holiday_days, 'annual_holiday_days', { positive: true, max: 366 });
      number(input.holiday_months, 'holiday_months', { max: 12 });
      number(input.holiday_taken_days, 'holiday_taken_days', { max: 366 });
      if (input.holiday_rate_confirmed !== true) fail('holiday_rate_confirmation_required', 'holiday_rate_confirmed', 'Confirm the illustrative holiday daily rate is appropriate for your regular pay, or use official guidance.');
      if (input.day_basis === 'calendar' && !input.holiday_day_rate_gbp) fail('holiday_day_rate_required', 'holiday_day_rate', 'Enter a separate holiday daily rate: a calendar-day wage rate is not assumed to be a holiday rate.');
    }
    const allowance = number(input.annual_holiday_days, 'annual_holiday_days', { optional: true, max: 366 });
    const months = number(input.holiday_months, 'holiday_months', { optional: true, max: 12 });
    const taken = number(input.holiday_taken_days, 'holiday_taken_days', { optional: true, max: 366 });
    const carry = number(input.holiday_carry_days, 'holiday_carry_days', { optional: true, max: 366 });
    if (holiday && allowance > 0 && (input.holiday_months === '' || input.holiday_months === undefined)) fail('holiday_months_required', 'holiday_months', 'Enter the portion of the holiday year accrued.');
    const dayRate = rate / period;
    const holidayRate = input.holiday_day_rate_gbp === '' || input.holiday_day_rate_gbp === undefined
      ? dayRate : number(input.holiday_day_rate_gbp, 'holiday_day_rate', { positive: true });
    const accrued = holiday ? allowance * months / 12 : 0;
    const balance = holiday ? accrued + carry - taken : 0;
    const wages = money(dayRate * worked), holidayValue = money(Math.max(0, balance) * holidayRate);
    const excess = money(Math.max(0, -balance) * holidayRate);
    const deduction = input.written_deduction_agreed === true ? excess : 0;
    const noticePay = number(input.notice_gbp, 'notice', { optional: true });
    const other = number(input.other_gbp, 'other', { optional: true });
    const separate = number(input.separate_package_gbp, 'separate_package', { optional: true });
    const subtotal = money(wages + holidayValue + noticePay + other - deduction);
    const quote = input.employer_quote_gbp === '' || input.employer_quote_gbp === undefined ? null : number(input.employer_quote_gbp, 'employer_quote');
    return { gross_wages_gbp: wages, holiday_accrued_days: accrued, holiday_balance_days: balance,
      illustrative_unused_holiday_days: Math.max(0, balance), illustrative_holiday_value_gbp: holidayValue,
      potential_excess_holiday_days: Math.max(0, -balance), potential_deduction_gbp: excess, deduction_gbp: deduction,
      notice_gbp: noticePay, other_gbp: other, gross_payroll_subtotal_gbp: subtotal, separate_package_gbp: separate,
      illustrative_combined_gbp: money(subtotal + separate), employer_quote_gbp: quote,
      quote_difference_gbp: quote === null ? null : money(quote - subtotal), day_rate_gbp: dayRate, holiday_day_rate_gbp: holidayRate };
  }
  function unfairDismissal(input) {
    date(input.dismissal_date, 'dismissal_date');
    if (input.dismissal_date >= '2027-01-01') fail('transition_review_required', 'dismissal_date', 'From 1 January 2027 the ordinary qualifying period and compensation cap change. This estimator does not model those transition cases. Check the effective termination date and seek advice.');
    const base = redundancy({ ...input, relevant_date: input.dismissal_date, cap_date: input.dismissal_date });
    const lossWeeks = number(input.weeks_loss, 'weeks_loss', { max: 260 });
    const replacement = number(input.new_weekly_pay_gbp, 'new_weekly_pay', { optional: true });
    const other = number(input.other_losses_gbp, 'other_losses', { optional: true });
    const pay = number(input.gross_weekly_pay_gbp, 'gross_weekly_pay', { positive: true });
    const basic = money(base.total_weeks * base.capped_weekly_pay_gbp);
    const cap = Math.min(base.compensatory_cap_gbp, pay * 52);
    const loss = money(Math.min(Math.max(0, pay - replacement) * lossWeeks + other, cap));
    return { ...base, basic_award_gbp: basic, estimated_compensatory_gbp: loss, compensatory_cap_used_gbp: cap,
      total_estimate_gbp: money(basic + loss), ordinary_qualification_met: base.service_years >= 2 };
  }
  function regularHoliday(input) {
    const days=number(input.days_per_week,'days_per_week',{positive:true,max:7});
    const months=number(input.months,'months',{max:12});
    const carry=number(input.carry,'carry',{optional:true});
    const taken=number(input.taken,'taken',{optional:true});
    if(!['standard','starter','leaver'].includes(input.mode)) fail('invalid_mode','mode','Choose a holiday estimate mode.');
    const full_year_days=money(Math.min(28,days*5.6));
    const accrued_days=money(full_year_days*months/12);
    const accumulated_days=money(accrued_days+carry);
    const remaining_days=money(accumulated_days-taken);
    return {full_year_days,accrued_days,accumulated_days,remaining_days,headline_days:input.mode==='leaver'?remaining_days:accumulated_days};
  }
  const calendarDay = 86400000;
  const isoDate = d => d.toISOString().slice(0,10);
  const addDays = (d,n) => new Date(d.getTime()+n*calendarDay);
  function familyQualifyingWeek(due) {
    const expectedWeekSunday=addDays(due,-due.getUTCDay());
    const start=addDays(expectedWeekSunday,-15*7),end=addDays(start,6);
    const endDate=isoDate(end);
    if(endDate<'2024-04-06'||endDate>='2027-04-06') fail('unsupported_qualifying_date','due_date','The qualifying week is outside the verified 2024/25–2026/27 earnings thresholds. Check the official calculator.');
    return {qualifying_week_start:isoDate(start),qualifying_week_end:endDate,
      lower_earnings_limit_gbp:endDate>='2026-04-06'?129:endDate>='2025-04-06'?125:123};
  }
  function familyWeeklyEarningsPay(value) {
    // Preserve supplied AWE (not rounded to pennies); calculate 90% exactly.
    // SMP reg28 / SPP weekly-rates reg4 round fractional pennies UP.
    const raw=String(value);
    if(!/^\d+(?:\.\d{1,8})?$/.test(raw)) fail('average_weekly_earnings_precision','average_weekly_earnings','Use a decimal earnings figure with up to eight decimal places; do not round the average to whole pennies first.');
    const [whole,fraction='']=raw.split('.');
    const numerator=BigInt(whole+fraction)*9n*100n;
    const denominator=10n**BigInt(fraction.length+1);
    return Number((numerator+denominator-1n)/denominator)/100;
  }
  function familyWeekRate(kind,start) {
    const from=isoDate(start),to=isoDate(addDays(start,6));
    // Future rate years are deliberately unpriced, including straddling weeks.
    const end=kind==='maternity'?'2027-04-04':'2027-04-06';
    if(to>=end) return {rate:null,reason:'unverified_future_rate'};
    const change=kind==='maternity'?'2026-04-05':'2026-04-06';
    // Current SPP sources do not explicitly resolve a week straddling the
    // different 2026 effective date. Withhold that week's amount for review.
    if(kind==='paternity'&&from<change&&to>=change) return {rate:null,reason:'uprating_week_review'};
    return {rate:from>=change?194.32:187.18,reason:null};
  }
  function familyPay(kind,input) {
    if(!['maternity','paternity'].includes(kind)) fail('unsupported_family_pay_kind','kind','Only ordinary birth-route maternity and paternity pay are supported.');
    const due=date(input.due_date,'due_date');
    const qualifying=familyQualifyingWeek(due);
    const start=date(input.pay_start_date,'pay_start_date');
    if(isoDate(start)<'2025-04-06') fail('unsupported_payment_date','pay_start_date','Payment weeks before 6 April 2025 are outside this estimator.');
    if(isoDate(start)<=qualifying.qualifying_week_end) fail('inconsistent_family_dates','pay_start_date','The payment start is before the end of the qualifying week. Early births or unusual dates need an individual check.');
    const awe=number(input.average_weekly_earnings_gbp,'average_weekly_earnings',{positive:true});
    const earningsPay=familyWeeklyEarningsPay(input.average_weekly_earnings_gbp);
    const count=number(input.weeks,'weeks',{positive:true,integer:true,max:kind==='maternity'?39:2});
    if(input.eligibility_confirmed!==true) fail('eligibility_confirmation_required','eligibility_confirmed','First check pay eligibility, average earnings and payment start dates using payroll or the official calculator. This tool does not decide entitlement.');
    const starts=kind==='maternity'?Array.from({length:count},(_,i)=>addDays(start,i*7)):[start];
    if(kind==='paternity'&&count===2) {
      const second=date(input.second_week_start_date,'second_week_start_date');
      if(second<addDays(start,7)) fail('overlapping_pay_weeks','second_week_start_date','The second paternity week must start after the first complete week ends.');
      starts.push(second);
    }
    const passed=awe>=qualifying.lower_earnings_limit_gbp;
    if(!passed) return {...qualifying,earnings_screen_passed:false,complete:false,weeks:[],total_gbp:null,known_subtotal_gbp:null,unpriced_weeks:0};
    const weeks=starts.map((weekStart,i)=>{
      const band=familyWeekRate(kind,weekStart);
      return {week:i+1,start_date:isoDate(weekStart),end_date:isoDate(addDays(weekStart,6)),standard_rate_gbp:band.rate,
        gross_gbp:band.rate===null?null:kind==='maternity'&&i<6?earningsPay:Math.min(earningsPay,band.rate),
        basis:kind==='maternity'&&i<6?'90% of AWE':'Lower of 90% of AWE and weekly statutory rate',reason:band.reason};
    });
    const priced=weeks.filter(w=>w.gross_gbp!==null),unpriced=weeks.length-priced.length;
    const subtotal=priced.length?money(priced.reduce((sum,w)=>sum+w.gross_gbp,0)):null;
    return {...qualifying,earnings_screen_passed:true,complete:unpriced===0,weeks,
      total_gbp:unpriced?null:subtotal,known_subtotal_gbp:subtotal,unpriced_weeks:unpriced};
  }
  return { date, fullYears, money, rates, serviceBands, redundancy, notice, finalPay, unfairDismissal, regularHoliday, familyPay };
}));
