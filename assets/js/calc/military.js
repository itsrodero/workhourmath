/* Military (24-hour) time converter, both ways. */
(function () {
  'use strict';
  var W = window.WHM;
  var form = document.getElementById('mt-form');
  if (!form) return;
  var out = document.getElementById('mt-results');
  var stdEl = form.querySelector('[data-k="std"]'), milEl = form.querySelector('[data-k="mil"]');

  // "1730", "17:30", "0930", "930", "17", "1730 hours" -> minutes after midnight (2400 -> 1440).
  function fromMilitary(v) {
    var s = String(v || '').trim().replace(/\s*(hours|hrs|hr|h)$/i, '').replace(':', '');
    if (!/^\d{1,4}$/.test(s)) return NaN;
    if (s.length <= 2) s = s + '00';
    s = ('0000' + s).slice(-4);
    var h = +s.slice(0, 2), m = +s.slice(2);
    if (h === 24 && m === 0) return 1440;
    return h < 24 && m < 60 ? h * 60 + m : NaN;
  }
  function four(min) { var h = Math.floor(min / 60), m = min % 60; return String(h).padStart(2, '0') + String(m).padStart(2, '0'); }
  var ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
    'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four'];
  var TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];
  function spoken(min) {
    var h = Math.floor(min / 60), m = min % 60;
    var hh = (h < 10 ? 'zero ' : '') + ONES[h];
    var mm = m === 0 ? 'hundred' : m < 10 ? 'zero ' + ONES[m] : m < 20 ? ONES[m] : TENS[Math.floor(m / 10)] + (m % 10 ? '-' + ONES[m % 10] : '');
    return hh + ' ' + mm + ' hours';
  }

  var last = 'std';
  form.addEventListener('input', function (e) { if (e.target === stdEl || e.target === milEl) last = e.target === milEl ? 'mil' : 'std'; }, true);

  function compute() {
    var min = last === 'mil' ? fromMilitary(milEl.value) : W.toMin(stdEl.value);
    if (!isFinite(min)) {
      out.innerHTML = '<p class="results-empty">' + (last === 'mil' && milEl.value ? 'Enter military time as four digits, like 1730.' : 'Enter a time.') + '</p>';
      return {};
    }
    var m24 = min === 1440 ? '2400' : four(min);
    if (last === 'mil') stdEl.value = min === 1440 ? '00:00' : m24.slice(0, 2) + ':' + m24.slice(2);
    else milEl.value = m24;
    var clock = W.clock12(min % 1440);
    out.innerHTML = '<div class="result-main"><div class="k">Military time</div><div class="v">' + m24 + '<small>hours</small></div>' +
      '<div class="sub">' + clock + (min === 1440 ? ' — midnight at the end of the day' : '') + '</div></div>' +
      '<ul class="result-rows"><li><span>Standard time</span><strong>' + clock + '</strong></li>' +
      '<li><span>With a colon (24-hour clock)</span><strong>' + m24.slice(0, 2) + ':' + m24.slice(2) + '</strong></li>' +
      '<li><span>How it\'s said</span><strong>' + spoken(min) + '</strong></li>' +
      '<li><span>Minutes after midnight</span><strong>' + W.fmt(min, 0) + '</strong></li></ul>';
    return { text: m24 + ' = ' + clock };
  }
  W.calculator(form, compute);
})();
