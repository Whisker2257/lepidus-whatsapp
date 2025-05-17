import OpenAI from 'openai';
import { cfg } from '../config.js';

const openai = new OpenAI({ apiKey: cfg.openaiKey });

const SYSTEM = `
You are Lepidus, an exam tutor. 
Given a math question (in LaTeX), produce:
1) A concise restatement of the question in plain English (preserve LaTeX).
2) A fully worked, numbered, step-by-step solution.
3) For each major step, a one-line description of a diagram that would aid understanding.
Respond strictly in valid HTML with headings <h1>, <h2>, lists <ol>, and <p>.
`;

export async function solveWithOpenAI(latex) {
  const prompt = `
<question>
${latex}
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
  const titleMatch = htmlSteps.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, '_') : 'Question';

  return { htmlSteps, title };
}
