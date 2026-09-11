// Silently mirrors registration/booking form submissions to a Google Sheet
// so they show up in admin.html, in addition to the WhatsApp message the
// form already sends. Safe to load on any page — does nothing until
// REG_LOG_URL below is filled in.
//
// Setup: see ADMIN-SETUP.md in the project root.
const REG_LOG_URL = ''; // e.g. 'https://script.google.com/macros/s/XXXXXXXX/exec'

function logRegistration(source, fields) {
  if (!REG_LOG_URL) return;
  try {
    fetch(REG_LOG_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ source, ...fields })
    });
  } catch (e) {
    // never let logging break the actual form submission
  }
}
