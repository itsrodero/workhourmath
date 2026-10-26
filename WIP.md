# WorkHourMath — work in progress

Third site of the AdSense business (niche research 2026-10-12, see `Desktop/WEBS/tercera-web-investigacion.md`):
free work-hours and pay calculators for US hourly workers, managers and small businesses. English only.
Domain workhourmath.com (Namecheap, bought 2026-10-12), hosted on GitHub Pages from this public repo.

## How it works
- Same builder as SizeMyProject: edit pages in `_src/*.html` (front matter + body), guides in `_src/guides/`,
  then `python _tools/build.py` writes the HTML at the repo root, sitemap.xml and robots.txt.
- Calculator pages: tool markup, then `<!-- content -->`, then the article. Shared helpers live in
  `assets/js/site.js` as `window.WHM` (time math, overtime rules, US federal holidays, URL + local storage
  state, copy / CSV / print). One script per calculator in `assets/js/calc/`.
- Builder placeholders: `[[timecard 7]]` / `[[timecard 14]]` (time card form), `[[chart_min_dec]]`,
  `[[chart_dec_min]]`, `[[chart_military]]`, `[[table_h2s]]`, `[[table_s2h]]`, `[[table_hours_year]]`,
  `[[table_holidays 2027]]` — numeric tables are generated so they can't contain arithmetic slips.
- Images: `_tools/img/*.html` rendered with headless Chrome (`--screenshot`) to `assets/img/`.
- After publishing pages: `python _tools/indexnow.py page.html ...` (no arguments = whole sitemap).

## Done
- v1.0 (2026-10-12): 15 calculators in 4 categories and 4 guides.
  - Time cards & hours: time card (weekly), biweekly time card, hours between times, add time, time clock rounding.
  - Pay & overtime: overtime, hourly to salary, salary to hourly, pay raise, shift differential.
  - Time conversions: minutes to decimal (chart), decimal to hours and minutes (chart), military time (chart).
  - Workdays & time off: work days between dates (federal holidays), PTO accrual.
  - Guides: how to calculate hours worked, overtime rules by state, how many work hours in a year,
    biweekly vs semimonthly pay.
  - Overtime rules modelled: federal 40/week, California (8/12 daily, 7th day), Alaska (8 daily), Colorado (12 daily).
  - Every calculator tested in the browser against its worked example; no horizontal overflow at 375 px.

## Launch (2026-10-12, same evening the domain was bought)
- GitHub repo itsrodero/workhourmath (public), Pages from main / root; domain verified for the account
  (TXT `_github-pages-challenge-itsrodero`); HTTPS certificate issued and Enforce HTTPS on; http and www
  redirect to https://workhourmath.com/.
- Namecheap DNS: 4 A records for `@`, CNAME `www` → itsrodero.github.io, TXT for GitHub and for Google.
  Parking CNAME and URL redirect removed. WHOIS privacy (WithheldForPrivacy) on; domain auto-renew on.
- Email: `hello@workhourmath.com` forwards to the roderolabs Gmail inbox (Namecheap Redirect Email).
- Search Console: Domain property `sc-domain:workhourmath.com` (Google account of Chrome authuser 2), verified
  by DNS; sitemap submitted. Indexing requested for 10 URLs: home, time card, hours, minutes to decimal,
  overtime, hourly to salary, military time, biweekly time card, calculators hub, add time.
- Analytics: property "WorkHourMath" (ID 558618157) in the same GA account, web stream measurement ID
  G-CFG1L4ENQ3; event retention 14 months; consent mode as on the other sites.
- Bing Webmaster Tools: added manually (GSC import didn't list it yet), verified with the msvalidate.01 meta
  tag (`BING_VERIFY` in build.py); sitemap submitted. IndexNow: whole sitemap submitted (202).

- Indexing 2026-10-13 (15:00): /decimal-to-hours-calculator.html OK, then "Cuota superada" — the quota is per
  Google account (shared with the other sites), roughly 10 per rolling 24 h; yesterday's 10 (~20:30) free up tonight.
- Indexing 2026-10-13 (20:32, after the quota freed): time clock rounding, salary to hourly, pay raise, shift
  differential, PTO, work days and the 4 guides — all OK. Still to request (6): guides hub, about, methodology,
  contact, privacy, terms (sitemap page low priority).

- 2026-10-14: Timesheet Templates page — downloadable weekly and biweekly Excel timesheets (formulas for lunch,
  overnight shifts, weekly overtime per workweek, gross pay; blank + Example tab; built by `_tools/timesheet_xlsx.py`
  with openpyxl into assets/files/, formulas verified with pycel: 44.5 h → $864.88; biweekly 89 h → $1,729.75)
  and a printable blank weekly/biweekly timesheet (dates from a start date; name field not saved). 16 tools.

- Indexing 2026-10-14 (~21:20): guides hub, about, methodology, contact; 2026-10-15 (21:22): privacy, terms.
  Every URL in the sitemap has now been requested (sitemap page skipped, low priority). First impressions in
  Search Console reported on 10-15.

- 2026-10-19: Semi-Monthly Time Card Calculator (from Search Console: the home page ranked ~5.7 for "semi monthly
  timesheet calculator" with no page for it).
  - 1st–15th / 16th–end with dated rows (13–16), and the current period by default.
  - Overtime per workweek, plus "hours already worked earlier in the first workweek" for weeks split across
    periods. `WHM.overtime(days, rule, startRun)` takes that starting point.
  - Notes on weeks that continue into the next period (29 CFR 778.106).
  - Weekday and hour tables for each half-month of 2027 (and 2026 collapsed); generator `[[table_semimonthly YYYY]]`.
  - Worked example tested in the browser: 88 h, 86 regular + 2 OT, $1,780.
  - Timecards order shifted; linked from the biweekly page and the biweekly vs semimonthly guide.

- 2026-10-21: Double Time Calculator. The home page had ranked ~6 for "double time calculator" with no page for it.
  - Two modes: (a) totals (regular / 1.5x / double-time hours, multiplier 2x, 2.5x or 3x); (b) daily hours with
    California rules via `WHM.overtime(days, 'ca')` (over 8 = 1.5x, over 12 = 2x, 7th consecutive day).
  - Both worked examples ($1,200; CA $1,462.50) and the 7th-day case ($1,550) tested in the browser.
  - Linked from the overtime calculator. Pay pages reordered (double time is 2nd).
  - The user's own time now goes mostly to Leafpost (separate chat). WHM cadence raised to ~2 pieces a week.

- 2026-10-26: DE-INDEXING. From 10-23 Google dropped almost the whole site: impressions went from ~400/day to 0–1.
  URL Inspection shows 27 "Crawled - currently not indexed"; only the home page and guides hub remain. There is no
  manual action or security issue, and the technical side is fine. Likely a quality/trust decision on a 2-week-old
  domain that launched with ~30 pages.
  - Agreed with the user: no new pages for 2–3 weeks, no mass re-requests; improve existing pages with information
    other sites don't have; watch it every Monday.
  - First improvement: a generated common-shifts chart on the hours calculator (`[[table_shifts]]`). It covers 36
    shifts in 12-hour and 24-hour time, with no break, 30-minute and 1-hour breaks, overnight wrap, plus an FAQ on
    "0900 to 1700". The time card links to it.

## Pinterest (prepared 2026-10-19)
- Own business profile, separate from SizeMyProject's. The user creates it the evening of 10-19 (same Pinterest login,
  "add account").
- 24 pins in `assets/img/pins/`:
  - 3 printable charts (minutes to decimal, military time, decimal to minutes) whose image is the chart itself
    (template `_tools/img/pin-chart.html`);
  - 17 calculators and 4 guides (template `_tools/img/pin.html`).
  - Regenerate with `python _tools/pins.py --start DATE`, then `node _tools/pins.mjs` (`--all` to redo).
- `_tools/pinterest-pins.csv`: 3 pins/day at 15:00, 19:00 and 23:00 from 2026-10-21 to 10-28.
- 4 boards: Time Cards & Timesheets; Overtime, Salary & Pay Calculators; Printable Time Conversion Charts;
  Work Days, Holidays & PTO.
- 2026-10-19 (evening), all done:
  - The user created the profile (email hello@workhourmath.com, username `workhourmath`).
  - I set the bio, website and logo photo.
  - workhourmath.com claimed ("Conectado"); `PINTEREST_VERIFY` set in build.py.
  - The 4 boards created.
  - CSV uploaded (Settings > Import content > Upload .csv): "Carga exitosa". The 24 pins go out from 2026-10-21.
  - Switch profiles from the avatar menu (top right); both profiles share one Pinterest login.

## Pinterest round 2 (2026-10-26)
- 25 pins from 2026-10-29 to 11-06, 3 a day:
  - 3 new chart pins: common shifts, 2027 federal holidays, 2027 semi-monthly periods;
  - 22 calculators and guides with the dark template `_tools/img/pin2.html` (images in `assets/img/pins/r2/`).
- Generator: `python _tools/pins.py --round 2 --start DATE`, then `node _tools/pins.mjs --round 2`.
  CSV: `_tools/pinterest-pins-r2.csv`.

## Rules to keep
- No tax / net-pay calculators (YMYL, dominated by ADP/SmartAsset).
- Law pages cite DOL / state sources, carry an "updated" date and say "not legal advice". Re-check yearly.

## Next
1. Launch (see LAUNCH.md): GitHub Pages + DNS + HTTPS, Search Console, Analytics, Bing, IndexNow.
2. More calculators: hours between dates and times, lunch break calculator, double time, holiday pay,
   timesheet template (printable / Excel), weekly hours, paycheck hours for semimonthly periods, FTE.
3. More guides: meal and rest break laws by state (verify each state), exempt vs non-exempt,
   how to read a paystub's hours, decimal hours chart (printable).
4. AdSense when ready on its own (most pages indexed + some organic visits).
