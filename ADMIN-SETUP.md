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
- **Weekly Plan** tab: the media team's weekly content plan as a picture — a **Today / Tomorrow** card, a Sunday-to-Saturday board (today in gold; ‹ › to look at other weeks), the plan type by type, who does the content selection, and a countdown card for the next event (it disappears the day after the event). It is fixed text inside `media.html` (`PLAN_ROWS`, `PLAN_PEOPLE`, `PLAN_EVENT`), so it needs **no script update**; ask to have it changed when the plan or the event changes. On this tab **Print / PDF** prints the plan on one A4 landscape page.
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
2. Retype `ADMIN_KEY` and `MEDIA_KEY` (and `WORSHIP_KEY`, section 7) at the top (the sample keys are refused).
3. Save, then **Deploy → Manage deployments → pencil icon → New version → Deploy**.

The first time the page loads after that, two columns — **Archive** and **ArchivedAt** — are added to the right of the Registrations tab. They stay empty for everyone still in the main list; for people you moved to History, **Archive** holds the event name. Please don't rename these headers. Big selections are sent in batches of 25 (a progress count shows), and if a batch fails, the ones already done are kept and the rest stay selected so you can try again.

## 7. Worship team — songs, lyrics and the Sunday list

`/worship.html` is a private page for the worship team, in the same style as the admin and media pages, with **its own key** (the worship key doesn't open registrations or the media office, and the other keys don't open this). Songs are kept in two new tabs of the same Google Sheet — **WorshipSongs** and **WorshipSets** — apart from everything else.

To turn it on, update the script once:

1. Open the sheet → **Extensions → Apps Script**, paste in the entire contents of [`admin-tools/apps-script.gs`](admin-tools/apps-script.gs) (replace everything).
2. Retype your keys at the top, and pick a new one for the worship team (**the sample keys are refused**):
   ```
   const ADMIN_KEY = '...';     // your existing admin key
   const MEDIA_KEY = '...';     // your existing media key
   const WORSHIP_KEY = '...';   // new — the one key the whole worship team uses on worship.html
   ```
3. Save, then **Deploy → Manage deployments → pencil icon → New version → Deploy**.
4. Visit `https://ajmfamily.site/worship.html` and log in with the worship key.

Until the script is updated the worship page just says the key is wrong — nothing else changes.

How it works:

- **Song Library** — *Add a song*: a title, the key it's sung in (optional), a YouTube link to learn it (optional), and the lyrics — just paste them. Leave an empty line between verses. A line that only says **Chorus**, **Verse 2**, **Bridge**, **कोरस** or **अंतरा 1** (or anything short in `[square brackets]`) becomes a label, and choruses are shown in gold. The preview beside the lyrics shows exactly how it will look on Sunday. Hindi and English both work. Search finds titles *and* words in the lyrics. Each card shows how many times the song has been sung and when it's planned next.
- **Sunday** — opens on the coming Sunday (‹ › for other Sundays, *Other date* for a special service on any day). **Add songs** lists the whole library: tap songs to put them in the list — as many as you like, up to 40 — and ▲ ▼ to change the order. There's a note for the team (e.g. "Communion Sunday"), *Saved lists* to jump to other dates, and a one-tap **Use last Sunday's list** when a date is empty. Everything saves by itself and appears on everyone's phone within about 20 seconds.
- **Start singing** — the lyrics fill the screen, big and easy to read: swipe left/right or tap **Next / Previous** for the next song, **A− / A+** for text size and 🌙 for a dark or light screen (both remembered on that phone). The screen stays on while the lyrics are open. The phone's **Back** button closes the lyrics. A Bluetooth page-turner pedal works too: *Page Down* scrolls and moves to the next song at the end.
- **Send the list** shares the song titles for that date (to WhatsApp etc.), and **Print lyrics** prints all the songs for that date, two columns per page.
- Deleting a song (in *Edit*) removes it for everyone; past lists that had it show "a song that was deleted".

Limits: 3,000 songs, 20,000 characters of lyrics per song, 40 songs per service.

## 8. Events and Invite in the AJM Office app (no key)

The app's login screen has two tiles anyone can use, without a key:

- **Events** — reads [`events.json`](events.json) from the website: the special events (with flyer, *Register*, *Zoom link* on WhatsApp, *Add to calendar*) and the weekly gatherings, as a "coming up in the next 7 days" list in India time, with a LIVE badge while a gathering is on. A special event disappears by itself the day after its date. When events change, update **events.json** together with **events.html** — every phone picks it up the next time Events is opened (no app update). The app keeps the last list it downloaded, so it also works offline.
  - **Announcements** (`notices` in events.json): a flyer and a few lines shown at the top of Events and on the login tile, between a `from` and an `until` date — e.g. "Wednesday Fellowship temporarily paused".
  - **Paused weeks** (`skip` on a weekly gathering): those dates show crossed out as "Not this week" with the reason (`skipNote`), and the home page's "Next Gathering" skips them too.
  - On the website, anything marked `data-until="YYYY-MM-DD"` takes itself down the day after that date.
- **Invite** — the same questions as [`invite.html`](invite.html). Sending it opens WhatsApp with the full invitation (as the website does) and adds a row to the sheet with source **Speaking Invitation** (details end with "Sent from the app"), so it shows in Admin like a website invitation.

## Important limitations — please read

- **This is not bank-grade security.** The admin key is a simple shared password, not a real login system. Anyone who guesses or obtains the key can read the sheet's data through the Web App URL. Don't use this for anything more sensitive than names/phone numbers/RSVPs.
- The admin page isn't linked from the site and is excluded from search engines (`robots.txt` + `noindex`), but the URL itself isn't secret once shared — treat the key like a password and don't post it publicly.
- If you ever want to revoke access, just change `ADMIN_KEY` in the Apps Script and redeploy (**Deploy → Manage deployments → Edit → New version**).
- The Google Sheet itself is the real source of truth — you can always open it directly to view, sort, filter, or export the data with Google Sheets' own tools, no need to go through the admin panel.
