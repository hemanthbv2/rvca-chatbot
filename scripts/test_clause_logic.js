const Engine = require('../engine.js');

function testMultiClause(raw) {
  const clauses = raw.split(/\s+(?:and|&|also|as well as|\+|along with)\s+|,|\;|\?+/i).map(c => c.trim()).filter(Boolean);
  const matched = [];
  for (const clause of clauses) {
    if (!clause) continue;
    // Classify clause directly
    const res = Engine.classify(clause);
    if (res && res.intentId && res.intentId !== 'fallback_guidance' && !matched.some(m => m.id === res.intentId)) {
      matched.push({ id: res.intentId, title: res.title });
    }
  }
  return matched;
}

const tests = [
  "tell me about fees and hostel",
  "what is mou and what are research projects?",
  "fees and placements",
  "barch and march programs",
  "principal and dean",
  "tell me about library, canteen and sports"
];

tests.forEach(t => {
  const m = testMultiClause(t);
  console.log(`Query: "${t}" -> Matched:`, m.map(x => x.id).join(', '));
});
