const Engine = require('../engine.js');

const singleWords = [
  "mou", "collaborations", "saar", "udrcc", "pottery", "fees", "fee", "hostel", "hostels",
  "nata", "placements", "admission", "admissions", "barch", "march", "phd", "library",
  "sports", "transport", "ranking", "contact", "address", "principal", "director", "dean",
  "faculty", "kalpa", "subversion", "clubs", "consultancy", "research", "scholarships",
  "cutoff", "daida", "bochum", "photovoice", "art", "dance", "drama", "music", "quiz",
  "cinema", "photography", "sustainability", "heritage", "gym", "canteen", "food", "mess",
  "syllabus", "curriculum", "eligibility", "management", "comedk", "kcet", "pgcet", "gate",
  "jee", "rsst", "rvei", "coa", "vtu", "nirf", "naac", "iia", "unai", "icomos", "isro",
  "iirs", "posh", "icc", "ragging", "antiragging", "achievements", "awards", "trophy",
  "internship", "internships", "globed", "workshops", "events"
];

const abbreviations = [
  "MOU", "m.o.u", "m.o.u.", "M.O.U.",
  "SAAR", "s.a.a.r", "s.a.a.r.", "S.A.A.R.",
  "UDRCC", "u.d.r.c.c", "u.d.r.c.c.", "U.D.R.C.C.",
  "IIA", "i.i.a", "i.i.a.",
  "UNAI", "u.n.a.i", "u.n.a.i.",
  "ICOMOS", "i.c.o.m.o.s", "i.c.o.m.o.s.",
  "IIRS", "i.i.r.s", "i.i.r.s.",
  "ISRO", "i.s.r.o", "i.s.r.o.",
  "B.Arch", "b.arch", "B. Arch", "b arch",
  "M.Arch", "m.arch", "M. Arch", "m arch",
  "Ph.D", "ph.d", "Ph. D", "ph d", "Ph.D.",
  "COA", "c.o.a", "c.o.a.",
  "VTU", "v.t.u", "v.t.u.",
  "KCET", "k.c.e.t", "k.c.e.t.",
  "COMEDK", "c.o.m.e.d.k", "comed-k",
  "PGCET", "p.g.c.e.t", "p.g.c.e.t.",
  "NATA", "n.a.t.a", "n.a.t.a.",
  "JEE", "j.e.e", "j.e.e.",
  "RSST", "r.s.s.t", "r.s.s.t.",
  "RVEI", "r.v.e.i", "r.v.e.i.",
  "RVCA", "r.v.c.a", "r.v.c.a.",
  "NIRF", "n.i.r.f", "n.i.r.f.",
  "NAAC", "n.a.a.c", "n.a.a.c.",
  "POSH", "p.o.s.h", "p.o.s.h.",
  "ICC", "i.c.c", "i.c.c.",
  "NSS", "n.s.s", "n.s.s.",
  "NCC", "n.c.c", "n.c.c.",
  "NASA", "n.a.s.a", "n.a.s.a.",
  "GIS", "g.i.s", "g.i.s."
];

const grammarWrapped = [
  "what is mou",
  "tell me about mou",
  "can you please give me mou details",
  "what is saar",
  "tell me about saar",
  "fees please",
  "can you tell me hostel",
  "give me hostel details",
  "what are the clubs",
  "explain pottery studio",
  "show me kalpa",
  "who is principal",
  "give me address",
  "tell me about udrcc",
  "what is subversion",
  "info on scholarships",
  "information regarding placements",
  "details of barch",
  "can i know about nata",
  "where is the college located",
  "how to reach rvca",
  "tell me about antiragging committee"
];

const multiIntentQueries = [
  "tell me about fees and hostel",
  "what is mou and what are research projects?",
  "fees and placements",
  "barch and march programs",
  "principal and dean",
  "tell me about library, canteen and sports"
];

console.log("=== 1. TESTING SINGLE WORDS ===");
let singleWordFails = 0;
singleWords.forEach(w => {
  const res = Engine.classify(w);
  if (!res || res.intentId === 'fallback_guidance') {
    console.log(`[FAIL single] "${w}" -> ${res ? res.intentId : 'null'}`);
    singleWordFails++;
  }
});
console.log(`Single words: ${singleWords.length - singleWordFails}/${singleWords.length} passed.`);

console.log("\n=== 2. TESTING ABBREVIATIONS ===");
let abbrFails = 0;
abbreviations.forEach(a => {
  const res = Engine.classify(a);
  if (!res || res.intentId === 'fallback_guidance') {
    console.log(`[FAIL abbr] "${a}" -> ${res ? res.intentId : 'null'}`);
    abbrFails++;
  }
});
console.log(`Abbreviations: ${abbreviations.length - abbrFails}/${abbreviations.length} passed.`);

console.log("\n=== 3. TESTING GRAMMAR-WRAPPED QUERIES ===");
let grammarFails = 0;
grammarWrapped.forEach(g => {
  const res = Engine.classify(g);
  if (!res || res.intentId === 'fallback_guidance') {
    console.log(`[FAIL grammar] "${g}" -> ${res ? res.intentId : 'null'}`);
    grammarFails++;
  }
});
console.log(`Grammar-wrapped: ${grammarWrapped.length - grammarFails}/${grammarWrapped.length} passed.`);

console.log("\n=== 4. TESTING MULTI-INTENT QUERIES ===");
let multiFails = 0;
multiIntentQueries.forEach(m => {
  const res = Engine.classify(m);
  const overflowCount = (res.overflow || []).length;
  console.log(`Query: "${m}" -> primary: ${res.intentId}, overflow: [${(res.overflow || []).map(o => o.id).join(', ')}]`);
  if (!res || res.intentId === 'fallback_guidance' || overflowCount === 0) {
    console.log(`[WARN multi] "${m}" -> primary: ${res.intentId}, overflow count: ${overflowCount}`);
    multiFails++;
  }
});
console.log(`Multi-intent: ${multiIntentQueries.length - multiFails}/${multiIntentQueries.length} passed.`);
