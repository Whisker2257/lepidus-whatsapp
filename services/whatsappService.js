// services/whatsappService.js
import { cfg } from '../config.js';
import { logger } from '../utils/logger.js';

/**
 * Send a plain-text WhatsApp message, with a statusCallback so you can trace delivered vs undelivered.
 */
export async function sendText(client, to, body) {
  const msg = await client.messages.create({
    to,                          // e.g. 'whatsapp:+12818894840'
    from: cfg.twilio.from,       // must be 'whatsapp:+15557465822'
    body,
    statusCallback: `${cfg.baseUrl}/twilio/status`
  });
  logger.info(`sendText → SID: ${msg.sid}, status: ${msg.status}, to: ${to}`);
  return msg;
}

/**
 * Send a PDF (or any document) via WhatsApp, with the same statusCallback.
 */
export async function sendDocument(client, to, mediaUrl, filename) {
  const msg = await client.messages.create({
    to,
    from: cfg.twilio.from,
    body: `📄 Your solution is here: ${filename}`,
    mediaUrl: [mediaUrl],
    statusCallback: `${cfg.baseUrl}/twilio/status`
  });
  logger.info(`sendDocument → SID: ${msg.sid}, status: ${msg.status}, to: ${to}`);
  return msg;
}
