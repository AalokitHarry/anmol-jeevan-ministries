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

## 4. Media office — shared Content Log

`/media.html` is a private page for the media office: a shared **content log** (Reel, Long Content, Sunday/Monday Flyer, Video Promo, T-Shirt Work, Other Work × days 1–31, with totals), plus a content list and a stock summary. Its only purpose is to see **how much content there is — made, uploaded and still left to upload**. It is not a performance or work-tracking chart. **The whole team works on one shared log per month** — one key, no names, no separate roles. Everything is saved in the same Google Sheet, in its own tabs (**MediaWork**, **MediaStock**, **MediaItems**), completely separate from the registrations.

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

- **Everyone edits the same log.** Pick the month, then type a number (or ✓ / P / R / O) in each day's box — changes save automatically and appear on everyone else's screen within a few seconds. If two people edit different boxes at the same moment, both are kept.
- **Nobody is tracked.** The page and the script never store who typed or uploaded anything — only the counts, the time of the last change and an optional note. There are no names, no per-person totals, no approval or sign-off, and no submit step, so nothing can be used to compare colleagues. The log says so at the top of the page.
- **Made / Uploaded:** above the log there are two views. *Made* is how many pieces were finished each day. *Uploaded* is a second log of the same shape — fill in how many of each type were uploaded (posted) on each day.
- **Total** = the numbers plus 1 for every ✓ (P, R and O don't count).
- **Today's column** is highlighted in gold, and under the chart it shows when the chart was **last updated**.
- **Content Stock** tab: the list of individual pieces the team has made — add a title, a type and (optionally) a link. Mark each piece **Ready**, **Uploaded** (and where: YouTube / Instagram / Facebook / WhatsApp / Other) or **Not needed**. The **Ready** filter is your "still to upload" list. You can search, filter by type, edit or remove a piece, and export the whole list as CSV. Only `http(s)` links become clickable.
- **Stock Summary** tab: your content stock across all months — for every work type, how many were **made**, how many **uploaded**, and how many are **left to upload**:

  ```
  Left to upload = Opening + Made − Uploaded − Not needed
  ```

  *Opening* is stock that existed before you started using the chart, and *Not needed* is content you decided not to post — both are editable boxes in the "Stock by type" table (they are saved right away in the **MediaStock** tab). If more was uploaded than recorded, the row shows 0 left with a warning. The last column compares "left to upload" with the pieces marked **Ready** in the Content Stock list, e.g. "3 to add", so you can see whether the list is complete. Below that, a month-by-month table you can filter by year. Export CSV gives one row per month and type.
- **Print / Save as PDF** prints the month's log on one A4 landscape page. It has no signature or approval lines.
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

## 6. History & bulk actions — select, confirm, move to History, delete

The registrations list has a **checkbox on every row** (and a *Select all* box at the top of the list, or above the cards on a phone). Tick some people and a bar appears at the bottom with what you can do to all of them at once:

- **✓ Confirm / Contacted / Pending** — change everyone's status in one go. No pop-up; it just does it and tells you how many changed.
- **🗂 Move to history** — for an event that has happened. Pick a name (it suggests one, e.g. "Women's Meet — September 2026") and those people leave the main list, the counts and the duplicate check. **Nothing is deleted** — they stay in the sheet, and you can bring them back any time.
- **Delete** — permanently removes them. It first shows who is about to be deleted and asks you to confirm, and offers "Move to history instead". Deleted registrations can't be brought back.
- **✕** clears the selection.

Handy: tick the first row and **shift-click** another to select everyone in between. Changing the tab or searching clears the selection, so you never act on rows you can't see. Ticking *Select all* in the **Women's Meet** tab, then **Move to history**, is the quickest way to put a finished Women's Meet away.

**History** (button at the top, or the "N in History" link on the total tile) now has two parts:

- **Past events** — every event you moved out of the main list, newest first, with how many people it had. Open one to see everyone, **Restore** a single person or **Restore all**, or **Export CSV**. There's a search box for finding a person in a past event.
- **Zoom sends** — the meeting history from section 5.

To turn this on, update the script once (an older script keeps working — Confirm / Contacted / Delete still work, just one person at a time, and *Move to history* asks for the update instead):

1. Open the sheet → **Extensions → Apps Script**, paste in the entire contents of [`admin-tools/apps-script.gs`](admin-tools/apps-script.gs) (replace everything).
2. Retype `ADMIN_KEY` and `MEDIA_KEY` at the top (the sample keys are refused).
3. Save, then **Deploy → Manage deployments → pencil icon → New version → Deploy**.

The first time the page loads after that, two columns — **Archive** and **ArchivedAt** — are added to the right of the Registrations tab. They stay empty for everyone still in the main list; for people you moved to History, **Archive** holds the event name. Please don't rename these headers. Big selections are sent in batches of 25 (a progress count shows), and if a batch fails, the ones already done are kept and the rest stay selected so you can try again.

## 7. Insights — the charts on the admin page

Under the summary tiles the admin page shows a few charts built from **every** registration, including everyone you've moved to History — so the page still has something to show when the main list is empty. Nothing needs updating in Google for this; it uses the data already in the sheet.

- **Registrations over time** — columns per day, week or month, stacked by source (Women's Meet, Event Booking, Speaking Invitation). Hover (or tab to) a column to see the numbers; the biggest column is labelled. **View as table** shows the same numbers as a table.
- **Where everyone stands** — how many are Pending, Contacted and Confirmed, the confirmed percentage, and the confirmed rate for each source.
- **Past events** — one card per event you moved to History, with how many people it had and how many confirmed. Click a card to open History.
- The **30 days / 12 weeks / All time** buttons change the period for the charts, and **Hide** folds the whole Insights section away (remembered on that device).
- When everyone has been moved to History, the main list shows an "All caught up!" message with a button to open History.

## Important limitations — please read

- **This is not bank-grade security.** The admin key is a simple shared password, not a real login system. Anyone who guesses or obtains the key can read the sheet's data through the Web App URL. Don't use this for anything more sensitive than names/phone numbers/RSVPs.
- The admin page isn't linked from the site and is excluded from search engines (`robots.txt` + `noindex`), but the URL itself isn't secret once shared — treat the key like a password and don't post it publicly.
- If you ever want to revoke access, just change `ADMIN_KEY` in the Apps Script and redeploy (**Deploy → Manage deployments → Edit → New version**).
- The Google Sheet itself is the real source of truth — you can always open it directly to view, sort, filter, or export the data with Google Sheets' own tools, no need to go through the admin panel.
