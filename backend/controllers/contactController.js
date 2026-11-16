const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const Contact = require('../models/Contact');

/**
 * Handle contact form submission and send email to namancse9258@gmail.com
 */
async function submitContact(req, res) {
  try {
    const { name, email, subject, message } = req.body;

    // 1. Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide your full name.'
      });
    }

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide your email address.'
      });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address (e.g. name@example.com).'
      });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your message.'
      });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = (subject && subject.trim()) ? subject.trim() : 'General Inquiry';
    const trimmedMessage = message.trim();

    // 3. Save contact message to MongoDB (graceful fallback if DB is offline)
    let saved = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const newContact = new Contact({
          name: trimmedName,
          email: trimmedEmail,
          subject: trimmedSubject,
          message: trimmedMessage
        });
        saved = await newContact.save();
      } catch (dbErr) {
        console.warn('[Contact Controller] Could not save message to MongoDB:', dbErr.message);
      }
    } else {
      console.log('[Contact Controller] MongoDB is not connected; proceeding without database write.');
    }

    // 4. Configure email dispatch
    const targetRecipient = (process.env.CONTACT_RECEIVER_EMAIL || 'namancse9258@gmail.com').trim();
    const smtpUser = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
    const smtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim();
    const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
    const smtpSecure = process.env.SMTP_SECURE !== 'false' && (smtpPort === 465);

    const submissionTimeIST = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'medium'
    });
    const submissionTimeUTC = new Date().toUTCString();

    let emailSent = false;
    let emailError = null;

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });

        const senderDisplayName = process.env.SMTP_FROM_NAME || 'AI Resume Coach Contact Form';
        const mailFrom = `"${senderDisplayName}" <${smtpUser}>`;

        const mailOptions = {
          from: mailFrom,
          to: targetRecipient,
          replyTo: `"${trimmedName}" <${trimmedEmail}>`,
          subject: `[AI Resume Coach] ${trimmedSubject} - from ${trimmedName}`,
          text: `
NEW CONTACT FORM SUBMISSION
AI Resume Checker & Interview Coach Platform

====================================================
Sender Name:    ${trimmedName}
Sender Email:   ${trimmedEmail}
Subject:        ${trimmedSubject}
Submission Time (IST): ${submissionTimeIST}
Submission Time (UTC): ${submissionTimeUTC}
====================================================

MESSAGE:
${trimmedMessage}

----------------------------------------------------
You can reply directly to this email to respond to ${trimmedName} (${trimmedEmail}).
`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .header { background: #245b96; padding: 24px; text-align: center; color: #ffffff; }
    .header h2 { margin: 0 0 6px 0; font-size: 20px; font-weight: 600; letter-spacing: -0.3px; }
    .header p { margin: 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 28px 24px; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 22px; }
    .info-table td { padding: 8px 12px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
    .info-label { font-weight: 600; color: #475569; width: 140px; background: #f8fafc; border-radius: 4px; }
    .info-value { color: #0f172a; word-break: break-word; }
    .message-box { background: #f8fafc; border-left: 4px solid #245b96; padding: 18px; border-radius: 0 8px 8px 0; font-size: 14.5px; line-height: 1.65; color: #1e293b; white-space: pre-wrap; word-wrap: break-word; margin: 18px 0; }
    .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #e0f2fe; color: #0369a1; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>✉️ New Contact & Feedback Message</h2>
      <p>AI Resume Checker & Interview Coach Platform</p>
    </div>
    <div class="content">
      <table class="info-table">
        <tr>
          <td class="info-label">Sender Name:</td>
          <td class="info-value"><strong>${trimmedName}</strong></td>
        </tr>
        <tr>
          <td class="info-label">Sender Email:</td>
          <td class="info-value"><a href="mailto:${trimmedEmail}" style="color: #245b96; text-decoration: none;">${trimmedEmail}</a></td>
        </tr>
        <tr>
          <td class="info-label">Subject:</td>
          <td class="info-value"><span class="badge">${trimmedSubject}</span></td>
        </tr>
        <tr>
          <td class="info-label">Date (IST):</td>
          <td class="info-value">${submissionTimeIST}</td>
        </tr>
        <tr>
          <td class="info-label">Date (UTC):</td>
          <td class="info-value">${submissionTimeUTC}</td>
        </tr>
      </table>

      <h4 style="margin: 20px 0 8px 0; color: #334155; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Message Content:</h4>
      <div class="message-box">${trimmedMessage}</div>
    </div>
    <div class="footer">
      This notification was automatically sent by your AI Resume Coach system to <strong>${targetRecipient}</strong>.<br>
      You can reply directly to this email to reach <em>${trimmedName}</em>.
    </div>
  </div>
</body>
</html>
`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('[Contact Controller] Email dispatched successfully:', info.messageId);
        emailSent = true;
      } catch (sendErr) {
        console.error('[Contact Controller] Nodemailer send error:', sendErr.message);
        emailError = sendErr.message;
      }
    } else {
      console.log('[Contact Controller] SMTP_USER or SMTP_PASS not set. Message recorded in database without live email dispatch.');
    }

    if (emailSent) {
      return res.status(200).json({
        success: true,
        emailSent: true,
        message: `Thank you, ${trimmedName}! Your message has been sent directly to ${targetRecipient}. We will get back to you shortly.`,
        data: {
          receiverEmail: targetRecipient,
          emailSent: true
        },
        id: saved ? saved._id : null
      });
    }

    if (emailError) {
      return res.status(502).json({
        success: false,
        emailSent: false,
        error: `Message saved, but email delivery encountered an error: ${emailError}. Please verify SMTP credentials in backend/.env.`
      });
    }

    // When SMTP credentials are not yet added in .env:
    return res.status(200).json({
      success: true,
      emailSent: false,
      message: `Thank you, ${trimmedName}! Your message has been recorded. (Note: Configure SMTP_USER and SMTP_PASS in backend/.env to dispatch live emails to ${targetRecipient}).`,
      data: {
        receiverEmail: targetRecipient,
        emailSent: false
      },
      id: saved ? saved._id : null
    });

  } catch (error) {
    console.error('Contact submission error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process contact message. ' + (error.message || '')
    });
  }
}

module.exports = {
  submitContact
};
