import axios from 'axios';
import { cfg } from '../config.js';

export async function mathpixExtract(imageBuffer) {
  const res = await axios.post(
    'https://api.mathpix.com/v3/text',
    {
      src: 'data:image/png;base64,' + imageBuffer.toString('base64'),
      formats: ['latex_styled']
    },
    {
      headers: {
        app_id: cfg.mathpix.id,
        app_key: cfg.mathpix.key,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!res.data || !res.data.latex_styled) {
    throw new Error('Mathpix failed to extract LaTeX');
  }
  return res.data.latex_styled;
}
