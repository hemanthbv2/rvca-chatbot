/**
 * RVCA Scraper — fetches every official RVCA URL, stores raw HTML (data/raw)
 * and clean readable text (data/pages) plus a link inventory (data/links.json).
 * Usage: node scripts/scrape.js
 */
const fs = require('fs');
const path = require('path');

const URLS = [
  'https://rvca.edu.in/',
  'https://rvca.edu.in/about-rvca',
  'https://rvca.edu.in/board-of-management/',
  'https://rvca.edu.in/achievements/',
  'https://rvca.edu.in/collaborations/',
  'https://rvca.edu.in/statutory-compliance/',
  'https://rvca.edu.in/programmes/',
  'https://rvca.edu.in/admission/',
  'https://rvca.edu.in/awards/',
  'https://rvca.edu.in/infrastructure/',
  'https://rvca.edu.in/placement/',
  'https://rvca.edu.in/clubs/',
  'https://rvca.edu.in/events/',
  'https://rvca.edu.in/rvca_publications/',
  'https://rvca.edu.in/research/',
  'https://rvca.edu.in/consultancy-cell/',
  'https://rvca.edu.in/contact-us/',
  'https://rvca.edu.in/career/',
  'https://rvca.edu.in/infrastructure/SKILL%20LABS/',
  'https://rvca.edu.in/infrastructure/STUDY%20TOUR/',
  'https://rvca.edu.in/infrastructure/SITE%20VISITS/',
  'https://rvca.edu.in/infrastructure/ACADEMIC%20INDUSTRIAL%20INTERACTIONS/',
  'https://rvca.edu.in/infrastructure/library/',
  'https://rvca.edu.in/infrastructure/multipurpose-and-seminar-hall/',
  'https://rvca.edu.in/infrastructure/experiential-learning-spaces/',
  'https://rvca.edu.in/infrastructure/hostel/',
  'https://rvca.edu.in/infrastructure/physical-education/',
  'https://rvca.edu.in/infrastructure/canteen/',
  'https://rvca.edu.in/infrastructure/social-outreach/',
  'https://rvca.edu.in/infrastructure/on-campus-doctor-and-counselling-cell/',
  'https://rvca.edu.in/clubs/Book%20Club/',
  'https://rvca.edu.in/clubs/Dance%20Club/',
  'https://rvca.edu.in/clubs/Drama%20Club/',
  'https://rvca.edu.in/clubs/Music%20Club/',
  'https://rvca.edu.in/clubs/Heritage%20Club/',
  'https://rvca.edu.in/clubs/health-and-wellness-club/',
  'https://rvca.edu.in/clubs/sustainability-club/',
  'https://rvca.edu.in/clubs/art-club/',
  'https://rvca.edu.in/clubs/sports-club/',
  'https://rvca.edu.in/clubs/quiz-club/',
  'https://rvca.edu.in/clubs/terra-thoughts/',
  'https://rvca.edu.in/clubs/the-journey-shared/',
  'https://rvca.edu.in/clubs/trail/',
  'https://rvca.edu.in/faculty/',
  'https://rvca.edu.in/faculty/dr-om-prakash-bawane/',
  'https://rvca.edu.in/faculty/dr-rakesh-k-s/',
  'https://rvca.edu.in/faculty/suresh-k-murthy/',
  'https://rvca.edu.in/faculty/k-sreedhar/',
  'https://rvca.edu.in/faculty/anuradha-dinesha/',
  'https://rvca.edu.in/faculty/phani-ram-pingali/',
  'https://rvca.edu.in/faculty/arun-swaminathan/',
  'https://rvca.edu.in/faculty/prasanna-rao/',
  'https://rvca.edu.in/faculty/dr-m-s-amarnath/',
  'https://rvca.edu.in/faculty/dr-mahalakshmi-karnad/',
  'https://rvca.edu.in/faculty/dr-h-r-manjunath/',
  'https://rvca.edu.in/faculty/girish-ramanathan/',
  'https://rvca.edu.in/faculty/seema-maiya-u/',
  'https://rvca.edu.in/faculty/bikramjit-chakraborty/',
  'https://rvca.edu.in/faculty/anupriya-saxena/',
  'https://rvca.edu.in/faculty/archana-vittal/',
  'https://rvca.edu.in/faculty/nishant/',
  'https://rvca.edu.in/faculty/pedaparthi-shweta/',
  'https://rvca.edu.in/faculty/vidya-v/',
  'https://rvca.edu.in/faculty/dr-shikha-verma/',
  'https://rvca.edu.in/faculty/mayank-singh/',
  'https://rvca.edu.in/faculty/hiranmayi-shankavaram/',
  'https://rvca.edu.in/faculty/ramya-krishna/',
  'https://rvca.edu.in/faculty/akanksha-singh/',
  'https://rvca.edu.in/faculty/ajinkya-kanitkar/',
  'https://rvca.edu.in/faculty/pappu-harcharan/',
  'https://rvca.edu.in/faculty/megala-gurumurthi/',
  'https://rvca.edu.in/faculty/ujjayant-bhattacharyya/',
  'https://rvca.edu.in/faculty/dharshini-yg/',
  'https://rvca.edu.in/faculty/prakruthi-s-karadagi/',
  'https://rvca.edu.in/faculty/deepika-varadarajan/',
  'https://rvca.edu.in/faculty/ishani-gogoi/',
  'https://rvca.edu.in/faculty/archita-bandyopadhyay/',
  'https://rvca.edu.in/sports/inter_college_sports/',
  // Canonical pages discovered from site navigation (several supplied URLs return 404)
  'https://rvca.edu.in/about/',
  'https://rvca.edu.in/about_us/',
  'https://rvca.edu.in/about-rvca/dr_rakesh_k_s_/',
  'https://rvca.edu.in/board_of_management/',
  'https://rvca.edu.in/statutory_compliance/',
  'https://rvca.edu.in/consultancy_cell/',
  'https://rvca.edu.in/ugprogramme/',
  'https://rvca.edu.in/pgprogramme/',
  'https://rvca.edu.in/phdprogramme/',
  'https://rvca.edu.in/faqs/',
  'https://rvca.edu.in/ncc_nss/',
  'https://rvca.edu.in/nirf/',
  'https://rvca.edu.in/sports/',
  'https://rvca.edu.in/alumni/',
  'https://rvca.edu.in/circular-and-notification/',
  'https://rvca.edu.in/circular_and_notification/',
  'https://rvca.edu.in/nata-2026/',
  'https://rvca.edu.in/kalpa/',
  'https://rvca.edu.in/subversion/',
  'https://rvca.edu.in/newsletter/',
  'https://rvca.edu.in/gallery/',
  'https://rvca.edu.in/faculty/dr_rakesh_k_s/',
  'https://rvca.edu.in/faculty/dinesh_rao/',
  'https://rvca.edu.in/about/m_p_shyam/',
  'https://rvca.edu.in/about/a_v_s_murthy/',
  'https://rvca.edu.in/about/d_p_nagaraj/',
  'https://rvca.edu.in/programmes/ugprogramme/ug_2021_scheme__syllabus/',
  'https://rvca.edu.in/programmes/pgprogramme/pg-2022-2023-scheme-syllabus/',
];
// Second pass: profile URLs discovered by scripts/build_faculty.js
const FAC_FILE = path.join(__dirname, 'faculty_urls.json');
if (fs.existsSync(FAC_FILE)) {
  for (const u of JSON.parse(fs.readFileSync(FAC_FILE, 'utf8'))) if (!URLS.includes(u)) URLS.push(u);
}

const ROOT = path.join(__dirname, '..', 'data');
const RAW = path.join(ROOT, 'raw');
const PAGES = path.join(ROOT, 'pages');
[ROOT, RAW, PAGES].forEach(d => fs.mkdirSync(d, { recursive: true }));

function slugOf(url) {
  let p = decodeURIComponent(new URL(url).pathname).replace(/^\/|\/$/g, '');
  if (!p) p = 'home';
  return p.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;|&rsquo;|&lsquo;|&#8217;|&#8216;/g, "'")
    .replace(/&ldquo;|&rdquo;|&#8220;|&#8221;/g, '"')
    .replace(/&ndash;|&#8211;/g, '–').replace(/&mdash;|&#8212;/g, '—')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

function htmlToText(html) {
  let h = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  // keep link targets inline so we can audit them
  h = h.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, txt) => {
    const t = txt.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return ` ${t} [${href}] `;
  });
  h = h.replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/section|\/article|\/header|\/footer)[^>]*>/gi, '\n');
  h = h.replace(/<(td|th)[^>]*>/gi, ' | ');
  h = h.replace(/<[^>]+>/g, ' ');
  h = decodeEntities(h);
  return h.split('\n').map(l => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n');
}

function extractLinks(html, base) {
  const out = new Set();
  const re = /(?:href|src)=["']([^"'#]+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    try { out.add(new URL(m[1], base).href); } catch (_) {}
  }
  return [...out];
}

async function fetchWithRetry(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' },
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
      });
      return { status: res.status, finalUrl: res.url, html: await res.text() };
    } catch (e) {
      if (i === tries - 1) return { status: 0, error: e.message, html: '' };
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

(async () => {
  const index = [];
  const allLinks = {};
  const queue = [...URLS];
  const workers = Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const url = queue.shift();
      const slug = slugOf(url);
      const r = await fetchWithRetry(url);
      if (r.html && r.status === 200) {
        fs.writeFileSync(path.join(RAW, slug + '.html'), r.html);
        const title = (r.html.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1].trim();
        fs.writeFileSync(path.join(PAGES, slug + '.txt'), `SOURCE: ${url}\nFINAL: ${r.finalUrl}\nTITLE: ${decodeEntities(title)}\n\n` + htmlToText(r.html));
        allLinks[url] = extractLinks(r.html, r.finalUrl || url);
      }
      index.push({ url, slug, status: r.status, finalUrl: r.finalUrl, bytes: r.html.length, error: r.error });
      console.log(`${r.status}\t${r.html.length}\t${url}`);
    }
  });
  await Promise.all(workers);
  fs.writeFileSync(path.join(ROOT, 'index.json'), JSON.stringify(index, null, 2));
  fs.writeFileSync(path.join(ROOT, 'links.json'), JSON.stringify(allLinks, null, 2));
  console.log(`\nDone: ${index.filter(i => i.status === 200).length}/${URLS.length} OK`);
})();
