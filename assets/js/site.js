/* WorkHourMath — navigation and shared calculator helpers (window.WHM). */
(function () {
  'use strict';

  // ---------- navigation
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  document.querySelectorAll('.nav-dd').forEach(function (dd) {
    var btn = dd.querySelector('.nav-dd-btn');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = dd.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.nav-dd.is-open').forEach(function (dd) {
      if (!dd.contains(e.target)) { dd.classList.remove('is-open'); dd.querySelector('.nav-dd-btn').setAttribute('aria-expanded', 'false'); }
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.nav-dd.is-open').forEach(function (dd) { dd.classList.remove('is-open'); });
  });

  // ---------- numbers
  function val(form, key) {
    var el = form.querySelector('[data-k="' + key + '"]');
    if (!el) return NaN;
    var v = parseFloat(String(el.value).replace(/[,$\s]/g, ''));
    return isFinite(v) ? v : NaN;
  }
  function str(form, key) {
    var el = form.querySelector('[data-k="' + key + '"]');
    return el ? String(el.value) : '';
  }
  function fmt(n, dec) {
    if (!isFinite(n)) return '–';
    dec = dec == null ? 2 : dec;
    return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: dec });
  }
  function fixed(n, dec) {
    return isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : '–';
  }
  function money(n) {
    return isFinite(n) ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '–';
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  // ---------- time
  // "HH:MM" (the value of <input type="time">) -> minutes after midnight.
  function toMin(v) {
    var m = /^(\d{1,2}):(\d{2})/.exec(String(v || ''));
    if (!m) return NaN;
    var h = +m[1], mi = +m[2];
    return h < 24 && mi < 60 ? h * 60 + mi : NaN;
  }
  // Minutes -> "8:05" (hours can exceed 24).
  function hm(min) {
    if (!isFinite(min)) return '–';
    var neg = min < 0; min = Math.round(Math.abs(min));
    return (neg ? '−' : '') + Math.floor(min / 60) + ':' + String(min % 60).padStart(2, '0');
  }
  // Minutes -> "8 hr 5 min".
  function hmLong(min) {
    if (!isFinite(min)) return '–';
    min = Math.round(min);
    var h = Math.floor(min / 60), m = min % 60;
    if (!h) return m + ' min';
    return h + ' hr' + (m ? ' ' + m + ' min' : '');
  }
  // Minutes -> decimal hours with 2 places, e.g. 485 -> "8.08".
  function dec(min, places) {
    return fixed(min / 60, places == null ? 2 : places);
  }
  // Minutes after midnight -> "9:30 AM".
  function clock12(min) {
    if (!isFinite(min)) return '–';
    min = ((Math.round(min) % 1440) + 1440) % 1440;
    var h = Math.floor(min / 60), m = min % 60;
    return ((h % 12) || 12) + ':' + String(m).padStart(2, '0') + ' ' + (h < 12 ? 'AM' : 'PM');
  }
  // Round a punch to the nearest increment (5, 6 or 15 minutes). With 15 minutes this is the
  // "7-minute rule": 1–7 minutes past a quarter hour round down, 8–14 round up.
  function roundTo(min, inc) {
    if (!inc || !isFinite(min)) return min;
    return Math.round(min / inc) * inc;
  }
  // Worked minutes between two punches, crossing midnight if the end is earlier than the start.
  function span(inMin, outMin) {
    if (!isFinite(inMin) || !isFinite(outMin)) return NaN;
    var d = outMin - inMin;
    return d < 0 ? d + 1440 : d;
  }

  // ---------- overtime
  // days: minutes worked on each day of ONE workweek, in workweek order.
  // rule: 'federal' (over 40 a week), 'ca', 'ak', 'co' or 'none'.
  // Returns per-day {reg, ot, dt} in minutes and the totals.
  function overtime(days, rule) {
    var allSeven = days.length === 7 && days.every(function (m) { return m > 0; });
    var out = days.map(function (m, i) {
      m = m > 0 ? m : 0;
      if (rule === 'ca') {
        if (allSeven && i === 6) return { reg: 0, ot: Math.min(m, 480), dt: Math.max(m - 480, 0) };
        return { reg: Math.min(m, 480), ot: Math.min(Math.max(m - 480, 0), 240), dt: Math.max(m - 720, 0) };
      }
      if (rule === 'ak') return { reg: Math.min(m, 480), ot: Math.max(m - 480, 0), dt: 0 };
      if (rule === 'co') return { reg: Math.min(m, 720), ot: Math.max(m - 720, 0), dt: 0 };
      return { reg: m, ot: 0, dt: 0 };
    });
    if (rule !== 'none') {
      // Weekly rule: regular hours beyond 40 in the workweek become overtime (daily overtime isn't counted twice).
      var run = 0;
      out.forEach(function (d) {
        var room = Math.max(2400 - run, 0);
        if (d.reg > room) { d.ot += d.reg - room; d.reg = room; }
        run += d.reg;
      });
    }
    var tot = out.reduce(function (a, d) { return { reg: a.reg + d.reg, ot: a.ot + d.ot, dt: a.dt + d.dt }; }, { reg: 0, ot: 0, dt: 0 });
    return { days: out, total: tot };
  }
  var RULES = {
    federal: 'Federal (FLSA): over 40 hours a week',
    ca: 'California: over 8 a day, 40 a week, 7th day',
    ak: 'Alaska: over 8 a day or 40 a week',
    co: 'Colorado: over 12 a day or 40 a week',
    none: 'No overtime'
  };

  // ---------- US federal holidays (5 U.S.C. 6103), with the observed date when one falls on a weekend
  function nthWeekday(y, month, weekday, n) {
    var d = new Date(Date.UTC(y, month, 1));
    var first = (weekday - d.getUTCDay() + 7) % 7 + 1;
    return new Date(Date.UTC(y, month, first + (n - 1) * 7));
  }
  function lastWeekday(y, month, weekday) {
    var d = new Date(Date.UTC(y, month + 1, 0));
    return new Date(Date.UTC(y, month, d.getUTCDate() - ((d.getUTCDay() - weekday + 7) % 7)));
  }
  function observed(d) {
    var wd = d.getUTCDay();
    if (wd === 6) return new Date(d.getTime() - 864e5);
    if (wd === 0) return new Date(d.getTime() + 864e5);
    return d;
  }
  function holidays(y) {
    var fixedDay = function (m, day) { return new Date(Date.UTC(y, m, day)); };
    var list = [
      ["New Year's Day", fixedDay(0, 1), true],
      ['Martin Luther King Jr. Day', nthWeekday(y, 0, 1, 3)],
      ["Washington's Birthday (Presidents Day)", nthWeekday(y, 1, 1, 3)],
      ['Memorial Day', lastWeekday(y, 4, 1)],
      ['Juneteenth', fixedDay(5, 19), true],
      ['Independence Day', fixedDay(6, 4), true],
      ['Labor Day', nthWeekday(y, 8, 1, 1)],
      ['Columbus Day', nthWeekday(y, 9, 1, 2)],
      ['Veterans Day', fixedDay(10, 11), true],
      ['Thanksgiving Day', nthWeekday(y, 10, 4, 4)],
      ['Christmas Day', fixedDay(11, 25), true]
    ];
    return list.map(function (h) { return { name: h[0], date: h[1], observed: h[2] ? observed(h[1]) : h[1] }; });
  }
  function isoDate(d) { return d.toISOString().slice(0, 10); }
  function parseDate(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || ''));
    return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
  }
  function longDate(d) {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }

  // ---------- state, sharing and files
  // Every input with data-k is kept in the URL so a result can be shared or bookmarked.
  // Forms with data-store="name" also remember their inputs in this browser.
  function fields(form) { return form.querySelectorAll('[data-k]'); }
  function defaultOf(el) {
    if (el.type === 'checkbox') return el.defaultChecked ? '1' : '0';
    if (el.tagName === 'SELECT') return (el.querySelector('option[selected]') || el.options[0] || {}).value;
    return el.defaultValue;
  }
  function valueOf(el) { return el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value; }
  function setValue(el, v) { if (el.type === 'checkbox') el.checked = v === '1'; else el.value = v; }
  function query(form) {
    var params = new URLSearchParams();
    fields(form).forEach(function (el) {
      var v = valueOf(el);
      if (v !== defaultOf(el)) params.set(el.dataset.k, v);
    });
    return params.toString();
  }
  function apply(form, q) {
    var params = new URLSearchParams(q);
    var any = false;
    params.forEach(function (v, k) {
      var el = form.querySelector('[data-k="' + k + '"]');
      if (el) { setValue(el, v); any = true; }
    });
    return any;
  }
  function store(key, v) {
    try { if (v === undefined) return localStorage.getItem('whm:' + key); if (v === null) localStorage.removeItem('whm:' + key); else localStorage.setItem('whm:' + key, v); } catch (e) { return null; }
  }
  function copy(text, btn, done) {
    function ok() {
      if (!btn) return;
      var t = btn.textContent;
      btn.textContent = done || 'Copied ✓';
      setTimeout(function () { btn.textContent = t; }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, ok);
    else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); ok(); }
  }
  function download(name, text, type) {
    var blob = new Blob([text], { type: type || 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // Wires up a calculator: restores state, recalculates on every change and connects
  // the Reset / Copy link / Copy summary / Download CSV / Print buttons.
  // compute() returns {text, csv} (both optional).
  function calculator(form, compute, opts) {
    opts = opts || {};
    var key = form.dataset.store;
    if (!apply(form, location.search) && key) {
      var saved = store(key);
      if (saved) apply(form, saved);
    }
    if (opts.init) opts.init();
    var last = {};
    function run() {
      last = compute() || {};
      var q = query(form);
      if (history.replaceState) history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
      if (key) store(key, q || null);
    }
    form.addEventListener('input', run);
    form.addEventListener('change', run);
    form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
    var root = form.closest('.calc') || document;
    function on(sel, fn) { var b = root.querySelector(sel); if (b) b.addEventListener('click', function () { fn(b); }); }
    on('.js-share', function (b) { copy(location.href, b, 'Link copied ✓'); });
    on('.js-print', function () { window.print(); });
    on('.js-copy', function (b) { copy((last.text || '') + '\n' + location.href, b, 'Copied ✓'); });
    on('.js-csv', function () { if (last.csv) download((opts.file || 'workhourmath') + '.csv', last.csv); });
    on('.js-reset', function () {
      form.reset();
      if (key) store(key, null);
      history.replaceState(null, '', location.pathname);
      if (opts.reset) opts.reset();
      run();
    });
    run();
    return run;
  }

  window.WHM = {
    val: val, str: str, fmt: fmt, fixed: fixed, money: money, esc: esc,
    toMin: toMin, hm: hm, hmLong: hmLong, dec: dec, clock12: clock12, roundTo: roundTo, span: span,
    overtime: overtime, RULES: RULES, holidays: holidays, isoDate: isoDate, parseDate: parseDate, longDate: longDate,
    copy: copy, download: download, calculator: calculator
  };
})();
