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
