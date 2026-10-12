#!/usr/bin/env python3
"""
WorkHourMath static site builder.

Usage (from the repository root):
    python _tools/build.py

Reads every page in _src/ (and _src/guides/), wraps it in the shared layout
(header, footer, SEO tags, structured data) and writes plain HTML files:
    _src/<slug>.html         ->  /<slug>.html
    _src/guides/<slug>.html  ->  /guides/<slug>.html
It also writes sitemap.xml and robots.txt.

No third-party packages are needed (Python 3.8+).
"""
import datetime
import hashlib
import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, '_src')

SITE_URL = 'https://workhourmath.com'
SITE_NAME = 'WorkHourMath'
CONTACT_EMAIL = 'hello@workhourmath.com'
AUTHOR_NAME = 'Daniel'
# Ads stay off until AdSense approves the site.
ADSENSE_CLIENT = None
GA_ID = 'G-CFG1L4ENQ3'
# Pinterest "claim website" code (the content of its p:domain_verify meta tag); added to the home page.
PINTEREST_VERIFY = None
# Bing Webmaster Tools site verification (msvalidate.01), added to the home page.
BING_VERIFY = 'C8B4759E49EA3ABB3CC5BA404D0E0532'

# EEA + UK + Switzerland: consent is denied by default. Analytics then runs
# without cookies there until a Google-certified CMP (AdSense > Privacy &
# messaging) is added and collects consent.
CONSENT_REGIONS = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
    'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO',
    'GB', 'CH',
]

CATEGORIES = {
    'timecards': ('Time cards & hours', 'Add up shifts, breaks and weekly hours for a time card or timesheet.'),
    'pay': ('Pay & overtime', 'Overtime pay, hourly and salary conversions, raises and shift differentials.'),
    'convert': ('Time conversions', 'Minutes to decimal hours, decimal hours to minutes, and military time.'),
    'dates': ('Workdays & time off', 'Working days between two dates and paid time off accrual.'),
}

ICONS = {
    'calc': '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8"/><path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
    'book': '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
    'arrow': '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    'chevron': '<path d="m6 9 6 6 6-6"/>',
    'menu': '<path d="M4 6h16M4 12h16M4 18h16"/>',
    'check': '<path d="M20 6 9 17l-5-5"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'card': '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    'cards': '<rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v12"/><path d="M6.5 11h6M6.5 15h6"/>',
    'addtime': '<circle cx="10" cy="13" r="7"/><path d="M10 9.5V13l2.5 1.5"/><path d="M19 3v6M16 6h6"/>',
    'hourglass': '<path d="M6 3h12M6 21h12"/><path d="M8 3v3.5a4 4 0 0 0 8 0V3M8 21v-3.5a4 4 0 0 1 8 0V21"/>',
    'decimal': '<circle cx="5" cy="18" r="1"/><rect x="9" y="5" width="6" height="14" rx="3"/><path d="M19 5v14"/>',
    'military': '<circle cx="12" cy="12" r="9"/><path d="M7.5 10a1.75 1.75 0 0 1 3.5 0c0 1.6-3.5 2.6-3.5 4.6H11"/><path d="M15.5 9.4 13.5 13.5h3.5M16.2 11v4.6"/>',
    'dollar': '<path d="M12 3v18"/><path d="M16.5 7.5C15.8 6 14.2 5 12 5c-2.6 0-4.2 1.3-4.2 3.1 0 4.2 8.9 2.2 8.9 6.7 0 1.9-1.8 3.2-4.7 3.2-2.3 0-4-1-4.8-2.5"/>',
    'alarm': '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5"/><path d="M5 3 2 6M19 3l3 3"/>',
    'swap': '<path d="M7 4 3 8l4 4"/><path d="M3 8h13"/><path d="m17 12 4 4-4 4"/><path d="M21 16H8"/>',
    'trend': '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    'moon': '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    'calendar': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    'timer': '<circle cx="12" cy="14" r="8"/><path d="M12 10v4l2 2M10 2h4"/>',
}


def icon(name, cls='icon'):
    return (f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>')


LOGO = ('<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#1d4ed8"/>'
        '<circle cx="16" cy="16" r="9" fill="none" stroke="#fff" stroke-width="2.4"/>'
        '<path d="M16 10.5V16l3.6 2.2" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>')


# ---------------------------------------------------------------- helpers

def esc(s):
    return html.escape(str(s), quote=True)


def parse_page(path):
    raw = open(path, encoding='utf-8').read()
    m = re.match(r'^---\s*\n(.*?)\n---\s*\n', raw, re.S)
    if not m:
        sys.exit(f'Missing front matter in {path}')
    meta = {}
    for line in m.group(1).splitlines():
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        k, _, v = line.partition(':')
        meta[k.strip()] = v.strip()
    return meta, raw[m.end():]


def fmt_date(d):
    dt = datetime.date.fromisoformat(d)
    return dt.strftime('%B %-d, %Y') if os.name != 'nt' else dt.strftime('%B %#d, %Y')


def strip_tags(s):
    return re.sub(r'<[^>]+>', ' ', s)


def reading_time(body):
    words = len(re.findall(r'\w+', strip_tags(re.sub(r'<(script|style)[\s\S]*?</\1>', '', body))))
    return max(1, round(words / 220)), words


def slugify(text):
    text = re.sub(r'[^a-z0-9]+', '-', strip_tags(text).lower()).strip('-')
    return text[:60] or 'section'


def inline_css():
    css = open(os.path.join(ROOT, 'assets', 'css', 'site.css'), encoding='utf-8').read()
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    css = re.sub(r'\s*\n\s*', '', css)
    return re.sub(r'\s{2,}', ' ', css)


def asset_version():
    h = hashlib.md5()
    for dp, _, fn in os.walk(os.path.join(ROOT, 'assets')):
        for f in sorted(fn):
            if f.endswith(('.css', '.js')):
                h.update(open(os.path.join(dp, f), 'rb').read())
    return h.hexdigest()[:8]


# ---------------------------------------------------------------- load

def load_pages():
    pages = {}
    for sub in ('', 'guides'):
        d = os.path.join(SRC, sub)
        for f in sorted(os.listdir(d)):
            if not f.endswith('.html'):
                continue
            slug = f[:-5]
            meta, body = parse_page(os.path.join(d, f))
            meta.setdefault('type', 'guide' if sub else 'page')
            key = f'{sub}/{slug}' if sub else slug
            url = '/' if slug == 'index' else f'/{key}.html'
            out = os.path.join(ROOT, *( [sub] if sub else []), f'{slug}.html')
            pages[key] = {'key': key, 'slug': slug, 'meta': meta, 'body': body, 'url': url, 'out': out}
    return pages


def resolve_links(body, pages, where):
    """Turn href="@slug" / href="@guides/slug#frag" into real URLs and check they exist."""
    def repl(m):
        target, frag = m.group(1), ''
        if '#' in target:
            target, frag = target.split('#', 1)
            frag = '#' + frag
        if target not in pages:
            sys.exit(f'Broken internal link @{m.group(1)} in {where}')
        return f'href="{pages[target]["url"]}{frag}"'
    return re.sub(r'href="@([^"]+)"', repl, body)


def add_heading_ids(body):
    toc, used = [], set()

    def repl(m):
        level, attrs, inner = m.group(1), m.group(2) or '', m.group(3)
        idm = re.search(r'id="([^"]+)"', attrs)
        if idm:
            hid = idm.group(1)
        else:
            hid = base = slugify(inner)
            n = 2
            while hid in used:
                hid, n = f'{base}-{n}', n + 1
            attrs = f'{attrs} id="{hid}"'
        used.add(hid)
        if level == '2' and 'data-notoc' not in attrs:
            toc.append((hid, strip_tags(inner).strip()))
        return f'<h{level}{attrs}>{inner}</h{level}>'
    body = re.sub(r'<h([23])((?:\s[^>]*)?)>(.*?)</h\1>', repl, body, flags=re.S)
    return body, toc


# ---------------------------------------------------------------- blocks

def calc_pages(pages, category=None):
    calcs = [p for p in pages.values() if p['meta']['type'] == 'calculator'
             and (category is None or p['meta']['category'] == category)]
    return sorted(calcs, key=lambda p: (list(CATEGORIES).index(p['meta']['category']), int(p['meta'].get('order', 50))))


def guide_pages(pages):
    return sorted([p for p in pages.values() if p['meta']['type'] == 'guide'],
                  key=lambda p: (int(p['meta'].get('order', 50)), p['slug']))


def calc_card(p):
    m = p['meta']
    return (f'<a class="calc-card" href="{p["url"]}"><span class="calc-card-icon">{icon(m.get("icon", "calc"))}</span>'
            f'<span class="calc-card-title">{esc(m["card_title"])}</span>'
            f'<span class="calc-card-desc">{esc(m["card_desc"])}</span>'
            f'<span class="calc-card-cta">Open calculator {icon("arrow", "icon icon-sm")}</span></a>')


def calc_grid(pages, category=None, exclude=None):
    cards = [calc_card(p) for p in calc_pages(pages, category) if p['key'] != exclude]
    return '<div class="calc-grid">' + ''.join(cards) + '</div>'


def calcs_by_category(pages):
    out = []
    for cat, (name, intro) in CATEGORIES.items():
        if calc_pages(pages, cat):
            out.append(f'<section class="cat-group" id="cat-{cat}"><h2>{esc(name)}</h2>'
                       f'<p class="section-lead">{esc(intro)}</p>{calc_grid(pages, cat)}</section>')
    return ''.join(out)


def guide_card(p):
    m = p['meta']
    label = CATEGORIES[m['category']][0] if m.get('category') in CATEGORIES else 'Guide'
    return (f'<a class="guide-card" href="{p["url"]}"><span class="guide-card-cat">{esc(label)}</span>'
            f'<span class="guide-card-title">{esc(m.get("card_title", m["h1"]))}</span>'
            f'<span class="guide-card-desc">{esc(m.get("card_desc", m["description"]))}</span>'
            f'<span class="calc-card-cta">Read guide {icon("arrow", "icon icon-sm")}</span></a>')


def guides_grid(pages, limit=None):
    gs = guide_pages(pages)
    if limit:
        gs = gs[:limit]
    return '<div class="guide-grid">' + ''.join(guide_card(p) for p in gs) + '</div>' if gs else ''


def guides_by_category(pages):
    out = []
    gs = guide_pages(pages)
    for cat, (name, _) in CATEGORIES.items():
        items = [p for p in gs if p['meta'].get('category') == cat]
        if items:
            out.append(f'<section class="cat-group" id="guides-{cat}"><h2>{esc(name)}</h2>'
                       f'<div class="guide-grid">{"".join(guide_card(p) for p in items)}</div></section>')
    rest = [p for p in gs if p['meta'].get('category') not in CATEGORIES]
    if rest:
        out.append(f'<section class="cat-group"><h2>More guides</h2><div class="guide-grid">{"".join(guide_card(p) for p in rest)}</div></section>')
    return ''.join(out)


def sitemap_block(pages):
    cols = []
    for cat, (name, _) in CATEGORIES.items():
        items = calc_pages(pages, cat)
        if items:
            cols.append(f'<h2>{esc(name)}</h2><ul>' + ''.join(
                f'<li><a href="{p["url"]}">{esc(p["meta"]["card_title"])}</a></li>' for p in items) + '</ul>')
    gs = guide_pages(pages)
    if gs:
        cols.append('<h2>Guides</h2><ul>' + ''.join(f'<li><a href="{p["url"]}">{esc(p["meta"]["h1"])}</a></li>' for p in gs) + '</ul>')
    others = sorted([p for p in pages.values() if p['meta']['type'] in ('page', 'hub') and p['meta'].get('noindex') != 'true'],
                    key=lambda p: p['meta']['h1'])
    cols.append('<h2>About this site</h2><ul>' + ''.join(f'<li><a href="{p["url"]}">{esc(p["meta"]["h1"])}</a></li>' for p in others) + '</ul>')
    return '<div class="sitemap-cols">' + ''.join(f'<div>{c}</div>' for c in cols) + '</div>'


DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']


def timecard_form(days):
    """Weekly (7) or biweekly (14) time card: in / out / unpaid break per day, read by assets/js/calc/timecard.js."""
    rows = []
    for i in range(days):
        if days > 7 and i % 7 == 0:
            rows.append(f'<p class="tc-week" data-notoc>Week {i // 7 + 1}</p>')
        weekday = i % 7 < 5
        tin, tout, brk = ('09:00', '17:30', '30') if weekday else ('', '', '')
        name = DAY_NAMES[i % 7]
        rows.append(f'''<div class="tc-row">
        <span class="tc-day" data-day="{i % 7}">{name}</span>
        <span class="tc-cell"><span class="tc-lab" aria-hidden="true">In</span><input type="time" data-k="in{i}" value="{tin}" aria-label="{name} time in"></span>
        <span class="tc-cell"><span class="tc-lab" aria-hidden="true">Out</span><input type="time" data-k="out{i}" value="{tout}" aria-label="{name} time out"></span>
        <span class="tc-cell"><span class="tc-lab" aria-hidden="true">Break</span><input type="text" inputmode="numeric" data-k="brk{i}" value="{brk}" placeholder="0" aria-label="{name} unpaid break in minutes"></span>
        <output class="tc-hrs" data-hrs="{i}">–</output>
      </div>''')
    rules = [('federal', 'Federal: over 40 hours a week'), ('ca', 'California: daily 8 / 12, weekly 40, 7th day'),
             ('ak', 'Alaska: over 8 a day or 40 a week'), ('co', 'Colorado: over 12 a day or 40 a week'), ('none', 'No overtime')]
    rule_opts = ''.join(f'<option value="{v}"{" selected" if v == "federal" else ""}>{n}</option>' for v, n in rules)
    return f'''<div class="calc calc-wide">
  <form class="panel" id="tc-form" data-store="timecard{days}" data-days="{days}" novalidate>
    <h2>Hours</h2>
    <div class="tc-head" aria-hidden="true"><span>Day</span><span>Time in</span><span>Time out</span><span>Break (min)</span><span>Hours</span></div>
    {"".join(rows)}
    <div class="tc-tools"><button type="button" class="btn btn-ghost btn-sm js-fill">Copy first day to Mon–Fri</button><button type="button" class="btn btn-ghost btn-sm js-clear">Clear all times</button></div>
    <h2 style="margin-top:22px">Pay and rules</h2>
    <div class="fields">
      <div class="field"><label for="tc-rate">Hourly rate (optional)</label><div class="inp"><span class="affix pre">$</span><input id="tc-rate" data-k="rate" type="text" inputmode="decimal" placeholder="e.g. 18.50"></div></div>
      <div class="field"><label for="tc-rule">Overtime rule</label><select id="tc-rule" class="select" data-k="rule">{rule_opts}</select></div>
      <div class="field"><label for="tc-round">Round punches to</label><select id="tc-round" class="select" data-k="round"><option value="0" selected>Exact minutes</option><option value="5">Nearest 5 minutes</option><option value="6">Nearest 6 minutes (0.1 hr)</option><option value="15">Nearest 15 minutes (7-minute rule)</option></select></div>
      <div class="field"><label for="tc-start">Workweek starts on</label><select id="tc-start" class="select" data-k="start"><option value="1" selected>Monday</option><option value="0">Sunday</option><option value="6">Saturday</option></select></div>
    </div>
    <p class="form-note">Saved automatically in this browser. Overnight shifts work: an out time earlier than the in time counts into the next day.</p>
    <div class="calc-actions">
      <button type="button" class="btn btn-ghost btn-sm js-reset">Reset</button>
      <button type="button" class="btn btn-ghost btn-sm js-copy">Copy summary</button>
      <button type="button" class="btn btn-ghost btn-sm js-csv">Download CSV</button>
      <button type="button" class="btn btn-ghost btn-sm js-share">Copy link</button>
      <button type="button" class="btn btn-ghost btn-sm js-print">Print</button>
    </div>
  </form>
  <section class="panel results" aria-live="polite" aria-label="Results">
    <div id="tc-results"><p class="results-empty">Enter your times in and out.</p></div>
  </section>
</div>'''


def table(head, rows, cls=''):
    th = ''.join(f'<th>{h}</th>' for h in head)
    tr = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in rows)
    return f'<div class="table-wrap{cls}"><table><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table></div>'


def money(x):
    return f'${x:,.2f}' if x < 1000 else f'${x:,.0f}'


def chart_min_dec():
    cols = [table(['Minutes', 'Decimal hours'], [(m, f'{m / 60:.2f}') for m in range(a, a + 20)]) for a in (1, 21, 41)]
    return '<div class="chart-cols">' + ''.join(cols) + '</div>'


def chart_dec_min():
    vals = [round(x * 0.05, 2) for x in range(1, 21)]
    rows = [(f'{v:.2f}', f'{v * 60:g} min') for v in vals]
    return '<div class="chart-cols">' + table(['Decimal', 'Minutes'], rows[:10]) + table(['Decimal', 'Minutes'], rows[10:]) + '</div>'


def chart_military():
    def std(h):
        return f'{(h % 12) or 12}:00 {"AM" if h < 12 else "PM"}'
    am = [(std(h), f'{h:02d}00') for h in range(12)]
    pm = [(std(h), f'{h:02d}00') for h in range(12, 24)]
    return '<div class="chart-cols">' + table(['Standard', 'Military'], am) + table(['Standard', 'Military'], pm) + '</div>'


def table_h2s():
    rates = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 28, 30, 32, 35, 40, 45, 50, 60, 75, 100]
    rows = [(f'${r}', money(r * 40), money(r * 2080 / 12), money(r * 2080)) for r in rates]
    return table(['Hourly', 'Weekly (40 hr)', 'Monthly', 'Yearly (2,080 hr)'], rows)


def table_s2h():
    sal = [25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000, 65000, 70000, 75000, 80000, 85000, 90000, 100000, 110000, 120000, 150000, 200000]
    rows = [(f'${s:,}', f'${s / 2080:,.2f}', money(s / 12), money(s / 26)) for s in sal]
    return table(['Yearly salary', 'Hourly (2,080 hr)', 'Monthly', 'Biweekly'], rows)


def us_holidays(y):
    """Observed US federal holidays (5 U.S.C. 6103), same rules as WHM.holidays in site.js."""
    d = datetime.date

    def nth(month, weekday, n):
        first = d(y, month, 1)
        return first + datetime.timedelta(days=(weekday - first.weekday()) % 7 + 7 * (n - 1))

    def last(month, weekday):
        nxt = d(y + (month == 12), month % 12 + 1, 1) - datetime.timedelta(days=1)
        return nxt - datetime.timedelta(days=(nxt.weekday() - weekday) % 7)

    def obs(x):
        return x - datetime.timedelta(days=1) if x.weekday() == 5 else x + datetime.timedelta(days=1) if x.weekday() == 6 else x
    return [("New Year's Day", obs(d(y, 1, 1))), ('Martin Luther King Jr. Day', nth(1, 0, 3)),
            ("Washington's Birthday", nth(2, 0, 3)), ('Memorial Day', last(5, 0)), ('Juneteenth', obs(d(y, 6, 19))),
            ('Independence Day', obs(d(y, 7, 4))), ('Labor Day', nth(9, 0, 1)), ('Columbus Day', nth(10, 0, 2)),
            ('Veterans Day', obs(d(y, 11, 11))), ('Thanksgiving Day', nth(11, 3, 4)), ('Christmas Day', obs(d(y, 12, 25)))]


def work_year(y):
    days = [datetime.date(y, 1, 1) + datetime.timedelta(days=i) for i in range((datetime.date(y + 1, 1, 1) - datetime.date(y, 1, 1)).days)]
    weekdays = [x for x in days if x.weekday() < 5]
    hol = {x for yy in (y, y + 1) for _, x in us_holidays(yy) if x.year == y and x.weekday() < 5}
    return len(weekdays), len(hol), len(weekdays) - len(hol)


def table_hours_year():
    rows = []
    for y in range(2025, 2031):
        wd, h, w = work_year(y)
        rows.append((y, wd, h, w, f'{wd * 8:,}', f'{w * 8:,}'))
    return table(['Year', 'Weekdays', 'Federal holidays on weekdays', 'Working days', 'Hours (all weekdays × 8)', 'Hours without holidays'], rows)


def table_holidays(y):
    rows = [(n, x.strftime('%A, %B %d').replace(' 0', ' ')) for n, x in us_holidays(y)]
    return table(['Holiday', f'{y} (observed)'], rows)


def expand_placeholders(body, page, pages):
    body = re.sub(r'\[\[timecard (\d+)\]\]', lambda m: timecard_form(int(m.group(1))), body)
    for name, fn in (('chart_min_dec', chart_min_dec), ('chart_dec_min', chart_dec_min), ('chart_military', chart_military),
                     ('table_h2s', table_h2s), ('table_s2h', table_s2h), ('table_hours_year', table_hours_year)):
        if f'[[{name}]]' in body:
            body = body.replace(f'[[{name}]]', fn())
    body = re.sub(r'\[\[table_holidays (\d{4})\]\]', lambda m: table_holidays(int(m.group(1))), body)
    body = body.replace('[[calcs_by_category]]', calcs_by_category(pages))
    body = body.replace('[[calc_grid]]', calc_grid(pages))
    body = re.sub(r'\[\[calc_grid:(\w+)\]\]', lambda m: calc_grid(pages, m.group(1), exclude=page['key']), body)
    body = body.replace('[[guides]]', guides_grid(pages))
    body = body.replace('[[guides_by_category]]', guides_by_category(pages))
    body = re.sub(r'\[\[guides:(\d+)\]\]', lambda m: guides_grid(pages, int(m.group(1))), body)
    body = body.replace('[[sitemap]]', sitemap_block(pages))
    body = body.replace('[[email]]', f'<a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a>')
    return body


# ---------------------------------------------------------------- layout

def head_html(page, title_full, canonical):
    m = page['meta']
    noindex = m.get('noindex') == 'true'
    lines = [
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        f'<title>{esc(title_full)}</title>',
        f'<meta name="description" content="{esc(m["description"])}">',
        '<meta name="robots" content="noindex, follow">' if noindex else f'<link rel="canonical" href="{canonical}">',
        '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
        '<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">',
        '<meta name="theme-color" content="#ffffff">',
        f'<meta property="og:site_name" content="{SITE_NAME}">',
        '<meta property="og:locale" content="en_US">',
        f'<meta property="og:type" content="{"article" if m["type"] == "guide" else "website"}">',
        f'<meta property="og:title" content="{esc(m.get("og_title", m["h1"]))}">',
        f'<meta property="og:description" content="{esc(m["description"])}">',
        f'<meta property="og:url" content="{canonical}">',
        f'<meta property="og:image" content="{SITE_URL}/assets/img/og.png">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta name="twitter:card" content="summary_large_image">',
    ]
    if BING_VERIFY and m['type'] == 'home':
        lines.append(f'<meta name="msvalidate.01" content="{esc(BING_VERIFY)}">')
    if PINTEREST_VERIFY and m['type'] == 'home':
        lines.append(f'<meta name="p:domain_verify" content="{esc(PINTEREST_VERIFY)}">')
    if GA_ID:
        regions = json.dumps(CONSENT_REGIONS)
        lines += [
            '<link rel="dns-prefetch" href="https://www.googletagmanager.com">',
            '<script>'
            'window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}'
            "gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',"
            f"analytics_storage:'denied',region:{regions},wait_for_update:500}});"
            "gtag('consent','default',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',"
            "analytics_storage:'granted'});"
            "gtag('js',new Date());gtag('config','" + GA_ID + "');"
            # Analytics loads after the page has rendered so it doesn't compete with the calculator.
            "addEventListener('load',function(){setTimeout(function(){var s=document.createElement('script');"
            "s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=" + GA_ID + "';document.head.appendChild(s);},1200);});"
            '</script>',
        ]
    if ADSENSE_CLIENT and m.get('ads', 'true') != 'false':
        lines.append(f'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={ADSENSE_CLIENT}" crossorigin="anonymous"></script>')
    lines.append(f'<style>{CSS}</style>')
    return '\n'.join(lines)


def breadcrumb_items(page, pages):
    m = page['meta']
    items = [('Home', '/')]
    if m['type'] == 'calculator':
        items.append((CATEGORIES[m['category']][0], f'{pages["calculators"]["url"]}#cat-{m["category"]}'))
    elif m['type'] == 'guide':
        items.append(('Guides', pages['guides']['url']))
    items.append((m.get('crumb', m['h1']), page['url']))
    return items


def breadcrumbs_html(page, pages):
    items = breadcrumb_items(page, pages)
    parts = [f'<li aria-current="page">{esc(n)}</li>' if i == len(items) - 1 else f'<li><a href="{u}">{esc(n)}</a></li>'
             for i, (n, u) in enumerate(items)]
    return f'<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>{"".join(parts)}</ol></nav>'


def structured_data(page, pages, canonical, words):
    m = page['meta']
    blocks = []
    publisher = {'@type': 'Organization', 'name': SITE_NAME, 'url': SITE_URL + '/',
                 'logo': {'@type': 'ImageObject', 'url': f'{SITE_URL}/assets/img/logo-512.png'}}
    if m['type'] == 'home':
        blocks.append({'@context': 'https://schema.org', '@type': 'WebSite', 'name': SITE_NAME, 'url': SITE_URL + '/',
                       'inLanguage': 'en-US', 'publisher': publisher})
    if m['type'] == 'calculator':
        blocks.append({'@context': 'https://schema.org', '@type': 'WebApplication', 'name': m['card_title'],
                       'url': canonical, 'description': m['description'], 'applicationCategory': 'UtilitiesApplication',
                       'operatingSystem': 'Any', 'browserRequirements': 'Requires JavaScript',
                       'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'}, 'inLanguage': 'en-US'})
    if m['type'] == 'guide':
        blocks.append({'@context': 'https://schema.org', '@type': 'Article', 'headline': m['h1'],
                       'description': m['description'], 'inLanguage': 'en-US',
                       'datePublished': m['published'], 'dateModified': m.get('updated', m['published']),
                       'author': {'@type': 'Person', 'name': AUTHOR_NAME, 'url': SITE_URL + pages['about']['url']},
                       'publisher': publisher, 'mainEntityOfPage': canonical, 'wordCount': words})
    if m['type'] != 'home':
        blocks.append({'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': SITE_URL + u}
            for i, (n, u) in enumerate(breadcrumb_items(page, pages))]})
    return '\n'.join(f'<script type="application/ld+json">{json.dumps(b, ensure_ascii=False)}</script>' for b in blocks)


def header_html(page, pages):
    active = page['meta'].get('nav', '')
    groups = []
    for cat, (name, _) in CATEGORIES.items():
        items = calc_pages(pages, cat)
        if items:
            groups.append(f'<div class="dd-group"><p class="dd-h">{esc(name)}</p>' + ''.join(
                f'<a href="{p["url"]}" class="dd-item">{icon(p["meta"].get("icon", "calc"))}<span>{esc(p["meta"]["card_title"])}</span></a>'
                for p in items) + '</div>')

    def cls(key):
        return ' class="is-active"' if key == active else ''
    return f'''<header class="site-header">
  <div class="container header-inner">
    <a class="logo" href="/">{LOGO}<span>WorkHour<b>Math</b></span></a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav">{icon('menu')}<span class="sr-only">Menu</span></button>
    <nav class="site-nav" id="site-nav" aria-label="Main">
      <div class="nav-dd">
        <button class="nav-dd-btn{' is-active' if active == 'calculators' else ''}" aria-expanded="false">Calculators {icon('chevron', 'icon icon-sm')}</button>
        <div class="nav-dd-panel">{''.join(groups)}<a class="dd-all" href="{pages['calculators']['url']}">All calculators {icon('arrow', 'icon icon-sm')}</a></div>
      </div>
      <a href="{pages['guides']['url']}"{cls('guides')}>Guides</a>
      <a href="{pages['about']['url']}"{cls('about')}>About</a>
    </nav>
  </div>
</header>'''


def footer_html(pages):
    year = datetime.date.today().year
    cols = []
    for cat, (name, _) in CATEGORIES.items():
        items = calc_pages(pages, cat)
        if items:
            cols.append(f'<div><h2 class="footer-h">{esc(name)}</h2><ul>' + ''.join(
                f'<li><a href="{p["url"]}">{esc(p["meta"]["card_title"])}</a></li>' for p in items) + '</ul></div>')
    site_links = [('about', 'About'), ('methodology', 'How we calculate'), ('contact', 'Contact'),
                  ('privacy', 'Privacy Policy'), ('terms', 'Terms of Use'), ('sitemap-page', 'Sitemap')]
    site = ''.join(f'<li><a href="{pages[k]["url"]}">{n}</a></li>' for k, n in site_links if k in pages)
    return f'''<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <a class="logo logo-invert" href="/">{LOGO}<span>WorkHour<b>Math</b></span></a>
      <p>Free calculators for time cards, hours worked, overtime and pay &mdash; with the math shown.</p>
    </div>
    {''.join(cols)}
    <div><h2 class="footer-h">{SITE_NAME}</h2><ul>{site}</ul></div>
  </div>
  <div class="container footer-bottom">
    <p>&copy; {year} {SITE_NAME}. For information only &mdash; not legal or payroll advice. Check your employer&rsquo;s policy and your state&rsquo;s labor laws.</p>
  </div>
</footer>'''


def related_html(page, pages):
    keys = [s.strip() for s in page['meta'].get('related', '').split(',') if s.strip()]
    cards = []
    for k in keys:
        if k not in pages:
            sys.exit(f'Unknown related page {k} in {page["key"]}')
        p = pages[k]
        cards.append(calc_card(p) if p['meta']['type'] == 'calculator' else guide_card(p))
    if not cards:
        return ''
    return (f'<section class="related"><div class="container"><h2 data-notoc>Related</h2>'
            f'<div class="calc-grid related-{len(cards)}">{"".join(cards)}</div></div></section>')


def author_line(page, pages, minutes=None):
    m = page['meta']
    upd = m.get('updated') or m.get('published')
    bits = [f'By <a href="{pages["about"]["url"]}">{AUTHOR_NAME}</a>']
    if upd:
        bits.append(f'Updated <time datetime="{upd}">{fmt_date(upd)}</time>')
    if minutes:
        bits.append(f'{minutes} min read')
    bits.append(f'<a href="{pages["methodology"]["url"]}">How we calculate</a>')
    return '<p class="byline">' + ' &middot; '.join(bits) + '</p>'


def render(page, pages, ver):
    m = page['meta']
    kind = m['type']
    body = resolve_links(page['body'], pages, page['key'])
    body = expand_placeholders(body, page, pages)
    body, toc = add_heading_ids(body)
    minutes, words = reading_time(body)
    canonical = SITE_URL + page['url']
    title_full = m['title'] if m.get('title_exact') == 'true' or len(m['title']) + len(SITE_NAME) + 3 > 65 \
        else f'{m["title"]} | {SITE_NAME}'
    toc_html = ''
    if toc and kind in ('calculator', 'guide') and m.get('toc', 'true') != 'false':
        toc_html = ('<details class="toc"><summary>On this page</summary><ol>'
                    + ''.join(f'<li><a href="#{hid}">{esc(txt)}</a></li>' for hid, txt in toc) + '</ol></details>')

    if kind == 'calculator':
        # The page body holds two parts separated by <!-- content -->: the tool, then the article.
        tool, _, article = body.partition('<!-- content -->')
        main = f'''<main id="main" class="calc-main">
  <section class="calc-hero">
    <div class="container">
      {breadcrumbs_html(page, pages)}
      <h1>{m['h1']}</h1>
      <p class="lead">{m['lead']}</p>
    </div>
  </section>
  <div class="container">
{tool}
  </div>
  <div class="container narrow content-wrap">
    {author_line(page, pages)}
    {toc_html}
    <div class="prose">
{article}
    </div>
  </div>
  {related_html(page, pages)}
</main>'''
    elif kind == 'guide':
        main = f'''<main id="main" class="guide-main">
  <div class="container narrow">
    {breadcrumbs_html(page, pages)}
    <header class="page-header">
      <h1>{m['h1']}</h1>
      <p class="lead">{m['lead']}</p>
      {author_line(page, pages, minutes)}
    </header>
    {toc_html}
    <div class="prose">
{body}
    </div>
  </div>
  {related_html(page, pages)}
</main>'''
    elif kind == 'home':
        main = f'<main id="main" class="home-main">\n{body}\n</main>'
    else:
        crumbs = '' if kind == '404' else breadcrumbs_html(page, pages)
        width = '' if m.get('width') == 'wide' else 'narrow'
        main = f'''<main id="main" class="page-main">
  <div class="container {width}">
    {crumbs}
    <header class="page-header">
      <h1>{m['h1']}</h1>
      {f'<p class="lead">{m["lead"]}</p>' if m.get('lead') else ''}
    </header>
    <div class="{'prose' if m.get('prose', 'true') == 'true' else ''}">
{body}
    </div>
  </div>
</main>'''

    scripts = [f'<script src="/assets/js/site.js?v={ver}" defer></script>']
    for s in [x.strip() for x in m.get('script', '').split(',') if x.strip()]:
        scripts.append(f'<script src="/assets/js/calc/{s}.js?v={ver}" defer></script>')
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
{head_html(page, title_full, canonical)}
{structured_data(page, pages, canonical, words)}
</head>
<body class="page-{kind}">
<a class="skip-link" href="#main">Skip to content</a>
{header_html(page, pages)}
{main}
{footer_html(pages)}
{chr(10).join(scripts)}
</body>
</html>
'''


def sitemap_xml(pages):
    urls = []
    for p in sorted(pages.values(), key=lambda p: p['url']):
        m = p['meta']
        if m.get('noindex') == 'true':
            continue
        lastmod = m.get('updated') or m.get('published') or datetime.date.today().isoformat()
        urls.append(f'  <url>\n    <loc>{SITE_URL}{p["url"]}</loc>\n    <lastmod>{lastmod}</lastmod>\n  </url>')
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + '\n'.join(urls) + '\n</urlset>\n')


def check_required(pages):
    for key, p in pages.items():
        m = p['meta']
        missing = {'h1', 'title', 'description'} - set(m)
        if m['type'] == 'calculator':
            missing |= {'category', 'card_title', 'card_desc', 'lead', 'updated'} - set(m)
            if m.get('category') not in CATEGORIES:
                sys.exit(f'{key}: unknown category {m.get("category")}')
            if '<!-- content -->' not in p['body']:
                sys.exit(f'{key}: calculator page needs a <!-- content --> separator')
        if m['type'] == 'guide':
            missing |= {'published', 'updated', 'lead'} - set(m)
        if missing:
            sys.exit(f'{key} is missing: {", ".join(sorted(missing))}')
        if len(m['title']) > 65:
            print(f'  note: long <title> ({len(m["title"])} chars) on {key}')
        if not 70 <= len(m['description']) <= 160:
            print(f'  note: description length {len(m["description"])} on {key}')


CSS = ''


def main():
    global CSS
    pages = load_pages()
    for k in ('index', 'calculators', 'guides', 'about', 'methodology'):
        if k not in pages:
            sys.exit(f'Required page _src/{k}.html is missing')
    check_required(pages)
    CSS = inline_css()
    ver = asset_version()
    written = set()
    for page in pages.values():
        os.makedirs(os.path.dirname(page['out']), exist_ok=True)
        with open(page['out'], 'w', encoding='utf-8', newline='\n') as f:
            f.write(render(page, pages, ver))
        written.add(os.path.relpath(page['out'], ROOT).replace(os.sep, '/'))
    with open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(sitemap_xml(pages))
    with open(os.path.join(ROOT, 'robots.txt'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(f'User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n')
    stale = []
    for dp, dn, fn in os.walk(ROOT):
        dn[:] = [d for d in dn if not d.startswith(('.', '_')) and d != 'assets']
        for f in fn:
            if f.endswith('.html'):
                rel = os.path.relpath(os.path.join(dp, f), ROOT).replace(os.sep, '/')
                if rel not in written:
                    stale.append(rel)
    print(f'Built {len(pages)} pages (assets v={ver}).')
    for s in sorted(stale):
        print('  not produced by the build:', s)


if __name__ == '__main__':
    main()
