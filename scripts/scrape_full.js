/**
 * scrape_full.js — Discovers every page from Yoast sitemap and site links,
 * fetches HTML, and extracts clean markdown/text for each into data/pages.
 */
const fs = require('fs');
const path = require('path');

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
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

(async () => {
  console.log('Fetching sitemap...');
  const res = await fetch('https://rvca.edu.in/page-sitemap.xml');
  const xml = await res.text();
  const sitemapUrls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const junkPatterns = ['/shop', '/woo-', '/cart', '/my-account', '/checkout', '/test', '/content-carousel', '/dum', '/dummyy', '/ensure', '/grf'];
  const validUrls = sitemapUrls.filter(u => !junkPatterns.some(j => u.includes(j)));

  console.log(`Found ${validUrls.length} legitimate URLs on RVCA website.`);
  const queue = [...validUrls];
  let processed = 0;
  let fetchedNew = 0;

  const workers = Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const url = queue.shift();
      const slug = slugOf(url);
      const txtPath = path.join(PAGES, slug + '.txt');
      const rawPath = path.join(RAW, slug + '.html');

      if (fs.existsSync(txtPath) && fs.existsSync(rawPath) && fs.statSync(txtPath).size > 100) {
        processed++;
        continue;
      }

      const r = await fetchWithRetry(url);
      if (r && r.status === 200 && r.html) {
        fs.writeFileSync(rawPath, r.html);
        const title = (r.html.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1].trim();
        fs.writeFileSync(txtPath, `SOURCE: ${url}\nFINAL: ${r.finalUrl || url}\nTITLE: ${decodeEntities(title)}\n\n` + htmlToText(r.html));
        fetchedNew++;
        console.log(`[+Fetched] ${slug} (${url})`);
      } else {
        console.log(`[-Failed] ${slug} (${url}) Status: ${r ? r.status : 'error'}`);
      }
      processed++;
    }
  });

  await Promise.all(workers);
  console.log(`\nCompleted! Total checked: ${processed}, Newly extracted: ${fetchedNew}`);
})();
