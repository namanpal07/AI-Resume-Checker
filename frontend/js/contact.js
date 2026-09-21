/**
 * AI Resume Coach - Contact Form Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const btnSubmit = document.getElementById('btnSubmitContact');
  const successNotice = document.getElementById('contactSuccessNotice');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('contactName').value.trim();
      const email = document.getElementById('contactEmail').value.trim();
      const subject = document.getElementById('contactSubject').value.trim();
      const message = document.getElementById('contactMessage').value.trim();

      if (!name || !email || !message) {
        showToast('Please fill in all required fields.', 'warning');
        return;
      }

      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<span>⏳</span> Sending Message...`;

      try {
        await API.submitContact({ name, email, subject, message });
        showToast('Message sent successfully!', 'success');

        form.reset();
        if (successNotice) successNotice.style.display = 'block';
      } catch (err) {
        console.error('Contact submission error:', err);
        showToast(err.message || 'Failed to send message. Please try again.', 'error');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<span>✉️</span> Send Message to Team`;
      }
    });
  }
});
