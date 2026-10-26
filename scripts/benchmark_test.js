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
  { query: "kalpa magazine", expectedIntent: "kalpa_magazine", category: "Research & Innovation" },
  { query: "subversion journal", expectedIntent: "subversion_journal", category: "Research & Innovation" },
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
  { query: "tell me about fees and hostels and placements", expectedIntent: "fees", hasOverflow: true, category: "Multi-Intent Split" },

  // 15. Student Clubs & NASA India
  { query: "tell me about art club", expectedIntent: "club_art", category: "Student Clubs" },
  { query: "originals dance club", expectedIntent: "club_dance", category: "Student Clubs" },
  { query: "frameworks drama club", expectedIntent: "club_drama", category: "Student Clubs" },
  { query: "terra thoughts pottery club", expectedIntent: "club_terra", category: "Student Clubs" },
  { query: "nasa india trophies", expectedIntent: "nasa_india", category: "Student Clubs" },
  { query: "who heads which club", expectedIntent: "faculty_club_incharges", category: "Student Clubs" },

  // 16. Staff & Statutory Roles
  { query: "tell me about non teaching staff", expectedIntent: "faculty_non_teaching", category: "Institutional Staff" },
  { query: "residential warden contact", expectedIntent: "hostel_warden", category: "Institutional Staff" },
  { query: "faculty committee heads", expectedIntent: "faculty_incharges_committees", category: "Institutional Staff" },

  // 17. Deep Publications & Faculty Research Papers
  { query: "kalpa research magazine issn 2583-696x", expectedIntent: "kalpa_magazine", category: "Publications Deep" },
  { query: "subversion journal cfp", expectedIntent: "subversion_journal", category: "Publications Deep" },
  { query: "papers published in springer", expectedIntent: "faculty_publications_papers", category: "Publications Deep" },
  { query: "research papers in taylor and francis", expectedIntent: "faculty_publications_papers", category: "Publications Deep" },

  // 18. Research, Consultancy & Skill Labs
  { query: "urban design research and consultancy cell udrcc", expectedIntent: "research_udrcc", category: "Research & Labs" },
  { query: "collaborations with bochum university", expectedIntent: "research_collaborations", category: "Research & Labs" },
  { query: "climate simulation lab heliodon", expectedIntent: "lab_climate", category: "Research & Labs" },
  { query: "ceramic clay and pottery kilns", expectedIntent: "lab_pottery", category: "Research & Labs" },
  { query: "3d printing and laser cutting lab", expectedIntent: "lab_fab", category: "Research & Labs" },
  { query: "spatial analytics and gis lab", expectedIntent: "lab_gis", category: "Research & Labs" },

  // 19. Academic Departments
  { query: "department of architecture ug", expectedIntent: "department_barch", category: "Departments" },
  { query: "department of urban design pg", expectedIntent: "department_march", category: "Departments" },
  { query: "doctoral department research centre", expectedIntent: "department_phd", category: "Departments" },
  { query: "all academic departments in rvca", expectedIntent: "departments_all", category: "Departments" },
  { query: "tell me about rvca publications", expectedIntent: "publications_deep", category: "Publications Deep" },

  // 20. Institutional Collaborations & Global MoUs
  { query: "tell me about collaborations", expectedIntent: "collaborations_overview", category: "Collaborations" },
  { query: "what partnerships does rvca have", expectedIntent: "collaborations_overview", category: "Collaborations" },
  { query: "academic collaborations in rvca", expectedIntent: "academic_collaborations", category: "Collaborations" },
  { query: "foreign university student exchange", expectedIntent: "academic_collaborations", category: "Collaborations" },
  { query: "industry collaborations with hafele", expectedIntent: "industry_collaborations", category: "Collaborations" },
  { query: "gesix solutions lidar surveying mou", expectedIntent: "industry_collaborations", category: "Collaborations" },
  { query: "institutional memberships in iia and unai", expectedIntent: "institutional_memberships", category: "Collaborations" },
  { query: "isro nodal centre courses", expectedIntent: "institutional_memberships", category: "Collaborations" },

  // 21. Consultancy Cell & Events
  { query: "tell me about consultancy cell", expectedIntent: "consultancy_cell", category: "Consultancy" },
  { query: "smart city consultancy services", expectedIntent: "consultancy_cell", category: "Consultancy" },
  { query: "workshops and events in rvca", expectedIntent: "events_and_workshops", category: "Events" },
  { query: "tensile structures workshop", expectedIntent: "events_and_workshops", category: "Events" },
  { query: "globed season 3 higher education", expectedIntent: "events_and_workshops", category: "Events" },

  // 22. Additional Student Clubs
  { query: "tell me about book club", expectedIntent: "club_book", category: "Student Clubs" },
  { query: "heritage club vernacular documentation", expectedIntent: "club_heritage", category: "Student Clubs" },
  { query: "quiz club trivia competitions", expectedIntent: "club_quiz", category: "Student Clubs" },
  { query: "decibels music club jamming", expectedIntent: "club_music", category: "Student Clubs" }
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
