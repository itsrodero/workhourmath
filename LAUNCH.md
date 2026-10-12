# Launch checklist — WorkHourMath

Same process as SizeMyProject (see that repo's LAUNCH.md for details).

1. Domain: workhourmath.com bought at Namecheap on 2026-10-12 (user). WHOIS privacy on.
2. Repo: github.com/itsrodero/workhourmath (public), GitHub Pages from `main` / root, `CNAME` = workhourmath.com.
3. GitHub Pages domain verification: TXT `_github-pages-challenge-itsrodero.workhourmath.com`.
4. Namecheap Advanced DNS:
   - A `@` → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   - CNAME `www` → itsrodero.github.io
   - TXT for Google Search Console (Domain property)
   - Email forwarding `hello@workhourmath.com` → owner's inbox.
5. Enforce HTTPS once the certificate is issued.
6. Search Console (same Google account as the other sites): Domain property, submit sitemap, request indexing.
7. Analytics: new GA4 property in the same account; set `GA_ID` in `_tools/build.py`.
8. Bing Webmaster Tools: import from Search Console. IndexNow: `python _tools/indexnow.py`.
9. AdSense later, when the site is ready on its own: ads.txt, Google CMP, `ADSENSE_CLIENT`, privacy policy.
