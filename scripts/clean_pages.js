/**
 * Post-processes scraped pages: removes 404 pages and strips the site-wide
 * header/footer boilerplate (lines appearing on >40% of pages) so each
 * data/pages/*.txt contains only the page's unique factual body.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'data');
const PAGES = path.join(ROOT, 'pages');
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8'));

// scrape.js only persists HTTP 200 pages; 404s are recorded in index.json only.
void index;
const files = fs.readdirSync(PAGES).filter(f => f.endsWith('.txt'));
const freq = {};
const docs = {};
for (const f of files) {
  const lines = fs.readFileSync(path.join(PAGES, f), 'utf8').split('\n');
  docs[f] = lines;
  new Set(lines.slice(4)).forEach(l => (freq[l] = (freq[l] || 0) + 1));
}
const threshold = files.length * 0.4;
let removed = 0;
for (const f of files) {
  const [a, b, c, d, ...body] = docs[f];
  const kept = body.filter(l => freq[l] < threshold);
  removed += body.length - kept.length;
  fs.writeFileSync(path.join(PAGES, f), [a, b, c, d, ...kept].join('\n'));
}
console.log(`Cleaned ${files.length} pages, removed ${removed} boilerplate lines.`);
