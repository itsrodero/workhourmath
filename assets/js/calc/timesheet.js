/* Printable timesheet: fills the dates from the week start and prints only the sheet. */
(function () {
  'use strict';
  var W = window.WHM;
  var form = document.getElementById('ts-form');
  if (!form) return;
  var sheet = document.getElementById('ts-sheet');
  var body = sheet.querySelector('tbody');
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  function compute() {
    var weeks = W.str(form, 'weeks') === '2' ? 2 : 1;
    var start = W.parseDate(W.str(form, 'start'));
    var name = form.querySelector('#ts-name').value;
    var rows = '';
    for (var w = 0; w < weeks; w++) {
      if (weeks > 1) rows += '<tr class="ts-week"><th colspan="7">Week ' + (w + 1) + '</th></tr>';
      for (var d = 0; d < 7; d++) {
        var date = start ? new Date(start.getTime() + (w * 7 + d) * 864e5) : null;
        var label = start ? DAYS[date.getUTCDay() === 0 ? 6 : date.getUTCDay() - 1] : DAYS[d];
        rows += '<tr><th scope="row">' + label + '</th><td>' + (date ? (date.getUTCMonth() + 1) + '/' + date.getUTCDate() : '') + '</td><td></td><td></td><td></td><td></td><td></td></tr>';
      }
      rows += '<tr class="ts-total"><td colspan="6">' + (weeks > 1 ? 'Week ' + (w + 1) + ' total' : 'Total hours') + '</td><td></td></tr>';
    }
    body.innerHTML = rows;
    sheet.querySelector('.ts-title').textContent = weeks > 1 ? 'Biweekly Timesheet' : 'Weekly Timesheet';
    sheet.querySelector('.ts-emp').textContent = name || '';
    sheet.querySelector('.ts-start').textContent = start ? W.longDate(start) : '';
    return {};
  }

  W.calculator(form, compute);
  form.querySelector('#ts-name').addEventListener('input', compute);
  var btn = document.querySelector('.js-print-sheet');
  if (btn) btn.addEventListener('click', function () {
    document.body.classList.add('print-sheet');
    window.print();
    setTimeout(function () { document.body.classList.remove('print-sheet'); }, 500);
  });
})();
