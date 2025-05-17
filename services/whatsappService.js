import { cfg } from '../config.js';
import { logger } from '../utils/logger.js';

/**
 * Send a plain text WhatsApp message.
 */
export async function sendText(client, to, body) {
  await client.messages.create({
    to,
    from: cfg.twilio.from,
    body
  });
}

/**
 * Send a document (PDF) via WhatsApp.
 */
export async function sendDocument(client, to, mediaUrl, filename) {
  await client.messages.create({
    to,
    from: cfg.twilio.from,
    body: '📄 Solution ready! Tap to view.',
    mediaUrl: [mediaUrl],
    persistentAction: [`document:${mediaUrl},${filename}`]
  });
}
