/* Time card calculator (weekly or biweekly): hours per day, overtime by rule, gross pay. */
(function () {
  'use strict';
  var W = window.WHM;
  var form = document.getElementById('tc-form');
  if (!form) return;
  var out = document.getElementById('tc-results');
  var DAYS = form.querySelectorAll('.tc-row').length;
  var NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var startSel = form.querySelector('[data-k="start"]');
  var prevStart = startSel.value;

  function el(k) { return form.querySelector('[data-k="' + k + '"]'); }
  function weekday(i) { return (+startSel.value + (i % 7)) % 7; }

  function relabel() {
    form.querySelectorAll('.tc-row').forEach(function (row, i) {
      var d = weekday(i);
      row.querySelector('.tc-day').textContent = NAMES[d];
      var what = { in: 'time in', out: 'time out', brk: 'unpaid break in minutes' };
      row.querySelectorAll('input').forEach(function (inp) {
        inp.setAttribute('aria-label', LONG[d] + ' ' + what[inp.dataset.k.replace(/\d+$/, '')]);
      });
    });
  }

  // Keep each weekday's times when the first day of the workweek changes.
  function rotate() {
    var offset = (+startSel.value - +prevStart + 7) % 7;
    prevStart = startSel.value;
    if (!offset) return;
    for (var w = 0; w < DAYS; w += 7) {
      var vals = [];
      for (var i = 0; i < 7; i++) vals.push([el('in' + (w + i)).value, el('out' + (w + i)).value, el('brk' + (w + i)).value]);
      for (var j = 0; j < 7; j++) {
        var v = vals[(j + offset) % 7];
        el('in' + (w + j)).value = v[0]; el('out' + (w + j)).value = v[1]; el('brk' + (w + j)).value = v[2];
      }
    }
  }

  function compute() {
    relabel();
    var inc = +el('round').value || 0;
    var rule = el('rule').value;
    var rate = W.val(form, 'rate');
    var hasRate = isFinite(rate) && rate > 0;
    var mins = [], warns = [], lines = [];
    for (var i = 0; i < DAYS; i++) {
      var a = W.toMin(el('in' + i).value), b = W.toMin(el('out' + i).value);
      var brk = parseFloat(el('brk' + i).value) || 0;
      var name = NAMES[weekday(i)] + (DAYS > 7 ? ' (wk ' + (Math.floor(i / 7) + 1) + ')' : '');
      var m = 0;
      if (isFinite(a) && isFinite(b)) {
        var span = W.span(W.roundTo(a, inc), W.roundTo(b, inc));
        m = span - brk;
        if (m < 0) { warns.push(name + ': the break is longer than the shift.'); m = 0; }
        lines.push({ name: name, a: a, b: b, brk: brk });
      } else if (isFinite(a) || isFinite(b)) {
        warns.push(name + ': add both a time in and a time out.');
      }
      mins.push(m);
      var cell = form.querySelector('[data-hrs="' + i + '"]');
      cell.textContent = m ? W.hm(m) : '–';
      cell.closest('.tc-row').classList.toggle('is-off', !m);
      if (lines.length && lines[lines.length - 1].name === name) lines[lines.length - 1].m = m;
    }

    var weeks = [];
    for (var w = 0; w < DAYS; w += 7) weeks.push(W.overtime(mins.slice(w, w + 7), rule));
    var days = [].concat.apply([], weeks.map(function (x) { return x.days; }));
    var tot = weeks.reduce(function (a, x) { return { reg: a.reg + x.total.reg, ot: a.ot + x.total.ot, dt: a.dt + x.total.dt }; }, { reg: 0, ot: 0, dt: 0 });
    var all = tot.reg + tot.ot + tot.dt;
    if (!all) {
      out.innerHTML = '<p class="results-empty">Enter your times in and out.</p>' + warnHtml(warns);
      return {};
    }
    var showDt = rule === 'ca' || tot.dt > 0;
    var pay = hasRate ? { reg: tot.reg / 60 * rate, ot: tot.ot / 60 * rate * 1.5, dt: tot.dt / 60 * rate * 2 } : null;
    var gross = pay ? pay.reg + pay.ot + pay.dt : NaN;

    var rows = '<li><span>Regular hours</span><strong>' + W.hm(tot.reg) + ' (' + W.dec(tot.reg) + ')</strong></li>' +
      '<li><span>Overtime hours (1.5×)</span><strong>' + W.hm(tot.ot) + ' (' + W.dec(tot.ot) + ')</strong></li>' +
      (showDt ? '<li><span>Double-time hours (2×)</span><strong>' + W.hm(tot.dt) + ' (' + W.dec(tot.dt) + ')</strong></li>' : '');
    if (pay) {
      rows += '<li><span>Regular pay (' + W.money(rate) + '/hr)</span><strong>' + W.money(pay.reg) + '</strong></li>' +
        '<li><span>Overtime pay (' + W.money(rate * 1.5) + '/hr)</span><strong>' + W.money(pay.ot) + '</strong></li>' +
        (showDt ? '<li><span>Double-time pay (' + W.money(rate * 2) + '/hr)</span><strong>' + W.money(pay.dt) + '</strong></li>' : '') +
        '<li><span><b>Gross pay</b></span><strong>' + W.money(gross) + '</strong></li>';
    }

    var head = '<tr><th>Day</th><th>Hours</th><th>Reg</th><th>OT</th>' + (showDt ? '<th>DT</th>' : '') + '</tr>';
    var body = days.map(function (d, i) {
      if (!mins[i]) return '';
      return '<tr><td>' + NAMES[weekday(i)] + (DAYS > 7 ? ' <small>wk ' + (Math.floor(i / 7) + 1) + '</small>' : '') + '</td><td>' + W.dec(mins[i]) + '</td><td>' + W.dec(d.reg) + '</td><td>' + W.dec(d.ot) + '</td>' + (showDt ? '<td>' + W.dec(d.dt) + '</td>' : '') + '</tr>';
    }).join('');
    var foot = '<tr><td>Total</td><td>' + W.dec(all) + '</td><td>' + W.dec(tot.reg) + '</td><td>' + W.dec(tot.ot) + '</td>' + (showDt ? '<td>' + W.dec(tot.dt) + '</td>' : '') + '</tr>';
    var weekNote = DAYS > 7 ? '<p class="note">Week 1: ' + W.dec(weeks[0].total.reg + weeks[0].total.ot + weeks[0].total.dt) + ' h · Week 2: ' + W.dec(weeks[1].total.reg + weeks[1].total.ot + weeks[1].total.dt) + ' h. Overtime is counted separately for each workweek.</p>' : '';
    var roundNote = inc ? '<p class="note">Punches rounded to the nearest ' + inc + ' minutes before adding up.</p>' : '';

    out.innerHTML =
      '<div class="result-main"><div class="k">' + (pay ? 'Total hours · gross pay' : 'Total hours') + '</div>' +
      '<div class="v">' + W.hm(all) + '<small>' + W.dec(all) + ' hrs</small></div>' +
      '<div class="sub">' + (pay ? W.money(gross) + ' gross · ' : '') + W.RULES[rule] + '</div></div>' +
      '<ul class="result-rows">' + rows + '</ul>' +
      '<table class="res-table"><thead>' + head + '</thead><tbody>' + body + '</tbody><tfoot>' + foot + '</tfoot></table>' +
      weekNote + roundNote + warnHtml(warns);

    var text = ['Time card — ' + W.RULES[rule]];
    lines.forEach(function (l) { text.push(l.name + ': ' + W.clock12(l.a) + ' – ' + W.clock12(l.b) + (l.brk ? ', break ' + l.brk + ' min' : '') + ' = ' + W.hm(l.m) + ' (' + W.dec(l.m) + ' h)'); });
    text.push('Total: ' + W.hm(all) + ' (' + W.dec(all) + ' h) — regular ' + W.dec(tot.reg) + ', overtime ' + W.dec(tot.ot) + (showDt ? ', double time ' + W.dec(tot.dt) : ''));
    if (pay) text.push('Gross pay at ' + W.money(rate) + '/hr: ' + W.money(gross));

    var csv = ['Day,Time in,Time out,Break (min),Hours (h:mm),Hours (decimal),Regular,Overtime,Double time'];
    for (var k = 0; k < DAYS; k++) {
      var label = NAMES[weekday(k)] + (DAYS > 7 ? ' wk' + (Math.floor(k / 7) + 1) : '');
      csv.push([label, el('in' + k).value, el('out' + k).value, el('brk' + k).value || 0, W.hm(mins[k]), W.dec(mins[k]), W.dec(days[k].reg), W.dec(days[k].ot), W.dec(days[k].dt)].join(','));
    }
    csv.push(['Total', '', '', '', W.hm(all), W.dec(all), W.dec(tot.reg), W.dec(tot.ot), W.dec(tot.dt)].join(','));
    if (pay) csv.push(['Gross pay', '', '', '', '', gross.toFixed(2), pay.reg.toFixed(2), pay.ot.toFixed(2), pay.dt.toFixed(2)].join(','));
    return { text: text.join('\n'), csv: csv.join('\n') };
  }

  function warnHtml(w) {
    return w.length ? '<p class="note warn">' + w.map(W.esc).join('<br>') + '</p>' : '';
  }

  var run = W.calculator(form, compute, { file: DAYS > 7 ? 'biweekly-time-card' : 'time-card', reset: function () { prevStart = startSel.value; } });
  prevStart = startSel.value;
  startSel.addEventListener('change', function () { rotate(); run(); });

  // Copy the first filled-in day to every Monday–Friday row.
  var fill = form.querySelector('.js-fill');
  if (fill) fill.addEventListener('click', function () {
    var src = null;
    for (var i = 0; i < DAYS && !src; i++) if (el('in' + i).value && el('out' + i).value) src = i;
    if (src === null) return;
    for (var j = 0; j < DAYS; j++) {
      var d = weekday(j);
      if (d >= 1 && d <= 5) { el('in' + j).value = el('in' + src).value; el('out' + j).value = el('out' + src).value; el('brk' + j).value = el('brk' + src).value; }
    }
    run();
  });
  var clear = form.querySelector('.js-clear');
  if (clear) clear.addEventListener('click', function () {
    for (var i = 0; i < DAYS; i++) { el('in' + i).value = ''; el('out' + i).value = ''; el('brk' + i).value = ''; }
    run();
  });
})();
