/* Time clock rounding: round an in and an out punch and compare with the exact time. */
(function () {
  'use strict';
  var W = window.WHM;
  var form = document.getElementById('rd-form');
  if (!form) return;
  var out = document.getElementById('rd-results');

  function compute() {
    var inc = +W.str(form, 'inc') || 15;
    var a = W.toMin(W.str(form, 'in')), b = W.toMin(W.str(form, 'out'));
    if (!isFinite(a)) { out.innerHTML = '<p class="results-empty">Enter a clock-in time.</p>'; return {}; }
    var ra = W.roundTo(a, inc);
    var rows = '<li><span>Clock in</span><strong>' + W.clock12(a) + ' → ' + W.clock12(ra) + '</strong></li>';
    var main = W.clock12(ra), sub = 'Clock-in rounded to the nearest ' + inc + ' minutes', text = 'In ' + W.clock12(a) + ' → ' + W.clock12(ra);
    if (isFinite(b)) {
      var rb = W.roundTo(b, inc);
      var exact = W.span(a, b), rounded = W.span(ra, rb), diff = rounded - exact;
      rows += '<li><span>Clock out</span><strong>' + W.clock12(b) + ' → ' + W.clock12(rb) + '</strong></li>' +
        '<li><span>Exact time worked</span><strong>' + W.hm(exact) + ' (' + W.dec(exact) + ')</strong></li>' +
        '<li><span>Rounded time worked</span><strong>' + W.hm(rounded) + ' (' + W.dec(rounded) + ')</strong></li>' +
        '<li><span>Difference</span><strong>' + (diff > 0 ? '+' : '') + diff + ' min</strong></li>';
      main = W.hm(rounded); sub = 'Rounded shift (exact: ' + W.hm(exact) + ')';
      text += ', out ' + W.clock12(b) + ' → ' + W.clock12(rb) + ': ' + W.hm(rounded) + ' rounded vs ' + W.hm(exact) + ' exact';
    }
    var rule = inc === 15 ? '1–7 minutes past a quarter hour round down; 8–14 minutes round up (the 7-minute rule).'
      : inc === 6 ? '1–2 minutes past a tenth of an hour round down; 3–5 minutes round up.'
      : '1–2 minutes past a 5-minute mark round down; 3–4 minutes round up.';
    out.innerHTML = '<div class="result-main"><div class="k">' + (isFinite(b) ? 'Rounded hours' : 'Rounded punch') + '</div><div class="v">' + main + '</div>' +
      '<div class="sub">' + sub + '</div></div><ul class="result-rows">' + rows + '</ul><p class="note">' + rule + '</p>';
    return { text: text + ' (nearest ' + inc + ' min)' };
  }
  W.calculator(form, compute);
})();
