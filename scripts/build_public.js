/**
 * Build script: copies all client-side static assets into /public so that
 * Vercel serves them directly from its CDN (with correct MIME types).
 * Vercel ignores express.static() inside serverless functions, so without
 * this step /chatbot.js would be answered with index.html and the widget
 * (FAB button) would never mount.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public');

const FILES = [
  'index.html',
  'chatbot.js',
  'chatbot.css',
  'engine.js',
  'telemetry.js',
  'knowledge-base.js',
  'faculty-data.js',
  'palette.json'
];
const DIRS = ['dashboard'];

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

for (const f of FILES) {
  const src = path.join(ROOT, f);
  if (!fs.existsSync(src)) {
    console.error(`[build] Missing required file: ${f}`);
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(OUT, f));
}
for (const d of DIRS) {
  const src = path.join(ROOT, d);
  if (fs.existsSync(src)) copyDir(src, path.join(OUT, d));
}

console.log(`[build] Static assets copied to ${OUT}`);
