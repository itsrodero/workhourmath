/* Overtime calculator: weekly hours split into regular / overtime / double time, and the pay. */
(function () {
  'use strict';
  var W = window.WHM;
  var form = document.getElementById('ot-form');
  if (!form) return;
  var out = document.getElementById('ot-results');

  function compute() {
    var rate = W.val(form, 'rate'), hours = W.val(form, 'hours');
    var limit = W.val(form, 'limit'); limit = limit > 0 ? limit : 40;
    var mult = parseFloat(W.str(form, 'mult')) || 1.5;
    var dt = W.val(form, 'dt'); dt = dt > 0 ? dt : 0;
    if (!(rate > 0) || !(hours > 0)) { out.innerHTML = '<p class="results-empty">Enter your hourly rate and the hours you worked.</p>'; return {}; }
    if (dt > hours) { out.innerHTML = '<p class="note warn">Double-time hours can\'t be more than the total hours.</p>'; return {}; }
    var rest = hours - dt;
    var reg = Math.min(rest, limit), ot = Math.max(rest - limit, 0);
    var regPay = reg * rate, otRate = rate * mult, otPay = ot * otRate, dtPay = dt * rate * 2;
    var gross = regPay + otPay + dtPay;
    var rows = '<li><span>Regular hours</span><strong>' + W.fmt(reg, 2) + ' × ' + W.money(rate) + ' = ' + W.money(regPay) + '</strong></li>' +
      '<li><span>Overtime hours (' + mult + '×)</span><strong>' + W.fmt(ot, 2) + ' × ' + W.money(otRate) + ' = ' + W.money(otPay) + '</strong></li>' +
      (dt ? '<li><span>Double-time hours (2×)</span><strong>' + W.fmt(dt, 2) + ' × ' + W.money(rate * 2) + ' = ' + W.money(dtPay) + '</strong></li>' : '') +
      '<li><span>Overtime rate</span><strong>' + W.money(otRate) + '/hr</strong></li>' +
      '<li><span>Extra earned from overtime premium</span><strong>' + W.money(ot * rate * (mult - 1) + dt * rate) + '</strong></li>' +
      '<li><span>Average per hour worked</span><strong>' + W.money(gross / hours) + '</strong></li>';
    out.innerHTML = '<div class="result-main"><div class="k">Gross pay for the week</div><div class="v">' + W.money(gross) + '</div>' +
      '<div class="sub">' + W.fmt(hours, 2) + ' hours · ' + W.fmt(ot + dt, 2) + ' paid at a premium</div></div>' +
      '<ul class="result-rows">' + rows + '</ul>' +
      (ot === 0 && !dt ? '<p class="note">No overtime: ' + W.fmt(hours, 2) + ' hours is not more than ' + W.fmt(limit, 2) + '.</p>' : '') +
      '<p class="note">Federal law counts overtime per workweek. If you were paid a bonus, commission or shift differential, your overtime rate may be higher — see below.</p>';
    return { text: W.fmt(hours, 2) + ' hours at ' + W.money(rate) + '/hr: regular ' + W.fmt(reg, 2) + ' h = ' + W.money(regPay) + ', overtime ' + W.fmt(ot, 2) + ' h at ' + W.money(otRate) + ' = ' + W.money(otPay) + (dt ? ', double time ' + W.fmt(dt, 2) + ' h = ' + W.money(dtPay) : '') + ', gross ' + W.money(gross) };
  }
  W.calculator(form, compute);
})();
