const engine = require('../engine.js');
const session = new engine.ConversationSession();

const queries = [
  'collaborations in rvca',
  'foreign universities exchange mou',
  'hafele industry tie up',
  'tell me about isro nodal centre',
  'consultancy cell udrcc',
  'shivamogga smart city project',
  'collaborations with bochum university',
  'daida global awards finalist',
  'who is hiranmayi',
  'tell me about ajinkya kanitkar',
  'heritage club activities',
  'pottery club kilns',
  'kalpa magazine vol 4',
  'subversion journal cfp 2026',
  'tensile structures workshop'
];

console.log('=== LIVE KEYWORD CLASSIFICATION AUDIT ===');
queries.forEach((q, idx) => {
  const res = engine.classify(q, session);
  console.log(`[#${idx + 1}] Query: "${q}"`);
  console.log(`     Intent:   ${res.intentId} (${res.title})`);
  console.log(`     Latency:  ${res.latencyMs} ms`);
  console.log(`     Response: ${res.response.split('\n')[0]}\n`);
});
