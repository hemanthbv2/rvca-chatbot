/**
 * Builds data/faculty.json from the official RVCA faculty directory.
 * The directory widget (Essential Addons filterable gallery) embeds every
 * card as base64 JSON in `data-gallery-items`; we decode it, then enrich each
 * teaching member with qualification/specialisation scraped from their profile.
 * Usage: node scripts/build_faculty.js
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'data');
const html = fs.readFileSync(path.join(ROOT, 'raw', 'faculty.html'), 'utf8');

const strip = s => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#8211;/g, '–').replace(/&nbsp;/g, ' ').replace(/Know (him|her) better/g, '').replace(/\s+/g, ' ').trim();

function parseCards(fragment) {
  const out = [];
  const re = /eael-filterable-gallery-item-wrap ([^"\\]+)[\\"]+ data-search-key=[\\"]+([^"\\]+)[\s\S]*?(?:<a\s*(?:href=[\\"]+([^"\\]+))?[^>]*>\s*<h6[^>]*>([\s\S]*?)<\\?\/h6>)[\s\S]*?fg-item-content[\\"]+>([\s\S]*?)<\\?\/div>/g;
  let m;
  while ((m = re.exec(fragment))) {
    const cats = m[1].split(/\s+/).filter(c => c.startsWith('eael-cf-')).map(c => c.replace('eael-cf-', ''));
    out.push({
      name: strip(m[4].replace(/\\\//g, '/')),
      designation: strip(m[5].replace(/\\n/g, ' ').replace(/\\\//g, '/')),
      url: m[3] ? m[3].replace(/\\\//g, '/') : null,
      categories: cats,
    });
  }
  return out;
}

// 1. visible cards in HTML
let cards = parseCards(html);
// 2. hidden "load more" cards in base64 payload
const b64 = html.match(/data-gallery-items="([^"]+)"/);
if (b64) {
  const arr = JSON.parse(Buffer.from(b64[1], 'base64').toString('utf8'));
  cards = cards.concat(parseCards(arr.join('\n')));
}

// dedupe by name
const seen = new Set();
cards = cards.filter(c => (seen.has(c.name) ? false : seen.add(c.name)));

// 3. enrich from scraped profile pages (layouts vary, so locate the name line)
const norm = s => s.toLowerCase().replace(/^(dr|prof|ar|mr|ms|mrs)\.?\s*/g, '').replace(/[^a-z]/g, '');
const DEGREE = /(B\.\s?Arch|BArch|B\.E\b|BE civil|B\.F\.A|M\.Arch|MArch|Ph\.D|M\.Tech|M\.Sc|M\.U\.P|M\.U\.R\.P|MLA|Master)/i;
const pages = fs.readdirSync(path.join(ROOT, 'pages')).filter(p => p.startsWith('faculty_'));
const profileBySource = {};
for (const f of pages) {
  const L = fs.readFileSync(path.join(ROOT, 'pages', f), 'utf8').split('\n');
  const src = L[0].replace('SOURCE: ', '').trim();
  const fin = L[1].replace('FINAL: ', '').trim();
  const body = L.slice(4);
  const spec = body.find(l => /^Specialisation and interest/i.test(l));
  profileBySource[src] = profileBySource[fin] = { source: src, body, specialisation: spec ? spec.replace(/^Specialisation and interest:\s*/i, '').trim() : null };
}
function enrich(target, p, nameKey) {
  const i = p.body.findIndex(l => norm(l) === nameKey);
  if (i < 0) return false;
  const next = p.body.slice(i + 1, i + 5);
  if (!target.designation && next[0] && next[0].length < 60 && !DEGREE.test(next[0])) target.designation = next[0];
  const q = next.find(l => DEGREE.test(l) && l.length < 220 && !/linkedin/i.test(l));
  if (q) target.qualification = q.replace(/\s*Linkedin.*$/i, '').trim();
  if (p.specialisation) target.specialisation = p.specialisation;
  return true;
}
for (const c of cards) {
  const p = c.url && profileBySource[c.url];
  if (p) enrich(c, p, norm(c.name));
}

// 4. profiles supplied by the user but absent from the directory widget
for (const [src, p] of Object.entries(profileBySource)) {
  if (src !== p.source) continue;
  if (cards.some(c => c.url === src)) continue;
  const slugKey = norm(src.replace(/\/$/, '').split('/').pop().replace(/[-_]/g, ' '));
  const nameLine = p.body.find(l => norm(l) === slugKey);
  if (!nameLine || cards.some(c => norm(c.name) === slugKey)) continue;
  const m = { name: nameLine, designation: '', url: src, categories: ['b-arch'], note: 'Profile page on rvca.edu.in (not shown in current directory grid)' };
  enrich(m, p, slugKey);
  cards.push(m);
}

fs.writeFileSync(path.join(ROOT, 'faculty.json'), JSON.stringify(cards, null, 2));
fs.writeFileSync(path.join(__dirname, 'faculty_urls.json'), JSON.stringify(cards.map(c => c.url).filter(Boolean), null, 2));
const by = cards.reduce((a, c) => ((c.categories.join('/') in a ? a[c.categories.join('/')]++ : (a[c.categories.join('/')] = 1)), a), {});
console.log(`faculty.json: ${cards.length} members`, by);
for (const c of cards) console.log(`${c.categories.join('/')}\t${c.name}\t${c.designation}\t${c.url || '-'}`);
