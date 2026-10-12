/* Decimal hours to hours and minutes. */
(function () {
  'use strict';
  var W = window.WHM;
  var form = document.getElementById('dh-form');
  if (!form) return;
  var out = document.getElementById('dh-results');

  function compute() {
    var d = W.val(form, 'd');
    if (!isFinite(d) || d < 0) { out.innerHTML = '<p class="results-empty">Enter a number of hours, like 7.75.</p>'; return {}; }
    var totalSec = Math.round(d * 3600);
    var h = Math.floor(totalSec / 3600), m = Math.floor((totalSec % 3600) / 60), s = totalSec % 60;
    var mins = Math.round(d * 60);
    var frac = d - Math.floor(d);
    var rows = '<li><span>Hours and minutes</span><strong>' + W.hmLong(mins) + '</strong></li>' +
      '<li><span>Exact (h:mm:ss)</span><strong>' + h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '</strong></li>' +
      '<li><span>Total minutes</span><strong>' + W.fmt(d * 60, 2) + '</strong></li>' +
      '<li><span>Decimal part × 60</span><strong>' + W.fmt(frac, 4) + ' × 60 = ' + W.fmt(frac * 60, 2) + ' min</strong></li>';
    out.innerHTML = '<div class="result-main"><div class="k">Hours and minutes</div><div class="v">' + W.hm(mins) + '<small>h:mm</small></div>' +
      '<div class="sub">' + W.fmt(d, 4) + ' hours</div></div><ul class="result-rows">' + rows + '</ul>' +
      (s ? '<p class="note">Rounded to the nearest minute. The exact time is ' + h + ' hr ' + m + ' min ' + s + ' sec.</p>' : '');
    return { text: W.fmt(d, 4) + ' hours = ' + W.hmLong(mins) + ' (' + W.hm(mins) + ')' };
  }
  W.calculator(form, compute);
})();
