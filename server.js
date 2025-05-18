// /Users/nashe/lepidus/backend/server.js
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import { logger } from './utils/logger.js';
import whatsappRouter from './routes/whatsapp.js';

const app = express();

// parse incoming Twilio webhooks
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// health check
app.get('/', (_req, res) => res.send('Lepidus API OK'));

// your WhatsApp incoming-media webhook
app.use('/webhook', whatsappRouter);

// new: Twilio delivery status callback
// Twilio will POST message-status updates here (queued → sent → delivered → etc.)
app.post('/twilio/status', (req, res) => {
  logger.info('🛈 Twilio delivery status callback:', req.body);
  res.sendStatus(200);
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Lepidus listening on port ${PORT}`);
});
