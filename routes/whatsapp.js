// routes/whatsapp.js

import express from 'express';
import twilio from 'twilio';
import { cfg } from '../config.js';
import { logger } from '../utils/logger.js';
import { mathpixExtract } from '../services/mathpixService.js';
import { solveWithOpenAI } from '../services/openaiService.js';
import { buildPdf } from '../services/pdfService.js';
import { uploadBuffer } from '../services/storageService.js';
import { sendDocument, sendText } from '../services/whatsappService.js';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const twilioClient = twilio(cfg.twilio.sid, cfg.twilio.token);

/**
 * Twilio WhatsApp POST Webhook
 * Expects: application/x-www-form-urlencoded
 */
router.post('/', async (req, res) => {
  // immediately acknowledge to Twilio
  res.type('text/xml').send('<Response></Response>');

  const from = req.body.From;               // e.g. "whatsapp:+263712345678"
  const numMedia = parseInt(req.body.NumMedia ?? '0', 10);

  if (!from || numMedia === 0) {
    await sendText(
      twilioClient,
      from,
      '📸 Please send a clear photo of a math question.'
    );
    return;
  }

  logger.info(`New solve request from ${from}`);
  const mediaUrl = req.body.MediaUrl0;

  try {
    // notify student
    await sendText(
      twilioClient,
      from,
      '✅ Got your question! Crunching the steps now—PDF arriving shortly…'
    );

    // 1. Download the image buffer (use Twilio auth only for twilio.com URLs)
    const { data: imageBuffer } = mediaUrl.includes('twilio.com')
      ? await axios.get(mediaUrl, {
          responseType: 'arraybuffer',
          auth: {
            username: cfg.twilio.sid,
            password: cfg.twilio.token
          }
        })
      : await axios.get(mediaUrl, { responseType: 'arraybuffer' });

    // 2. OCR via Mathpix → Mathpix Markdown
    const markdown = await mathpixExtract(imageBuffer);

    // 3. Solve the question with GPT-4o (HTML output)
    const { htmlSteps, title } = await solveWithOpenAI(markdown);

    // 4. Build the PDF (question markdown + solution HTML)
    const pdfBuffer = await buildPdf({
      title,
      latex: markdown,
      htmlSteps
    });

    // 5. Upload PDF to S3
    const key = `solutions/${uuidv4()}.pdf`;
    const pdfUrl = await uploadBuffer(pdfBuffer, key);

    // 6. Send back as WhatsApp document
    await sendDocument(
      twilioClient,
      from,
      pdfUrl,
      `Solution_${title}.pdf`
    );

  } catch (err) {
    logger.error(err);
    await sendText(
      twilioClient,
      from,
      '❌ Sorry, something went wrong processing your question. Could you try again?'
    );
  }
});

export default router;
