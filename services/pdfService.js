import PDFDocument from 'pdfkit';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { cfg } from '../config.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import pug from 'pug';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = join(__dirname, '../templates/solutionTemplate.html');
const template = readFileSync(templatePath, 'utf8');

export async function buildPdf({ title, latex, htmlSteps }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    /** Cover Page **/
    doc.fontSize(20).text('Lepidus Solution', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(title, { align: 'center' });
    doc.addPage();

    /** Restated Question **/
    doc.fontSize(16).text('Question', { underline: true });
    doc.moveDown(0.5);
    doc.font('Helvetica-Oblique').fontSize(12).text(latex);
    doc.moveDown();
    doc.addPage();

    /** Steps (rendered from GPT HTML trimmed of h1) **/
    doc.font('Helvetica').fontSize(16).text('Solution', { underline: true });
    doc.moveDown(0.5);

    // A very lightweight HTML→text parser.
    const stripped = htmlSteps
      .replace(/<\/?h[12][^>]*>/g, '')
      .replace(/<\/?p[^>]*>/g, '\n')
      .replace(/<\/?ol[^>]*>/g, '\n')
      .replace(/<\/?li[^>]*>/g, '- ')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]+>/g, '');

    doc.fontSize(12).text(stripped, { align: 'left' });

    doc.end();
  });
}
