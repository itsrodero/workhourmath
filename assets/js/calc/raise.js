/* Pay raise calculator: new pay from a percentage, or the percentage from a new pay. */
(function () {
  'use strict';
  var W = window.WHM;
  var form = document.getElementById('rs-form');
  if (!form) return;
  var out = document.getElementById('rs-results');
  var HOURS = 2080;

  function compute() {
    var cur = W.val(form, 'cur'), per = W.str(form, 'per'), how = W.str(form, 'how'), x = W.val(form, 'x');
    form.querySelectorAll('[data-how]').forEach(function (n) { n.hidden = n.dataset.how !== how; });
    if (!(cur > 0) || !isFinite(x)) { out.innerHTML = '<p class="results-empty">Enter your current pay and the raise.</p>'; return {}; }
    var next = how === 'pct' ? cur * (1 + x / 100) : how === 'amt' ? cur + x : x;
    var pct = (next / cur - 1) * 100;
    var hourlyOld = per === 'hr' ? cur : cur / HOURS, hourlyNew = per === 'hr' ? next : next / HOURS;
    var yearlyOld = hourlyOld * HOURS, yearlyNew = hourlyNew * HOURS;
    var unit = per === 'hr' ? '/hr' : '/yr';
    var rows = '<li><span>Raise</span><strong>' + (pct >= 0 ? '+' : '') + W.fmt(pct, 2) + '%</strong></li>' +
      '<li><span>Increase' + (per === 'hr' ? ' per hour' : ' per year') + '</span><strong>' + W.money(next - cur) + '</strong></li>' +
      '<li><span>New hourly rate</span><strong>' + W.money(hourlyNew) + '</strong></li>' +
      '<li><span>New yearly pay (2,080 hours)</span><strong>' + W.money(yearlyNew) + '</strong></li>' +
      '<li><span>Extra per year</span><strong>' + W.money(yearlyNew - yearlyOld) + '</strong></li>' +
      '<li><span>Extra per month</span><strong>' + W.money((yearlyNew - yearlyOld) / 12) + '</strong></li>' +
      '<li><span>Extra per biweekly paycheck</span><strong>' + W.money((yearlyNew - yearlyOld) / 26) + '</strong></li>';
    out.innerHTML = '<div class="result-main"><div class="k">New pay</div><div class="v">' + W.money(next) + '<small>' + unit + '</small></div>' +
      '<div class="sub">' + W.money(cur) + unit + ' ' + (pct >= 0 ? '+' : '') + W.fmt(pct, 2) + '%</div></div><ul class="result-rows">' + rows + '</ul>' +
      '<p class="note">Before taxes. Yearly figures assume 40 hours a week, 52 weeks a year.</p>';
    return { text: W.money(cur) + unit + ' → ' + W.money(next) + unit + ' (' + (pct >= 0 ? '+' : '') + W.fmt(pct, 2) + '%), ' + W.money(yearlyNew - yearlyOld) + ' more per year' };
  }
  W.calculator(form, compute);
})();
