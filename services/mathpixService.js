// services/mathpixService.js

import axios from 'axios';
import { cfg } from '../config.js';

/**
 * Extract Mathpix Markdown (MMD) from an image buffer via the Mathpix OCR API.
 * Returns a string of Mathpix Markdown, which embeds LaTeX in \(…\)/\[…\] delimiters.
 */
export async function mathpixExtract(imageBuffer) {
  // Build request body: base64-encoded image + request the 'text' format
  const body = {
    src: 'data:image/png;base64,' + imageBuffer.toString('base64'),
    formats: ['text'], 
    data_options: {
      include_asciimath: true,
      include_latex: true
    },
    // ensure standard math delimiters, strip extra spaces
    math_inline_delimiters: ['\\(', '\\)'],
    math_display_delimiters: ['\\[', '\\]'],
    rm_spaces: true,
    rm_fonts: false
  };

  const res = await axios.post(
    'https://api.mathpix.com/v3/text',
    body,
    {
      headers: {
        app_id: cfg.mathpix.id,
        app_key: cfg.mathpix.key,
        'Content-Type': 'application/json'
      }
    }
  );

  // Mathpix returns the OCR’d Markdown in res.data.text
  if (!res.data || typeof res.data.text !== 'string') {
    // Bubble up Mathpix’s error message if available
    const errMsg = res.data?.error || 'Mathpix failed to extract Markdown';
    throw new Error(errMsg);
  }

  return res.data.text;
}
