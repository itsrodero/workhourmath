/* Double time calculator: pay for regular / overtime / double-time hours, either from totals or from daily hours
   under California's daily rules (over 8 = 1.5x, over 12 = 2x, 7th consecutive day). */
(function () {
  'use strict';
  var W = window.WHM;
  var form = document.getElementById('dt-form');
  if (!form) return;
  var out = document.getElementById('dt-results');
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Daily hours as minutes: "10.5" or "10:30".
  function dur(s) {
    s = String(s || '').trim();
    if (!s) return 0;
    if (s.indexOf(':') >= 0) {
      var p = s.split(':');
      return Math.max(0, Math.round((parseFloat(p[0]) || 0) * 60 + (parseFloat(p[1]) || 0)));
    }
    var v = parseFloat(s.replace(',', '.'));
    return isFinite(v) && v > 0 ? Math.round(v * 60) : 0;
  }
  function pos(key) { var v = W.val(form, key); return v > 0 ? v : 0; }

  function compute() {
    var mode = W.str(form, 'mode');
    document.getElementById('dt-totals').hidden = mode === 'daily';
    document.getElementById('dt-daily').hidden = mode !== 'daily';
    var rate = W.val(form, 'rate');
    var mult = parseFloat(W.str(form, 'mult')) || 2;
    if (!(rate > 0)) { out.innerHTML = '<p class="results-empty">Enter your hourly rate.</p>'; return {}; }

    var reg, ot, dt, table = '', notes = [];
    if (mode === 'daily') {
      var mins = DAYS.map(function (d, i) { return dur(W.str(form, 'd' + i)); });
      var r = W.overtime(mins, 'ca');
      reg = r.total.reg / 60; ot = r.total.ot / 60; dt = r.total.dt / 60;
      table = '<table class="res-table"><thead><tr><th>Day</th><th>Hours</th><th>Reg</th><th>OT 1.5×</th><th>DT ' + mult + '×</th></tr></thead><tbody>' +
        r.days.map(function (d, i) {
          if (!mins[i]) return '';
          return '<tr><td>' + DAYS[i] + '</td><td>' + W.dec(mins[i]) + '</td><td>' + W.dec(d.reg) + '</td><td>' + W.dec(d.ot) + '</td><td>' + W.dec(d.dt) + '</td></tr>';
        }).join('') + '</tbody></table>';
      if (mins.every(function (m) { return m > 0; })) notes.push('Seventh consecutive day: the first 8 hours on Sunday are overtime and any hours beyond 8 are double time.');
      notes.push('California rules: over 8 hours a day at 1.5×, over 12 at double time, and regular hours over 40 a week at 1.5×.');
    } else {
      reg = pos('reg'); ot = pos('ot'); dt = pos('dt');
    }
    var hours = reg + ot + dt;
    if (!hours) { out.innerHTML = '<p class="results-empty">Enter your hours.</p>'; return {}; }

    var regPay = reg * rate, otPay = ot * rate * 1.5, dtRate = rate * mult, dtPay = dt * dtRate;
    var gross = regPay + otPay + dtPay;
    var rows = '<li><span>Double time rate (' + mult + '×)</span><strong>' + W.money(dtRate) + '/hr</strong></li>' +
      '<li><span>Regular: ' + W.fmt(reg, 2) + ' h × ' + W.money(rate) + '</span><strong>' + W.money(regPay) + '</strong></li>' +
      '<li><span>Overtime: ' + W.fmt(ot, 2) + ' h × ' + W.money(rate * 1.5) + '</span><strong>' + W.money(otPay) + '</strong></li>' +
      '<li><span>Double time: ' + W.fmt(dt, 2) + ' h × ' + W.money(dtRate) + '</span><strong>' + W.money(dtPay) + '</strong></li>' +
      '<li><span>Extra from double time vs. straight time</span><strong>' + W.money(dt * rate * (mult - 1)) + '</strong></li>' +
      '<li><span>Average per hour worked</span><strong>' + W.money(gross / hours) + '</strong></li>';
    out.innerHTML = '<div class="result-main"><div class="k">Gross pay</div><div class="v">' + W.money(gross) + '</div>' +
      '<div class="sub">' + W.fmt(hours, 2) + ' hours · ' + W.fmt(dt, 2) + ' at double time · ' + W.fmt(ot, 2) + ' at time and a half</div></div>' +
      '<ul class="result-rows">' + rows + '</ul>' + table +
      notes.map(function (t) { return '<p class="note">' + W.esc(t) + '</p>'; }).join('');
    return { text: W.fmt(hours, 2) + ' hours at ' + W.money(rate) + '/hr: regular ' + W.fmt(reg, 2) + ' h = ' + W.money(regPay) +
      ', overtime ' + W.fmt(ot, 2) + ' h = ' + W.money(otPay) + ', double time ' + W.fmt(dt, 2) + ' h at ' + W.money(dtRate) + ' = ' + W.money(dtPay) +
      ' — gross ' + W.money(gross) };
  }
  W.calculator(form, compute);
})();
