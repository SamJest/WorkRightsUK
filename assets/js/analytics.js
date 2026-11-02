/* Optional analytics only. The consent cookie holds 'granted'/'denied', no identifier. */
(function () {
  'use strict';
  const cookieName = 'workrights_analytics';
  const tools = new Set(['redundancy_pay_calculator','notice_period_calculator','final_pay_calculator','unfair_dismissal_estimator','holiday_entitlement_calculator','maternity_pay_calculator','paternity_pay_calculator','settlement_tax_checker']);
  const events = new Set(['tool_calculate','tool_validation_error','tool_result_copy','tool_result_print']);
  const errors = new Set(['invalid_input','invalid_date','inconsistent_dates','relevant_date_required','birth_date_required','start_date_required','dismissal_date_required','unsupported_rate_date','transition_review_required','direction_required','period_workdays_positive','worked_days_exceed_period','gross_rate_required','day_basis_required','holiday_rate_confirmation_required','holiday_day_rate_required','unsupported_holiday_pattern','unsupported_payment_period','earnings_below_threshold','eligibility_confirmation_required']);
  let consent = false, measurementId = null, configured = false;
  function cleanLocation(raw) {
    try { const u = new URL(raw); return u.origin + u.pathname; } catch (error) { return ''; }
  }
  function activate() {
    if (!consent || !measurementId) return;
    window['ga-disable-' + measurementId] = false;
    window.gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    if(configured) return;
    configured = true;
    window.gtag('js',new Date());
    window.gtag('config',measurementId,{
      allow_google_signals:false,allow_ad_personalization_signals:false,
      page_location:cleanLocation(window.location.href),page_referrer:cleanLocation(document.referrer)
    });
    const script = document.querySelector('script[data-consent-src]');
    if (script) { script.src = script.getAttribute('data-consent-src'); script.removeAttribute('data-consent-src'); }
  }
  function setChoice(choice) {
    consent = choice === 'granted';
    document.cookie = cookieName + '=' + (consent?'granted':'denied') + '; Path=/; Max-Age=15552000; SameSite=Lax' + (window.location.protocol==='https:'?'; Secure':'');
    if (consent) activate();
    else if (measurementId) {
      window['ga-disable-'+measurementId] = true;
      window.gtag('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      // Remove this site's optional Google analytics cookies when withdrawing consent.
      document.cookie.split(';').forEach(part=>{
        const name=part.trim().split('=')[0];
        if (!/^_ga(?:_|$)/.test(name)) return;
        for (const domain of ['', '; Domain='+window.location.hostname, '; Domain=.'+window.location.hostname]) {
          document.cookie=name+'=; Max-Age=0; Path=/'+domain;
        }
      });
    }
    const panel=document.getElementById('analyticsConsent');
    if(panel) panel.hidden=true;
    const button=document.getElementById('analyticsChoices');
    if(button) { button.textContent='Analytics choices ('+(consent?'allowed':'off')+')'; button.focus(); }
  }
  window.WorkRightsAnalytics = {
    configure(id) { if(measurementId) return; measurementId=id; activate(); },
    track(event, payload) {
      if (!consent || !events.has(event) || !payload || !tools.has(payload.tool_name)) return false;
      const safe={tool_name:payload.tool_name};
      if(event==='tool_calculate') {
        safe.mode=['quick','detailed'].includes(payload.mode)?payload.mode:'standard';safe.success=true;
      }
      if(event==='tool_validation_error') safe.error_code=errors.has(payload.error_code)?payload.error_code:'invalid_input';
      window.gtag('event',event,safe);
      return true;
    }
  };
  document.addEventListener('DOMContentLoaded',()=>{
    const choice=document.cookie.split(';').map(p=>p.trim()).find(p=>p.startsWith(cookieName+'='))?.split('=')[1];
    consent=choice==='granted';activate();
    const footer=document.querySelector('.footer') || document.body;
    const container=document.createElement('div');container.className='container analytics-preferences';
    const open=document.createElement('button');open.type='button';open.id='analyticsChoices';
    open.textContent='Analytics choices'+(choice?(consent?' (allowed)':' (off)'):'');container.append(open);
    const panel=document.createElement('section');panel.id='analyticsConsent';panel.className='policy-box';panel.hidden=!!choice;
    panel.setAttribute('aria-label','Optional analytics');
    const text=document.createElement('p');text.textContent='Optional analytics help us count page visits and calculator actions. Google Analytics loads only if you allow it. Custom events exclude pay amounts, ages, employment dates and entered quotes. A first-party cookie remembers only your choice for 180 days. Calculators work with analytics off. You can change your choice here.';panel.append(text);
    for(const [label,choiceValue] of [['Allow analytics','granted'],['Keep analytics off','denied']]) {
      const button=document.createElement('button');button.type='button';button.textContent=label;
      button.addEventListener('click',()=>setChoice(choiceValue));panel.append(button);
    }
    open.addEventListener('click',()=>{panel.hidden=false;panel.querySelector('button').focus();});
    container.append(panel);footer.append(container);
  });
}());
