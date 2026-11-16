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

      const nameInput = document.getElementById('contactName');
      const emailInput = document.getElementById('contactEmail');
      const subjectInput = document.getElementById('contactSubject');
      const messageInput = document.getElementById('contactMessage');

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const subject = subjectInput ? subjectInput.value.trim() : '';
      const message = messageInput.value.trim();

      // Field validation
      if (!name) {
        showToast('Please enter your full name.', 'warning');
        nameInput.focus();
        return;
      }

      if (!email) {
        showToast('Please enter your email address.', 'warning');
        emailInput.focus();
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address (e.g. name@example.com).', 'warning');
        emailInput.focus();
        return;
      }

      if (!message) {
        showToast('Please enter your message or feedback.', 'warning');
        messageInput.focus();
        return;
      }

      // Loading state - prevent duplicate submissions
      btnSubmit.disabled = true;
      const originalBtnHtml = btnSubmit.innerHTML;
      btnSubmit.innerHTML = `<span>⏳</span> Sending Email to Team...`;
      if (successNotice) successNotice.style.display = 'none';

      try {
        const response = await API.submitContact({ name, email, subject, message });

        const messageText = response.message || 'Your message has been sent successfully!';
        showToast(messageText, 'success');

        if (successNotice) {
          successNotice.style.display = 'block';
          successNotice.innerHTML = `
            <div style="font-size: 1.5rem; margin-bottom: 6px;">✓</div>
            <strong>Message Received!</strong>
            <p style="margin: 6px 0 0 0; font-size: 0.95rem; line-height: 1.5;">${messageText}</p>
          `;
          successNotice.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        form.reset();
      } catch (err) {
        console.error('Contact submission error:', err);
        const errMsg = err.message || 'Failed to send message. Please verify connection and try again.';
        showToast(errMsg, 'error');

        if (successNotice) {
          successNotice.style.display = 'block';
          successNotice.style.background = 'rgba(239, 68, 68, 0.1)';
          successNotice.style.borderColor = 'var(--color-danger)';
          successNotice.style.color = 'var(--color-danger)';
          successNotice.innerHTML = `
            <div style="font-size: 1.5rem; margin-bottom: 6px;">✕</div>
            <strong>Delivery Issue</strong>
            <p style="margin: 6px 0 0 0; font-size: 0.95rem; line-height: 1.5;">${errMsg}</p>
          `;
        }
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnHtml;
      }
    });
  }
});
