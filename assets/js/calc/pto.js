/* PTO accrual calculator: accrual rate and the balance you'll have after a number of weeks. */
(function () {
  'use strict';
  var W = window.WHM;
  var form = document.getElementById('pto-form');
  if (!form) return;
  var out = document.getElementById('pto-results');
  var PERIODS = { w: ['week', 52], b: ['biweekly pay period', 26], s: ['semimonthly pay period', 24], m: ['month', 12] };

  function compute() {
    var method = W.str(form, 'method');
    form.querySelectorAll('[data-method]').forEach(function (n) { n.hidden = n.dataset.method.split(' ').indexOf(method) === -1; });
    var hpw = W.val(form, 'hpw'); hpw = hpw > 0 ? hpw : 40;
    var dayLen = W.val(form, 'day'); dayLen = dayLen > 0 ? dayLen : 8;
    var perWeek;
    var how;
    if (method === 'hours') {
      var earn = W.val(form, 'earn'), per = W.val(form, 'per');
      if (!(earn > 0) || !(per > 0)) { out.innerHTML = '<p class="results-empty">Enter how many PTO hours you earn and per how many hours worked.</p>'; return {}; }
      perWeek = hpw * earn / per;
      how = W.fmt(earn, 2) + ' hr per ' + W.fmt(per, 2) + ' hours worked';
    } else if (method === 'period') {
      var amt = W.val(form, 'amt'), p = PERIODS[W.str(form, 'period')] || PERIODS.b;
      if (!(amt > 0)) { out.innerHTML = '<p class="results-empty">Enter the PTO hours you earn each pay period.</p>'; return {}; }
      perWeek = amt * p[1] / 52;
      how = W.fmt(amt, 2) + ' hr per ' + p[0];
    } else {
      var yr = W.val(form, 'yr'), unit = W.str(form, 'yrunit');
      if (!(yr > 0)) { out.innerHTML = '<p class="results-empty">Enter the PTO you get each year.</p>'; return {}; }
      var yrHours = unit === 'd' ? yr * dayLen : yr;
      perWeek = yrHours / 52;
      how = W.fmt(yr, 2) + (unit === 'd' ? ' days' : ' hours') + ' a year';
    }
    var bal = W.val(form, 'bal'); bal = isFinite(bal) ? bal : 0;
    var cap = W.val(form, 'cap'); cap = cap > 0 ? cap : Infinity;
    var weeks = W.val(form, 'weeks'); weeks = weeks > 0 ? weeks : 0;
    var use = W.val(form, 'use'); use = use > 0 ? use : 0;
    var raw = bal + perWeek * weeks - use;
    var end = Math.min(raw, cap);
    var capped = isFinite(cap) && raw > cap;
    var perYear = perWeek * 52;
    var weeksToCap = isFinite(cap) && perWeek > 0 && cap > bal ? Math.ceil((cap - bal) / perWeek - 1e-9) : null;
    var rows = '<li><span>Earned per week</span><strong>' + W.fmt(perWeek, 3) + ' hr</strong></li>' +
      '<li><span>Earned per biweekly paycheck</span><strong>' + W.fmt(perWeek * 2, 2) + ' hr</strong></li>' +
      '<li><span>Earned per year</span><strong>' + W.fmt(perYear, 2) + ' hr = ' + W.fmt(perYear / dayLen, 2) + ' days</strong></li>' +
      '<li><span>Per hour worked</span><strong>' + W.fmt(perWeek / hpw, 4) + ' hr</strong></li>' +
      (weeks ? '<li><span>Balance after ' + W.fmt(weeks, 0) + ' weeks</span><strong>' + W.fmt(end, 2) + ' hr = ' + W.fmt(end / dayLen, 2) + ' days</strong></li>' : '') +
      (weeksToCap ? '<li><span>Weeks until you reach the cap</span><strong>' + weeksToCap + '</strong></li>' : '');
    out.innerHTML = '<div class="result-main"><div class="k">' + (weeks ? 'PTO balance after ' + W.fmt(weeks, 0) + ' weeks' : 'PTO earned per year') + '</div>' +
      '<div class="v">' + W.fmt(weeks ? end : perYear, 2) + '<small>hours</small></div>' +
      '<div class="sub">' + W.esc(how) + ' · ' + W.fmt(hpw, 2) + ' hours worked a week</div></div><ul class="result-rows">' + rows + '</ul>' +
      (capped ? '<p class="note warn">You\'d hit your cap of ' + W.fmt(cap, 2) + ' hours, so ' + W.fmt(raw - cap, 2) + ' hours wouldn\'t be earned. Plan some time off.</p>' : '') +
      (raw < 0 ? '<p class="note warn">You\'d use more PTO than you have by then.</p>' : '');
    return { text: 'PTO: ' + how + ' = ' + W.fmt(perYear, 2) + ' hours a year' + (weeks ? '; balance after ' + weeks + ' weeks: ' + W.fmt(end, 2) + ' hours' : '') };
  }
  W.calculator(form, compute);
})();
