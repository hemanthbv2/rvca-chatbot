/**
 * RVCA Algorithmic NLP Benchmark Suite (scripts/benchmark_test.js)
 * 50+ Rigorous Test Cases covering Conversational, Governance, Admissions,
 * Placements, Academics, Composite Resolution, Typo Tolerance, Moderation,
 * Multi-Turn Memory, Negation Shield, and 0ms Button Bypass.
 * Requires 100% pass rate and <5ms average latency.
 */

const engine = require('../engine.js');

const TEST_CASES = [
  // 1. Conversational, Greetings & Fluff
  { query: "", expectedIntent: "greeting", category: "Conversational" },
  { query: "hello", expectedIntent: "greeting", category: "Conversational" },
  { query: "please tell me some information about rvca", expectedIntent: "about_rvca", category: "Stop-Word Stripping" },
  { query: "can you give me details on the history of rvca", expectedIntent: "about_rvca", category: "Stop-Word Stripping" },

  // 2. Core Governance & RSST Leadership
  { query: "who is the president of rvei", expectedIntent: "board_of_management", category: "Governance" },
  { query: "who are the trustees of rsst", expectedIntent: "board_of_management", category: "Governance" },
  { query: "tell me about board of management", expectedIntent: "board_of_management", category: "Governance" },
  { query: "who is the principal", expectedIntent: "principal", category: "Leadership" },
  { query: "tell me about dr rakesh", expectedIntent: "principal", category: "Leadership" },
  { query: "who is the dean of architecture", expectedIntent: "dean", category: "Leadership" },
  { query: "who is suresh murthy", expectedIntent: "dean", category: "Leadership" },
  { query: "who is associate dean pg studies", expectedIntent: "dean", category: "Leadership" },

  // 3. Academic Programs
  { query: "tell me about b.arch program", expectedIntent: "barch_program", category: "Academics" },
  { query: "what is bachelor of architecture duration", expectedIntent: "barch_program", category: "Academics" },
  { query: "what is m.arch in urban design", expectedIntent: "march_program", category: "Academics" },
  { query: "how many seats are there in march", expectedIntent: "march_program", category: "Academics" },
  { query: "tell me about phd program in architecture", expectedIntent: "phd_program", category: "Academics" },
  { query: "is rvca a vtu research centre", expectedIntent: "phd_program", category: "Academics" },

  // 4. Admissions, Cutoffs & Quotas
  { query: "b.arch eligibility criteria", expectedIntent: "barch_eligibility", category: "Admissions" },
  { query: "what are the nata and jee cutoff requirements", expectedIntent: "barch_eligibility", category: "Admissions" },
  { query: "what is the kea code for rvca", expectedIntent: "barch_eligibility", category: "Admissions" },
  { query: "how to get comedk admission", expectedIntent: "barch_program", category: "Admissions" },
  { query: "tell me about management quota admission", expectedIntent: "management_quota", category: "Admissions" },
  { query: "can i apply for direct admission through management quota", expectedIntent: "management_quota", category: "Admissions" },
  { query: "are brokers or agents allowed for admission", expectedIntent: "management_quota", category: "Admissions" },

  // 5. Fee Structures
  { query: "what is the fee structure", expectedIntent: "fees", category: "Fees" },
  { query: "barch fees details", expectedIntent: "fees", category: "Fees" },
  { query: "how much is the tuition fee for b.arch", expectedIntent: "fees", category: "Fees" },
  { query: "m.arch annual fees", expectedIntent: "march_program", category: "Fees" },

  // 6. Placements & Internships
  { query: "how are placements at rvca", expectedIntent: "placements", category: "Placements" },
  { query: "which companies visit for placement", expectedIntent: "placements", category: "Placements" },
  { query: "who heads the training and placement cell", expectedIntent: "placements", category: "Placements" },
  { query: "tell me about mandatory internship", expectedIntent: "internships", category: "Internships" },
  { query: "who is the internship cell coordinator", expectedIntent: "internships", category: "Internships" },
  { query: "what is globed cell", expectedIntent: "globed", category: "Higher Studies" },
  { query: "does rvca help with studying masters abroad", expectedIntent: "globed", category: "Higher Studies" },

  // 7. Campus Infrastructure & Hostels
  { query: "tell me about hostel facilities", expectedIntent: "hostels", category: "Campus Infrastructure" },
  { query: "where is venkatadri hostel located", expectedIntent: "hostels", category: "Campus Infrastructure" },
  { query: "who is the boys hostel warden", expectedIntent: "hostels", category: "Campus Infrastructure" },
  { query: "is there a vegetarian mess", expectedIntent: "hostels", category: "Campus Infrastructure" },
  { query: "does rvca library have opac and jstor", expectedIntent: "library", category: "Campus Infrastructure" },
  { query: "tell me about skill labs and model making workshop", expectedIntent: "skill_labs", category: "Campus Infrastructure" },
  { query: "is there a clay and pottery studio", expectedIntent: "skill_labs", category: "Campus Infrastructure" },
  { query: "tell me about campus bus transport routes", expectedIntent: "campus_facilities", category: "Campus Infrastructure" },
  { query: "tell me about student clubs", expectedIntent: "clubs", category: "Campus Life" },

  // 8. Statutory Compliance
  { query: "what is the antiragging policy", expectedIntent: "antiragging", category: "Statutory" },
  { query: "who handles ragging complaints", expectedIntent: "antiragging", category: "Statutory" },
  { query: "what statutory committees are there", expectedIntent: "committees", category: "Statutory" },
  { query: "tell me about internal compliance committee posh", expectedIntent: "committees", category: "Statutory" },

  // 9. Dynamic Faculty Detective
  { query: "who is Dr. Shikha Verma", expectedIntent: "faculty_profile", category: "Faculty Detective" },
  { query: "tell me about Phani Ram Pingali", expectedIntent: "faculty_profile", category: "Faculty Detective" },
  { query: "who is Bikramjit Chakraborty", expectedIntent: "faculty_profile", category: "Faculty Detective" },
  { query: "tell me about Dinesh Rao", expectedIntent: "faculty_profile", category: "Faculty Detective" },
  { query: "who is Hiranmayi Shankavaram", expectedIntent: "faculty_profile", category: "Faculty Detective" },
  { query: "who is Dr M S Amarnath", expectedIntent: "faculty_profile", category: "Faculty Detective" },
  { query: "tell me about Archita Bandyopadhyay", expectedIntent: "faculty_profile", category: "Faculty Detective" },
  { query: "tell me about Prasanna Rao", expectedIntent: "faculty_profile", category: "Faculty Detective" },
  { query: "who is Dr. Om Prakash Bawane", expectedIntent: "faculty_profile", category: "Faculty Detective" },

  // 10. Research, Smart Cities & Publications
  { query: "research in rvca", expectedIntent: "research_overview", category: "Research & Innovation" },
  { query: "smart city projects", expectedIntent: "smart_city_research", category: "Research & Innovation" },
  { query: "tell me about saar initiative", expectedIntent: "smart_city_research", category: "Research & Innovation" },
  { query: "who are the research guides", expectedIntent: "research_guides", category: "Research & Innovation" },
  { query: "kalpa magazine", expectedIntent: "publications_deep", category: "Research & Innovation" },
  { query: "subversion journal", expectedIntent: "publications_deep", category: "Research & Innovation" },
  { query: "who are the professors", expectedIntent: "faculty_professors", category: "Faculty Architecture" },
  { query: "associate professors list", expectedIntent: "faculty_associate_professors", category: "Faculty Architecture" },
  { query: "assistant professors list", expectedIntent: "faculty_assistant_professors", category: "Faculty Architecture" },
  { query: "who are the phd mentors", expectedIntent: "faculty_phd_holders", category: "Faculty Architecture" },
  { query: "who teaches march", expectedIntent: "faculty_by_dept", category: "Faculty Architecture" },

  // 10. Typo Tolerance via Levenshtein Dynamic Programming
  { query: "tell me about plsemnt", expectedIntent: "placements", category: "Typo Tolerance" },
  { query: "hostl accommodation details", expectedIntent: "hostels", category: "Typo Tolerance" },
  { query: "libry books and journals", expectedIntent: "library", category: "Typo Tolerance" },
  { query: "barch admsn procedure", expectedIntent: "barch_program", category: "Typo Tolerance" },
  { query: "eligiblty for b.arch", expectedIntent: "barch_eligibility", category: "Typo Tolerance" },

  // 11. Content Moderation Firewall
  { query: "what the fuck is this stupid college", expectedIntent: "moderation_profanity", category: "Moderation" },
  { query: "is rvca a fake college scam", expectedIntent: "moderation_conspiracy", category: "Moderation" },
  { query: "tell me the personal salary and private phone of professors", expectedIntent: "moderation_privacy", category: "Moderation" },

  // 12. Composite Intent Resolution Matrix
  { query: "barch fees", expectedIntent: "fees", category: "Composite Matrix" },
  { query: "march fees", expectedIntent: "march_program", category: "Composite Matrix" },
  { query: "barch syllabus", expectedIntent: "barch_program", category: "Composite Matrix" },
  { query: "hostel fees", expectedIntent: "hostels", category: "Composite Matrix" },

  // 13. Universal 0ms Button Bypass
  { query: "B.Arch Program", expectedIntent: "barch_program", category: "Button Bypass" },
  { query: "Fee Structure", expectedIntent: "fees", category: "Button Bypass" },
  { query: "Hostel Facilities", expectedIntent: "hostels", category: "Button Bypass" },
  { query: "Anti-Ragging", expectedIntent: "antiragging", category: "Button Bypass" },

  // 14. Negation Shield & Multi-Intent Split
  { query: "tell me about admissions without hostel", expectedIntent: "barch_program", category: "Negation Shield" },
  { query: "tell me about fees and hostels and placements", expectedIntent: "fees", hasOverflow: true, category: "Multi-Intent Split" }
];

async function runBenchmark() {
  console.log('================================================================');
  console.log('RVCA Algorithmic NLP Benchmark Suite');
  console.log(`Running ${TEST_CASES.length} Test Cases across all Institutional Categories`);
  console.log('================================================================\n');

  let passed = 0;
  let totalLatency = 0;
  const session = new engine.ConversationSession();

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    const res = engine.classify(tc.query, session);
    totalLatency += res.latencyMs;

    let isMatch = res.intentId === tc.expectedIntent;
    if (tc.hasOverflow) {
      if (!res.overflow || res.overflow.length === 0) isMatch = false;
    }

    if (isMatch) {
      passed++;
      console.log(`[PASS] Case #${i + 1} (${tc.category}): "${tc.query.slice(0, 32)}" -> ${res.intentId} (${res.latencyMs}ms)`);
    } else {
      console.error(`[FAIL] Case #${i + 1} (${tc.category}): "${tc.query}"`);
      console.error(`       Expected: ${tc.expectedIntent}, Got: ${res.intentId}`);
    }
  }

  const avgLatency = (totalLatency / TEST_CASES.length).toFixed(2);
  const passRate = ((passed / TEST_CASES.length) * 100).toFixed(1);

  console.log('\n================================================================');
  console.log(`Results: ${passed} / ${TEST_CASES.length} Passed (${passRate}%)`);
  console.log(`Average Query Latency: ${avgLatency} ms (Threshold: < 5.0 ms)`);
  console.log('================================================================\n');

  if (passed === TEST_CASES.length && Number(avgLatency) < 5.0) {
    console.log('100% Algorithmic Benchmark Suite Passed with Sub-5ms Latency!');
    process.exit(0);
  } else {
    console.error('Benchmark Suite did not meet 100% pass rate or latency SLA.');
    process.exit(1);
  }
}

runBenchmark();
