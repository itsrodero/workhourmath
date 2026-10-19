#!/usr/bin/env python3
"""
Pinterest pins for WorkHourMath (its own business profile, separate from SizeMyProject's).

    python _tools/pins.py --start 2026-10-21   # writes _tools/pins.json and _tools/pinterest-pins.csv
    node _tools/pins.mjs                       # renders the missing pin images into assets/img/pins/
    node _tools/pins.mjs --all                 # re-renders every image

One vertical pin (1000x1500) per calculator and guide (template img/pin.html), plus printable-chart pins whose
image is the chart itself (img/pin-chart.html). The CSV follows Pinterest's "Bulk upload Pins" help article
(Title, Media URL, Pinterest board, Thumbnail — empty for images —, Description, Link, Publish date, Keywords).
Upload it in Pinterest: Settings > Import content > Upload .csv or .txt file. The images must be live on the
site first, because Pinterest fetches them by URL.
"""
import csv
import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B  # noqa: E402

# One board per site category.
BOARDS = {
    'timecards': 'Time Cards & Timesheets',
    'pay': 'Overtime, Salary & Pay Calculators',
    'convert': 'Printable Time Conversion Charts',
    'dates': 'Work Days, Holidays & PTO',
}
# The question people type into Pinterest search, used as the headline of calculator pins.
HOOKS = {
    'time-card-calculator': 'How many hours did I work this week?',
    'biweekly-time-card-calculator': 'How many hours on my biweekly paycheck?',
    'semi-monthly-time-card-calculator': 'Hours for a 1st–15th pay period?',
    'hours-calculator': 'How many hours between two times?',
    'add-time-calculator': 'How do I add up hours and minutes?',
    'time-clock-rounding-calculator': 'How does time clock rounding work?',
    'timesheet-template': 'Free timesheet template: Excel & printable',
    'minutes-to-decimal-calculator': 'How do I turn minutes into decimal hours?',
    'decimal-to-hours-calculator': 'What is 7.75 hours in hours and minutes?',
    'military-time-converter': 'What time is 1700 in military time?',
    'overtime-calculator': 'How much is my overtime pay?',
    'hourly-to-salary-calculator': 'What is $20 an hour per year?',
    'salary-to-hourly-calculator': 'What is my salary per hour?',
    'pay-raise-calculator': 'What will I earn after a raise?',
    'shift-differential-calculator': 'How much is my night shift differential?',
    'pto-accrual-calculator': 'How much PTO will I earn?',
    'work-days-calculator': 'How many work days between two dates?',
}
PRIORITY = ['timecards', 'convert', 'pay', 'dates']
PINS_PER_DAY = 3
# Account time: 15:00–23:00 in Spain is morning to evening across US time zones.
TIMES = ['15:00', '19:00', '23:00']


def clip(text, n):
    text = ' '.join(text.split())
    return text if len(text) <= n else text[:n - 1].rsplit(' ', 1)[0] + '…'


def keywords(m, label):
    words = [m['card_title'].lower()] if m.get('card_title') else []
    words += [w.strip().lower() for w in label.replace('&', ',').split(',') if w.strip()]
    words += ['hourly workers', 'payroll']
    return ', '.join(dict.fromkeys(words))


def military(h):
    ampm = 'AM' if h < 12 else 'PM'
    return f'{(h % 12) or 12}:00 {ampm}', f'{h:02d}00'


def charts():
    """Printable charts: the image shows the whole chart, the link goes to the page that has it."""
    return [
        {'name': 'chart-minutes-to-decimal', 'page': 'minutes-to-decimal-calculator',
         'headline': 'Minutes to Decimal Hours Chart', 'sub': '1 to 60 minutes, for timesheets and payroll',
         'label': 'Minutes|Decimal', 'rows': [[f'{m} min', f'{m / 60:.2f}'] for m in range(1, 61)],
         'title': 'Minutes to Decimal Hours Chart (1–60 minutes) – Free Printable',
         'description': 'Free printable chart converting 1 to 60 minutes into decimal hours for timesheets and payroll — 15 minutes = 0.25, 30 = 0.50, 45 = 0.75. Plus a free minutes-to-decimal calculator. WorkHourMath.'},
        {'name': 'chart-military-time', 'page': 'military-time-converter',
         'headline': 'Military Time Chart', 'sub': '24-hour clock next to regular AM/PM time',
         'label': 'Regular|Military', 'rows': [list(military(h)) for h in range(24)],
         'title': 'Military Time Chart – 24-Hour Clock Conversion (Free Printable)',
         'description': 'Free printable military time chart: every hour of the day in regular AM/PM time and 24-hour military time — 1:00 PM = 1300, 5:00 PM = 1700, midnight = 0000. Plus a free military time converter. WorkHourMath.'},
        {'name': 'chart-decimal-to-minutes', 'page': 'decimal-to-hours-calculator',
         'headline': 'Decimal Hours to Minutes Chart', 'sub': 'Read payroll hours like 7.75 in hours and minutes',
         'label': 'Decimal|Minutes', 'rows': [[f'{d / 100:.2f} hr', f'{round(d * 0.6)} min'] for d in range(5, 101, 5)],
         'title': 'Decimal Hours to Minutes Chart – Payroll Time Conversion (Free)',
         'description': 'Free chart converting decimal hours to minutes: 0.25 hr = 15 min, 0.5 = 30 min, 0.75 = 45 min, and every step of 0.05. Read payroll hours at a glance. Plus a free decimal to hours calculator. WorkHourMath.'},
    ]


def main():
    pages = B.load_pages()
    calcs, guides = [], []
    for key, p in pages.items():
        m = p['meta']
        if m.get('type') not in ('calculator', 'guide'):
            continue
        cat = m.get('category', 'timecards')
        name = key.replace('/', '-')
        if m['type'] == 'calculator':
            head = HOOKS.get(p['slug'], B.strip_tags(m['h1']))
            title = f"{head} Free {m['card_title']}"
            cta, ic = ('Free templates' if p['slug'] == 'timesheet-template' else 'Free calculator'), m.get('icon', 'calc')
        else:
            head = B.strip_tags(m['h1']).strip()
            title, cta, ic = head, 'Read the guide', m.get('icon', 'calendar' if cat == 'dates' else 'clock')
        job = {
            'name': name, 'tpl': 'pin.html',
            'out': f'assets/img/pins/{name}.jpg',
            'headline': head, 'sub': m['card_desc'], 'label': B.CATEGORIES[cat][0], 'cta': cta,
            'icon': B.ICONS.get(ic, B.ICONS['calc']),
            'link': B.SITE_URL + p['url'], 'board': BOARDS[cat],
            'title': clip(title, 100),
            'description': clip(m['description'] + ' Free and no sign-up — WorkHourMath.', 500),
            'order': int(float(m.get('order', 99))), 'cat': cat,
            'keywords': keywords(m, B.CATEGORIES[cat][0]),
        }
        (calcs if m['type'] == 'calculator' else guides).append(job)

    chart_jobs = []
    for c in charts():
        page = pages[c['page']]
        chart_jobs.append({
            'name': c['name'], 'tpl': 'pin-chart.html', 'out': f"assets/img/pins/{c['name']}.jpg",
            'headline': c['headline'], 'sub': c['sub'], 'label': c['label'], 'cta': 'Free printable + calculator',
            'icon': '', 'rows': c['rows'], 'link': B.SITE_URL + page['url'], 'board': BOARDS['convert'],
            'title': clip(c['title'], 100), 'description': clip(c['description'], 500),
            'keywords': 'printable chart, ' + keywords(page['meta'], B.CATEGORIES['convert'][0]),
        })

    def interleave(items):
        by_cat = {c: [] for c in PRIORITY}
        for j in sorted(items, key=lambda j: j['order']):
            by_cat.setdefault(j['cat'], []).append(j)
        out = []
        while any(by_cat.values()):
            for c in list(by_cat):
                if by_cat[c]:
                    out.append(by_cat[c].pop(0))
        return out
    # Charts first (the most "pinnable"), then calculators alternating boards, then guides.
    jobs = chart_jobs + interleave(calcs) + interleave(guides)
    start = datetime.date.fromisoformat(sys.argv[sys.argv.index('--start') + 1]) if '--start' in sys.argv else datetime.date.today() + datetime.timedelta(days=1)
    for i, j in enumerate(jobs):
        day = start + datetime.timedelta(days=i // PINS_PER_DAY)
        j['publish'] = f'{day.isoformat()}T{TIMES[i % PINS_PER_DAY]}:00'

    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, 'pins.json'), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(jobs, f, ensure_ascii=False, indent=1)
    with open(os.path.join(here, 'pinterest-pins.csv'), 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f)
        w.writerow(['Title', 'Media URL', 'Pinterest board', 'Thumbnail', 'Description', 'Link', 'Publish date', 'Keywords'])
        for j in jobs:
            w.writerow([j['title'], B.SITE_URL + '/' + j['out'], j['board'], '', j['description'], j['link'], j['publish'], j['keywords']])
    print(f'{len(jobs)} pins ({len(chart_jobs)} charts, {len(calcs)} calculators, {len(guides)} guides); '
          f'publishing {jobs[0]["publish"][:10]} to {jobs[-1]["publish"][:10]}')


if __name__ == '__main__':
    main()
