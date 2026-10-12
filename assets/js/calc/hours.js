/* Hours calculator: time between two clock times, minus a break, optionally times a rate. */
(function () {
  'use strict';
  var W = window.WHM;
  var form = document.getElementById('hr-form');
  if (!form) return;
  var out = document.getElementById('hr-results');

  function compute() {
    var a = W.toMin(W.str(form, 'start')), b = W.toMin(W.str(form, 'end'));
    var brk = W.val(form, 'brk'); brk = brk > 0 ? brk : 0;
    if (!isFinite(a) || !isFinite(b)) {
      out.innerHTML = '<p class="results-empty">Enter a start time and an end time.</p>';
      return {};
    }
    var span = W.span(a, b);
    var m = span - brk;
    if (m < 0) {
      out.innerHTML = '<p class="note warn">The break is longer than the time between ' + W.clock12(a) + ' and ' + W.clock12(b) + '.</p>';
      return {};
    }
    var rate = W.val(form, 'rate');
    var rows = '<li><span>Hours and minutes</span><strong>' + W.hmLong(m) + '</strong></li>' +
      '<li><span>Decimal hours</span><strong>' + W.dec(m) + '</strong></li>' +
      '<li><span>Total minutes</span><strong>' + W.fmt(m, 0) + '</strong></li>' +
      (brk ? '<li><span>Time between, before the break</span><strong>' + W.hm(span) + '</strong></li>' : '') +
      (rate > 0 ? '<li><span>Pay at ' + W.money(rate) + '/hr</span><strong>' + W.money(m / 60 * rate) + '</strong></li>' : '');
    var note = b < a ? '<p class="note">The end time is earlier than the start time, so it counts into the next day (an overnight shift).</p>'
      : (a === b ? '<p class="note">Start and end are the same time, so this counts as 0 hours. For a 24-hour shift, use the <a href="/add-time-calculator.html">add time calculator</a>.</p>' : '');
    out.innerHTML = '<div class="result-main"><div class="k">Time worked</div><div class="v">' + W.hm(m) + '<small>' + W.dec(m) + ' hrs</small></div>' +
      '<div class="sub">' + W.clock12(a) + ' to ' + W.clock12(b) + (brk ? ' minus a ' + W.fmt(brk, 0) + '-minute break' : '') + '</div></div>' +
      '<ul class="result-rows">' + rows + '</ul>' + note;
    return { text: W.clock12(a) + ' to ' + W.clock12(b) + (brk ? ' minus ' + brk + ' min break' : '') + ' = ' + W.hmLong(m) + ' (' + W.dec(m) + ' hours)' + (rate > 0 ? ', ' + W.money(m / 60 * rate) + ' at ' + W.money(rate) + '/hr' : '') };
  }
  W.calculator(form, compute);
})();
