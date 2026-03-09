const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');

async function inspect() {
  const data = new Uint8Array(fs.readFileSync('c:/Users/elmej/Downloads/pensum.pdf'));
  const doc = await pdfjsLib.getDocument({data}).promise;
  console.log('pages', doc.numPages);
  for (let i=1;i<=doc.numPages;i++){
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strs = content.items.map(i=>i.str);
    console.log('--- page',i,'---');
    console.log(strs.join(' '));
  }
}
inspect().catch(console.error);