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

`/media.html` is a private page for the media office: an online version of the paper Monthly Work Chart (Reel, Long Content, Sunday/Monday Flyer, Video Promo, T-Shirt Work, Other Work × days 1–31, with totals), plus a content list and a stock summary. **The whole team works on one shared chart per month** — one key, no names, no separate roles. Everything is saved in the same Google Sheet, in its own tabs (**MediaWork**, **MediaStock**, **MediaItems**), completely separate from the registrations.

To turn it on (or to update it — for example to add the Content Stock tab), update the script once. Existing tabs are upgraded automatically and keep everything already in them; until you update, the page still works, just without the newer features (older script: no Uploaded chart; script before the content list: no Content Stock tab or stock adjustments):

1. Open the sheet → **Extensions → Apps Script**, and paste in the entire contents of [`admin-tools/apps-script.gs`](admin-tools/apps-script.gs) (replace everything).
2. At the top, set the two keys — the pasted file has sample keys, and **the script refuses the sample keys** until you change them:
   ```
   const ADMIN_KEY = '...';   // your existing admin key — the one you already use for admin.html
   const MEDIA_KEY = '...';   // the one key the whole media team uses on media.html
   ```
3. Save, then **Deploy → Manage deployments → pencil icon → New version → Deploy**. (Don't use "New deployment" — it issues a different URL.)
4. Visit `https://ajmfamily.site/media.html` and log in with the media key.

How it works:

- **Everyone edits the same chart.** Pick the month, then type a number (or ✓ / P / R / O) in each day's box — changes save automatically and appear on everyone else's screen within a few seconds. If two people edit different boxes at the same moment, both are kept.
- **Submit month** stamps the submission date (Submission Date on the printed form). The team can still add to the chart afterwards; **Reopen month** clears the date.
- **Work done / Uploaded:** above the chart there are two views. *Work done* is the chart from the paper form. *Uploaded* is a second chart of the same shape — fill in how many of each type were uploaded (posted) on each day.
- **Total** = the numbers plus 1 for every ✓ (P, R and O don't count).
- **Today's column** is highlighted in gold, and under the chart it shows when the chart was **last updated**.
- **Content Stock** tab: the list of individual pieces the team has made — add a title, a type and (optionally) a link. Mark each piece **Ready**, **Uploaded** (and where: YouTube / Instagram / Facebook / WhatsApp / Other) or **Not needed**. The **Ready** filter is your "still to upload" list. You can search, filter by type, edit or remove a piece, and export the whole list as CSV. Only `http(s)` links become clickable.
- **Total Work** tab: your content stock across all months — for every work type, how many were **made**, how many **uploaded**, and how many are **left to upload**:

  ```
  Left to upload = Opening + Made − Uploaded − Not needed
  ```

  *Opening* is stock that existed before you started using the chart, and *Not needed* is content you decided not to post — both are editable boxes in the "Stock by type" table (they are saved right away in the **MediaStock** tab). If more was uploaded than recorded, the row shows 0 left with a warning. The last column compares "left to upload" with the pieces marked **Ready** in the Content Stock list, e.g. "3 to add", so you can see whether the list is complete. Below that, a month-by-month table you can filter by year. Export CSV gives one row per month and type.
- **Print / Save as PDF** prints the chart in the same layout as the paper form, with blank signature lines to sign by hand.
- The month/year that opens by default comes from Google's clock, so a wrong computer date can't open the wrong month.
- The work types are listed in one line near the top of the script in `media.html` (`CATEGORIES`) if you ever want to add or rename one.

The media key doesn't open the registrations list, and the admin key doesn't open the media chart. If an earlier version left a **MediaCharts** tab in the sheet, you can delete it — the new version uses **MediaWork**.

## 5. Meeting history — Send Zoom Link

In the admin panel, **Send Zoom Link** walks you through everyone marked *Confirmed*, one WhatsApp chat at a time. With the meeting history turned on, every send is also filed under a **meeting name**, so you can look back at exactly who was sent a meeting's link and who was skipped.

To turn it on, update the script once (an older script keeps working — sending still works, it just isn't saved, and the panel tells you so):

1. Open the sheet → **Extensions → Apps Script**, and paste in the entire contents of [`admin-tools/apps-script.gs`](admin-tools/apps-script.gs) (replace everything).
2. Retype your two keys at the top (the pasted file has sample keys, and **the script refuses the sample keys**):
   ```
   const ADMIN_KEY = '...';   // your existing admin key
   const MEDIA_KEY = '...';   // your existing media key
   ```
3. Save, then **Deploy → Manage deployments → pencil icon → New version → Deploy** (not "New deployment" — that changes the URL).

How it works:

- **Meeting name.** The Send Zoom Link window has a *Meeting name* box (it suggests one, e.g. "Women's Meet — 28 Sep 2026"). Type your own if you like, or pick an earlier one from the list to continue that meeting.
- **Select all / Clear.** Above the recipient list, *Select all* ticks everyone and *Clear* unticks everyone; the count shows how many are selected. You can still tick or untick people one by one.
- **Saved as you go.** Each time you press *Yes, sent* or *Skip*, that person's result is saved to the meeting straight away (in a **Meetings** tab of the sheet), so nothing is lost if you close the page half-way. *Stop* ends the run early. If a save fails, a **Retry** button appears.
- **Continuing a meeting.** Using the same meeting name again adds to it. People who were already sent that meeting's link are marked **✓ sent before** and left unticked, so you don't message anyone twice. Someone marked *sent* is never changed back to *skipped*.
- **History** (button at the top). Lists every meeting, newest first, with how many were sent and skipped. Open one to see the message and each person with their result and time. **Send to the rest** re-opens the send window for that meeting with the same message, for the confirmed people not yet sent it. **Export CSV** downloads that meeting's list.
- History only records names and phone numbers already in the registrations; it never changes or removes a registration. There's no delete button for meetings — if you ever need to remove a test meeting, delete its row in the **Meetings** tab of the sheet.

## Important limitations — please read

- **This is not bank-grade security.** The admin key is a simple shared password, not a real login system. Anyone who guesses or obtains the key can read the sheet's data through the Web App URL. Don't use this for anything more sensitive than names/phone numbers/RSVPs.
- The admin page isn't linked from the site and is excluded from search engines (`robots.txt` + `noindex`), but the URL itself isn't secret once shared — treat the key like a password and don't post it publicly.
- If you ever want to revoke access, just change `ADMIN_KEY` in the Apps Script and redeploy (**Deploy → Manage deployments → Edit → New version**).
- The Google Sheet itself is the real source of truth — you can always open it directly to view, sort, filter, or export the data with Google Sheets' own tools, no need to go through the admin panel.
