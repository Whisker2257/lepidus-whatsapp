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
 * Expects: multipart/x-www-form-urlencoded
 */
router.post('/', async (req, res) => {
  const from = req.body.From;      // e.g. "whatsapp:+2637XXXXXXX"
  const numMedia = parseInt(req.body.NumMedia || '0', 10);

  // Acknowledge immediately so Twilio doesn’t wait
  res.type('text/xml').send('<Response></Response>');

  if (!from || numMedia === 0) {
    await sendText(
      twilioClient,
      from,
      '📸 Please send a clear photo of a math question.'
    );
    return;
  }

  const mediaUrl = req.body.MediaUrl0;
  logger.info(`New solve request from ${from}`);

  try {
    // Let the user know we’re on it
    await sendText(
      twilioClient,
      from,
      '✅ Got your question! Crunching the steps now—PDF arriving shortly…'
    );

    // 1. Download the image buffer
    const { data: imageBuffer } = await axios.get(mediaUrl, {
      responseType: 'arraybuffer',
      auth: {
        username: cfg.twilio.sid,
        password: cfg.twilio.token
      }
    });

    // 2. OCR via Mathpix → LaTeX
    const latex = await mathpixExtract(imageBuffer);

    // 3. Solve the question with GPT-4o
    const { htmlSteps, title } = await solveWithOpenAI(latex);

    // 4. Build the PDF
    const pdfBuffer = await buildPdf({ title, latex, htmlSteps });

    // 5. Upload PDF to S3
    const key = `solutions/${uuidv4()}.pdf`;
    const pdfUrl = await uploadBuffer(pdfBuffer, key);

    // 6. Send back as a WhatsApp document
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
      '❌ Sorry, I hit a snag while solving that. Could you try retaking the photo?'
    );
  }
});

export default router;
