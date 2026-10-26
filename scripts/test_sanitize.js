function sanitizeAcronyms(text) {
  if (!text) return '';
  let s = text.toLowerCase();

  // Handle specific spaced forms first
  s = s.replace(/\bb\.?\s*arch\b/gi, 'barch')
       .replace(/\bm\.?\s*arch\b/gi, 'march')
       .replace(/\bph\.?\s*d\.?\b/gi, 'phd')
       .replace(/\bcomed\s*[- ]\s*k\b/gi, 'comedk');

  // Strip all dots from acronyms: e.g. "m.o.u." -> "mou", "s.a.a.r." -> "saar", "p.g.c.e.t." -> "pgcet"
  // If a word is composed of single letters separated by dots:
  s = s.replace(/(?:^|[^a-z0-9])([a-z]\.(?:[a-z]\.)+[a-z]?)(?:$|[^a-z0-9])/gi, (match, acronym) => {
    return match.replace(acronym, acronym.replace(/\./g, ''));
  });

  // Also clean any leftover dotted single letter sequences like "c.o.a" -> "coa"
  s = s.replace(/\b([a-z])\.([a-z])\.([a-z])\.([a-z])\.([a-z])\b/gi, '$1$2$3$4$5')
       .replace(/\b([a-z])\.([a-z])\.([a-z])\.([a-z])\b/gi, '$1$2$3$4')
       .replace(/\b([a-z])\.([a-z])\.([a-z])\b/gi, '$1$2$3')
       .replace(/\b([a-z])\.([a-z])\b/gi, '$1$2');

  // Clean trailing dots after 2-6 letter acronyms at word boundaries
  s = s.replace(/\b(mou|saar|udrcc|barch|march|phd|coa|vtu|kea|kcet|comedk|pgcet|nata|jee|rsst|rvei|rvca|rvce|nirf|naac|ugc|aicte|posh|icc|nss|ncc|nasa|gis|iia|unai|icomos|isro|iirs|uaa|acsa)\./gi, '$1');

  // Common plural acronyms
  s = s.replace(/\bmous\b/gi, 'mou');

  return s;
}

const tests = [
  'MOU', 'm.o.u', 'm.o.u.', 'M.O.U.',
  'SAAR', 's.a.a.r', 's.a.a.r.',
  'UDRCC', 'u.d.r.c.c', 'u.d.r.c.c.',
  'B.Arch', 'b.arch', 'B. Arch', 'b arch',
  'M.Arch', 'm.arch', 'M. Arch', 'm arch',
  'Ph.D', 'ph.d', 'Ph. D', 'ph d', 'Ph.D.',
  'COA', 'c.o.a', 'c.o.a.',
  'VTU', 'v.t.u', 'v.t.u.',
  'KCET', 'k.c.e.t', 'k.c.e.t.',
  'COMEDK', 'c.o.m.e.d.k', 'comed-k',
  'PGCET', 'p.g.c.e.t', 'p.g.c.e.t.',
  'NATA', 'n.a.t.a', 'n.a.t.a.',
  'JEE', 'j.e.e', 'j.e.e.',
  'RSST', 'r.s.s.t', 'r.s.s.t.',
  'RVEI', 'r.v.e.i', 'r.v.e.i.',
  'RVCA', 'r.v.c.a', 'r.v.c.a.',
  'NIRF', 'n.i.r.f', 'n.i.r.f.',
  'NAAC', 'n.a.a.c', 'n.a.a.c.',
  'NCC', 'n.c.c', 'n.c.c.',
  'NSS', 'n.s.s', 'n.s.s.',
  'POSH', 'p.o.s.h', 'p.o.s.h.',
  'ICC', 'i.c.c', 'i.c.c.',
  'NASA', 'n.a.s.a', 'n.a.s.a.',
  'GIS', 'g.i.s', 'g.i.s.',
  'IIA', 'i.i.a', 'i.i.a.',
  'UNAI', 'u.n.a.i', 'u.n.a.i.',
  'ICOMOS', 'i.c.o.m.o.s', 'i.c.o.m.o.s.',
  'ISRO', 'i.s.r.o', 'i.s.r.o.',
  'IIRS', 'i.i.r.s', 'i.i.r.s.'
];

let failed = 0;
tests.forEach(t => {
  const res = sanitizeAcronyms(t);
  const ok = /^[a-z0-9]+$/.test(res);
  console.log(`${t.padEnd(15)} -> ${res} ${ok ? '✓' : '✗'}`);
  if (!ok) failed++;
});
console.log(`\nResult: ${tests.length - failed}/${tests.length} passed.`);
