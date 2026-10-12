/* Working days between two dates, without weekends and (optionally) US federal holidays. */
(function () {
  'use strict';
  var W = window.WHM;
  var form = document.getElementById('wd-form');
  if (!form) return;
  var out = document.getElementById('wd-results');
  var from = form.querySelector('[data-k="from"]'), to = form.querySelector('[data-k="to"]');

  function init() {
    var now = new Date();
    var today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    if (!from.value) from.value = W.isoDate(today);
    if (!to.value) to.value = W.isoDate(new Date(Date.UTC(today.getUTCFullYear(), 11, 31)));
  }

  function compute() {
    var a = W.parseDate(from.value), b = W.parseDate(to.value);
    if (!a || !b) { out.innerHTML = '<p class="results-empty">Pick a start date and an end date.</p>'; return {}; }
    var swap = b < a; if (swap) { var t = a; a = b; b = t; }
    var incEnd = form.querySelector('[data-k="incl"]').checked;
    var useHol = form.querySelector('[data-k="hol"]').checked;
    var hpd = W.val(form, 'hpd'); hpd = hpd > 0 ? hpd : 8;
    var end = incEnd ? b : new Date(b.getTime() - 864e5);
    var hol = {};
    if (useHol) {
      for (var y = a.getUTCFullYear() - 1; y <= b.getUTCFullYear() + 1; y++) {
        W.holidays(y).forEach(function (h) { hol[W.isoDate(h.observed)] = h.name; });
      }
    }
    var total = 0, weekend = 0, work = 0, holList = [];
    for (var d = new Date(a); d <= end; d = new Date(d.getTime() + 864e5)) {
      total++;
      var wd = d.getUTCDay();
      if (wd === 0 || wd === 6) { weekend++; continue; }
      var key = W.isoDate(d);
      if (hol[key]) { holList.push([d, hol[key]]); continue; }
      work++;
      if (total > 40000) break;
    }
    var rows = '<li><span>Calendar days</span><strong>' + W.fmt(total, 0) + '</strong></li>' +
      '<li><span>Weekend days</span><strong>' + W.fmt(weekend, 0) + '</strong></li>' +
      (useHol ? '<li><span>Federal holidays on weekdays</span><strong>' + holList.length + '</strong></li>' : '') +
      '<li><span>Work hours at ' + W.fmt(hpd, 2) + ' a day</span><strong>' + W.fmt(work * hpd, 2) + '</strong></li>' +
      '<li><span>Work weeks (5 days)</span><strong>' + W.fmt(work / 5, 2) + '</strong></li>';
    var list = holList.length && holList.length <= 30 ? '<table class="res-table"><thead><tr><th>Holiday (observed)</th><th>Date</th></tr></thead><tbody>' +
      holList.map(function (h) { return '<tr><td>' + W.esc(h[1]) + '</td><td>' + W.longDate(h[0]) + '</td></tr>'; }).join('') + '</tbody></table>' : '';
    out.innerHTML = '<div class="result-main"><div class="k">Working days</div><div class="v">' + W.fmt(work, 0) + '<small>days</small></div>' +
      '<div class="sub">' + W.longDate(a) + ' to ' + W.longDate(b) + (incEnd ? ', end date included' : '') + '</div></div>' +
      '<ul class="result-rows">' + rows + '</ul>' + list +
      (swap ? '<p class="note">The end date was before the start date, so the two were swapped.</p>' : '');
    return { text: W.longDate(a) + ' – ' + W.longDate(b) + ': ' + work + ' working days (' + W.fmt(work * hpd, 2) + ' hours), ' + total + ' calendar days' };
  }
  W.calculator(form, compute, { init: init, reset: function () { from.value = ''; to.value = ''; init(); } });
})();
