/**
 * Build script: copies all client-side static assets into /public and /rvca-institutional-chatbot
 * and packages rvca-institutional-chatbot.zip for seamless WordPress installation.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT_PUBLIC = path.join(ROOT, 'public');
const OUT_WP = path.join(ROOT, 'rvca-institutional-chatbot');
const ZIP_OUT = path.join(ROOT, 'rvca-institutional-chatbot.zip');

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

const WP_FILES = [
  'chatbot.js',
  'chatbot.css',
  'engine.js',
  'telemetry.js',
  'knowledge-base.js',
  'faculty-data.js',
  'palette.json',
  'rvca-chatbot.php'
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

// 1. Sync /public
fs.rmSync(OUT_PUBLIC, { recursive: true, force: true });
fs.mkdirSync(OUT_PUBLIC, { recursive: true });

for (const f of FILES) {
  const src = path.join(ROOT, f);
  if (!fs.existsSync(src)) {
    console.error(`[build] Missing required file: ${f}`);
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(OUT_PUBLIC, f));
}
for (const d of DIRS) {
  const src = path.join(ROOT, d);
  if (fs.existsSync(src)) copyDir(src, path.join(OUT_PUBLIC, d));
}
console.log(`[build] Static assets copied to ${OUT_PUBLIC}`);

// 2. Sync /rvca-institutional-chatbot
fs.mkdirSync(OUT_WP, { recursive: true });
for (const f of WP_FILES) {
  const src = path.join(ROOT, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(OUT_WP, f));
  }
}
console.log(`[build] WordPress plugin files synced to ${OUT_WP}`);

// 3. Package rvca-institutional-chatbot.zip
try {
  if (fs.existsSync(ZIP_OUT)) {
    fs.unlinkSync(ZIP_OUT);
  }
  execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${OUT_WP}' -DestinationPath '${ZIP_OUT}' -Force"`, { cwd: ROOT });
  console.log(`[build] Successfully built ${ZIP_OUT}`);
} catch (err) {
  console.warn(`[build] Note on zip packaging: ${err.message}`);
}
