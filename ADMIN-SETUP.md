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

## 4. (Optional) Turn on free SMS confirmations

By default, WhatsApp still opens as before and that's the only confirmation people get. If you also want registrants to receive a free text on their own phone the moment they submit, here's how — no cost, no DLT registration needed, because it sends from an ordinary personal SIM rather than a commercial bulk route.

1. On an Android phone that can stay switched on and connected to the internet (your own phone is fine — it just needs a working SIM with SMS), install the **SMS Gateway for Android** app — search for it on the Play Store, or get it from [github.com/capcom6/android-sms-gateway](https://github.com/capcom6/android-sms-gateway) if it's not listed for your region.
2. Open the app and turn on **Cloud Server** mode.
3. Tap the **Offline** button to connect — it'll switch to **Online** and show you a **username** and **password** on screen. That's all the setup the app needs.
4. Back in your Apps Script editor, find these two lines near the top and paste in that username and password:
   ```
   const SMS_GATEWAY_USER = '';
   const SMS_GATEWAY_PASS = '';
   ```
5. Save, then **Deploy → Manage deployments → pencil icon → New version → Deploy** (same redeploy step as always — don't use "New deployment," it issues a different URL).
6. Test it: submit any of the site's registration forms with your own phone number and confirm you receive a text like *"Hi [name], AJM Family here — we've received your registration for [event]. We'll be in touch soon. God bless!"*

Leave both fields blank and this step is skipped entirely — registrations keep logging normally either way, so there's no risk in leaving it off until you're ready.

**Good to know:** the phone needs to stay on and connected for messages to send (the free "Cloud" mode routes through sms-gate.app's server to your phone, so no port-forwarding or static IP needed). It's meant for the volume this site sees (dozens/hundreds a week), not mass marketing blasts.

## Important limitations — please read

- **This is not bank-grade security.** The admin key is a simple shared password, not a real login system. Anyone who guesses or obtains the key can read the sheet's data through the Web App URL. Don't use this for anything more sensitive than names/phone numbers/RSVPs.
- The admin page isn't linked from the site and is excluded from search engines (`robots.txt` + `noindex`), but the URL itself isn't secret once shared — treat the key like a password and don't post it publicly.
- If you ever want to revoke access, just change `ADMIN_KEY` in the Apps Script and redeploy (**Deploy → Manage deployments → Edit → New version**).
- The Google Sheet itself is the real source of truth — you can always open it directly to view, sort, filter, or export the data with Google Sheets' own tools, no need to go through the admin panel.
