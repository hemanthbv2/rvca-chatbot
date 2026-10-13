/**
 * RVCA Link Audit Script (scripts/audit_links.js)
 * Recursively extracts every URL in knowledge-base.js and faculty-data.js,
 * performs HTTP HEAD/GET checks with timeout and retry, ensuring 100% reachability.
 * Usage: node scripts/audit_links.js
 */

const KB = require('../knowledge-base.js');
const FACULTY = require('../faculty-data.js');

function extractUrls(obj, gathered = new Set()) {
  if (!obj) return gathered;
  if (typeof obj === 'string') {
    if (/^https?:\/\//i.test(obj)) {
      gathered.add(obj.trim());
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) extractUrls(item, gathered);
  } else if (typeof obj === 'object') {
    for (const val of Object.values(obj)) extractUrls(val, gathered);
  }
  return gathered;
}

async function checkUrl(url, timeoutMs = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Try HEAD first
    let res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal,
      redirect: 'follow'
    }).catch(() => null);

    // If HEAD not allowed or 404/405/403, try GET range
    if (!res || res.status === 405 || res.status === 403 || res.status === 404) {
      res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Range': 'bytes=0-1024'
        },
        signal: controller.signal,
        redirect: 'follow'
      }).catch(() => null);
    }

    clearTimeout(timer);
    return {
      url,
      status: res ? res.status : 0,
      ok: res ? (res.status >= 200 && res.status < 400) : false
    };
  } catch (err) {
    clearTimeout(timer);
    return { url, status: 0, ok: false, error: err.message };
  }
}

async function runAudit() {
  console.log('=== RVCA Knowledge Base Link Reachability Audit ===\n');

  const allUrls = Array.from(extractUrls({ KB, FACULTY }));
  console.log(`Found ${allUrls.length} unique URLs in knowledge base and faculty directory.\n`);

  let passed = 0;
  let failed = 0;
  const broken = [];

  // Concurrency limit of 5
  const concurrency = 5;
  const queue = [...allUrls];

  async function worker() {
    while (queue.length > 0) {
      const u = queue.shift();
      const res = await checkUrl(u);
      if (res.ok) {
        passed++;
        console.log(`[PASS] ${res.status} : ${u}`);
      } else {
        // Retry once
        const retry = await checkUrl(u, 30000);
        if (retry.ok) {
          passed++;
          console.log(`[PASS (Retry)] ${retry.status} : ${u}`);
        } else {
          failed++;
          broken.push({ url: u, status: retry.status, error: retry.error });
          console.log(`[FAIL] ${retry.status} : ${u}`);
        }
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  console.log('\n=============================================');
  console.log(`Audit Summary: ${passed} Passed, ${failed} Failed out of ${allUrls.length}`);
  console.log('=============================================\n');

  if (failed > 0) {
    console.error('Broken Links Found:', broken);
    process.exit(1);
  } else {
    console.log('100% Link Reachability Verified (0 Broken Links)!');
  }
}

runAudit();
