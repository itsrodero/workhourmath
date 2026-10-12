/* Hours, minutes and seconds to decimal hours. */
(function () {
  'use strict';
  var W = window.WHM;
  var form = document.getElementById('md-form');
  if (!form) return;
  var out = document.getElementById('md-results');

  function compute() {
    var h = W.val(form, 'h'), m = W.val(form, 'm'), s = W.val(form, 's');
    if (!isFinite(h) && !isFinite(m) && !isFinite(s)) { out.innerHTML = '<p class="results-empty">Enter hours and minutes.</p>'; return {}; }
    var hours = (isFinite(h) ? h : 0) + (isFinite(m) ? m : 0) / 60 + (isFinite(s) ? s : 0) / 3600;
    var label = [isFinite(h) ? h + ' hr' : '', isFinite(m) ? m + ' min' : '', isFinite(s) ? s + ' sec' : ''].filter(Boolean).join(' ');
    var rows = '<li><span>Decimal hours (2 places)</span><strong>' + W.fixed(hours, 2) + '</strong></li>' +
      '<li><span>Decimal hours (4 places)</span><strong>' + W.fixed(hours, 4) + '</strong></li>' +
      '<li><span>Nearest tenth of an hour</span><strong>' + W.fixed(Math.round(hours * 10) / 10, 1) + '</strong></li>' +
      '<li><span>Nearest quarter hour</span><strong>' + W.fixed(Math.round(hours * 4) / 4, 2) + '</strong></li>' +
      '<li><span>Total minutes</span><strong>' + W.fmt(hours * 60, 2) + '</strong></li>';
    out.innerHTML = '<div class="result-main"><div class="k">Decimal hours</div><div class="v">' + W.fixed(hours, 2) + '<small>hrs</small></div>' +
      '<div class="sub">' + W.esc(label) + '</div></div><ul class="result-rows">' + rows + '</ul>' +
      '<p class="note">Minutes ÷ 60 gives the decimal part: 45 minutes ÷ 60 = 0.75 hours.</p>';
    return { text: label + ' = ' + W.fixed(hours, 2) + ' hours' };
  }
  W.calculator(form, compute);
})();
