# Setting up the admin panel

The registration forms (Women's Meet, event booking, speaking invitations) still open WhatsApp exactly like before. This adds a second, silent step: each submission is also logged to a Google Sheet, which the admin panel at `/admin.html` reads from.

This takes about 10 minutes, one time.

## 1. Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank sheet. Name it something like "AJM Family Registrations."
2. In the menu, go to **Extensions → Apps Script**.
3. Delete the placeholder code in the editor, and paste in the entire contents of [`admin-tools/apps-script.gs`](admin-tools/apps-script.gs) from this repo.
4. Near the top of that pasted code, change this line to your own secret (any string you'll remember — this is the password for the admin panel):
   ```
   const ADMIN_KEY = 'ajm-2026-change-me';
   ```
5. Save the script (the disk icon, or Ctrl+S).

## 2. Deploy it as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**. The first time, Google will ask you to authorize the script — approve it (it's your own script, acting on your own sheet).
5. Copy the **Web app URL** it gives you — it looks like `https://script.google.com/macros/s/AKfycb.../exec`.

## 3. Wire the URL into the site

Send me that URL (and confirm the `ADMIN_KEY` you set), and I'll paste it into [`js/reglog.js`](js/reglog.js) and commit/push it. From then on:

- Every form submission gets logged to the sheet automatically, in addition to opening WhatsApp.
- Visit `https://ajmfamily.site/admin.html`, enter your `ADMIN_KEY`, and you'll see every registration in a searchable, filterable table.

## 4. Media office — Monthly Work Chart

`/media.html` is a private page for the media office: an online version of the paper Monthly Work Chart (Reel, Long Content, Sunday/Monday Flyer, Video Promo, T-Shirt Work, Other Work × days 1–31, with totals). It is saved in a new **MediaCharts** tab of the same Google Sheet, completely separate from the registrations.

To turn it on, update the script once:

1. Open the sheet → **Extensions → Apps Script**, and paste in the entire new contents of [`admin-tools/apps-script.gs`](admin-tools/apps-script.gs) (replace everything).
2. At the top, put your **existing** `ADMIN_KEY` back (the pasted file has a placeholder), and set the two new keys to secrets of your own:
   ```
   const MEDIA_KEY = '...';        // the whole media team uses this one
   const SUPERVISOR_KEY = '...';   // supervisor only: sees everyone's charts and approves them
   ```
3. Save, then **Deploy → Manage deployments → pencil icon → New version → Deploy**. (Don't use "New deployment" — it issues a different URL.)
4. Visit `https://ajmfamily.site/media.html` and log in with the media key (team) or the supervisor key.

How it works:

- **Team:** type your name, fill in the numbers (or ✓ / P / R / O) for each day, and it saves automatically. Press **Submit for approval** when the month is done — you can keep editing until it's approved.
- **Supervisor:** the **Team Overview** tab shows everyone's totals for the month. Type your name, then **Approve** a submitted chart. Approved charts are locked; **Unlock** puts one back to Submitted.
- **Total** = the numbers plus 1 for every ✓ (P, R and O don't count).
- **Print / Save as PDF** prints the chart in the same layout as the paper form, with the approval on the signature line. **Export CSV** (supervisor) gives the month's totals per person.
- The work types are listed in one line near the top of the script in `media.html` (`CATEGORIES`) if you ever want to add or rename one.

The media key and supervisor key don't open the registrations list, and the admin key doesn't open the media charts.

## Important limitations — please read

- **This is not bank-grade security.** The admin key is a simple shared password, not a real login system. Anyone who guesses or obtains the key can read the sheet's data through the Web App URL. Don't use this for anything more sensitive than names/phone numbers/RSVPs.
- The admin page isn't linked from the site and is excluded from search engines (`robots.txt` + `noindex`), but the URL itself isn't secret once shared — treat the key like a password and don't post it publicly.
- If you ever want to revoke access, just change `ADMIN_KEY` in the Apps Script and redeploy (**Deploy → Manage deployments → Edit → New version**).
- The Google Sheet itself is the real source of truth — you can always open it directly to view, sort, filter, or export the data with Google Sheets' own tools, no need to go through the admin panel.
