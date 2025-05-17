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

router.post('/', async (req, res) => {
  logger.info('Webhook hit:', req.method, req.url);
  // Ack immediately
  res.type('text/xml').send('<Response></Response>');

  const from = req.body.From;
  const numMedia = parseInt(req.body.NumMedia ?? '0', 10);
  logger.info(`Parsed From=${from}, NumMedia=${numMedia}`);

  if (!from || numMedia === 0) {
    logger.info('No media or no from; sending prompt to user');
    await sendText(twilioClient, from, '📸 Please send a clear photo of a math question.');
    return;
  }

  logger.info(`New solve request from ${from}`);
  const mediaUrl = req.body.MediaUrl0;
  logger.info('Media URL:', mediaUrl);

  try {
    // 1) Notify the student
    logger.info('Sending acknowledgement text');
    await sendText(
      twilioClient,
      from,
      '✅ Got your question! Crunching the steps now—PDF arriving shortly…'
    );
    logger.info('Ack sent');

    // 2) Download the image
    logger.info('Downloading image buffer');
    const { data: imageBuffer } = mediaUrl.includes('twilio.com')
      ? await axios.get(mediaUrl, {
          responseType: 'arraybuffer',
          auth: {
            username: cfg.twilio.sid,
            password: cfg.twilio.token
          }
        })
      : await axios.get(mediaUrl, { responseType: 'arraybuffer' });
    logger.info('Downloaded image bytes:', imageBuffer.length);

    // 3) OCR via Mathpix → Markdown
    logger.info('Calling mathpixExtract()');
    const markdown = await mathpixExtract(imageBuffer);
    logger.info('Mathpix returned Markdown length:', markdown.length);

    // 4) Solve via OpenAI
    logger.info('Calling solveWithOpenAI()');
    const { htmlSteps, title } = await solveWithOpenAI(markdown);
    logger.info('OpenAI returned HTML steps length:', htmlSteps.length, 'Title:', title);

    // 5) Build PDF
    logger.info('Building PDF');
    const pdfBuffer = await buildPdf({ title, latex: markdown, htmlSteps });
    logger.info('PDF built bytes:', pdfBuffer.length);

    // 6) Upload PDF to S3
    const key = `solutions/${uuidv4()}.pdf`;
    logger.info('Uploading PDF to S3 at key:', key);
    const pdfUrl = await uploadBuffer(pdfBuffer, key);
    logger.info('PDF uploaded; URL:', pdfUrl);

    // 7) Send PDF back
    logger.info('Sending document to user');
    await sendDocument(twilioClient, from, pdfUrl, `Solution_${title}.pdf`);
    logger.info('Document sent successfully');

  } catch (err) {
    logger.error('Error in solve flow:', err);
    await sendText(
      twilioClient,
      from,
      '❌ Sorry, something went wrong processing your question. Could you try again?'
    );
  }
});

export default router;
