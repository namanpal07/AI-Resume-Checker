const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Common resume section heading indicators
 */
const SECTION_PATTERNS = {
  "Summary": /(?:^|\n)\s*(?:professional\s+)?(?:summary|profile|about\s+me|career\s+objective|objective)\b/i,
  "Education": /(?:^|\n)\s*(?:education|academic\s+background|academics|qualifications|academic\s+credentials)\b/i,
  "Skills": /(?:^|\n)\s*(?:technical\s+skills|skills|technologies|core\s+competencies|key\s+skills|skill\s+set|tools\s+&\s+technologies)\b/i,
  "Experience": /(?:^|\n)\s*(?:experience|work\s+experience|professional\s+experience|employment\s+history|internships?|work\s+history)\b/i,
  "Projects": /(?:^|\n)\s*(?:projects?|academic\s+projects?|personal\s+projects?|key\s+projects?)\b/i,
  "Certifications": /(?:^|\n)\s*(?:certifications?|certificates?|licenses?|training|courses?)\b/i,
  "Achievements": /(?:^|\n)\s*(?:achievements?|awards?|honors?|accomplishments?|extracurricular)\b/i,
  "Languages": /(?:^|\n)\s*(?:languages?|linguistic\s+skills)\b/i
};

/**
 * Extracts raw text from uploaded PDF or DOCX file (supports file paths or in-memory Buffers)
 */
async function extractTextFromFile(filePathOrBuffer, mimeType = '', originalName = '') {
  let buffer;
  let ext = '';

  if (Buffer.isBuffer(filePathOrBuffer)) {
    buffer = filePathOrBuffer;
    ext = originalName ? path.extname(originalName).toLowerCase() : '';
  } else if (typeof filePathOrBuffer === 'string') {
    if (!fs.existsSync(filePathOrBuffer)) {
      throw new Error('File not found on server');
    }
    ext = path.extname(filePathOrBuffer).toLowerCase();
    buffer = fs.readFileSync(filePathOrBuffer);
  } else {
    throw new Error('Unsupported document input');
  }

  let rawText = '';

  if (ext === '.pdf' || mimeType === 'application/pdf') {
    try {
      const parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      rawText = (parsed && parsed.text) ? parsed.text : '';
      if (!rawText.trim() && parsed && parsed.pages) {
        rawText = parsed.pages.map(p => p.text || '').join('\n');
      }
    } catch (pdfErr) {
      console.error('PDF parsing error:', pdfErr);
      throw new Error(`Failed to parse PDF document: ${pdfErr.message}`);
    }
  } else if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value || '';
    } catch (docxErr) {
      console.error('DOCX parsing error:', docxErr);
      throw new Error(`Failed to parse DOCX document: ${docxErr.message}`);
    }
  } else {
    throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
  }

  if (!rawText || rawText.trim().length === 0) {
    throw new Error("We couldn't extract readable text from this document. It may be scanned or image-only.");
  }

  return cleanText(rawText);
}

/**
 * Normalizes text formatting, converts weird quotes/spaces
 */
function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \u00A0\u2000-\u200B]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Identifies present and missing standard resume sections
 */
function detectSections(text) {
  const detected = [];
  const missing = [];

  for (const [sectionName, pattern] of Object.entries(SECTION_PATTERNS)) {
    if (pattern.test(text)) {
      detected.push(sectionName);
    } else {
      missing.push(sectionName);
    }
  }

  // Check for contact information presence (email, phone)
  const hasEmail = /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/.test(text);
  const hasPhone = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[-.\s]?\d{10}/.test(text);

  if (hasEmail || hasPhone) {
    detected.unshift('Contact Information');
  } else {
    missing.unshift('Contact Information');
  }

  return { detected, missing };
}

/**
 * Extracts basic metadata: email, phone, links, name estimate
 */
function extractMetadata(text) {
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[-.\s]?\d{10}/);
  const githubMatch = text.match(/github\.com\/[a-zA-Z0-9_-]+/i);
  const linkedinMatch = text.match(/linkedin\.com\/(?:in\/)?[a-zA-Z0-9_-]+/i);

  // Approximate candidate name from top lines
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let candidateName = 'Candidate';
  if (lines.length > 0 && lines[0].length < 40 && !lines[0].includes('@') && !lines[0].toLowerCase().includes('resume')) {
    candidateName = lines[0];
  }

  return {
    candidateName,
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0] : null,
    github: githubMatch ? githubMatch[0] : null,
    linkedin: linkedinMatch ? linkedinMatch[0] : null
  };
}

module.exports = {
  extractTextFromFile,
  cleanText,
  detectSections,
  extractMetadata
};
