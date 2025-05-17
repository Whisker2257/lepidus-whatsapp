import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import { logger } from './utils/logger.js';
import whatsappRouter from './routes/whatsapp.js';

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (_req, res) => res.send('Lepidus API OK'));
app.use('/webhook', whatsappRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Lepidus listening on port ${PORT}`);
});
