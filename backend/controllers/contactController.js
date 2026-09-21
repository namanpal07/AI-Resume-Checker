const Contact = require('../models/Contact');

/**
 * Handle contact form submission
 */
async function submitContact(req, res) {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in all required fields (Name, Email, Message).'
      });
    }

    let saved = null;
    try {
      const newContact = new Contact({
        name,
        email,
        subject: subject || 'General Inquiry',
        message
      });
      saved = await newContact.save();
    } catch (dbErr) {
      console.warn('Could not save contact message to MongoDB:', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Your message has been received! Our team will get back to you shortly.',
      id: saved ? saved._id : null
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process contact message.'
    });
  }
}

module.exports = {
  submitContact
};
