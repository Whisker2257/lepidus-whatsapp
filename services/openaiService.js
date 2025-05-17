// services/openaiService.js

import OpenAI from 'openai';
import { cfg } from '../config.js';

const openai = new OpenAI({ apiKey: cfg.openaiKey });

const SYSTEM = `
You are Lepidus, an AI exam tutor. 
You receive a math question in Mathpix Markdown format (LaTeX inside \\(…\\) or \\[…\\]). 
Produce:
1) A concise restatement of the question in plain English (keeping math in LaTeX).
2) A numbered, step-by-step solution.
3) For each major step, a one-line description of a supporting diagram.
Respond strictly in valid HTML with <h1>, <h2>, <ol>, <li>, and <p> tags.
`;

export async function solveWithOpenAI(markdown) {
  const prompt = `
<question>
${markdown}
</question>
`;

  const chat = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 800,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: prompt }
    ]
  });

  const htmlSteps = chat.choices[0].message.content;
  // derive a file-friendly title from the first <h1> heading
  const titleMatch = htmlSteps.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const title = titleMatch
    ? titleMatch[1].trim().replace(/\s+/g, '_')
    : 'Question';

  return { htmlSteps, title };
}
