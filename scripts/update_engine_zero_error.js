const fs = require('fs');
const path = require('path');

const enginePath = path.join(__dirname, '..', 'engine.js');
let code = fs.readFileSync(enginePath, 'utf8');

// 1. UPDATE STOP_WORDS
const oldStopWords = `    'describe', 'regarding', 'pertaining', 'say', 'talk', 'question', 'queries', 'query'
  ]);`;

const newStopWords = `    'describe', 'regarding', 'pertaining', 'say', 'talk', 'question', 'queries', 'query',
    'college', 'institution', 'campus', 'pls', 'plz', 'sir', 'madam', 'whats', 'looking',
    'interested', 'available', 'check', 'find', 'see', 'let', 'ask', 'where', 'when', 'which',
    'can you', 'tell me', 'i want to know', 'give me', 'show me'
  ]);`;

if (code.includes(oldStopWords)) {
  code = code.replace(oldStopWords, newStopWords);
  console.log("Updated STOP_WORDS");
} else {
  console.log("Warning: oldStopWords not found");
}

// 2. UPDATE sanitizeAcronyms
const oldSanitizeRegex = /function sanitizeAcronyms\(text\) \{[\s\S]*?\n  \}/;
const newSanitize = `function sanitizeAcronyms(text) {
    if (!text) return '';
    let s = text.toLowerCase();

    // Spaced forms first
    s = s.replace(/\\bb\\.?\\s*arch\\b/gi, 'barch')
         .replace(/\\bm\\.?\\s*arch\\b/gi, 'march')
         .replace(/\\bph\\.?\\s*d\\.?\\b/gi, 'phd')
         .replace(/\\bcomed\\s*[- ]\\s*k\\b/gi, 'comedk');

    // Strip all dots from acronyms: e.g. "m.o.u." -> "mou", "s.a.a.r." -> "saar", "p.g.c.e.t." -> "pgcet"
    s = s.replace(/(?:^|[^a-z0-9])([a-z]\\.(?:[a-z]\\.)+[a-z]?)(?:$|[^a-z0-9])/gi, (match, acronym) => {
      return match.replace(acronym, acronym.replace(/\\./g, ''));
    });

    // Clean leftover dotted single letter sequences like "c.o.a" -> "coa"
    s = s.replace(/\\b([a-z])\\.([a-z])\\.([a-z])\\.([a-z])\\.([a-z])\\b/gi, '$1$2$3$4$5')
         .replace(/\\b([a-z])\\.([a-z])\\.([a-z])\\.([a-z])\\b/gi, '$1$2$3$4')
         .replace(/\\b([a-z])\\.([a-z])\\.([a-z])\\b/gi, '$1$2$3')
         .replace(/\\b([a-z])\\.([a-z])\\b/gi, '$1$2');

    // Clean trailing dots after 2-6 letter acronyms at word boundaries
    s = s.replace(/\\b(mou|saar|udrcc|barch|march|phd|coa|vtu|kea|kcet|comedk|pgcet|nata|jee|rsst|rvei|rvca|rvce|nirf|naac|ugc|aicte|posh|icc|nss|ncc|nasa|gis|iia|unai|icomos|isro|iirs|uaa|acsa)\\./gi, '$1');

    // Common plural acronyms
    s = s.replace(/\\bmous\\b/gi, 'mou');

    return s;
  }`;

if (oldSanitizeRegex.test(code)) {
  code = code.replace(oldSanitizeRegex, newSanitize);
  console.log("Updated sanitizeAcronyms");
} else {
  console.log("Warning: oldSanitizeRegex not matched");
}

// 3. UPDATE findFacultyMatches (Entrance exam / acronym shield)
const oldShield = `if (/\\b(fees|fee|tuition|cost|hostel|hostels|mess|placement|placements|admission|admissions|apply|eligibility|cutoff|cutoffs|syllabus|curriculum|antiragging|ragging)\\b/i.test(clean)) {`;
const newShield = `if (/\\b(fees|fee|tuition|cost|hostel|hostels|mess|placement|placements|admission|admissions|apply|eligibility|cutoff|cutoffs|syllabus|curriculum|antiragging|ragging|jee|nata|kcet|comedk|pgcet|gate|mou|saar|udrcc|coa|vtu|barch|march|phd|nirf|naac|ncc|nss|posh|icc)\\b/i.test(clean)) {`;

if (code.includes(oldShield)) {
  code = code.replace(oldShield, newShield);
  console.log("Updated findFacultyMatches shield");
} else {
  console.log("Warning: oldShield not found");
}

// 4. UPDATE resolveCompositeIntent hostel fees
const oldHostelFees = `if (/\\b(hostel|mess)\\b/i.test(combined) && hasFees) return "hostels";`;
const newHostelFees = `if (/\\b(hostel fees?|mess fees?|hostel charges?|mess charges?)\\b/i.test(combined)) return "hostels";`;

if (code.includes(oldHostelFees)) {
  code = code.replace(oldHostelFees, newHostelFees);
  console.log("Updated resolveCompositeIntent hostel fees");
} else {
  console.log("Warning: oldHostelFees not found");
}

// 5. UPDATE about_rvca & how_to_reach_location keywords
const oldAboutKw = `keywords: ["about rvca", "history", "established", "vision", "mission", "background", "institution"],`;
const newAboutKw = `keywords: ["about rvca", "history", "established", "vision", "mission", "background", "institution", "coa", "council of architecture", "vtu", "nirf", "naac", "ranking", "rankings", "affiliation", "accreditation"],`;

if (code.includes(oldAboutKw)) {
  code = code.replace(oldAboutKw, newAboutKw);
  console.log("Updated about_rvca keywords");
}

const oldReachKw = `keywords: ["how to reach", "nearest metro", "metro connectivity", "bus connectivity", "location details", "directions to campus", "how to visit campus", "nearest metro station", "location of rvca"],`;
const newReachKw = `keywords: ["how to reach", "nearest metro", "metro connectivity", "bus connectivity", "location details", "directions to campus", "how to visit campus", "nearest metro station", "location of rvca", "where is the college located", "where is rvca", "where is the college", "located", "directions", "reach", "route"],`;

if (code.includes(oldReachKw)) {
  code = code.replace(oldReachKw, newReachKw);
  console.log("Updated how_to_reach_location keywords");
}

// 6. UPDATE ConversationSession constructor to add pendingOverflows
const oldSessionConstructor = `  class ConversationSession {
    constructor() {
      this.lastIntent = null;
      this.lastCategory = null;
      this.history = [];
    }`;

const newSessionConstructor = `  class ConversationSession {
    constructor() {
      this.lastIntent = null;
      this.lastCategory = null;
      this.history = [];
      this.pendingOverflows = [];
    }`;

if (code.includes(oldSessionConstructor)) {
  code = code.replace(oldSessionConstructor, newSessionConstructor);
  console.log("Updated ConversationSession");
}

// 7. UPDATE INTENT_LABELS mappings
code = code.replace('"udrcc": "consultancy_cell",', '"udrcc": "research_udrcc",');
code = code.replace('"udrcc": "smart_city_research",', '"udrcc": "research_udrcc",');
code = code.replace('"pottery": "club_terra",', '"pottery": "lab_pottery",');
code = code.replace('"clay": "club_terra",', '"clay": "lab_pottery",');

// Ensure INTENT_LABELS contains all required single words
const intentLabelsAddition = `    "director": "dean",
    "dean": "dean",
    "principal": "principal",
    "coa": "about_rvca",
    "vtu": "about_rvca",
    "nirf": "about_rvca",
    "naac": "about_rvca",
    "jee": "barch_eligibility",
    "kea": "admissions_overview",
    "admission": "admissions_overview",
    "placement": "placements",
    "ncc": "committees",
    "nss": "committees",
    "posh": "committees",
    "icc": "committees",
    "located": "how_to_reach_location",
    "directions": "how_to_reach_location",
    "reach": "how_to_reach_location",
    "route": "how_to_reach_location",
    "timings": "timings_and_schedule",
    "timing": "timings_and_schedule",
    "schedule": "timings_and_schedule",
    "hours": "timings_and_schedule",
    "tour": "study_tours",
    "tours": "study_tours",
    "visit": "site_visits",
    "visits": "site_visits",
    "pottery club": "club_terra",
    "clay club": "club_terra",
    "terra thoughts": "club_terra",`;

const targetLocation = `"location": "how_to_reach_location",`;
if (code.includes(targetLocation) && !code.includes('"coa": "about_rvca"')) {
  code = code.replace(targetLocation, `${intentLabelsAddition}\n    "location": "how_to_reach_location",`);
  console.log("Added new mappings to INTENT_LABELS");
}

// 8. UPDATE classify() function with sanitized bypass, multi-clause splitting, and post-grammar bypass
const oldSanitizedBlock = `    // 4. DOT-STRIPPING & ACRONYM SANITIZATION
    const sanitized = sanitizeAcronyms(raw);`;

const newSanitizedBlock = `    // 4. DOT-STRIPPING & ACRONYM SANITIZATION
    const sanitized = sanitizeAcronyms(raw);

    // 4.1 DIRECT SANITIZED ACRONYM BYPASS (0ms Zero Error)
    const sanitizedKey = sanitized.trim();
    if (INTENT_LABELS[sanitizedKey]) {
      const intentObj = INTENTS.find(i => i.id === INTENT_LABELS[sanitizedKey]);
      if (intentObj) {
        session.update(intentObj.id, raw);
        return {
          intentId: intentObj.id,
          title: intentObj.title,
          response: intentObj.response,
          chips: intentObj.chips,
          overflow: [],
          latencyMs: parseFloat((performance.now() - startTime).toFixed(2)),
          isDirectBypass: true
        };
      }
    }

    // 8.1 MULTI-CLAUSE QUERY SPLITTER & OVERFLOW (RVCE Architecture Standard)
    // Splits queries like "tell me about fees and hostel", "what is mou and what are research projects"
    const hasConjunction = /\\b(and|&|also|as well as|\\+|along with)\\b|,/i.test(sanitized);
    if (hasConjunction) {
      const clauses = sanitized.split(/\\s+(?:and|&|also|as well as|\\+|along with)\\s+|,|\\;|\\?+/i).map(c => c.trim()).filter(Boolean);
      if (clauses.length > 1) {
        const detectedClauseIntents = [];
        for (const clause of clauses) {
          if (!clause) continue;
          const cTokens = clause.split(/[^a-z0-9_-]+/i).filter(t => !PROTECTED_TOKENS.has(t) && !STOP_WORDS.has(t)).map(correctTypo);
          const cProcessed = cTokens.join(' ');
          let clauseIntentId = INTENT_LABELS[clause] || INTENT_LABELS[cProcessed] || (cTokens.length === 1 ? INTENT_LABELS[cTokens[0]] : null);

          if (!clauseIntentId) {
            clauseIntentId = resolveCompositeIntent(clause, cTokens);
          }
          if (!clauseIntentId) {
            for (const item of INTENTS) {
              if (item.keywords.some(kw => clause.includes(kw) || cTokens.includes(kw))) {
                clauseIntentId = item.id;
                break;
              }
            }
          }

          if (clauseIntentId && !detectedClauseIntents.some(d => d.id === clauseIntentId)) {
            const obj = INTENTS.find(i => i.id === clauseIntentId);
            if (obj) detectedClauseIntents.push(obj);
          }
        }

        if (detectedClauseIntents.length > 1) {
          const primary = detectedClauseIntents[0];
          const overflow = detectedClauseIntents.slice(1).map(i => ({
            id: i.id,
            label: i.title,
            chipText: i.title
          }));

          session.update(primary.id, raw);
          if (session.pendingOverflows) {
            session.pendingOverflows = overflow.map(o => o.id);
          }

          return {
            intentId: primary.id,
            title: primary.title,
            response: primary.response,
            chips: primary.chips,
            overflow: overflow,
            latencyMs: parseFloat((performance.now() - startTime).toFixed(2))
          };
        }
      }
    }`;

if (code.includes(oldSanitizedBlock)) {
  code = code.replace(oldSanitizedBlock, newSanitizedBlock);
  console.log("Updated classify with sanitized bypass and multi-clause splitter");
}

// 9. UPDATE post-grammar removal bypass in classify()
const oldCleanedBlock = `    const processedQuery = cleanedTokens.join(' ');

    // 6. COMPOSITE INTENT RESOLUTION MATRIX (Check explicit compound terms first)`;

const newCleanedBlock = `    const processedQuery = cleanedTokens.join(' ');

    // 2.1 DIRECT POST-GRAMMAR SINGLE-WORD / PROCESSED QUERY BYPASS (Zero Error)
    // Resolves queries like "can you please give me mou details" -> cleanedTokens: ['mou'] -> direct hit!
    if (INTENT_LABELS[processedQuery]) {
      const intentObj = INTENTS.find(i => i.id === INTENT_LABELS[processedQuery]);
      if (intentObj) {
        session.update(intentObj.id, raw);
        return {
          intentId: intentObj.id,
          title: intentObj.title,
          response: intentObj.response,
          chips: intentObj.chips,
          overflow: [],
          latencyMs: parseFloat((performance.now() - startTime).toFixed(2)),
          isDirectBypass: true
        };
      }
    }
    if (cleanedTokens.length === 1 && INTENT_LABELS[cleanedTokens[0]]) {
      const intentObj = INTENTS.find(i => i.id === INTENT_LABELS[cleanedTokens[0]]);
      if (intentObj) {
        session.update(intentObj.id, raw);
        return {
          intentId: intentObj.id,
          title: intentObj.title,
          response: intentObj.response,
          chips: intentObj.chips,
          overflow: [],
          latencyMs: parseFloat((performance.now() - startTime).toFixed(2)),
          isDirectBypass: true
        };
      }
    }

    // 6. COMPOSITE INTENT RESOLUTION MATRIX (Check explicit compound terms first)`;

if (code.includes(oldCleanedBlock)) {
  code = code.replace(oldCleanedBlock, newCleanedBlock);
  console.log("Updated classify with post-grammar single-word bypass");
}

// 10. Also update pendingOverflows in Step 8
const oldStep8Update = `      session.update(primary.id, raw);

      return {
        intentId: primary.id,`;

const newStep8Update = `      session.update(primary.id, raw);
      if (session.pendingOverflows) {
        session.pendingOverflows = overflow.map(o => o.id);
      }

      return {
        intentId: primary.id,`;

if (code.includes(oldStep8Update)) {
  code = code.replace(oldStep8Update, newStep8Update);
  console.log("Updated Step 8 overflow tracking");
}

fs.writeFileSync(enginePath, code, 'utf8');
console.log("engine.js successfully updated!");
