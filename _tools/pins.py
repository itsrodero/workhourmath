#!/usr/bin/env python3
"""
Pinterest pins for WorkHourMath (its own business profile, separate from SizeMyProject's).

    python _tools/pins.py --start 2026-10-21   # writes _tools/pins.json and _tools/pinterest-pins.csv
    node _tools/pins.mjs                       # renders the missing pin images into assets/img/pins/
    node _tools/pins.mjs --all                 # re-renders every image
    python _tools/pins.py --round 2 --start 2026-10-29   # second round: pin2.html images in assets/img/pins/r2/,
    node _tools/pins.mjs --round 2                        # new charts and copy -> pins-r2.json, pinterest-pins-r2.csv

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


ROUND = 2 if '--round' in sys.argv and sys.argv[sys.argv.index('--round') + 1] == '2' else 1


def charts_r2():
    """Second-round charts: data people search for and save — shift lengths, 2027 holidays, 2027 semi-monthly periods."""
    def clock12(t):
        h, m = map(int, t.split(':'))
        return f"{(h % 12) or 12}{f':{m:02d}' if m else ''} {'AM' if h < 12 else 'PM'}"

    def mins(t):
        h, m = map(int, t.split(':'))
        return h * 60 + m
    picks = [('07:00', '15:00'), ('07:00', '15:30'), ('07:00', '16:00'), ('07:00', '19:00'), ('08:00', '16:00'), ('08:00', '16:30'),
             ('08:00', '17:00'), ('08:30', '17:00'), ('09:00', '17:00'), ('09:00', '17:30'), ('09:00', '18:00'), ('10:00', '18:00'),
             ('11:00', '19:00'), ('12:00', '20:00'), ('14:00', '22:00'), ('15:00', '23:00'), ('19:00', '07:00'), ('23:00', '07:00')]
    shift_rows = []
    for a, b in picks:
        span = (mins(b) - mins(a)) % 1440
        shift_rows.append([f'{clock12(a)} – {clock12(b)}', f'{span / 60:g} h · {(span - 30) / 60:g} h'])
    hol = [[n, x.strftime('%a, %b %d').replace(' 0', ' ')] for n, x in B.us_holidays(2027)]
    semi = []
    for mth in range(1, 13):
        last = (datetime.date(2027 + (mth == 12), mth % 12 + 1, 1) - datetime.timedelta(days=1)).day
        for a, b in ((1, 15), (16, last)):
            n = sum(1 for d in range(a, b + 1) if datetime.date(2027, mth, d).weekday() < 5)
            semi.append([datetime.date(2027, mth, a).strftime('%b ') + f'{a}–{b}', f'{n} days · {n * 8} h'])
    return [
        {'name': 'chart-common-shifts', 'page': 'hours-calculator', 'board': 'timecards',
         'headline': 'How Many Hours Is My Shift?', 'sub': 'Hours with no break · with a 30-minute lunch',
         'label': 'Shift|Hours', 'rows': shift_rows,
         'title': 'How Many Hours Is a Shift? 9 to 5, 7 to 3:30, 12-Hour Shifts – Chart',
         'description': 'Chart of common work shifts and the hours they add up to, with no break and with a 30-minute unpaid lunch: 9 to 5 is 8 hours (7.5 with lunch), 7 to 3:30 is 8.5 (8), 7 PM to 7 AM is 12 (11.5). Plus a free hours calculator. WorkHourMath.'},
        {'name': 'chart-federal-holidays-2027', 'page': 'work-days-calculator', 'board': 'dates',
         'headline': '2027 Federal Holidays', 'sub': 'Observed dates for US federal employees and most payrolls',
         'label': 'Holiday|2027 (observed)', 'rows': hol,
         'title': '2027 US Federal Holidays – Observed Dates (Printable List)',
         'description': "All 11 US federal holidays in 2027 with their observed dates — New Year's Day, MLK Day, Presidents Day, Memorial Day, Juneteenth, Independence Day, Labor Day, Columbus Day, Veterans Day, Thanksgiving and Christmas. Plus a free work days calculator. WorkHourMath."},
        {'name': 'chart-semimonthly-2027', 'page': 'semi-monthly-time-card-calculator', 'board': 'timecards',
         'headline': '2027 Semi-Monthly Pay Periods', 'sub': 'Weekdays and hours (8 h a day) in every half-month',
         'label': 'Pay period|Weekdays · hours', 'rows': semi,
         'title': '2027 Semi-Monthly Pay Periods – Workdays & Hours Chart',
         'description': 'Every 2027 semi-monthly pay period (1st–15th and 16th–end of month) with its number of weekdays and hours at 8 hours a day — from 72 to 96 hours. Plus a free semi-monthly time card calculator. WorkHourMath.'},
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
        sub = m['card_desc']
        if ROUND == 2:
            # Second round: fresh image and copy for the same pages.
            parts = B.strip_tags(m['title']).split(' – ', 1)
            head = parts[0].strip()
            sub = parts[1].strip() if len(parts) > 1 else m['card_desc']
            title = f'{head}: {sub}' if len(parts) > 1 else head
        job = {
            'name': name, 'tpl': 'pin2.html' if ROUND == 2 else 'pin.html',
            'out': f'assets/img/pins/r2/{name}.jpg' if ROUND == 2 else f'assets/img/pins/{name}.jpg',
            'headline': head, 'sub': sub, 'label': B.CATEGORIES[cat][0], 'cta': cta,
            'icon': B.ICONS.get(ic, B.ICONS['calc']),
            'link': B.SITE_URL + p['url'], 'board': BOARDS[cat],
            'title': clip(title, 100),
            'description': clip((m.get('lead') if ROUND == 2 and m.get('lead') else m['description']) + ' Free and no sign-up — WorkHourMath.', 500),
            'order': int(float(m.get('order', 99))), 'cat': cat,
            'keywords': keywords(m, B.CATEGORIES[cat][0]),
        }
        (calcs if m['type'] == 'calculator' else guides).append(job)

    chart_jobs = []
    for c in (charts_r2() if ROUND == 2 else charts()):
        page = pages[c['page']]
        chart_jobs.append({
            'name': c['name'], 'tpl': 'pin-chart.html', 'out': f"assets/img/pins/{c['name']}.jpg",
            'headline': c['headline'], 'sub': c['sub'], 'label': c['label'], 'cta': 'Free printable + calculator',
            'icon': '', 'rows': c['rows'], 'link': B.SITE_URL + page['url'], 'board': BOARDS[c.get('board', 'convert')],
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
    suffix = '-r2' if ROUND == 2 else ''
    with open(os.path.join(here, f'pins{suffix}.json'), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(jobs, f, ensure_ascii=False, indent=1)
    with open(os.path.join(here, f'pinterest-pins{suffix}.csv'), 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f)
        w.writerow(['Title', 'Media URL', 'Pinterest board', 'Thumbnail', 'Description', 'Link', 'Publish date', 'Keywords'])
        for j in jobs:
            w.writerow([j['title'], B.SITE_URL + '/' + j['out'], j['board'], '', j['description'], j['link'], j['publish'], j['keywords']])
    print(f'{len(jobs)} pins ({len(chart_jobs)} charts, {len(calcs)} calculators, {len(guides)} guides); '
          f'publishing {jobs[0]["publish"][:10]} to {jobs[-1]["publish"][:10]}')


if __name__ == '__main__':
    main()
