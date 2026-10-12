/* Shift differential calculator: extra pay for evening, night or weekend hours. */
(function () {
  'use strict';
  var W = window.WHM;
  var form = document.getElementById('sd-form');
  if (!form) return;
  var out = document.getElementById('sd-results');

  function compute() {
    var base = W.val(form, 'base'), diff = W.val(form, 'diff'), type = W.str(form, 'type');
    var dh = W.val(form, 'dh'); dh = dh > 0 ? dh : 0;
    var rh = W.val(form, 'rh'); rh = rh > 0 ? rh : 0;
    if (!(base > 0) || !isFinite(diff)) { out.innerHTML = '<p class="results-empty">Enter your base rate and the differential.</p>'; return {}; }
    var extra = type === 'pct' ? base * diff / 100 : diff;
    var shiftRate = base + extra;
    var hours = dh + rh;
    var pay = rh * base + dh * shiftRate;
    var rows = '<li><span>Differential</span><strong>' + (type === 'pct' ? W.fmt(diff, 2) + '% = ' : '') + W.money(extra) + '/hr</strong></li>' +
      '<li><span>Rate on differential hours</span><strong>' + W.money(shiftRate) + '/hr</strong></li>' +
      (hours ? '<li><span>Regular-shift pay</span><strong>' + W.fmt(rh, 2) + ' × ' + W.money(base) + ' = ' + W.money(rh * base) + '</strong></li>' +
      '<li><span>Differential-shift pay</span><strong>' + W.fmt(dh, 2) + ' × ' + W.money(shiftRate) + ' = ' + W.money(dh * shiftRate) + '</strong></li>' +
      '<li><span>Extra from the differential</span><strong>' + W.money(dh * extra) + '</strong></li>' +
      '<li><span>Average hourly rate</span><strong>' + W.money(pay / hours) + '</strong></li>' : '');
    out.innerHTML = '<div class="result-main"><div class="k">' + (hours ? 'Gross pay (straight time)' : 'Shift rate') + '</div><div class="v">' + (hours ? W.money(pay) : W.money(shiftRate)) + '<small>' + (hours ? '' : '/hr') + '</small></div>' +
      '<div class="sub">' + W.money(base) + '/hr base + ' + W.money(extra) + '/hr differential</div></div><ul class="result-rows">' + rows + '</ul>' +
      (hours > 40 ? '<p class="note warn">Over 40 hours: overtime is owed on top of this, and under federal rules the shift differential raises the rate overtime is based on. See the example below.</p>' : '');
    return { text: 'Base ' + W.money(base) + '/hr + differential ' + W.money(extra) + '/hr = ' + W.money(shiftRate) + '/hr' + (hours ? '; ' + W.fmt(hours, 2) + ' hours = ' + W.money(pay) : '') };
  }
  W.calculator(form, compute);
})();
