// services/whatsappService.js

import { cfg } from '../config.js';
import { logger } from '../utils/logger.js';

/**
 * Send a plain-text WhatsApp message and log the Twilio response.
 */
export async function sendText(client, to, body) {
  const msg = await client.messages.create({
    to,
    from: cfg.twilio.from,
    body
  });
  logger.info(`sendText → SID: ${msg.sid}, status: ${msg.status}, to: ${to}`);
  return msg;
}

/**
 * Send a document (PDF) via WhatsApp and log the Twilio response.
 */
export async function sendDocument(client, to, mediaUrl, filename) {
  const msg = await client.messages.create({
    to,
    from: cfg.twilio.from,
    body: `📄 Your solution is here: ${filename}`,
    mediaUrl: [mediaUrl]
  });
  logger.info(`sendDocument → SID: ${msg.sid}, status: ${msg.status}, to: ${to}`);
  return msg;
}
