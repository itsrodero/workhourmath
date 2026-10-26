/* Add (or subtract) hours and minutes. */
(function () {
  'use strict';
  var W = window.WHM;
  var form = document.getElementById('at-form');
  if (!form) return;
  var out = document.getElementById('at-results');
  var N = form.querySelectorAll('.at-row').length;

  function compute() {
    var total = 0, used = 0, parts = [];
    for (var i = 0; i < N; i++) {
      var h = W.val(form, 'h' + i), m = W.val(form, 'm' + i);
      if (!isFinite(h) && !isFinite(m)) continue;
      var v = (isFinite(h) ? h * 60 : 0) + (isFinite(m) ? m : 0);
      var sign = W.str(form, 's' + i) === '-' ? -1 : 1;
      total += sign * v; used++;
      parts.push((sign < 0 ? '− ' : (parts.length ? '+ ' : '')) + W.hm(v));
    }
    if (!used) { out.innerHTML = '<p class="results-empty">Enter some hours and minutes.</p>'; return {}; }
    var abs = Math.abs(total), neg = total < 0 ? '−' : '';
    var days = Math.floor(abs / 1440), rest = abs % 1440;
    var rows = '<li><span>Hours and minutes</span><strong>' + neg + W.hmLong(abs) + '</strong></li>' +
      '<li><span>Decimal hours</span><strong>' + neg + W.dec(abs) + '</strong></li>' +
      '<li><span>Total minutes</span><strong>' + W.fmt(total, 0) + '</strong></li>' +
      (days ? '<li><span>Days, hours and minutes</span><strong>' + neg + days + (days === 1 ? ' day ' : ' days ') + Math.floor(rest / 60) + ' hr ' + (rest % 60) + ' min</strong></li>' : '');
    out.innerHTML = '<div class="result-main"><div class="k">Total time</div><div class="v">' + W.hm(total) + '<small>' + neg + W.dec(abs) + ' hrs</small></div>' +
      '<div class="sub">' + W.esc(parts.join(' ')) + '</div></div><ul class="result-rows">' + rows + '</ul>';
    return { text: parts.join(' ') + ' = ' + W.hm(total) + ' (' + neg + W.dec(abs) + ' hours)' };
  }
  W.calculator(form, compute);
})();

/* Add or subtract hours and minutes from a clock time (wraps past midnight). */
(function () {
  'use strict';
  var W = window.WHM;
  var cf = document.getElementById('clk-form');
  if (!cf) return;
  var co = document.getElementById('clk-results');
  function el(k) { return cf.querySelector('[data-c="' + k + '"]'); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function run() {
    var start = W.toMin(el('start').value);
    var h = parseFloat(el('h').value) || 0, m = parseFloat(el('m').value) || 0;
    var dur = Math.round(h * 60 + m), sign = el('op').value === '-' ? -1 : 1;
    if (!isFinite(start)) { co.innerHTML = '<p class="results-empty">Enter a start time.</p>'; return; }
    var total = start + sign * dur;
    var shift = Math.floor(total / 1440), r = ((total % 1440) + 1440) % 1440;
    var when = shift === 0 ? 'same day' : shift === 1 ? 'next day' : shift === -1 ? 'day before'
      : shift > 1 ? shift + ' days later' : (-shift) + ' days earlier';
    co.innerHTML = '<div class="result-main"><div class="k">Resulting time</div><div class="v">' + W.clock12(r) + '</div>' +
      '<div class="sub">' + W.clock12(start) + (sign > 0 ? ' + ' : ' − ') + W.hmLong(dur) + ' · ' + when + '</div></div>' +
      '<ul class="result-rows"><li><span>24-hour time</span><strong>' + pad(Math.floor(r / 60)) + ':' + pad(r % 60) + '</strong></li>' +
      '<li><span>Duration</span><strong>' + W.hm(dur) + ' (' + W.dec(dur) + ' hrs)</strong></li></ul>';
  }
  cf.addEventListener('input', run);
  cf.addEventListener('change', run);
  cf.addEventListener('submit', function (e) { e.preventDefault(); run(); });
  run();
})();
