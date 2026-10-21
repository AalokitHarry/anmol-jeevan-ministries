// Prepare a draft locally. Opening WhatsApp and sending are visitor actions.
(() => {
  const form = document.getElementById('prayerForm');
  if (!form) return;
  const callback = document.getElementById('prayerCallback');
  const phoneGroup = document.getElementById('prayerPhoneGroup');
  const phone = document.getElementById('prayerPhone');
  const message = document.getElementById('prayerMessage');
  const preview = document.getElementById('prayerPreview');
  const error = document.getElementById('prayerError');
  const name = document.getElementById('prayerName');

  function updateCallback() {
    phoneGroup.hidden = !callback.checked;
    phone.required = callback.checked;
    phone.disabled = !callback.checked;
    phone.setCustomValidity('');
    error.hidden = true;
  }
  callback.addEventListener('change', updateCallback);
  updateCallback();
  phone.addEventListener('input', () => {
    phone.setCustomValidity('');
    error.hidden = true;
  });
  message.addEventListener('input', () => message.setCustomValidity(''));

  form.addEventListener('submit', event => {
    event.preventDefault();
    const request = message.value.trim();
    if (!request) {
      message.setCustomValidity('Please write a prayer request before continuing.');
      message.reportValidity();
      return;
    }
    const number = phone.value.trim();
    const digits = number.replace(/\D/g, '');
    if (callback.checked && (digits.length < 7 || digits.length > 15 || !/^\+?[\d\s()-]+$/.test(number))) {
      error.hidden = false;
      phone.setCustomValidity('Enter a phone number with 7 to 15 digits, including your country code.');
      phone.reportValidity();
      return;
    }
    const lines = [
      'Prayer request from the AJM Family website:',
      name.value.trim() ? 'Name: ' + name.value.trim() : null,
      'Prayer request: ' + request,
      callback.checked ? 'I would like the AJM team to contact me.' : null,
      callback.checked ? 'Contact number: ' + number : null
    ].filter(Boolean).join('\n\n');
    document.getElementById('prayerDraft').textContent = lines;
    document.getElementById('prayerWhatsApp').href = 'https://wa.me/917999929550?text=' + encodeURIComponent(lines);
    form.hidden = true;
    preview.hidden = false;
    document.getElementById('prayerPreviewTitle').focus();
  });

  document.getElementById('prayerEdit').addEventListener('click', () => {
    preview.hidden = true;
    form.hidden = false;
    document.getElementById('prayerWhatsApp').removeAttribute('href');
    document.getElementById('prayerDraft').textContent = '';
    message.focus();
  });
})();
