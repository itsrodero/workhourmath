/* Hourly <-> salary converter. The form's data-mode is "h2s" (hourly to salary) or "s2h". */
(function () {
  'use strict';
  var W = window.WHM;
  var form = document.getElementById('sal-form');
  if (!form) return;
  var out = document.getElementById('sal-results');
  var mode = form.dataset.mode;

  function compute() {
    var amount = W.val(form, 'amount');
    var hpw = W.val(form, 'hpw'); hpw = hpw > 0 ? hpw : 40;
    var weeks = W.val(form, 'weeks'); weeks = weeks > 0 ? Math.min(weeks, 52.143) : 52;
    var dpw = W.val(form, 'dpw'); dpw = dpw > 0 ? Math.min(dpw, 7) : 5;
    if (!(amount > 0)) { out.innerHTML = '<p class="results-empty">Enter ' + (mode === 'h2s' ? 'an hourly rate.' : 'an annual salary.') + '</p>'; return {}; }
    var hoursYear = hpw * weeks;
    var annual = mode === 'h2s' ? amount * hoursYear : amount;
    var hourly = annual / hoursYear;
    var rows = [
      ['Hourly', W.money(hourly)],
      ['Daily (' + W.fmt(hpw / dpw, 2) + ' hours)', W.money(hourly * hpw / dpw)],
      ['Weekly', W.money(hourly * hpw)],
      ['Biweekly (26 paychecks)', W.money(annual / 26)],
      ['Semimonthly (24 paychecks)', W.money(annual / 24)],
      ['Monthly', W.money(annual / 12)],
      ['Yearly', W.money(annual)]
    ].map(function (r) { return '<li><span>' + r[0] + '</span><strong>' + r[1] + '</strong></li>'; }).join('');
    var main = mode === 'h2s' ? W.money(annual) : W.money(hourly);
    out.innerHTML = '<div class="result-main"><div class="k">' + (mode === 'h2s' ? 'Annual salary' : 'Hourly rate') + '</div><div class="v">' + main + '<small>' + (mode === 'h2s' ? '/year' : '/hour') + '</small></div>' +
      '<div class="sub">' + W.fmt(hpw, 2) + ' hours a week × ' + W.fmt(weeks, 2) + ' weeks = ' + W.fmt(hoursYear, 0) + ' paid hours a year</div></div>' +
      '<ul class="result-rows">' + rows + '</ul>' +
      '<p class="note">Before taxes. Biweekly and semimonthly amounts divide the yearly pay by 26 and 24 paychecks.</p>';
    return { text: (mode === 'h2s' ? W.money(amount) + '/hr' : W.money(amount) + '/yr') + ' at ' + hpw + ' h/week, ' + weeks + ' weeks = ' + W.money(hourly) + '/hr, ' + W.money(annual / 12) + '/month, ' + W.money(annual) + '/year' };
  }
  W.calculator(form, compute);
})();
