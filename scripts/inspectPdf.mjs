import fs from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

async function inspect() {
  const data = new Uint8Array(fs.readFileSync('c:/Users/elmej/Downloads/pensum.pdf'));
  const doc = await getDocument({data}).promise;
  console.log('pages', doc.numPages);
  let fullText = '';
  for (let i=1;i<=doc.numPages;i++){
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strs = content.items.map((it) => it.str);
    console.log('--- page',i,'---');
    console.log(strs.join(' '));
    fullText += strs.join(' ') + '\n';
  }

  // build semester markers
  const markerRegex = /(PRIMER|SEGUNDO|TERCER|CUARTO|QUINTO|SEXTO|S[EÉPTIMO]+|OCTAVO|NOVENO|DÉCIMO|UNDÉCIMO|DUODÉCIMO)\s+CUATRIMESTRE/gi;
  const semesterMap = {
    PRIMER: 1, SEGUNDO: 2, TERCER: 3, CUARTO: 4, QUINTO: 5,
    SEXTO: 6, SEPTIMO: 7, SÉPTIMO: 7, OCTAVO: 8, NOVENO: 9,
    DÉCIMO: 10, UNDÉCIMO: 11, DUODÉCIMO: 12,
  };
  const markers = [];
  let mm;
  while ((mm = markerRegex.exec(fullText)) !== null) {
    const ord = mm[1].toUpperCase().replace('É','E');
    markers.push({ pos: mm.index, semester: semesterMap[ord] || 0 });
  }

  // alternative parsing by splitting on large whitespace groups
  const cleanText = fullText
    .replace(/CLAVE\s+NOMBRE\s+CR\s+PRE-REQ\./g, '')
    .replace(markerRegex, '')
    .replace(/INGENIERÍA\s+de\s+Software/gi, '');
  const tokens = cleanText.split(/\s{2,}/g).map(t => t.trim()).filter(t => t);
  const subjects = [];
  let lastSearchIdx = 0;
  for (let i = 0; i < tokens.length; ) {
    const code = tokens[i];
    if (/^[A-ZÑ&\-]+-\d{3}$/.test(code)) {
      const name = tokens[i+1] || '';
      const credits = parseInt(tokens[i+2] || '0', 10);
      const prereqRaw = tokens[i+3] || '';
      const prereqCodes = prereqRaw.match(/[A-ZÑ&\-]+-\d{3}/g) || [];

      const pos = cleanText.indexOf(code, lastSearchIdx);
      if (pos !== -1) lastSearchIdx = pos + code.length;
      let semester = 0;
      for (const mk of markers) {
        if (mk.pos <= pos) semester = mk.semester;
        else break;
      }

      subjects.push({ code, name, credits, prereqs: prereqCodes, semester });
      i += 4;
    } else {
      i++;
    }
  }
  console.log('parsed subjects via whitespace split', subjects.length);
  console.log(subjects);
}
inspect().catch(console.error);