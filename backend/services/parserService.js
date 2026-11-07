require('./polyfills');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const pdfModule = require('pdf-parse');
const mammoth = require('mammoth');

// Support both function export (pdf-parse 1.x) and object export
const pdfParse = typeof pdfModule === 'function' ? pdfModule : (pdfModule.default || pdfModule);

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
 * Robust Type 3 & custom CMap vector text extractor
 * Handles Figma, Canva, Illustrator, Form XObjects, and custom /ToUnicode CMaps directly from buffer.
 * Zero external worker dependencies, 100% reliable locally and on Vercel serverless.
 */
function extractTextFromPdfBufferCMap(buf) {
  try {
    const latin = buf.toString('latin1');

    // 1. Index all PDF objects: "<id> 0 obj" ... "endobj"
    const objRegex = /(\d+)\s+0\s+obj([\s\S]*?)endobj/g;
    const objects = new Map();
    let m;
    while ((m = objRegex.exec(latin)) !== null) {
      objects.set(parseInt(m[1]), { raw: m[2], index: m.index });
    }

    function getStreamBuffer(objId) {
      const obj = objects.get(objId);
      if (!obj) return null;
      const sMatch = /stream[\r\n]+/.exec(obj.raw);
      if (!sMatch) return null;
      const start = obj.index + (objId + ' 0 obj').length + sMatch.index + sMatch[0].length;
      const end = latin.indexOf('endstream', start);
      if (end === -1) return null;
      const streamRaw = buf.slice(start, end);
      try {
        return zlib.inflateSync(streamRaw);
      } catch (e) {
        return streamRaw;
      }
    }

    function parseCMap(cmapStr) {
      const map = new Map();
      // Parse beginbfchar
      const bfcharRegex = /beginbfchar([\s\S]*?)endbfchar/g;
      let bfm;
      while ((bfm = bfcharRegex.exec(cmapStr)) !== null) {
        const lines = bfm[1].trim().split(/\r?\n/);
        for (const line of lines) {
          const parts = line.trim().match(/<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>/);
          if (parts) {
            map.set(parseInt(parts[1], 16), String.fromCharCode(parseInt(parts[2], 16)));
          }
        }
      }
      // Parse beginbfrange
      const bfrangeRegex = /beginbfrange([\s\S]*?)endbfrange/g;
      let brm;
      while ((brm = bfrangeRegex.exec(cmapStr)) !== null) {
        const lines = brm[1].trim().split(/\r?\n/);
        for (const line of lines) {
          const parts = line.trim().match(/<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>/);
          if (parts) {
            const start = parseInt(parts[1], 16);
            const end = parseInt(parts[2], 16);
            let dst = parseInt(parts[3], 16);
            for (let c = start; c <= end; c++) {
              map.set(c, String.fromCharCode(dst++));
            }
          }
        }
      }
      return map;
    }

    // 2. Discover all CMaps from objects referenced by /ToUnicode
    const fontToCMapId = new Map();
    for (const [id, obj] of objects.entries()) {
      const toUni = obj.raw.match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
      if (toUni) {
        fontToCMapId.set(id, parseInt(toUni[1]));
      }
    }

    const cmapsCache = new Map();
    function getCMapForFont(fontObjId) {
      const cmapId = fontToCMapId.get(fontObjId);
      if (!cmapId) return null;
      if (cmapsCache.has(cmapId)) return cmapsCache.get(cmapId);
      const sBuf = getStreamBuffer(cmapId);
      if (!sBuf) return null;
      const parsed = parseCMap(sBuf.toString('latin1'));
      cmapsCache.set(cmapId, parsed);
      return parsed;
    }

    // 3. Map font aliases (e.g. /F1, /F2, etc.) to font object IDs
    const fontAliasToFontId = new Map();
    const resRegex = /\/Font\s*<<([\s\S]*?)>>/g;
    let rm;
    while ((rm = resRegex.exec(latin)) !== null) {
      const inner = rm[1];
      const pairRegex = /\/([a-zA-Z0-9]+)\s+(\d+)\s+0\s+R/g;
      let pm;
      while ((pm = pairRegex.exec(inner)) !== null) {
        fontAliasToFontId.set(pm[1], parseInt(pm[2]));
      }
    }

    const genericAliasRegex = /\/([FfTt]\d+)\s+(\d+)\s+0\s+R/g;
    let gam;
    while ((gam = genericAliasRegex.exec(latin)) !== null) {
      if (!fontAliasToFontId.has(gam[1])) {
        fontAliasToFontId.set(gam[1], parseInt(gam[2]));
      }
    }

    function parsePdfBytes(str) {
      const bytes = [];
      for (let i = 0; i < str.length; i++) {
        if (str[i] === '\\') {
          i++;
          if (str[i] >= '0' && str[i] <= '7') {
            let oct = str[i];
            if (i + 1 < str.length && str[i + 1] >= '0' && str[i + 1] <= '7') {
              oct += str[++i];
              if (i + 1 < str.length && str[i + 1] >= '0' && str[i + 1] <= '7') {
                oct += str[++i];
              }
            }
            bytes.push(parseInt(oct, 8));
          } else if (str[i] === 'n') bytes.push(10);
          else if (str[i] === 'r') bytes.push(13);
          else if (str[i] === 't') bytes.push(9);
          else if (str[i] === 'b') bytes.push(8);
          else if (str[i] === 'f') bytes.push(12);
          else bytes.push(str.charCodeAt(i));
        } else {
          bytes.push(str.charCodeAt(i));
        }
      }
      return bytes;
    }

    // 4. Find all streams containing text blocks (BT ... ET)
    const allExtractedLines = [];

    for (const [id, obj] of objects.entries()) {
      const sBuf = getStreamBuffer(id);
      if (!sBuf) continue;
      const sStr = sBuf.toString('latin1');
      if (!sStr.includes('BT') || !sStr.includes('ET')) continue;

      const btRegex = /BT([\s\S]*?)ET/g;
      let btm;
      while ((btm = btRegex.exec(sStr)) !== null) {
        const block = btm[1];
        const tokenRegex = /\/([a-zA-Z0-9]+)\s+[\d.-]+\s+Tf|\[([\s\S]*?)\]\s*TJ|(?:\(([^)]*)\)|<([0-9a-fA-F]+)>)\s*Tj/g;

        let curCMap = null;
        if (fontAliasToFontId.size > 0) {
          const firstFontId = fontAliasToFontId.values().next().value;
          curCMap = getCMapForFont(firstFontId);
        }

        let blockText = '';
        let tok;
        while ((tok = tokenRegex.exec(block)) !== null) {
          if (tok[1] !== undefined) {
            const fontId = fontAliasToFontId.get(tok[1]);
            if (fontId) {
              const cmap = getCMapForFont(fontId);
              if (cmap) curCMap = cmap;
            }
          } else if (tok[2] !== undefined) {
            // TJ array
            const arr = tok[2];
            const itemRegex = /\(([^)]*)\)|<([0-9a-fA-F]+)>|(-?[\d.]+)/g;
            let itm;
            while ((itm = itemRegex.exec(arr)) !== null) {
              if (itm[1] !== undefined) {
                const bytes = parsePdfBytes(itm[1]);
                for (const b of bytes) {
                  blockText += (curCMap && curCMap.get(b)) || String.fromCharCode(b);
                }
              } else if (itm[2] !== undefined) {
                const hex = itm[2];
                for (let h = 0; h < hex.length; h += 2) {
                  const b = parseInt(hex.substr(h, 2), 16);
                  blockText += (curCMap && curCMap.get(b)) || String.fromCharCode(b);
                }
              } else if (itm[3] !== undefined) {
                if (parseFloat(itm[3]) < -150) blockText += ' ';
              }
            }
          } else if (tok[3] !== undefined || tok[4] !== undefined) {
            // Tj single
            if (tok[3] !== undefined) {
              const bytes = parsePdfBytes(tok[3]);
              for (const b of bytes) {
                blockText += (curCMap && curCMap.get(b)) || String.fromCharCode(b);
              }
            } else if (tok[4] !== undefined) {
              const hex = tok[4];
              for (let h = 0; h < hex.length; h += 2) {
                const b = parseInt(hex.substr(h, 2), 16);
                blockText += (curCMap && curCMap.get(b)) || String.fromCharCode(b);
              }
            }
          }
        }

        if (blockText.trim()) {
          allExtractedLines.push(blockText.trim());
        }
      }
    }

    return allExtractedLines.join('\n');
  } catch (err) {
    console.warn('[Parser Service] CMap stream parsing fallback error:', err.message);
    return '';
  }
}

/**
 * Optional Gemini OCR fallback for image-only, scanned, or Figma/Canva exported PDFs
 */
async function extractTextWithGeminiOcr(buffer) {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'your_gemini_api_key_here') return '';

  try {
    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const fallbackModel = 'gemini-1.5-flash';

    async function callOcr(mName) {
      return await ai.models.generateContent({
        model: mName,
        contents: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: buffer.toString('base64')
            }
          },
          {
            text: 'Transcribe and extract ALL text from this resume document accurately and completely. Preserve all sections, bullet points, skills, work experience, projects, education, and details. Output plain text only.'
          }
        ]
      });
    }

    let response;
    try {
      response = await callOcr(model);
    } catch (e) {
      const errMsg = (e.message || '').toLowerCase();
      if (errMsg.includes('not found') || errMsg.includes('404')) {
        response = await callOcr(fallbackModel);
      } else {
        throw e;
      }
    }

    return (response && response.text) ? response.text.trim() : '';
  } catch (ocrErr) {
    console.warn('[Parser Service] Gemini OCR fallback encountered error:', ocrErr.message);
    return '';
  }
}

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
    if (!buffer || buffer.length === 0) {
      throw new Error('The uploaded PDF file is empty (0 bytes).');
    }

    // Verify PDF header magic bytes "%PDF-"
    const headerPrefix = buffer.slice(0, 1024).toString('binary');
    if (!headerPrefix.includes('%PDF-')) {
      throw new Error('The uploaded file is not a valid PDF document or the header is corrupted.');
    }

    try {
      let parsed;
      try {
        if (typeof pdfParse === 'function') {
          parsed = await pdfParse(buffer);
        } else if (pdfParse && typeof pdfParse.PDFParse === 'function') {
          const parser = new pdfParse.PDFParse({ data: buffer });
          parsed = await parser.getText();
        }
      } catch (primaryErr) {
        console.warn('[Parser Service] Standard pdf-parse pass encountered error:', primaryErr.message);
      }

      rawText = (parsed && parsed.text) ? parsed.text : '';
      if (!rawText.trim() && parsed && parsed.pages) {
        rawText = parsed.pages.map(p => p.text || '').join('\n');
      }

      // Secondary attempt with custom page render if standard pass yielded sparse text
      if (!rawText || rawText.trim().length < 30) {
        try {
          const secondary = await pdfParse(buffer, {
            pagerender: function(pageData) {
              return pageData.getTextContent({ normalizeWhitespace: true }).then(function(textContent) {
                return (textContent.items || []).map(item => item.str).join(' ');
              });
            }
          });
          if (secondary && secondary.text && secondary.text.trim().length > (rawText || '').trim().length) {
            rawText = secondary.text;
          }
        } catch (secErr) {
          // Continue to CMap stream extractor
        }
      }

      // Tertiary attempt: Pure Node.js CMap & Type 3 stream extractor (for Figma, Canva, vector PDFs)
      if (!rawText || rawText.trim().length < 30) {
        const cmapText = extractTextFromPdfBufferCMap(buffer);
        if (cmapText && cmapText.trim().length > (rawText || '').trim().length) {
          rawText = cmapText;
        }
      }

      // Quaternary attempt: multimodal Gemini AI OCR (for scanned images / photos)
      if (!rawText || rawText.trim().length < 30) {
        const ocrText = await extractTextWithGeminiOcr(buffer);
        if (ocrText && ocrText.trim().length > 30) {
          rawText = ocrText;
        }
      }
    } catch (pdfErr) {
      console.error('PDF parsing error:', pdfErr);
      const errMsg = pdfErr.message || '';
      if (errMsg.toLowerCase().includes('password')) {
        throw new Error('This PDF is password-protected. Please upload an unprotected document.');
      }
      throw new Error(`Failed to parse PDF document: ${errMsg}`);
    }
  } else if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    if (!buffer || buffer.length === 0) {
      throw new Error('The uploaded DOCX file is empty (0 bytes).');
    }
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
    const latinCheck = buffer ? buffer.slice(0, 100000).toString('latin1') : '';
    const hasImage = latinCheck.includes('/Subtype /Image') || latinCheck.includes('/Subtype/Image') || latinCheck.includes('/Image');
    const hasText = latinCheck.includes('BT') && latinCheck.includes('ET');

    if (hasImage && !hasText) {
      throw new Error("We couldn't extract readable text from this document. It appears to be an image-only or scanned PDF without a selectable text layer. Please upload a PDF with selectable text, or configure your free GEMINI_API_KEY in backend/.env for automatic AI OCR.");
    }
    throw new Error("We couldn't extract readable text from this document. If your resume was designed in Figma/Canva or scanned, please ensure it contains selectable text, or configure your free GEMINI_API_KEY in backend/.env to activate automatic AI OCR.");
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
