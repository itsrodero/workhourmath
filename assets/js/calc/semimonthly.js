/* Semi-monthly time card (1st–15th or 16th–end of month): hours per dated day, overtime per workweek
   (including hours already worked earlier in a workweek that started in the previous period), gross pay. */
(function () {
  'use strict';
  var W = window.WHM;
  var form = document.getElementById('sm-form');
  if (!form) return;
  var out = document.getElementById('sm-results');
  var ROWS = form.querySelectorAll('.tc-row');
  var NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAY = 864e5;

  function el(k) { return form.querySelector('[data-k="' + k + '"]'); }
  function short(d) { return MONTHS[d.getMonth()] + ' ' + d.getDate(); }
  function label(d) { return NAMES[d.getDay()] + ' ' + (d.getMonth() + 1) + '/' + d.getDate(); }

  // Empty selects mean "the pay period we are in today".
  function period() {
    var now = new Date();
    var y = +el('year').value || now.getFullYear();
    var m = el('mon').value ? +el('mon').value - 1 : now.getMonth();
    var half = el('half').value || (now.getDate() <= 15 ? '1' : '2');
    var last = new Date(y, m + 1, 0).getDate();
    var a = half === '2' ? 16 : 1, b = half === '2' ? last : 15;
    var dates = [];
    for (var d = a; d <= b; d++) dates.push(new Date(y, m, d));
    return { dates: dates, first: dates[0], last: dates[dates.length - 1] };
  }

  function layout(p) {
    ROWS.forEach(function (row, i) {
      var d = p.dates[i];
      row.hidden = !d;
      if (!d) return;
      row.querySelector('.tc-day').textContent = label(d);
      var what = { in: 'time in', out: 'time out', brk: 'unpaid break in minutes' };
      row.querySelectorAll('input').forEach(function (inp) {
        inp.setAttribute('aria-label', LONG[d.getDay()] + ' ' + short(d) + ' ' + what[inp.dataset.k.replace(/\d+$/, '')]);
      });
    });
  }

  function anyTimes() {
    for (var i = 0; i < ROWS.length; i++) if (el('in' + i).value || el('out' + i).value) return true;
    return false;
  }
  // First visit: a typical Monday–Friday 9:00–5:30 with a 30-minute break, so the result isn't empty.
  function defaults() {
    if (location.search || anyTimes()) return;
    var p = period();
    p.dates.forEach(function (d, i) {
      if (d.getDay() >= 1 && d.getDay() <= 5) { el('in' + i).value = '09:00'; el('out' + i).value = '17:30'; el('brk' + i).value = '30'; }
    });
  }

  function compute() {
    var p = period();
    layout(p);
    var n = p.dates.length;
    var startDay = +el('start').value;
    var inc = +el('round').value || 0;
    var rule = el('rule').value;
    var rate = W.val(form, 'rate');
    var hasRate = isFinite(rate) && rate > 0;
    var carryH = parseFloat(el('carry').value);
    var carry = isFinite(carryH) && carryH > 0 ? Math.round(carryH * 60) : 0;
    var weekdays = p.dates.filter(function (d) { return d.getDay() >= 1 && d.getDay() <= 5; }).length;
    document.getElementById('sm-period').textContent = short(p.first) + ' – ' + short(p.last) + ', ' + p.last.getFullYear() +
      ': ' + n + ' days, ' + weekdays + ' weekdays (Mon–Fri).';

    var mins = [], warns = [], lines = [];
    for (var i = 0; i < n; i++) {
      var a = W.toMin(el('in' + i).value), b = W.toMin(el('out' + i).value);
      var brk = parseFloat(el('brk' + i).value) || 0;
      var name = label(p.dates[i]);
      var m = 0;
      if (isFinite(a) && isFinite(b)) {
        m = W.span(W.roundTo(a, inc), W.roundTo(b, inc)) - brk;
        if (m < 0) { warns.push(name + ': the break is longer than the shift.'); m = 0; }
        lines.push({ name: name, a: a, b: b, brk: brk, m: m });
      } else if (isFinite(a) || isFinite(b)) {
        warns.push(name + ': add both a time in and a time out.');
      }
      mins.push(m);
      var cell = form.querySelector('[data-hrs="' + i + '"]');
      cell.textContent = m ? W.hm(m) : '–';
      cell.closest('.tc-row').classList.toggle('is-off', !m);
    }

    // Split the period into workweeks. The first may have started in the previous period, the last may end in the next.
    var weeks = [], cur = null;
    p.dates.forEach(function (d, i) {
      var ws = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (d.getDay() - startDay + 7) % 7);
      if (!cur || cur.start.getTime() !== ws.getTime()) {
        cur = { start: ws, end: new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + 6), idx: [] };
        weeks.push(cur);
      }
      cur.idx.push(i);
    });
    var days = [];
    weeks.forEach(function (w, k) {
      w.before = w.start < p.first;
      w.after = w.end > p.last;
      w.carry = k === 0 && w.before ? carry : 0;
      w.res = W.overtime(w.idx.map(function (i) { return mins[i]; }), rule, w.carry);
      w.idx.forEach(function (i, j) { days[i] = w.res.days[j]; });
    });
    var tot = weeks.reduce(function (s, w) { return { reg: s.reg + w.res.total.reg, ot: s.ot + w.res.total.ot, dt: s.dt + w.res.total.dt }; }, { reg: 0, ot: 0, dt: 0 });
    var all = tot.reg + tot.ot + tot.dt;
    var hint = document.getElementById('sm-carry-hint');
    hint.textContent = weeks[0].before
      ? 'Your first workweek began ' + LONG[weeks[0].start.getDay()] + ', ' + short(weeks[0].start) + ', in the previous pay period.'
      : 'Not needed: this period starts on the first day of a workweek.';
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

    var wkHead = '<tr><th>Workweek</th><th>Hours</th><th>Reg</th><th>OT</th>' + (showDt ? '<th>DT</th>' : '') + '</tr>';
    var wkBody = weeks.map(function (w) {
      var h = w.res.total.reg + w.res.total.ot + w.res.total.dt;
      var tag = w.before ? (w.carry ? ' <small>+' + W.dec(w.carry) + ' h before</small>' : ' <small>began earlier</small>') : (w.after ? ' <small>continues</small>' : '');
      return '<tr><td>' + short(w.start) + '–' + short(w.end) + tag + '</td><td>' + W.dec(h) + '</td><td>' + W.dec(w.res.total.reg) + '</td><td>' + W.dec(w.res.total.ot) + '</td>' + (showDt ? '<td>' + W.dec(w.res.total.dt) + '</td>' : '') + '</tr>';
    }).join('');
    var dayHead = '<tr><th>Day</th><th>Hours</th><th>Reg</th><th>OT</th>' + (showDt ? '<th>DT</th>' : '') + '</tr>';
    var dayBody = p.dates.map(function (d, i) {
      if (!mins[i]) return '';
      return '<tr><td>' + label(d) + '</td><td>' + W.dec(mins[i]) + '</td><td>' + W.dec(days[i].reg) + '</td><td>' + W.dec(days[i].ot) + '</td>' + (showDt ? '<td>' + W.dec(days[i].dt) + '</td>' : '') + '</tr>';
    }).join('');
    var foot = '<tr><td>Total</td><td>' + W.dec(all) + '</td><td>' + W.dec(tot.reg) + '</td><td>' + W.dec(tot.ot) + '</td>' + (showDt ? '<td>' + W.dec(tot.dt) + '</td>' : '') + '</tr>';

    var notes = [];
    var first = weeks[0], lastW = weeks[weeks.length - 1];
    if (first.before && !carry && rule !== 'none') {
      notes.push('The first workweek began ' + short(first.start) + ', in the previous pay period. If you worked hours earlier that week, enter them above: they count toward the 40 hours.');
    }
    if (lastW.after) {
      notes.push('The workweek that starts ' + short(lastW.start) + ' continues into the next pay period. Overtime for it is settled when the week ends, usually on the next paycheck.');
    }
    if (rule === 'ca' && (first.before || lastW.after)) {
      notes.push('California 7th-day overtime can only be checked for workweeks that fall entirely in this period.');
    }
    var roundNote = inc ? '<p class="note">Punches rounded to the nearest ' + inc + ' minutes before adding up.</p>' : '';

    out.innerHTML =
      '<div class="result-main"><div class="k">' + (pay ? 'Total hours · gross pay' : 'Total hours') + '</div>' +
      '<div class="v">' + W.hm(all) + '<small>' + W.dec(all) + ' hrs</small></div>' +
      '<div class="sub">' + short(p.first) + ' – ' + short(p.last) + (pay ? ' · ' + W.money(gross) + ' gross' : '') + ' · ' + W.RULES[rule] + '</div></div>' +
      '<ul class="result-rows">' + rows + '</ul>' +
      '<table class="res-table"><thead>' + wkHead + '</thead><tbody>' + wkBody + '</tbody></table>' +
      '<table class="res-table"><thead>' + dayHead + '</thead><tbody>' + dayBody + '</tbody><tfoot>' + foot + '</tfoot></table>' +
      notes.map(function (t) { return '<p class="note">' + W.esc(t) + '</p>'; }).join('') + roundNote + warnHtml(warns);

    var text = ['Semi-monthly time card, ' + short(p.first) + ' – ' + short(p.last) + ', ' + p.last.getFullYear() + ' — ' + W.RULES[rule]];
    if (first.before && carry) text.push('Hours worked earlier in the first workweek: ' + W.dec(carry));
    lines.forEach(function (l) { text.push(l.name + ': ' + W.clock12(l.a) + ' – ' + W.clock12(l.b) + (l.brk ? ', break ' + l.brk + ' min' : '') + ' = ' + W.hm(l.m) + ' (' + W.dec(l.m) + ' h)'); });
    text.push('Total: ' + W.hm(all) + ' (' + W.dec(all) + ' h) — regular ' + W.dec(tot.reg) + ', overtime ' + W.dec(tot.ot) + (showDt ? ', double time ' + W.dec(tot.dt) : ''));
    if (pay) text.push('Gross pay at ' + W.money(rate) + '/hr: ' + W.money(gross));

    var csv = ['Date,Day,Time in,Time out,Break (min),Hours (h:mm),Hours (decimal),Regular,Overtime,Double time'];
    p.dates.forEach(function (d, k) {
      csv.push([W.isoDate(d), NAMES[d.getDay()], el('in' + k).value, el('out' + k).value, el('brk' + k).value || 0, W.hm(mins[k]), W.dec(mins[k]), W.dec(days[k].reg), W.dec(days[k].ot), W.dec(days[k].dt)].join(','));
    });
    csv.push(['Total', '', '', '', '', W.hm(all), W.dec(all), W.dec(tot.reg), W.dec(tot.ot), W.dec(tot.dt)].join(','));
    if (pay) csv.push(['Gross pay', '', '', '', '', '', gross.toFixed(2), pay.reg.toFixed(2), pay.ot.toFixed(2), pay.dt.toFixed(2)].join(','));
    return { text: text.join('\n'), csv: csv.join('\n') };
  }

  function warnHtml(w) {
    return w.length ? '<p class="note warn">' + w.map(W.esc).join('<br>') + '</p>' : '';
  }

  var run = W.calculator(form, compute, { file: 'semi-monthly-time-card', init: defaults, reset: defaults });

  // Copy the first filled-in day to every Monday–Friday row of the period.
  form.querySelector('.js-fill').addEventListener('click', function () {
    var p = period(), src = null;
    for (var i = 0; i < p.dates.length && src === null; i++) if (el('in' + i).value && el('out' + i).value) src = i;
    if (src === null) return;
    p.dates.forEach(function (d, j) {
      if (d.getDay() >= 1 && d.getDay() <= 5) { el('in' + j).value = el('in' + src).value; el('out' + j).value = el('out' + src).value; el('brk' + j).value = el('brk' + src).value; }
    });
    run();
  });
  form.querySelector('.js-clear').addEventListener('click', function () {
    for (var i = 0; i < ROWS.length; i++) { el('in' + i).value = ''; el('out' + i).value = ''; el('brk' + i).value = ''; }
    run();
  });
})();
