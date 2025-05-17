// services/whatsappService.js

import { cfg } from '../config.js';

/**
 * Send a plain-text WhatsApp message.
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
 * The Twilio WhatsApp API will render the PDF as an attachment
 * when you pass the mediaUrl array.
 */
export async function sendDocument(client, to, mediaUrl, filename) {
  await client.messages.create({
    to,
    from: cfg.twilio.from,
    // You can include a short caption if you like:
    body: `📄 Your solution is here: ${filename}`,
    mediaUrl: [mediaUrl]
  });
}
