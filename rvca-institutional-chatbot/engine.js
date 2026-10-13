/**
 * RVCA Algorithmic NLP Engine (engine.js)
 * Production-grade Client-Side Multi-Intent Classifier with Zero Hallucination
 * Implements 11 Core Algorithmic Requirements:
 * 1. Content Moderation Firewall (Profanity, Conspiracy, Private Probe)
 * 2. Grammar & Stop-Words Removal with Pronoun Collision Protection
 * 3. Levenshtein Dynamic Programming Edit-Distance (O(m x n))
 * 4. Dot-Stripping & Acronym Sanitizer
 * 5. Priority-Weighted Multi-Keyword Classifier (Lower p = Higher Priority)
 * 6. Composite Intent Resolution Matrix (Program + Topic)
 * 7. Dynamic Faculty Detective (Name Slugs & Fuzzy Matching)
 * 8. Multi-Intent Split & Overflow Queue ("⬇️ Also Asked ⬇️")
 * 9. Universal 0ms Button Bypass (INTENT_LABELS lookup)
 * 10. Multi-Turn Context Memory (SESSION.lastIntent)
 * 11. Negation Shield (Preceding 20 chars check)
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    const KB = require('./knowledge-base.js');
    const FACULTY = require('./faculty-data.js');
    module.exports = factory(KB, FACULTY);
  } else {
    root.RVCAEngine = factory(root.RVCA_KB, root.RVCA_FACULTY);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(KB, FACULTY) {

  // 1. CONTENT MODERATION PATTERNS
  const MODERATION_PATTERNS = {
    conspiracy: /\b(conspiracy|illuminati|fake college|bogus degree|scam|fraud|bribe|leaked question paper|dark web|money laundering)\b/i,
    profanity: /\b(fuck|shit|bitch|bastard|asshole|dick|pussy|cunt|slut|whore|retard|fag|idiot|stupid)\b/i,
    privateProbes: /\b(salary|salaries|aadhaar|pan card|bank account|personal phone|private number|home address|personal mobile|whatsapp number|caste certificate)\b/i
  };

  // 2. STOP-WORDS LIST
  const STOP_WORDS = new Set([
    'the', 'is', 'for', 'a', 'an', 'of', 'in', 'to', 'and', 'with', 'about', 'on', 'at',
    'please', 'can', 'could', 'you', 'tell', 'me', 'know', 'give', 'what', 'how', 'where',
    'which', 'who', 'i', 'want', 'need', 'would', 'like', 'there', 'any', 'some', 'details',
    'information', 'info', 'provide', 'show', 'get', 'explain', 'hi', 'hello', 'hey', 'good'
  ]);

  // Protected tokens: bare conversational words that must NOT trigger department aliases
  const PROTECTED_TOKENS = new Set(['me', 'is', 'it', 'us', 'as', 'to', 'in', 'at', 'an', 'be', 'or', 'do']);

  // 3. LEVENSHTEIN DYNAMIC PROGRAMMING EDIT-DISTANCE MATRIX O(m x n)
  function levenshteinDistance(s1, s2) {
    const m = s1.length;
    const n = s2.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(
            dp[i - 1][j],     // deletion
            dp[i][j - 1],     // insertion
            dp[i - 1][j - 1]  // substitution
          );
        }
      }
    }
    return dp[m][n];
  }

  // Canonical Typo Dictionary for Architecture College
  const CANONICAL_MAP = {
    'plsemnt': 'placements',
    'plsemnts': 'placements',
    'plcmnt': 'placements',
    'plcmnts': 'placements',
    'hostl': 'hostels',
    'hostls': 'hostels',
    'libry': 'library',
    'libri': 'library',
    'feez': 'fees',
    'admsn': 'admissions',
    'eligiblty': 'eligibility',
    'princpal': 'principal',
    'faclty': 'faculty'
  };

  const CANONICAL_WORDS = [
    'placements', 'placement', 'internship', 'internships', 'hostel', 'hostels',
    'library', 'admission', 'admissions', 'eligibility', 'principal', 'faculty',
    'architecture', 'fees', 'scholarship', 'scholarships', 'syllabus', 'curriculum',
    'governance', 'antiragging', 'transport', 'sports', 'canteen', 'clubs',
    'comedk', 'kcet', 'pgcet', 'barch', 'march', 'phd', 'gate', 'nata', 'research'
  ];

  function correctTypo(token) {
    if (token.length < 3) return token;
    const lower = token.toLowerCase();
    if (CANONICAL_MAP[lower]) return CANONICAL_MAP[lower];
    if (CANONICAL_WORDS.includes(lower)) return lower;

    let bestMatch = lower;
    let minDistance = Infinity;

    for (const canonical of CANONICAL_WORDS) {
      const dist = levenshteinDistance(lower, canonical);
      const maxAllowed = canonical.length >= 7 ? 2 : 1;
      if (dist <= maxAllowed && dist < minDistance) {
        minDistance = dist;
        bestMatch = canonical;
      }
    }
    return bestMatch;
  }

  // 4. DOT-STRIPPING & ACRONYM SANITIZER
  function sanitizeAcronyms(text) {
    return text
      .toLowerCase()
      .replace(/\b([a-z])\.([a-z])\.([a-z])\.([a-z])\b/gi, '$1$2$3$4')
      .replace(/\b([a-z])\.([a-z])\.([a-z])\b/gi, '$1$2$3')
      .replace(/\b([a-z])\.([a-z])\b/gi, '$1$2')
      .replace(/b\.\s*arch/gi, 'barch')
      .replace(/m\.\s*arch/gi, 'march')
      .replace(/ph\.\s*d/gi, 'phd')
      .replace(/c\.\s*o\.\s*a/gi, 'coa')
      .replace(/v\.\s*t\.\s*u/gi, 'vtu')
      .replace(/k\.\s*e\.\s*a/gi, 'kea')
      .replace(/k\.\s*c\.\s*e\.\s*t/gi, 'kcet')
      .replace(/c\.\s*o\.\s*m\.\s*e\.\s*d\.\s*k/gi, 'comedk')
      .replace(/p\.\s*g\.\s*c\.\s*e\.\s*t/gi, 'pgcet')
      .replace(/n\.\s*a\.\s*t\.\s*a/gi, 'nata')
      .replace(/j\.\s*e\.\s*e/gi, 'jee');
  }

  // 11. NEGATION SHIELD
  function hasNegation(rawText, keywordMatchIndex) {
    if (keywordMatchIndex <= 0) return false;
    const start = Math.max(0, keywordMatchIndex - 20);
    const precedingSlice = rawText.substring(start, keywordMatchIndex).toLowerCase();
    return /\b(not|no|without|except|neither|never|don't|dont|dont want)\b/i.test(precedingSlice);
  }

  // INTENT DEFINITIONS & KNOWLEDGE RESPONSES
  const INTENTS = [
    {
      id: "antiragging",
      priority: 0.7, // Lower p = higher priority
      keywords: ["antiragging", "anti ragging", "ragging", "ragging cell", "ragging policy", "ragging complaint"],
      title: "Anti-Ragging Committee & Policy",
      response: `**Zero Tolerance Anti-Ragging Policy at RVCA**\n\nRV College of Architecture strictly enforces a zero-tolerance policy towards ragging in compliance with UGC and Council of Architecture regulations.\n\n• **Anti-Ragging Committee & Squad**: Regularly monitors studios, hostels, canteen, and campus precincts.\n• **Immediate Action**: Any act of harassment or intimidation results in suspension and legal reporting.\n• **Official Notification**: [Download Details of Anti-Ragging Committee PDF](https://rvca.edu.in/wp-content/uploads/2024/09/RVCA_Details-of-Anti-Ragging-Commitee.pdf)\n• **Awareness Poster**: [View Anti-Ragging Poster](https://rvca.edu.in/wp-content/uploads/2024/10/Anti-ragging-poster_RVCA-1.pdf)`,
      chips: ["Hostel Facilities", "Statutory Committees", "Contact Authorities"]
    },
    {
      id: "committees",
      priority: 1.0,
      keywords: ["statutory committee", "committees", "grievance", "internal compliance", "icc", "posh", "disabilities", "sc st obc cell", "mentoring"],
      title: "Statutory Compliance & Committees",
      response: `**Statutory Committees at RVCA**\n\nIn accordance with UGC, COA, and VTU regulations, RVCA has established official committees for campus welfare:\n\n1. **Anti-Ragging Committee & Squad**: [View PDF](https://rvca.edu.in/wp-content/uploads/2024/09/RVCA_Details-of-Anti-Ragging-Commitee.pdf)\n2. **Online Grievance Redressal Committee**: Redressal for student & faculty grievances ([View PDF](https://rvca.edu.in/wp-content/uploads/2024/07/Grievance-Redressal-Committee.pdf))\n3. **Internal Compliance Committee (ICC / POSH)**: Redressal under the Sexual Harassment of Women at Workplace Act 2013 ([View PDF](https://rvca.edu.in/wp-content/uploads/2024/07/Internal-Compliance-Committee.pdf))\n4. **Internal Committee for Students with Disabilities**: Barrier-free campus accessibility ([View PDF](https://rvca.edu.in/wp-content/uploads/2024/07/Internal-Committee-for-Students-with-Disabilities.pdf))\n5. **Central Mentoring cum Counselling Committee**: Psycho-social and academic guidance ([View PDF](https://rvca.edu.in/wp-content/uploads/2024/07/Central-Mentoring-cum-Counselling-Committee.pdf))\n6. **SC-ST-OBC Cell**: Protection of student rights & scholarship facilitation ([View PDF](https://rvca.edu.in/wp-content/uploads/2024/07/SC-ST-OBC-Cell.pdf))`,
      chips: ["Anti-Ragging", "Counselling Cell", "Contact Administration"]
    },
    {
      id: "principal",
      priority: 1.0,
      keywords: ["principal", "head of institution", "who is the principal", "rakesh", "dr rakesh"],
      title: "Principal & Institutional Leadership",
      response: `**Principal — RV College of Architecture**\n\n**Dr. Rakesh K. S.**\n*Principal, RV College of Architecture*\n• **Qualifications**: B. Arch. [SAP, Chennai], M. Arch. [SAP, Chennai], Ph.D. [SAP, Chennai]\n• **Specialisation**: Climatic Design, Sustainable Architecture, Contemporary Architecture\n• **Email**: [principal.rvca@rvei.edu.in](mailto:principal.rvca@rvei.edu.in)\n• **Phone**: 080-35095001 / 080-35095002\n• **Timings**: 09:00 AM to 07:00 PM\n• **Profile**: [Dr. Rakesh K. S. Official Bio](https://rvca.edu.in/faculty/dr_rakesh_k_s/)\n\n*(Note: Dr. Om Prakash Bawane previously served as Principal and continues as Senior Professor specializing in Sustainable Development and Building Services.)*`,
      chips: ["Dean & Leadership", "Board of Management", "Faculty Directory"]
    },
    {
      id: "dean",
      priority: 0.85,
      keywords: ["dean", "associate dean", "suresh murthy", "prasanna rao", "manjunath", "leadership"],
      title: "Deans & Academic Leadership",
      response: `**Academic Leadership & Deans at RVCA**\n\n• **Dean / Professor**: **Prof. Suresh K Murthy**\n  *Qualifications*: B.Arch [MSU Baroda], M.Tech [IIT Delhi]\n  *Specialisation*: Building Science & Construction Management, Climatology\n  *Profile*: [Prof. Suresh K Murthy Bio](https://rvca.edu.in/faculty/suresh-k-murthy/)\n\n• **Associate Dean (PG Studies)**: **Prof. Prasanna Rao**\n  *Qualifications*: B.Arch [Mysore Univ], M.Arch (Urban Design) [CEPT Ahmedabad]\n  *Email*: [prasannarao.rvca@rvei.edu.in](mailto:prasannarao.rvca@rvei.edu.in) | Phone: 080-35094924\n\n• **Associate Dean (VTU Affairs)**: **Dr. H R Manjunath**\n  *Qualifications*: B.E. Civil, M.E. Structures, Ph.D [VTU]\n  *Email*: [assocdean-vtu.rvca@rvei.edu.in](mailto:assocdean-vtu.rvca@rvei.edu.in) | Phone: 080-35094929\n\n• **Design Chair**: **Prof. Dinesh Rao** (Principal Architect, Monsoon Design; 36+ yrs practice)`,
      chips: ["Principal Bio", "Faculty Directory", "Board of Management"]
    },
    {
      id: "board_of_management",
      priority: 0.9,
      keywords: ["trustee", "trustees", "board of management", "governing council", "shyam", "avs murthy", "rsst", "rvei", "founder"],
      title: "Board of Management & RSST Trustees",
      response: `**Rashtreeya Sikshana Samithi Trust (RSST) Governance**\n\nRV Educational Institutions (RVEI) is steered by the prestigious RSST trust founded in 1940 by late Sri M.C. Sivananda Sarma.\n\n• **President, RVEI**: Dr. M.P. Shyam\n• **Vice Presidents**: Mr. A.C. Chandrashekar Raju, Dr. C. Vinod Hayagriv\n• **Treasurer**: Mr. P.S. Venkatesh Babu\n• **Hon. Secretary**: Dr. (h.c.) A.V.S. Murthy\n• **Hon. Joint Secretary**: Mr. D.P. Nagaraj\n• **Assistant Secretary**: Mr. Nikhil A Murthy\n• **Governing Council Chairman**: Sri K.S. Akhilesh Babu\n\nOfficial Portal: [RVCA Board of Management](https://rvca.edu.in/board_of_management/)`,
      chips: ["About RVCA", "Principal", "Affiliations & Approvals"]
    },
    {
      id: "about_rvca",
      priority: 1.0,
      keywords: ["about rvca", "history", "established", "vision", "mission", "background", "institution"],
      title: "About RV College of Architecture",
      response: `**Welcome to RV College of Architecture (RVCA)**\n\nEstablished in 1992 under the iconic **Rashtreeya Sikshana Samithi Trust (RSST)**, RV College of Architecture is Karnataka's premier school of architectural education:\n\n• **Institutional Legacy**: Started in 1992 as the Department of Architecture in RVCE, attained academic autonomy in 2009, and relocated in 2014 to its dedicated modern campus in Banashankari 6th Stage, Bengaluru.\n• **Accreditation & Affiliations**: Affiliated to Visvesvaraya Technological University (VTU), Belagavi, and approved by the Council of Architecture (COA), New Delhi.\n• **KEA College Code**: **E-244**\n• **Stellar Rankings**:\n  - **#1 in Karnataka & 13th in India** (MDRA India Today 2025)\n  - **2nd in Super Excellence Category in India** (GHRDC 2024)\n  - **14th Nationally** (THE WEEK 2025)\n• **Vision**: To be an architecture institute par excellence, nurturing academics, creative professional practice, and pioneering research for a sustainable contemporary society.\n\n🌐 **Official Website Link**: [Visit Official RVCA About Us Page (rvca.edu.in/about_us/)](https://rvca.edu.in/about_us/)`,
      chips: ["Courses", "Admissions", "Facilities", "Contact Us"]
    },
    {
      id: "everything_overview",
      priority: 0.85,
      keywords: ["tell me everything", "tell me all about", "everything about rvca", "everything about the college", "everything about architecture", "give me complete details", "complete information", "all details", "overview of rvca", "what can you tell me", "what does rvca offer", "explore rvca", "complete guide", "full details", "all about the college", "all info"],
      title: "Complete Institutional Guide — RV College of Architecture",
      response: `**Welcome to RV College of Architecture (RVCA) — Complete Institutional Guide**\n\nRanked **#1 in Karnataka** and **13th in India** (MDRA India Today 2025), RVCA represents over 30 years of architectural pedigree under the Rashtreeya Sikshana Samithi Trust (RSST). Here is a complete overview:\n\n🏛️ **Academic Degrees Offered**:\n• **B.Arch (5 Years / 10 Semesters)**: VTU-affiliated & Council of Architecture (COA) approved degree featuring hands-on studio pedagogy and a mandatory 1-semester professional internship in active architectural practice.\n• **M.Arch in Urban Design (2 Years / 4 Semesters)**: 20 seats (16 PGCET + 4 Management) focused on urban morphology, spatial informatics, and city habitats.\n• **Ph.D. in Architecture**: Recognized VTU Research Centre with doctorate supervisors across sustainable and climatic design.\n\n🎯 **Admissions & Seat Quotas**:\n• **Direct Management Quota**: Direct application to RSST (rv@rvei.edu.in) based on 10+2 marks & NATA/JEE score. **Strict Zero-Broker Policy**.\n• **Government Quota (KEA KCET)**: Karnataka domicile merit counselling (**KEA Code: E-244**).\n• **All-India Quota (COMEDK UGET)**: Centralized merit counselling for national students.\n\n🎨 **Experiential Studios & Skill Workshops**:\n• Natural daylit 40-student drafting studios with individual workstations and personal lockers.\n• Hands-on **Model Making Workshop**, **Ceramic Clay & Pottery Studio** with kilns, **Digital Fabrication Lab (3D Printing)**, **Climate Simulation Lab**, and **GIS Analytical Lab**.\n\n🏡 **Campus Life, Hostels & Dining**:\n• Separate secure boys' and girls' hostels with an attached **pure vegetarian dining mess** (4 nutritious meals daily).\n• Hygienic multi-cuisine cafeteria, gymnasium, basketball court, indoor games, and 12 vibrant student clubs.\n• Curated annual **architectural study tours** and **live site visits** across India and abroad.\n\n💼 **Internships, Career Placements & GlobEd**:\n• 100% internship placement across premier architecture studios (Total Environment, Mindspace, Studio Whitescape, Betweenlines).\n• **GlobEd Cell**: Dedicated international advisory facilitating Masters admissions to prestigious universities across USA, UK, Europe, Australia, and Singapore.\n\n🌐 **Official Website Link**: [Visit Official RVCA Website (rvca.edu.in)](https://rvca.edu.in/)`,
      chips: ["B.Arch Program", "Admissions Overview", "Fee Structure", "Experiential Studios", "Hostels"]
    },
    {
      id: "why_rvca",
      priority: 0.85,
      keywords: ["why rvca", "why choose rvca", "why should i join", "why study at rvca", "what makes rvca unique", "benefits of rvca", "reasons to join rvca", "is rvca good", "how good is rvca", "why is rvca famous", "unique features", "reasons to choose"],
      title: "Why Choose RVCA — Hallmarks & Excellence",
      response: `**Why Study Architecture at RV College of Architecture?**\n\nChoosing the right architecture school shapes your design philosophy and career. Here is why aspiring architects choose RVCA:\n\n1. **#1 Architecture College in Karnataka**:\n   • Ranked **1st in Karnataka** and **13th across India** by MDRA India Today (2025).\n   • Ranked **2nd in India in Super Excellence** by GHRDC (2024).\n\n2. **Dedicated Standalone Architectural Campus**:\n   • Unlike departments housed inside engineering buildings, RVCA operates on its own dedicated, architecturally inspiring campus in Banashankari 6th Stage, Bengaluru, tailored specifically for studio culture, juries, and creative spatial exploration.\n\n3. **Distinguished Faculty Mentors (63 Members)**:\n   • Learn under renowned practicing architects and academicians with doctoral and postgraduate degrees from SAP Chennai, IIT Delhi, CEPT Ahmedabad, and MSU Baroda, headed by Dr. Rakesh K. S. and Prof. Suresh K Murthy.\n\n4. **Hands-On Experiential Learning**:\n   • Move beyond theoretical drafting with on-campus pottery wheels, ceramic kilns, digital fabrication (3D printers), climatology simulation, and structural testing labs.\n\n5. **Award-Winning Student Pedigree**:\n   • Our students consistently win national accolades, including the **COA National Thesis Awards** (Rs. 1 Lakh cash prize), **Solar Decathlon India**, **Saint-Gobain Transparence**, and the **Asia Young Designer Awards (AYDA)**.\n\n6. **Global Pathways & 100% Industry Exposure**:\n   • Mandatory 1-semester professional training in leading architectural studios and direct guidance from the **GlobEd Cell** for higher studies at top global universities (USC, RMIT, KU Leuven, NUS, etc.).\n\n🌐 **Official Website Link**: [Visit Official RVCA About Us Page (rvca.edu.in/about_us/)](https://rvca.edu.in/about_us/)`,
      chips: ["Courses", "Experiential Studios", "Study Tours", "Admissions", "Contact Us"]
    },
    {
      id: "courses_overview",
      priority: 0.85,
      keywords: ["courses", "cources", "programmes", "academic programs", "all courses", "courses offered"],
      title: "Programmes & Courses Offered",
      response: `**Academic Programmes at RV College of Architecture**\n\nRVCA offers Council of Architecture (COA) approved and VTU affiliated degree programmes:\n\n1. **Bachelor of Architecture (B.Arch)**:\n   • **Duration**: 5 Years (10 Semesters), Full-Time\n   • **Highlights**: Studio-based learning, digital fabrication labs, 1-semester professional internship\n   • **Intake Routes**: KEA KCET (Code E-244), COMEDK UGET, Management Quota\n\n2. **Master of Architecture (M.Arch) in Urban Design**:\n   • **Duration**: 2 Years (4 Semesters), Full-Time\n   • **Total Intake**: 20 Seats (16 PGCET / KEA Quota + 4 Management Quota)\n   • **Focus**: Urban morphology, spatial informatics, sustainable and resilient urban transformation\n\n3. **Ph.D. in Architecture**:\n   • **Centre**: VTU Recognised Research Centre\n   • **Routes**: VTU-ETR entrance test followed by interview and research proposal\n\n🌐 **Official Website Link**: [Explore RVCA Academic Programmes (rvca.edu.in/programmes/)](https://rvca.edu.in/programmes/)`,
      chips: ["B.Arch Program", "M.Arch Urban Design", "Ph.D. Program", "Admissions", "Fee Structure"]
    },
    {
      id: "admissions_overview",
      priority: 0.85,
      keywords: ["admissions overview", "admission process", "how to join rvca", "seat quotas", "admission overview"],
      title: "Admissions Procedure & Quotas",
      response: `**Admissions Procedure at RV College of Architecture**\n\nAdmissions are strictly merit-driven across transparent government and institutional routes:\n\n• **B.Arch Government Quota (KEA KCET)**:\n  - Karnataka domicile candidates via KEA Counselling (**KEA Code: E-244**)\n  - Requires qualified score in **NATA** or **JEE Main Paper II**.\n\n• **B.Arch All-India Quota (COMEDK UGET)**:\n  - Open merit counseling through COMEDK with qualifying 10+2 marks & NATA score.\n\n• **M.Arch (Urban Design) Quota**:\n  - 16 seats via KEA PGCET / GATE Architecture; 4 Management Quota seats.\n\n• **Management Quota (Direct Admission)**:\n  - Direct merit applications to RSST (Hon. Secretary, RSST at rv@rvei.edu.in).\n  - **Strict Zero-Broker Policy**: RVCA operates with **NO agents, brokers, or consultants**.\n\n🌐 **Official Website Link**: [Explore RVCA Admissions Guidelines (rvca.edu.in/admission/)](https://rvca.edu.in/admission/)`,
      chips: ["B.Arch Eligibility", "Management Quota", "Fee Structure", "Contact Us"]
    },
    {
      id: "barch_program",
      priority: 0.8,
      keywords: ["barch", "b arch", "bachelor of architecture", "ug program", "undergraduate", "comedk", "comedk admission", "kcet admission", "admissions"],
      title: "Bachelor of Architecture (B.Arch)",
      response: `**Bachelor of Architecture (B.Arch) — 5-Year Degree Programme**\n\n• **Duration**: 5 Years (10 Semesters), Full-Time.\n• **Affiliation & Approval**: Affiliated to VTU Belagavi, approved by Council of Architecture (COA).\n• **Intake Routes**: KEA KCET (Code E-244), COMEDK UGET, and Management Quota.\n• **Key Features**:\n  - Mandatory 1-semester professional practical training (internship) in real-world architectural firms.\n  - Current curriculum under VTU 2021 CBCS Scheme & Syllabus.\n  - Dedicated Skill Labs: Model Making, Clay/Pottery, GIS, Climate Responsive Lab, Fabrication, and Structural Testing Lab.\n• **Official Syllabus**: [Download 2021 B.Arch Scheme & Syllabus](https://rvca.edu.in/programmes/ugprogramme/ug_2021_scheme__syllabus/)`,
      chips: ["B.Arch Eligibility", "B.Arch Fees", "Placements & Internships"]
    },
    {
      id: "march_program",
      priority: 0.8,
      keywords: ["march", "m arch", "master of architecture", "urban design", "pg program", "postgraduate"],
      title: "Master of Architecture (M.Arch) in Urban Design",
      response: `**M.Arch in Urban Design — 2-Year Postgraduate Programme**\n\n• **Duration**: 2 Years (4 Semesters), Full-Time.\n• **Total Seats**: 20 Seats (16 PGCET / KEA Quota + 4 Management Quota).\n• **Curriculum Focus**: Urbanism, theory of Indian cities, spatial informatics, sustainable and resilient urban transformation.\n• **Annual Tuition**: Rs. 77,310/- per year (Management quota includes a one-time non-refundable development fee of Rs. 1.75 Lakhs).\n• **PG Coordinator**: Prof. Prasanna Rao ([prasannarao.rvca@rvei.edu.in](mailto:prasannarao.rvca@rvei.edu.in) / 080-35094924)\n• **Syllabus**: [VTU 2022-2023 M.Arch Scheme & Syllabus](https://rvca.edu.in/programmes/pgprogramme/pg-2022-2023-scheme-syllabus/)`,
      chips: ["M.Arch Eligibility", "M.Arch Fees", "Ph.D. Programme"]
    },
    {
      id: "phd_program",
      priority: 0.85,
      keywords: ["phd", "ph.d", "doctoral", "doctor of philosophy", "research program", "research centre"],
      title: "Ph.D. in Architecture (VTU Research Centre)",
      response: `**Ph.D. in Architecture Programme**\n\n• **Affiliation**: Visvesvaraya Technological University (VTU) Recognised Research Centre.\n• **Admission Route**: VTU-ETR (VTU Eligibility Test for Research) followed by an interview and proposal presentation.\n• **Eligibility**:\n  - With Master's: M.Arch or allied master's degree with min 60% aggregate or 6.75 CGPA.\n  - With Bachelor's: B.Arch with min 10 years of professional/teaching/research experience.\n• **Research Supervisors / Guides**:\n  1. Dr. O. P. Bawane\n  2. Dr. Shikha Verma\n  3. Dr. Mahalakshmi Karnad\n• **VTU Official Portal**: [vtu.ac.in Research Portal](https://vtu.ac.in)`,
      chips: ["Research Publications", "Faculty Guides", "B.Arch Program"]
    },
    {
      id: "research_overview",
      priority: 0.98,
      keywords: ["research", "research in rvca", "research activities", "research projects", "research work", "innovation at rvca", "research thrust areas", "research papers", "funded research", "academic research"],
      title: "Research & Innovation at RVCA",
      response: `**Research & Innovation at RV College of Architecture (RVCA)**\n\nRVCA fosters a vibrant research culture bridging architectural theory, urban informatics, and sustainable building technologies:\n\n🏛️ **VTU Recognized Research Centre**:\n• Official Ph.D. Research Centre affiliated to Visvesvaraya Technological University (VTU), Belagavi.\n• Doctoral research streams: Sustainable Architecture, Building Energy Simulation, Urban Resilience, C&D Waste Recycling, and Cultural Heritage.\n\n🏙️ **Smart City Projects — MoHUA & NIUA SAAR Initiative**:\n• RVCA is selected as **1 of only 15 Premier Institutes of Academic Excellence nationwide** by the Ministry of Housing and Urban Affairs (MoHUA) and National Institute of Urban Affairs (NIUA).\n• **SAAR 1.0**: Documented landmark smart city initiatives across Bengaluru, Davanagere, and Belagavi.\n• **SAAR 2.0**: Ongoing smart city projects collaborating with Shivamogga & Bengaluru Smart City Limited.\n\n📐 **Urban Design Research & Consultancy Cell (UDRCC)**:\n• Hands-on municipal consultancy cell engaging Master of Architecture (M.Arch) scholars directly with public sector urban transformation projects.\n\n🌍 **Global Research Collaborations**:\n• **Bochum University, Germany**: Joint digital participatory place analysis using the "Photovoice" methodology (published in *Cities & Health*, Routledge).\n• **University of Florida, Gainesville (USA) & KRVIA**: International dialogues on climate justice and tropical architecture resilience.\n\n🏆 **DAIDA Global Awards Finalist (2023)**:\n• "Cities for All" — M.Arch thesis on closed-loop wastescape regeneration in Nayandahalli, Bengaluru shortlisted among 8 international finalists.\n\n📚 **Peer-Reviewed Publications**:\n• **KALPA** Annual Magazine (ISSN 2583-696X) and **sub:version** International Journal.\n• High-impact faculty publications indexed in Scopus, Springer Nature, and Taylor & Francis.\n\n🌐 **Official Research Portal**: [RVCA Research & Innovation (rvca.edu.in/research/)](https://rvca.edu.in/research/)`,
      chips: ["Smart City (SAAR)", "Research Guides", "Publications", "Ph.D. Program", "Faculty Directory"]
    },
    {
      id: "smart_city_research",
      priority: 0.98,
      keywords: ["smart city", "smart city projects", "saar", "saar 1.0", "saar 2.0", "mohua", "niua", "udrcc", "smart cities", "urban consultancy", "shivamogga smart city", "bengaluru smart city", "davanagere smart city", "belagavi smart city"],
      title: "Smart City Research & SAAR Initiative",
      response: `**RVCA Smart City Projects & SAAR Initiative**\n\nRV College of Architecture is at the forefront of national urban development initiatives:\n\n🇮🇳 **MoHUA & NIUA SAAR Recognition**:\n• Selected among the **Top 15 Premier Institutes of Academic Excellence in India** by the Ministry of Housing and Urban Affairs (MoHUA) and National Institute of Urban Affairs (NIUA).\n• **SAAR 1.0 (Smart Cities and Academia Towards Action & Research)**: Documented field outcomes, live challenges, and learnings of landmark urban projects in **Bengaluru**, **Davanagere**, and **Belagavi** Smart Cities.\n• **SAAR 2.0**: Formulating academic research and ground evaluation with **Shivamogga Smart City Limited** and **Bengaluru Smart City Limited**.\n\n🏢 **UDRCC (Urban Design Research & Consultancy Cell)**:\n• Specialized institutional cell at RVCA providing live research and consultancy for public sector urban interventions.\n• Directly embeds Master of Architecture (M.Arch in Urban Design) students into real-world master planning, public place transformation, and resilience strategies.\n\n📖 **Published Research Outcome**:\n• "Exploring role of public spaces in accommodating economic activities during Ashadh Wari in Pandharpur: case of Chowk, Galli and Ghat" published in *Future is Urban* (Routledge / Taylor & Francis).\n\n🌐 **Official Research Portal**: [Explore Smart City Research (rvca.edu.in/research/)](https://rvca.edu.in/research/)`,
      chips: ["Research Overview", "M.Arch Urban Design", "Research Guides", "Faculty Directory"]
    },
    {
      id: "research_guides",
      priority: 0.98,
      keywords: ["research guides", "phd guides", "doctoral guides", "supervisors", "phd supervisors", "research supervisors", "who are the research guides", "doctoral mentors", "vtu research guides", "guide list"],
      title: "Ph.D. Research Guides & Doctoral Mentors",
      response: `**VTU Approved Ph.D. Research Guides at RVCA**\n\nScholars pursuing Ph.D. in Architecture at the VTU-recognized RVCA Research Centre are mentored by distinguished doctoral guides:\n\n1. **Dr. Om Prakash Bawane** (Senior Professor / Former Principal):\n   • Qualifications: B.Arch. [NIT Bhopal], M.Arch. [IIT Roorkee], M.Sc. [SMU], Ph.D. [VMU]\n   • Research Thrust: Sustainable Development, Building Services, Architectural Pedagogy\n\n2. **Dr. Shikha Verma** (Associate Professor):\n   • Qualifications: B.Arch. [NIT Bhopal], M.Tech. & Ph.D. [MNNIT Allahabad]\n   • Research Thrust: Environmental Geotechnology, C&D Waste Recycling Systems, Mud Thermal Performance\n\n3. **Dr. Mahalakshmi Karnad** (Associate Professor):\n   • Qualifications: B.Arch. [Bangalore Univ], MLA [SPA New Delhi], Ph.D. [SPA New Delhi]\n   • Research Thrust: Landscape Architecture, Heritage Conservation, Traditional Settlements\n\n4. **Dr. Rakesh K. S.** (Principal):\n   • Qualifications: B.Arch., M.Arch., Ph.D. [SAP, Anna University Chennai]\n   • Research Thrust: Climatic & Passive Solar Design, Energy Efficiency, Sustainable Architecture\n\n5. **Dr. Chinnu S Kumar** (Associate Professor):\n   • Qualifications: B.Arch. [TKM Kollam], M.U.D. [SPA New Delhi], Ph.D. [MNIT Jaipur]\n   • Research Thrust: Urban Morphology, Spatial Modeling, Urban Resilience\n\n📝 **Admission Process**: Through VTU-ETR entrance examination followed by research proposal defense.\n\n🌐 **Official Portal**: [Ph.D. Research Centre Details (rvca.edu.in/programmes/phdprogramme/)](https://rvca.edu.in/programmes/phdprogramme/)`,
      chips: ["Ph.D. Program", "Research Overview", "Publications", "Faculty Directory"]
    },
    {
      id: "publications_deep",
      priority: 0.98,
      keywords: ["kalpa", "kalpa magazine", "subversion", "sub:version", "publications", "magazines", "journal", "academic journals", "research publications", "research papers", "faculty papers", "springer", "taylor and francis"],
      title: "Institutional Publications — Kalpa & sub:version",
      response: `**RVCA Institutional Publications & Journals**\n\nRV College of Architecture actively publishes peer-reviewed research and scholarly inquiries:\n\n📖 **KALPA (Annual Research Magazine — ISSN 2583-696X)**:\n• Annual flagship publication fostering architectural inquiry through real-time data analysis and critical case studies.\n• **Editorial Board**: Dr. Om Prakash Bawane (Editor-in-Chief), Prof. Hiranmayi Shankavaram, Prof. Ramya Krishna, Prof. Alisha Sinha, and Ar. Rashmi P. Subbanarasimha (IIITB).\n• **Volumes**: Vol. 1 (2020) through Vol. 5 (2024-25) published and archived online.\n• Themes: Green building materials, mud in composite climates, C&D waste recycling.\n\n🌐 **sub:version (Biennial International Journal)**:\n• In-house academic journal conceptualized as an online global publication exploring multidisciplinary spatial and urban theories.\n• **Editor-in-Chief**: Dr. Rakesh K. S. (Principal); **Guest Editor**: Dr. Anant Maringanti (Founder & Director, Hyderabad Urban Lab).\n• Features interdisciplinary articles, audio, and video formats examining "Subcultures".\n\n📚 **Recent International Faculty Publications (2024)**:\n• **Routledge / Taylor & Francis**: "Physical Activity in Public Space: insights applying Photovoice" in *Cities & Health* journal.\n• **Springer Nature**: "Mobility as a Response to Urban Floods" in *Climate Crisis, Social Responses and Sustainability*.\n• **Taylor & Francis Book Chapter**: "Exploring Role of Public Spaces during Ashadh Wari in Pandharpur".\n\n🌐 **Official Publications Portal**: [View RVCA Publications & Archives (rvca.edu.in/rvca_publications/)](https://rvca.edu.in/rvca_publications/)`,
      chips: ["Research Overview", "Smart City (SAAR)", "Ph.D. Program", "Faculty Directory"]
    },
    {
      id: "barch_eligibility",
      priority: 0.75,
      keywords: ["barch eligibility", "b.arch eligibility", "barch criteria", "nata cutoff", "nata and jee", "nata", "cutoff", "cutoffs", "kea code", "code e-244", "jee paper 2", "10+2 marks", "eligibility", "criteria", "requirements"],
      title: "B.Arch Eligibility Criteria",
      response: `**B.Arch Eligibility & Qualifying Norms (COA 2020 Regulations)**\n\n1. **Qualifying Academic Exam**:\n   - 10+2 / PUC with Physics and Mathematics as compulsory subjects, along with Chemistry / Biology / Computer Science / IT / Informatics Practices / Engineering Graphics / Business Studies with **minimum 45% aggregate** (40% for reserved categories as per govt policy).\n   - OR 10+3 Diploma Examination with Mathematics as compulsory subject with at least 45% aggregate.\n2. **Compulsory Aptitude Test**:\n   - Mandatory qualifying score in **NATA (National Aptitude Test in Architecture)** conducted by COA OR **JEE Main Paper II**.\n3. **KEA College Code**: **E-244** for Karnataka domicile CET applicants.`,
      chips: ["B.Arch Fees", "Management Quota Criteria", "Application Forms"]
    },
    {
      id: "management_quota",
      priority: 0.75,
      keywords: ["management quota", "mgmt quota", "direct admission", "donation", "seat booking", "how to apply management", "broker", "brokers", "agent", "agents", "consultant"],
      title: "Management Quota Admission Procedure",
      response: `**B.Arch & M.Arch Management Quota Admission Criteria**\n\n**Academic Criteria for B.Arch**:\n• Min 70% in 10th Std in Science & Mathematics.\n• Min 65% in Class 11 Mathematics & Physics separately.\n• If Class 12 results announced: Min 60% in Physics, Chemistry & Mathematics separately.\n• Valid qualified score in NATA or JEE Main Paper II.\n• Non-state/CBSE/ICSE boards require Equivalence Certificate from Association of Indian Universities (AIU), New Delhi.\n\n**Application Process**:\n• Email scanned marks cards (10th, 11th, 12th) & NATA scorecard directly to 'The Hon. Secretary, RSST' at **rv@rvei.edu.in**.\n• **Strict Notice**: RVCA and RSST strictly entertain **NO brokers, consultants, or agents**. All admissions are processed transparently and directly.`,
      chips: ["B.Arch Fees", "Hostel Fees", "Contact Admissions"]
    },
    {
      id: "fees",
      priority: 1.0,
      keywords: ["fees", "fee structure", "tuition", "cost", "annual fee", "how much fee", "fee payment"],
      title: "Fee Structure & Payment Notifications",
      response: `**Fee Structure Summary at RVCA**\n\n• **B.Arch (KCET / KEA Quota)**: Fees fixed as per Government of Karnataka consensual agreement with KUPECA.\n  - [Download CET / KEA B.Arch Fee Details AY 2026-27](https://rvca.edu.in/wp-content/uploads/2026/07/CET-KEA-1st-Year-B.Arch-Admission-Procedure-Balance-Fee-AY-2026-27.pdf)\n• **B.Arch (COMEDK Quota)**: \n  - [Download COMEDK B.Arch Fee Details AY 2026-27](https://rvca.edu.in/wp-content/uploads/2026/08/COMEDK-1st-Year-B.Arch-Admission-Procedure-Balance-Fee-Details-AY-2026-27.pdf)\n• **M.Arch (Urban Design)**:\n  - PGCET Quota: Rs. 77,310/- per year\n  - Management Quota: Rs. 77,310/- annual tuition + Rs. 1.75 Lakhs one-time development fee.\n• **Hostel Fee Notification**: [Download AY 2026-27 Hostel Fee PDF](https://rvca.edu.in/wp-content/uploads/2026/06/HOSTEL-FEE-NOTIFICATION-AY-2026-27.pdf)\n• **Accounts Office**: Harsha Deshpande, Senior Executive Accountant (accounts.rvca@rvei.edu.in, 080-35094942).`,
      chips: ["Hostel Fees", "B.Arch Admissions", "Scholarships"]
    },
    {
      id: "placements",
      priority: 1.0,
      keywords: ["placement", "placements", "salary", "package", "recruiters", "jobs", "hiring", "highest package"],
      title: "Placement Assistance & Career Cell",
      response: `**Placements & Career Assistance at RVCA**\n\n• **Active Since**: 2016 (Annual on-campus & virtual recruiting drive).\n• **Placement Cell Coordinators**:\n  - Ar. Girish Ramanathan (Associate Professor)\n  - Ar. Vidya V (Associate Professor, [vidyav.rvca@rvei.edu.in](mailto:vidyav.rvca@rvei.edu.in), 080-35094938)\n• **Placement Office Email**: [placements2020.rvca@rvei.edu.in](mailto:placements2020.rvca@rvei.edu.in) | Instagram: @placementscell_rvca\n• **Leading Visiting Recruiters**:\n  - Total Environment\n  - Titan Company Ltd.\n  - Rainmaker Studio\n  - Vestian Global Ltd.\n  - Betweenlines\n• **Career Pathways**: Graduates excel in leading design studios, urban planning authorities, architectural conservation, BIM management, and allied fields (game design, UX/UI, set design).`,
      chips: ["Internship Cell", "GlobEd Study Abroad", "Student Achievements"]
    },
    {
      id: "internships",
      priority: 0.85,
      keywords: ["internship", "internships", "practical training", "interned firms", "internship coordinator"],
      title: "Internship Assistance Cell",
      response: `**Professional Internship Assistance Cell**\n\nB.Arch requires a mandatory semester of professional practical training in architectural practice.\n\n• **Coordination Team**:\n  - Ar. Anupriya Saxena (Assoc. Professor, 080-35094933)\n  - Ar. Megala Gurumurthi (Asst. Professor, 080-35094933)\n  - Ar. Vidya V (Senior Asst. Professor)\n  - Ar. Goutham K B (Asst. Professor)\n• **Internship Cell Email**: [ptcoordinator.rvca@rvei.edu.in](mailto:ptcoordinator.rvca@rvei.edu.in)\n• **Top Interned Firms**: SOHO Architects, Shekar & Associates, Studio Whitescape, SRDA (Samira Rathod Design Atelier), Mindspace Architects, Monsoon Design.\n• **Batch Brochures**:\n  - [Internship Batch Brochure 2021-2026 PDF](https://rvca.edu.in/wp-content/uploads/2025/11/B_Brochure_Draft_30_09_25-final.pdf)\n  - [Internship Batch Brochure 2020-2025 PDF](https://rvca.edu.in/wp-content/uploads/2024/09/internship-Batch-Brochure-2020-2025.pdf)`,
      chips: ["Placements", "GlobEd", "B.Arch Program"]
    },
    {
      id: "globed",
      priority: 0.85,
      keywords: ["globed", "study abroad", "higher studies", "masters abroad", "foreign university", "international"],
      title: "GlobEd — Global Education Guidance Cell",
      response: `**GlobEd Cell (Global Higher Education Guidance)**\n\nInitiated at RVCA in 2020, GlobEd guides students for international Master's and Ph.D. admissions in Architecture, Urbanism, and Allied Disciplines.\n\n• **Host Universities & Sessions**:\n  - KU Leuven (Belgium), Univ of South Wales & RMIT (Australia)\n  - University of Southern California & Auburn University (USA)\n  - Univ of Cincinnati (DAAP) & Rochester Institute of Technology (USA)\n  - University of Creative Arts, Strathclyde & Manchester Metropolitan (UK)\n  - National University of Singapore (NUS)\n  - Dessau International Architecture Graduate School (Anhalt, Germany)\n  - DAAD (German Academic Exchange Service) & British Council\n  - Indian Premier Institutes: CEPT Ahmedabad, NID, NICMAR, IIHS\n• **YouTube Conference Archives**: [Watch GlobEd Session Playlists](https://www.youtube.com/watch?v=7OXDei19ci4&list=PLP-zgFmq3dvJf_H6nQZsgavNkEv9Uy-pD)`,
      chips: ["Placements", "Internships", "Student Publications"]
    },
    {
      id: "hostels",
      priority: 0.9,
      keywords: ["hostel", "hostels", "accommodation", "boys hostel", "girls hostel", "mess", "food", "rooms", "venkatadri"],
      title: "Hostel Facilities & Mess",
      response: `**RVCA Student Hostels & Mess Facilities**\n\n• **On-Campus Hostels**: Separate Boys' and Girls' hostel blocks featuring 43-bed capacity each.\n• **Venkatadri Hostel**: Satellite hostel located approximately 4 km from campus with an additional 30-bed capacity.\n• **Vegetarian Mess**: Attached pure vegetarian mess serving 4 hygienic, wholesome meals daily (breakfast, lunch, evening snacks, dinner).\n• **Boys Hostel Warden**: **Dr. M S Amarnath** (Associate Professor)\n  - Email: [amarnathms.rvca@rvei.edu.in](mailto:amarnathms.rvca@rvei.edu.in) | Phone: 080-35092402\n• **Residential Warden**: Soniya V\n• **Official Notification**: [Download Hostel Fee Notification AY 2026-27](https://rvca.edu.in/wp-content/uploads/2026/06/HOSTEL-FEE-NOTIFICATION-AY-2026-27.pdf)`,
      chips: ["Hostel Fees", "Campus Facilities", "Transport Bus Routes"]
    },
    {
      id: "library",
      priority: 0.9,
      keywords: ["library", "books", "journals", "jstor", "opac", "reading room", "library opac", "material museum"],
      title: "RVCA Resource Centre & Library",
      response: `**RVCA Comprehensive Resource Centre & Library**\n\n• **Collections**: Extensive volumes in Architecture, Urban Design, Landscape Architecture, Conservation, and Allied Disciplines.\n• **Journals & E-Resources**: 81 print and electronic journals, JSTOR database (2,065+ archived journals), IndiaStat, World eBook Library, South Asia Archive, ISID, and V-IDEO.\n• **Remote Access**: Off-campus digital access provided to students and faculty.\n• **Web-OPAC**: Intranet Online Public Access Catalogue for catalog searching, dissertation lookup, and loan tracking.\n• **Exhibition Hall & Material Museum**: 180 sq. m hall exhibiting student models, award-winning thesis sheets, and material samples.\n• **Library Staff**: Ramaprasad C (Senior Library Executive), Chetankumar Jain (Assistant Librarian).`,
      chips: ["Skill Labs", "Campus Facilities", "Publications"]
    },
    {
      id: "skill_labs",
      priority: 0.85,
      keywords: ["labs", "skill labs", "pottery", "clay studio", "model making", "gis lab", "climate lab", "fabrication lab", "structural testing"],
      title: "Specialized Skill Labs & Studios",
      response: `**RVCA Hands-On Skill Labs & Fabrication Facilities**\n\n1. **Computer Graphics Studios**: High-end CAD/BIM workstations with AutoCAD, Revit, Rhino, GIS, and rendering software.\n2. **GIS Lab**: Dedicated geographic information software and spatial analysis infrastructure.\n3. **Model Making Workshop**: Material experimentation in wood, acrylic, wire, foam, and paper craft.\n4. **Clay & Pottery Station**: Ceramic studio with state-of-the-art pottery wheels and electric kilns for tactile 3D exploration.\n5. **Climate Responsive Lab**: Climatological simulation tools to test passive design and thermal dynamics.\n6. **Fabrication Lab**: Digital fabrication, 3D printing, and full-scale architectural mock-up prototyping.\n7. **Structural Testing Lab**: Material strength analysis for bricks, timber, concrete, and steel under load.`,
      chips: ["Library", "Campus Infrastructure", "B.Arch Program"]
    },
    {
      id: "campus_facilities",
      priority: 1.0,
      keywords: ["campus", "infrastructure", "facilities", "canteen", "transport", "bus", "doctor", "counselling", "sports"],
      title: "Campus Facilities & Student Amenities",
      response: `**RVCA Campus Infrastructure & Amenities**\n\n• **Location**: CA Site No. 1, Banashankari 6th Stage, 4th Block, Chikegowadanapalya, Bengaluru - 560109.\n• **Campus Transport**: Extensive bus routes connecting key localities across Bengaluru. [Download Bus Routes PDF](https://rvca.edu.in/wp-content/uploads/2026/06/TRANSPORT-FEE-NOTIFICATION-AY-2026-27.pdf)\n• **Sports & Physical Education**: Indoor table tennis, sports fest, gym under Mr. Puneeth H K (Assistant Director PE).\n• **Healthcare & Counselling**: On-campus doctor and dedicated student counselling cell.\n• **Canteen**: Hygienic multi-cuisine cafeteria providing fresh meals and refreshments.\n• **Multipurpose Hall**: Acoustically treated hall for national symposiums, exhibitions, and guest lectures.`,
      chips: ["Hostel Facilities", "Library", "Skill Labs"]
    },
    {
      id: "clubs",
      priority: 0.9,
      keywords: ["clubs", "student clubs", "activities", "art club", "heritage club", "drama club", "music club", "rotaract", "nss"],
      title: "Student Clubs & Co-Curricular Life",
      response: `**Student Clubs & Vibrant Campus Life at RVCA**\n\n• **Art Club**: Painting, sculpting, sketching, and campus murals\n• **Book Club**: Architectural literature circles and discussions\n• **Dance & Music Clubs**: Performing arts and cultural festival choreography\n• **Drama Club**: Stage plays and street theater on contemporary urban issues\n• **Heritage Club**: Vernacular architecture documentation and heritage conservation walks\n• **Sustainability Club**: Net-zero energy initiatives and Solar Decathlon participation\n• **Quiz Club**: Architectural trivia and general knowledge challenges\n• **Terra Thoughts & The Journey Shared**: Student editorial and travel memoirs\n• **NSS & Rotaract**: Blood donation, rural outreach, community service (Coordinated by Prof. Pedaparthi Shweta and Mr. B S Girish).`,
      chips: ["Publications", "Sports", "Campus Facilities"]
    },
    {
      id: "publications",
      priority: 0.9,
      keywords: ["publications", "kalpa", "subversion", "newsletter", "journal", "magazine"],
      title: "Institutional Publications & Journals",
      response: `**RVCA Institutional Publications**\n\n• **KALPA (Vol. 01 to Vol. 06)**: Annual college architectural journal highlighting studio portfolios, critical essays, and award-winning student projects. [View Kalpa Vol. 06](https://rvca.edu.in/kalpa/)\n• **sub:version (Issue 01 & Issue 02)**: Peer-reviewed architectural theory and critiques journal. [Download Issue 02 PDF](https://rvca.edu.in/wp-content/uploads/2025/09/00_Issue_2_2025.pdf)\n• **Monthly Newsletter**: Records faculty papers, guest lectures, student accolades, and campus events. [Read Newsletters](https://rvca.edu.in/newsletter/)`,
      chips: ["Research at RVCA", "Student Achievements", "About RVCA"]
    },
    {
      id: "achievements",
      priority: 0.9,
      keywords: ["achievement", "achievements", "awards", "rankings", "solar decathlon", "transparence", "ayda", "nirf", "india today"],
      title: "Institutional & Student Achievements",
      response: `**Major Accolades & Student Honors**\n\n• **National Rankings**:\n  - MDRA India Today 2025: Ranked 13th in India, No. 1 in Karnataka.\n  - GHRDC 2024: 2nd Rank in Super Excellence Category in India, 1st in Southern Region.\n  - THE WEEK 2025: 14th Place Nationally.\n• **Student Design Laurels**:\n  - **COA National Thesis Awards**: Harsha S M (Winner 2022), Dhruv Ravi Gowda & Namratha Dewanjee (National Winners 2023 with Rs. 1 Lakh cash prize each).\n  - **Solar Decathlon India**: Team 'Solastra' Runner-Up (2024); Team 'Green Collars' Winner (2023).\n  - **Transparence (Saint-Gobain)**: National winners & runners-up across Transparence 17.0 and 18.0.\n  - **Asia Young Designer Awards (AYDA)**: Gold & Silver awards in national finals sponsored by Nippon Paint.\n  - **VTU University Rank**: Pooja Vijay secured 2nd Rank in M.Arch (Urban Design) for 2023-25 batch.`,
      chips: ["About RVCA", "Placements", "Publications"]
    },
    {
      id: "study_tours",
      priority: 0.85,
      keywords: ["study tour", "study tours", "architectural tour", "travel study", "documentation tour", "field trips", "travels"],
      title: "Architectural Study Tours & Field Exploration",
      response: `**Architectural Study Tours & Experiential Learning at RVCA**\n\nAt RV College of Architecture, study tours form an essential pillar of our experiential curriculum. We believe architecture is best understood by experiencing spaces firsthand:\n\n• **National & International Tours**: Every academic year, faculty guides curated documentation tours across India and international architectural capitals to study vernacular heritage, structural innovations, and contemporary masterpieces.\n• **Studio Integration**: Students document historical precincts, measure structures, sketch on-site, and engage directly with regional craftsmen and legendary architects.\n• **Travel Memoirs**: Student travelogues and field documentations are featured in our annual publications *KALPA* and *The Journey Shared*.\n• **Official Tour Portal**: [RVCA Study Tours](https://rvca.edu.in/infrastructure/STUDY%20TOUR/)`,
      chips: ["Site Visits", "Student Clubs", "Campus Facilities", "B.Arch Program"]
    },
    {
      id: "site_visits",
      priority: 0.85,
      keywords: ["site visit", "site visits", "construction visit", "live project", "site exposure", "construction site"],
      title: "Site Visits & Practical Construction Exposure",
      response: `**Live Site Visits & Practical Studio Exposure**\n\nRVCA places immense value on bridging theoretical studio drafting with real-world construction reality:\n\n• **Active Construction Exposure**: Students regularly visit active residential, commercial, and urban infrastructure sites across Bengaluru.\n• **Material Interaction**: Gain firsthand insights into structural steel erection, RCC casting, brick bonding, HVAC ducting, and sustainable building technologies.\n• **Expert Interactions**: Direct on-site dialogue with site engineers, project managers, and practicing architects.\n• **Official Site Visits Portal**: [RVCA Site Visits](https://rvca.edu.in/infrastructure/SITE%20VISITS/)`,
      chips: ["Skill Labs", "Study Tours", "B.Arch Program", "Internships"]
    },
    {
      id: "canteen_and_dining",
      priority: 0.85,
      keywords: ["canteen", "cafeteria", "food", "dining", "canteen food", "lunch", "snacks", "mess menu"],
      title: "Campus Canteen & Dining Facilities",
      response: `**Campus Canteen & Dining Experience at RVCA**\n\n• **Hygienic Multi-Cuisine Cafeteria**: Open from **09:00 AM to 05:00 PM**, serving fresh breakfast, lunch, and evening refreshments.\n• **Student Committee Curated Menu**: The mess menu is actively curated in consultation with the Student Welfare Committee to ensure balanced nutrition and diverse regional delicacies.\n• **Hostel Mess**: In addition to the canteen, hostel students enjoy an attached pure vegetarian dining hall serving 4 hygienic meals daily (breakfast, lunch, evening snacks, and dinner).\n• **Portal**: [RVCA Canteen](https://rvca.edu.in/infrastructure/canteen/)`,
      chips: ["Hostel Facilities", "Campus Facilities", "Contact Us"]
    },
    {
      id: "sports_and_fitness",
      priority: 0.85,
      keywords: ["sports", "gym", "fitness", "badminton", "basketball", "table tennis", "physical education", "gymnasium", "indoor games"],
      title: "Sports, Gymnasium & Physical Education",
      response: `**Sports & Physical Fitness at RVCA**\n\nRVCA encourages holistic student wellbeing with vibrant sports infrastructure:\n\n• **Facilities Available**: Dedicated basketball court, badminton court, gymnasium, indoor table tennis, chess, and carrom boards.\n• **Annual Sports Fest**: Inter-batch and inter-college sports tournaments organized every academic year.\n• **Physical Education Director**: Mr. Puneeth Kempegowda (Assistant Director of Physical Education, [puneethhk.rvca@rvei.edu.in](mailto:puneethhk.rvca@rvei.edu.in)).\n• **Official Portal**: [RVCA Physical Education](https://rvca.edu.in/infrastructure/physical-education/)`,
      chips: ["Student Clubs", "Campus Facilities", "Hostels"]
    },
    {
      id: "scholarships_aid",
      priority: 0.85,
      keywords: ["scholarship", "scholarships", "financial aid", "fee concession", "ssp", "nsp", "sc st scholarship", "fee discount"],
      title: "Scholarships & Financial Assistance",
      response: `**Scholarships & Financial Assistance at RVCA**\n\nWe believe financial constraints should never hinder a talented student's architectural ambitions:\n\n• **Government Scholarships**: Complete facilitation for State Scholarship Portal (SSP), National Scholarship Portal (NSP), Post-Matric SC/ST/OBC Scholarships, and Fee Concessions.\n• **RSST Trust Scholarships**: Merit-cum-means assistance provided by Rashtreeya Sikshana Samithi Trust for deserving candidates.\n• **Scholarship Coordinator**: Prof. Prasanna Rao | Phone: **080-35094920** / **080-35094924**.\n• **Social Welfare Officer**: Prof. K Sreedhar | Official desk assistance.`,
      chips: ["Fee Structure", "Admissions", "Contact Us"]
    },
    {
      id: "experiential_studios",
      priority: 0.85,
      keywords: ["studios", "design studios", "work desks", "drafting tables", "drafting boards", "learning spaces", "classrooms"],
      title: "Experiential Design Studios & Workspaces",
      response: `**Spacious Experiential Design Studios at RVCA**\n\n• **Individual Workstations**: Every student is allocated an individual drafting table, ergonomic seating, and locker storage within dedicated 40-student studio spaces.\n• **Natural Daylighting & Ventilation**: Acoustically designed, high-ceiling studios that maximize natural ambient light for sketching and technical drafting.\n• **Critique & Jury Areas**: Integrated pin-up boards and digital projection displays for studio juries and peer evaluations.\n• **Portal**: [RVCA Experiential Learning Spaces](https://rvca.edu.in/infrastructure/experiential-learning-spaces/)`,
      chips: ["Skill Labs", "Campus Facilities", "B.Arch Program"]
    },
    {
      id: "faculty_directory",
      priority: 1.0,
      keywords: ["faculty", "teachers", "staff", "who teaches", "faculty list", "faculty members", "all faculty", "mentors"],
      title: "Complete Faculty Directory (63 Members)",
      response: `**RVCA Faculty & Mentors Directory (63 Distinguished Members)**\n\nRVCA boasts 63 highly experienced faculty members across B.Arch, M.Arch (Urban Design), and Administration:\n\n• **Principal**: Dr. Rakesh K. S. (Ph.D. SAP Chennai)\n• **Dean**: Prof. Suresh K Murthy (M.Tech IIT Delhi, MSU Baroda)\n• **Design Chair**: Prof. Dinesh Rao (36+ yrs practice, Monsoon Design)\n• **Professors**: Prof. Phani Ram Pingali, Prof. Prasanna Rao (Assoc. Dean PG), Dr. Om Prakash Bawane, Prof. K Sreedhar\n• **Associate Professors (14 Members)**: Dr. M S Amarnath, Dr. H R Manjunath, Dr. Shikha Verma, Dr. Mahalakshmi Karnad, Dr. Saisanath, Dr. Chinnu S Kumar, Bikramjit Chakraborty, Seema Maiya U, Anupriya Saxena, Archana Vittal, Nishant, Hiranmayi Shankavaram, Girish Ramanathan.\n• **Senior Asst. Professors**: Dharshini YG, Ramya Krishna, Pedaparthi Shweta, Vidya V, Mayank Singh.\n• **Assistant Professors (21 Members)**: Megala Gurumurthi, Nitin Bhardwaj, Pappu Harcharan, Ajinkya Kanitkar, Ishani Gogoi, Abhinandan K S, Dr. Asmita Yadav, Deepthi V, Akanksha Singh, Ujjayant Bhattacharyya, Lavanya Anbazhagan, Akanksha Ruchi Horo, Abhirami A, Kiranjee, Goutham K B, Sunain Dalwani, Raghavendra Kuppusamy, William George Kennedy, Archita Bandyopadhyay, Deepika Varadarajan, Prakruthi S Karadagi.\n\n🌐 **Official Faculty Portal**: [Explore Full Faculty Bios (rvca.edu.in/faculty/)](https://rvca.edu.in/faculty/)`,
      chips: ["Professors", "Associate Professors", "Doctoral Mentors", "B.Arch Faculty", "M.Arch Faculty"]
    },
    {
      id: "faculty_professors",
      priority: 0.98,
      keywords: ["professors", "who are the professors", "senior professors", "full professors", "senior faculty", "professors list", "chairperson", "design chair"],
      title: "Senior Professors & Academic Leadership",
      response: `**Professors & Academic Leadership at RVCA**\n\nThe senior academic council at RVCA comprises distinguished academicians and master practitioners:\n\n1. **Dr. Rakesh K. S.** — Principal & Senior Professor\n   • Qualifications: B.Arch., M.Arch., Ph.D. [SAP Chennai]\n   • Specialisation: Climatic Design, Sustainable Architecture\n\n2. **Prof. Suresh K Murthy** — Dean & Professor\n   • Qualifications: B.Arch. [MSU Baroda], M.Tech. (BS & CM) [IIT Delhi]\n   • Specialisation: Building Science & Construction Management, Environmental Responsive Design\n\n3. **Prof. Dinesh Rao** — Professor & Design Chair\n   • Experience: 36+ Years Practicing Architect; Principal Architect at Monsoon Design\n   • Specialisation: Architectural Planning, Studio Juries, Spatial Experience\n\n4. **Dr. Om Prakash Bawane** — Senior Professor / Former Principal\n   • Qualifications: B.Arch. [NIT Bhopal], M.Arch. [IIT Roorkee], Ph.D. [VMU]\n   • Specialisation: Sustainable Development, Building Services, Quality Assurance\n\n5. **Prof. Phani Ram Pingali** — Professor\n   • Qualifications: B.Arch. [JNTU], MS (Arch.) [Louisiana State University, USA]\n   • Specialisation: Architectural Pedagogy, Studio Practice\n\n6. **Prof. Prasanna Rao** — Professor & Associate Dean (PG Studies)\n   • Qualifications: B.Arch. [Mysore Univ], M.Arch. (Urban Design) [CEPT Ahmedabad]\n   • Specialisation: Urban Design & Morphological Transformation\n\n7. **Prof. K Sreedhar** — Professor & Social Welfare Officer\n   • Qualifications: B.Arch. [Bangalore University]\n   • Specialisation: Institutional Welfare, Professional Practice\n\n🌐 **Official Faculty Directory**: [Explore All 63 Faculty Members (rvca.edu.in/faculty/)](https://rvca.edu.in/faculty/)`,
      chips: ["Associate Professors", "Doctoral Mentors", "B.Arch Faculty", "M.Arch Faculty", "Faculty Directory"]
    },
    {
      id: "faculty_associate_professors",
      priority: 0.98,
      keywords: ["associate professors", "associate prof", "associate professors list", "associate faculty"],
      title: "Associate Professors at RVCA",
      response: `**Associate Professors at RV College of Architecture**\n\nRVCA has 14 Associate Professors leading advanced design studios, technical labs, and research cells:\n\n• **Dr. M S Amarnath** — Ph.D. Jain Univ | Associate Professor & Boys Hostel Warden\n• **Dr. H R Manjunath** — Ph.D. VTU | M.E. Structures | Structural Systems & Climatology\n• **Dr. Shikha Verma** — Ph.D. MNNIT Allahabad | Environmental Geotechnology & Waste Systems\n• **Dr. Mahalakshmi Karnad** — Ph.D. SPA New Delhi | Landscape Architecture & Traditional Design\n• **Dr. Saisanath** — Ph.D. NIT Trichy | Urban & Regional Planning\n• **Dr. Chinnu S Kumar** — Ph.D. MNIT Jaipur | Urban Design & Spatial Modeling\n• **Bikramjit Chakraborty** — M.Arch Jadavpur Univ | Architecture History & Theory\n• **Seema Maiya U** — M.Arch VTU | Studio & Architectural Graphics\n• **Anupriya Saxena** — M.BEM SPA New Delhi, Ph.D. Scholar NIT Trichy | Building Engineering Management\n• **Archana Vittal** — M.Arch | Pedestrian Systems & Urban Morphology\n• **Nishant** — M.Arch | Sustainable & Digital Drafting\n• **Hiranmayi Shankavaram** — M.Sc Erasmus Univ Netherlands | Urban Management & Public Spaces\n• **Girish Ramanathan** — M.Arch | Experiential Studio Instructor\n\n*(Tip: Type any professor's name, e.g., \"tell me about Shikha Verma\" for their complete bio and official profile link!)*`,
      chips: ["Professors", "Assistant Professors", "Doctoral Mentors", "Faculty Directory"]
    },
    {
      id: "faculty_assistant_professors",
      priority: 0.98,
      keywords: ["assistant professors", "assistant prof", "assistant professors list", "assistant faculty"],
      title: "Assistant Professors & Studio Instructors",
      response: `**Assistant Professors at RV College of Architecture**\n\nRVCA has an energetic cohort of 26 Assistant Professors & Senior Assistant Professors mentoring foundational to advanced studios:\n\n• **Senior Assistant Professors**: Dharshini YG, Ramya Krishna, Pedaparthi Shweta, Vidya V, Mayank Singh.\n• **Assistant Professors**: Megala Gurumurthi, Nitin Bhardwaj, Pappu Harcharan, Ajinkya Kanitkar, Ishani Gogoi, Abhinandan K S, Dr. Asmita Yadav, Deepthi V, Akanksha Singh, Ujjayant Bhattacharyya, Lavanya Anbazhagan, Akanksha Ruchi Horo, Abhirami A, Kiranjee, Goutham K B, Sunain Dalwani, Raghavendra Kuppusamy, William George Kennedy, Archita Bandyopadhyay, Deepika Varadarajan, Prakruthi S Karadagi.\n\n• **Studio Focus**: Architectural drawing, pottery & ceramics, climatology simulation, digital fabrication, 3D printing, structural modeling.\n\n🌐 **Official Faculty Directory**: [Explore All Faculty Profiles (rvca.edu.in/faculty/)](https://rvca.edu.in/faculty/)`,
      chips: ["Professors", "Associate Professors", "Doctoral Mentors", "Faculty Directory"]
    },
    {
      id: "faculty_phd_holders",
      priority: 0.98,
      keywords: ["phd faculty", "ph.d faculty", "doctorate faculty", "who has phd", "phd holders", "professors with phd", "faculty qualifications phd", "faculty phd", "doctoral faculty", "doctoral mentors"],
      title: "Doctoral Degree Faculty (Ph.D. Mentors)",
      response: `**Doctoral Degree (Ph.D.) Faculty at RVCA**\n\nRVCA features an outstanding concentration of doctoral-qualified faculty mentors from premier institutions across India:\n\n1. **Dr. Rakesh K. S.** (Principal) — Ph.D. from **School of Architecture & Planning (SAP), Anna University Chennai**\n2. **Dr. Om Prakash Bawane** (Senior Professor) — Ph.D. from **Vinayaka Missions University** & M.Arch from **IIT Roorkee**\n3. **Dr. Shikha Verma** (Associate Professor) — Ph.D. & M.Tech from **MNNIT Allahabad**\n4. **Dr. Mahalakshmi Karnad** (Associate Professor) — Ph.D. & MLA from **School of Planning and Architecture (SPA), New Delhi**\n5. **Dr. Saisanath** (Associate Professor) — Ph.D. from **National Institute of Technology (NIT), Tiruchirappalli**\n6. **Dr. Chinnu S Kumar** (Associate Professor) — Ph.D. from **Malaviya National Institute of Technology (MNIT), Jaipur**\n7. **Dr. H R Manjunath** (Associate Professor) — Ph.D. from **Visvesvaraya Technological University (VTU)**\n8. **Dr. M S Amarnath** (Associate Professor) — Ph.D. from **Jain University** & MFA from **MSU Baroda**\n9. **Anupriya Saxena** (Associate Professor) — Ph.D. Research Scholar at **NIT Tiruchirappalli**\n10. **Akanksha Singh** (Assistant Professor) — Ph.D. Research Scholar at **NIT Calicut**\n\nScholars are eligible for Ph.D. guidance under these approved VTU research mentors.\n\n🌐 **Official Research Centre**: [Ph.D. Programme Details (rvca.edu.in/programmes/phdprogramme/)](https://rvca.edu.in/programmes/phdprogramme/)`,
      chips: ["Research Guides", "Research Overview", "Ph.D. Program", "Faculty Directory"]
    },
    {
      id: "faculty_by_dept",
      priority: 0.98,
      keywords: ["m.arch faculty", "march faculty", "pg faculty", "b.arch faculty", "barch faculty", "ug faculty", "who teaches march", "who teaches barch", "urban design faculty"],
      title: "Faculty by Academic Wing — B.Arch vs M.Arch",
      response: `**RVCA Faculty by Academic Department**\n\nFaculty members at RVCA are specialized across Undergraduate and Postgraduate studios:\n\n🏛️ **Postgraduate Studies (M.Arch in Urban Design)**:\n• **Prof. Prasanna Rao** — Associate Dean (PG Studies) | B.Arch, M.Arch (Urban Design) [CEPT Ahmedabad]\n• **Dr. Chinnu S Kumar** — Associate Professor | M.U.D. [SPA New Delhi], Ph.D. [MNIT Jaipur]\n• **Prof. Hiranmayi Shankavaram** — Assistant Professor | M.Sc Urban Management [Erasmus University, Netherlands]\n• Supported by visiting international master planners and urban design jury members.\n\n📐 **Undergraduate Studies (B.Arch — 5 Years)**:\n• 44 full-time dedicated design studio professors, associate professors, and assistant professors.\n• Led by Principal Dr. Rakesh K. S., Dean Prof. Suresh K Murthy, Design Chair Prof. Dinesh Rao, and Senior Prof. Phani Ram Pingali.\n• Focus: Studio mentorship, pottery & ceramic arts, climatology simulation, structural drafting, digital fabrication.\n\n🌐 **Official Faculty Directory**: [View All 63 Faculty Members (rvca.edu.in/faculty/)](https://rvca.edu.in/faculty/)`,
      chips: ["Professors", "Associate Professors", "M.Arch Urban Design", "B.Arch Program", "Faculty Directory"]
    },
    {
      id: "contact_directory",
      priority: 1.0,
      keywords: ["contact", "contact us", "phone", "email", "address", "location", "reach", "maps", "helpdesk"],
      title: "Campus Location & Official Contact Directory",
      response: `**RV College of Architecture Contact Channels**\n\n• **Address**: CA Site No. 1, Banashankari 6th Stage, 4th Block, Chikegowadanapalya, Bengaluru - 560109, Karnataka, India\n• **Campus EPABX**: +91-80-35095000 / 5001 / 5002\n• **Google Maps**: [View Campus Location](https://maps.app.goo.gl/giLUPxmCUxKH9WdcA)\n\n**Key Department Desks**:\n• **Principal / Academics**: [principal.rvca@rvei.edu.in](mailto:principal.rvca@rvei.edu.in) | 080-35095001\n• **M.Arch (Urban Design)**: Prof. Prasanna Rao | 080-35094924\n• **VTU Affairs & Exams**: Dr. H R Manjunath | 080-35094929\n• **Accounts & Fees**: Harsha Deshpande | 080-35094942\n• **Boys Hostel**: Dr. M S Amarnath | 080-35092402\n• **Training & Placements**: Ar. Vidya V | 080-35094938\n• **Internship Cell**: Ar. Anupriya Saxena | 080-35094933\n• **HR & Admin**: Srinivas A M | 080-35095004`,
      chips: ["Admissions", "Fees", "Hostel Facilities"]
    },
    {
      id: "campus_life",
      priority: 0.85,
      keywords: ["campus life", "student life", "life at rvca", "college life", "studio culture", "studio life", "atmosphere at rvca", "day in the life", "what is student life like", "campus vibe"],
      title: "Student Life & Vibrant Studio Culture",
      response: `**Student Life & Studio Culture at RVCA**\n\nLife at RVCA is creative, dynamic, and community-driven. Architecture is more than a degree here — it's an immersive lifestyle:\n\n• **Studio Culture**: The heart of RVCA beats in the design studios. Students collaborate, brainstorm, build physical scale models, and engage in constructive jury critiques in daylit, open workspaces.\n• **Study Tours & Site Visits**: Every academic year features curated travel across heritage cities (Hampi, Rajasthan, Kerala, Chandigarh) and international design capitals, alongside live construction site visits in Bengaluru.\n• **Vibrant Student Clubs**: From the Art Club, Heritage Club, and Drama Club to the Sustainability Club (Solar Decathlon) and Quiz Club, there are endless avenues for creative expression.\n• **Festivals & Events**: Annual Architecture Fests, inter-batch sports tournaments, exhibitions in the 180 sq. m Material Museum, and design symposiums.\n• **Dining & Social Spaces**: The campus cafeteria, open courtyards, and green landscaped pockets serve as bustling hubs for casual chats, coffee breaks, and group discussions.\n• **Wellbeing & Support**: Dedicated physical education directors, a gym, badminton/basketball courts, on-campus healthcare doctor, and student counselling committee.`,
      chips: ["Experiential Studios", "Study Tours", "Student Clubs", "Hostels", "Sports & Fitness"]
    },
    {
      id: "timings_and_schedule",
      priority: 0.85,
      keywords: ["timings", "college timings", "working hours", "working days", "classes timing", "office hours", "what time does college start", "daily schedule", "timing of college"],
      title: "College Timings & Academic Working Hours",
      response: `**RVCA College Timings & Office Hours**\n\n• **Academic Studio & Class Hours**:\n  - **Monday to Friday**: 09:00 AM – 04:30 PM\n  - **Saturday**: 09:00 AM – 01:30 PM (Design studios, workshops, and student club activities)\n• **Principal's Office & Administration**:\n  - **Monday to Friday**: 09:00 AM – 05:00 PM (Principal desk accessible till 07:00 PM on appointment)\n• **Resource Centre & Library**:\n  - **Monday to Friday**: 08:30 AM – 06:00 PM\n  - **Saturday**: 09:00 AM – 02:00 PM\n• **Campus Canteen**:\n  - 09:00 AM – 05:00 PM daily\n• **Hostel Dining Hours**:\n  - Breakfast: 07:30 AM – 09:00 AM\n  - Lunch: 12:30 PM – 02:00 PM\n  - Evening Tea: 04:30 PM – 05:30 PM\n  - Dinner: 07:30 PM – 09:30 PM`,
      chips: ["Campus Facilities", "Experiential Studios", "Contact Directory"]
    },
    {
      id: "curriculum_and_syllabus",
      priority: 0.85,
      keywords: ["curriculum", "syllabus", "subjects", "course structure", "what will i study", "learning scheme", "cbcs scheme", "barch subjects", "design studio syllabus"],
      title: "Architecture Curriculum & Subjects (VTU CBCS Scheme)",
      response: `**RVCA Architecture Curriculum & Subjects Overview**\n\nRVCA follows the approved Visvesvaraya Technological University (VTU) Choice Based Credit System (CBCS) curriculum, updated regularly to incorporate contemporary design technologies:\n\n1. **Core Architectural Design Studios**:\n   - Residential, Institutional, Commercial, Urban Habitat, and Thesis Design Studios.\n2. **Building Construction & Materials (MMBC)**:\n   - Brick, timber, RCC, steel construction, advanced building technologies, and joinery details.\n3. **Architectural Graphics & Drawing**:\n   - Freehand sketching, geometric perspective, descriptive geometry, and presentation techniques.\n4. **History & Theory of Architecture**:\n   - Ancient Indian, Vernacular, Western, Islamic, Modern, and Contemporary architectural history.\n5. **Climate Responsive Architecture & Environmental Science**:\n   - Passive cooling, solar shading, thermal comfort, acoustics, illumination, and building services.\n6. **Digital Tools & Spatial Analytics**:\n   - AutoCAD, Revit (BIM), SketchUp, Rhino, Photoshop, and GIS analytical mapping.\n7. **Structures & Materials Science**:\n   - Structural mechanics, RCC design, steel structures, and seismic-resistant design.\n8. **Professional Practice & Mandatory Internship**:\n   - Office management, Council of Architecture codes, tendering, and 1 full semester in practice.\n\n• **Official Downloads**: [Download VTU B.Arch 2021 Scheme & Syllabus PDF](https://rvca.edu.in/programmes/ugprogramme/ug_2021_scheme__syllabus/)`,
      chips: ["B.Arch Program", "Experiential Studios", "Skill Labs", "Internships"]
    },
    {
      id: "how_to_reach_location",
      priority: 0.85,
      keywords: ["how to reach", "nearest metro", "metro connectivity", "bus connectivity", "location details", "directions to campus", "how to visit campus", "nearest metro station", "location of rvca"],
      title: "Location, Directions & Metro Transit Connectivity",
      response: `**How to Reach RV College of Architecture**\n\n• **Campus Address**:\n  CA Site No. 1, Banashankari 6th Stage, 4th Block, Chikegowadanapalya, Bengaluru - 560109, Karnataka, India.\n• **Google Maps Navigation**: [Open RVCA on Google Maps](https://maps.app.goo.gl/giLUPxmCUxKH9WdcA)\n\n🚇 **Nearest Metro Connectivity**:\n• **Namma Metro Green Line**: The nearest metro stations are **Vajarahalli Metro Station** and **Silk Institute Metro Station** on Kanakapura Road (~10-12 mins by auto/cab).\n\n🚌 **BMTC Bus & Institutional Transport**:\n• **BMTC Bus Stops**: Chikegowadanapalya / Banashankari 6th Stage bus stops connecting to Banashankari TTMC and Majestic.\n• **College Bus Fleet**: RVCA operates dedicated bus routes connecting major residential hubs across Bengaluru. [Download Bus Routes & Transport Notification](https://rvca.edu.in/wp-content/uploads/2026/06/TRANSPORT-FEE-NOTIFICATION-AY-2026-27.pdf)\n\n🚗 **Landmarks**: Located off Kanakapura Road near NICE Road junction, providing seamless ring-road connectivity across Bengaluru.`,
      chips: ["Campus Facilities", "Contact Us", "Hostel Facilities"]
    },
    {
      id: "cutoffs_and_scores",
      priority: 0.8,
      keywords: ["admission cutoff", "admission cutoffs", "closing rank", "rank required", "minimum marks for admission", "kcet closing rank", "comedk closing rank"],
      title: "Admission Cutoffs & Qualifying Score Benchmarks",
      response: `**RVCA Admission Cutoffs & Score Benchmarks**\n\nAdmissions to RVCA are among the most sought-after in South India:\n\n• **KEA KCET (Karnataka Quota — Code E-244)**:\n  - Combined merit rank calculated using 50% 10+2 (PCM) marks + 50% NATA score.\n  - Typically closes within the top competitive ranks for architecture colleges in Karnataka.\n• **COMEDK UGET (All-India Merit Quota)**:\n  - Open to students nationwide; evaluated on 10+2 marks + NATA normalized scores.\n• **Direct Management Quota Minimum Eligibility Benchmarks**:\n  - 10th Standard: Minimum 70% in Science & Mathematics.\n  - Class 11: Minimum 65% in Mathematics & Physics individually.\n  - Class 12: Minimum 60% in Physics, Chemistry & Mathematics individually.\n  - Valid qualified NATA or JEE Main Paper II scorecard.`,
      chips: ["B.Arch Eligibility", "Management Quota", "Admissions Overview"]
    }
  ];

  // 9. UNIVERSAL 0ms BUTTON BYPASS MAP
  const INTENT_LABELS = {
    "about": "about_rvca",
    "about rvca": "about_rvca",
    "courses": "courses_overview",
    "cources": "courses_overview",
    "programmes": "courses_overview",
    "programs": "courses_overview",
    "admissions": "admissions_overview",
    "admission": "admissions_overview",
    "facilities": "campus_facilities",
    "campus facilities": "campus_facilities",
    "infrastructure": "campus_facilities",
    "contact us": "contact_directory",
    "contact": "contact_directory",
    "why rvca": "why_rvca",
    "why choose rvca": "why_rvca",
    "everything about rvca": "everything_overview",
    "complete guide": "everything_overview",
    "campus life": "campus_life",
    "student life": "campus_life",
    "timings": "timings_and_schedule",
    "college timings": "timings_and_schedule",
    "curriculum": "curriculum_and_syllabus",
    "syllabus": "curriculum_and_syllabus",
    "how to reach": "how_to_reach_location",
    "directions": "how_to_reach_location",
    "study tours": "study_tours",
    "site visits": "site_visits",
    "canteen": "canteen_and_dining",
    "sports": "sports_and_fitness",
    "sports & fitness": "sports_and_fitness",
    "scholarships": "scholarships_aid",
    "experiential studios": "experiential_studios",
    "studios": "experiential_studios",
    "b.arch program": "barch_program",
    "barch program": "barch_program",
    "b.arch": "barch_program",
    "barch": "barch_program",
    "b.arch eligibility": "barch_eligibility",
    "barch eligibility": "barch_eligibility",
    "eligibility": "barch_eligibility",
    "eligibility (nata)": "barch_eligibility",
    "eligibility & nata": "barch_eligibility",
    "m.arch program": "march_program",
    "march program": "march_program",
    "m.arch urban design": "march_program",
    "march urban design": "march_program",
    "m.arch": "march_program",
    "march": "march_program",
    "ph.d program": "phd_program",
    "phd program": "phd_program",
    "phd": "phd_program",
    "fee structure": "fees",
    "fees": "fees",
    "b.arch fees": "fees",
    "hostel facilities": "hostels",
    "hostels": "hostels",
    "hostel fees": "hostels",
    "placements": "placements",
    "placement": "placements",
    "placements & internships": "placements",
    "internship cell": "internships",
    "internships": "internships",
    "globed": "globed",
    "globed study abroad": "globed",
    "principal": "principal",
    "principal bio": "principal",
    "dean": "dean",
    "dean & leadership": "dean",
    "dean bio": "dean",
    "board of management": "board_of_management",
    "anti-ragging": "antiragging",
    "statutory committees": "committees",
    "skill labs": "skill_labs",
    "library": "library",
    "campus tour": "campus_facilities",
    "student clubs": "clubs",
    "clubs": "clubs",
    "publications": "publications_deep",
    "publications (kalpa)": "publications_deep",
    "kalpa": "publications_deep",
    "kalpa magazine": "publications_deep",
    "subversion": "publications_deep",
    "sub:version": "publications_deep",
    "achievements": "achievements",
    "faculty directory": "faculty_directory",
    "all faculty": "faculty_directory",
    "professors": "faculty_professors",
    "senior professors": "faculty_professors",
    "associate professors": "faculty_associate_professors",
    "assistant professors": "faculty_assistant_professors",
    "ph.d mentors": "faculty_phd_holders",
    "phd mentors": "faculty_phd_holders",
    "b.arch faculty": "faculty_by_dept",
    "m.arch faculty": "faculty_by_dept",
    "research": "research_overview",
    "research overview": "research_overview",
    "research & innovation": "research_overview",
    "smart city": "smart_city_research",
    "smart city projects": "smart_city_research",
    "smart city (saar)": "smart_city_research",
    "saar": "smart_city_research",
    "udrcc": "smart_city_research",
    "research guides": "research_guides",
    "phd guides": "research_guides",
    "contact authorities": "contact_directory",
    "contact administration": "contact_directory",
    "management quota criteria": "management_quota",
    "management quota": "management_quota",
    "application forms": "fees"
  };

  // 7. DYNAMIC FACULTY DETECTIVE
  function findFacultyMember(queryText) {
    if (!FACULTY || !Array.isArray(FACULTY)) return null;
    const clean = queryText.toLowerCase().replace(/^(dr|prof|ar|mr|ms|mrs)\.?\s+/gi, '').trim();

    // PASS 1: Check full name matches first
    for (const member of FACULTY) {
      const memName = member.name.toLowerCase().replace(/^(dr|prof|ar|mr|ms|mrs)\.?\s+/gi, '').trim();
      if (clean === memName || clean.includes(memName) || memName.includes(clean)) {
        return member;
      }
    }

    // PASS 2: Check distinctive single tokens (length >= 4, ignoring general words and common surnames)
    const ignoreWords = new Set([
      'about', 'tell', 'who', 'the', 'is', 'dr', 'prof', 'mr', 'ms', 'mrs',
      'faculty', 'professor', 'professors', 'teacher', 'teachers', 'warden',
      'dean', 'principal', 'design', 'chair', 'associate', 'assistant',
      'member', 'members', 'research', 'guide', 'guides', 'project', 'projects',
      'phd', 'barch', 'march', 'college', 'architecture'
    ]);
    const queryTokens = clean.split(/[^a-z0-9]+/i).filter(w => w.length >= 4 && !ignoreWords.has(w));
    const commonSurnames = new Set(['kumar', 'singh', 'rao', 'reddy', 'babu', 'sharma']);

    for (const member of FACULTY) {
      const memName = member.name.toLowerCase().replace(/^(dr|prof|ar|mr|ms|mrs)\.?\s+/gi, '').trim();
      const parts = memName.split(/[^a-z0-9]+/i).filter(p => p.length >= 4 && !commonSurnames.has(p));

      for (const token of queryTokens) {
        if (parts.some(p => p === token)) {
          return member;
        }
      }
    }
    return null;
  }

  function formatFacultyResponse(faculty) {
    let text = `**Faculty Profile — ${faculty.name}**\n\n`;
    text += `• **Designation / Role**: ${faculty.role || faculty.designation || 'Faculty Member'}\n`;
    text += `• **Department**: ${faculty.department || 'Department of Architecture'}\n`;
    if (faculty.qualification) text += `• **Qualifications**: ${faculty.qualification}\n`;
    if (faculty.specialisation) text += `• **Specialisation & Research**: ${faculty.specialisation}\n`;
    if (faculty.email) text += `• **Official Email**: [${faculty.email}](mailto:${faculty.email})\n`;
    if (faculty.phone) text += `• **Phone / Desk**: ${faculty.phone}\n`;
    if (faculty.profileUrl) text += `• **Official Profile**: [View Bio on rvca.edu.in](${faculty.profileUrl})\n`;
    return text;
  }

  // 6. COMPOSITE INTENT RESOLUTION MATRIX
  function resolveCompositeIntent(cleanQuery, tokens = []) {
    const combined = (cleanQuery + ' ' + tokens.join(' ')).toLowerCase();

    // Specific Research & Publication triggers
    if (/\b(smart city|saar|udrcc|shivamogga smart)\b/i.test(combined)) return "smart_city_research";
    if (/\b(kalpa|sub:?version)\b/i.test(combined)) return "publications_deep";
    if (/\b(research guides?|doctoral guides?|supervisors?)\b/i.test(combined)) return "research_guides";
    if (/\b(publications?|research papers?|faculty papers?)\b/i.test(combined)) return "publications_deep";
    if (/\b(research in rvca|research projects?|funded research|research work|research thrust)\b/i.test(combined)) return "research_overview";

    // Specific Faculty ranks & wings triggers
    if (/\b(associate professors?)\b/i.test(combined)) return "faculty_associate_professors";
    if (/\b(assistant professors?)\b/i.test(combined)) return "faculty_assistant_professors";
    if (/\b(phd faculty|doctorate faculty|doctoral faculty|faculty.*phd|phd mentors?|doctoral mentors?)\b/i.test(combined)) return "faculty_phd_holders";
    if (/\b(m\.?arch faculty|b\.?arch faculty|faculty by dept|faculty by department|who teaches (march|m arch|urban design|barch|b arch))\b/i.test(combined)) return "faculty_by_dept";
    if (/\b(professors?|senior professors?|design chair)\b/i.test(combined) && !/\b(associate|assistant)\b/i.test(combined)) return "faculty_professors";

    const hasBArch = /\b(barch|b arch|undergraduate|ug|bachelor)\b/i.test(combined);
    const hasMArch = /\b(march|m arch|postgraduate|pg|urban design|master)\b/i.test(combined);
    const hasPhD = /\b(phd|ph\.d|doctoral)\b/i.test(combined);

    const hasFees = /\b(fee|fees|cost|tuition|charge|payment)\b/i.test(combined);
    const hasEligibility = /\b(eligibility|criteria|qualification|cutoff|cutoffs|marks|requirement|nata|jee)\b/i.test(combined);
    const hasSyllabus = /\b(syllabus|curriculum|scheme|course|subjects)\b/i.test(combined);
    const hasAdmissions = /\b(admission|admissions|apply|entrance|seat|seats|quota)\b/i.test(combined);

    if (hasBArch && hasEligibility) return "barch_eligibility";
    if (hasBArch && hasFees) return "fees";
    if (hasBArch && hasSyllabus) return "barch_program";
    if (hasBArch && hasAdmissions) return "barch_program";

    if (hasMArch && hasEligibility) return "march_program";
    if (hasMArch && hasFees) return "march_program";
    if (hasMArch && hasSyllabus) return "march_program";
    if (hasMArch && hasAdmissions) return "march_program";

    if (hasPhD && (hasEligibility || hasAdmissions)) return "phd_program";

    if (/\b(hostel|mess)\b/i.test(combined) && hasFees) return "hostels";
    if (/\b(hostel|mess)\b/i.test(combined) && /\b(warden|contact|incharge)\b/i.test(combined)) return "hostels";

    return null;
  }

  // 10. MULTI-TURN CONTEXT MEMORY STATE
  class ConversationSession {
    constructor() {
      this.lastIntent = null;
      this.lastCategory = null;
      this.history = [];
    }

    update(intentId, rawQuery) {
      this.lastIntent = intentId;
      if (['barch_program', 'barch_eligibility'].includes(intentId)) this.lastCategory = 'barch';
      else if (['march_program'].includes(intentId)) this.lastCategory = 'march';
      else if (['phd_program'].includes(intentId)) this.lastCategory = 'phd';
      else if (['hostels'].includes(intentId)) this.lastCategory = 'hostels';

      this.history.push({ query: rawQuery, intent: intentId, timestamp: Date.now() });
      if (this.history.length > 20) this.history.shift();
    }

    resolveFollowUp(query) {
      if (!this.lastCategory) return null;
      const q = query.toLowerCase();
      // If user explicitly mentions another program or facility, it is not a follow-up
      if (/\b(barch|b arch|march|m arch|phd|ph\.d|hostel|hostels)\b/i.test(q)) {
        return null;
      }
      if (/\b(what about syllabus|syllabus|subjects|curriculum)\b/i.test(q)) {
        if (this.lastCategory === 'barch') return 'barch_program';
        if (this.lastCategory === 'march') return 'march_program';
      }
      if (/\b(what about fees|how much fees|fee)\b/i.test(q)) {
        if (this.lastCategory === 'march') return 'march_program';
        if (this.lastCategory === 'hostels') return 'hostels';
        return 'fees';
      }
      if (/\b(eligibility|criteria)\b/i.test(q)) {
        if (this.lastCategory === 'barch') return 'barch_eligibility';
        if (this.lastCategory === 'march') return 'march_program';
        if (this.lastCategory === 'phd') return 'phd_program';
      }
      return null;
    }
  }

  const defaultSession = new ConversationSession();

  // MAIN CLASSIFIER DISPATCHER
  function classify(userQuery, session = defaultSession) {
    const startTime = performance.now();
    const raw = String(userQuery || '').trim();

    if (!raw || /^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening))\b/i.test(raw)) {
      return {
        intentId: "greeting",
        title: "RVCA Virtual Assistant",
        response: `Hello! Welcome to **RV College of Architecture (RVCA)**. How may I assist you today? Please select an option below or type your question:`,
        chips: [
          "About RVCA",
          "B.Arch Program",
          "M.Arch Urban Design",
          "Admissions",
          "Fee Structure",
          "Research & Innovation",
          "Faculty Directory",
          "Eligibility (NATA)",
          "Hostel Facilities",
          "Placements",
          "Facilities",
          "Contact Us"
        ],
        overflow: [],
        latencyMs: parseFloat((performance.now() - startTime).toFixed(2))
      };
    }

    // 9. UNIVERSAL 0ms BUTTON BYPASS
    const bypassKey = raw.toLowerCase().trim();
    if (INTENT_LABELS[bypassKey]) {
      const intentObj = INTENTS.find(i => i.id === INTENT_LABELS[bypassKey]);
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

    // 1. CONTENT MODERATION FIREWALL
    if (MODERATION_PATTERNS.conspiracy.test(raw)) {
      return {
        intentId: "moderation_conspiracy",
        title: "Factual Verification Redirection",
        response: "RV College of Architecture is an approved constituent institution governed by Rashtreeya Sikshana Samithi Trust (RSST), affiliated with VTU Belagavi and recognised by the Council of Architecture (COA). We only address verified academic and administrative procedures.",
        chips: ["Board of Management", "Statutory Compliance", "Affiliations"],
        overflow: [],
        latencyMs: parseFloat((performance.now() - startTime).toFixed(2))
      };
    }

    if (MODERATION_PATTERNS.profanity.test(raw)) {
      return {
        intentId: "moderation_profanity",
        title: "Communication Policy Notice",
        response: "RV College of Architecture maintains high standards of mutual respect and institutional discourse. Please refrain from using profane or abusive language. Let us know how we may assist you with official institutional queries.",
        chips: ["About RVCA", "Programmes Offered", "Contact Directory"],
        overflow: [],
        latencyMs: parseFloat((performance.now() - startTime).toFixed(2))
      };
    }

    if (MODERATION_PATTERNS.privateProbes.test(raw)) {
      return {
        intentId: "moderation_privacy",
        title: "Privacy & Data Protection Notice",
        response: "In compliance with personal privacy standards and institutional policies, private details such as personal staff salaries, private phone numbers, and sensitive financial credentials are strictly confidential. For official inquiries, please contact the Principal's office at principal.rvca@rvei.edu.in.",
        chips: ["Principal Contact", "Accounts Office", "Administration"],
        overflow: [],
        latencyMs: parseFloat((performance.now() - startTime).toFixed(2))
      };
    }

    // 4. DOT-STRIPPING & ACRONYM SANITIZATION
    const sanitized = sanitizeAcronyms(raw);

    // 7. DYNAMIC FACULTY DETECTIVE (Check before generic keyword stripping)
    const facultyFound = findFacultyMember(raw);
    if (facultyFound && !/\b(fees|hostel|placements|antiragging)\b/i.test(sanitized)) {
      if (/rakesh/i.test(raw)) {
        const pObj = INTENTS.find(i => i.id === 'principal');
        if (pObj) {
          session.update(pObj.id, raw);
          return {
            intentId: pObj.id,
            title: pObj.title,
            response: pObj.response,
            chips: pObj.chips,
            overflow: [],
            latencyMs: parseFloat((performance.now() - startTime).toFixed(2))
          };
        }
      }
      if (/suresh.*murthy/i.test(raw)) {
        const dObj = INTENTS.find(i => i.id === 'dean');
        if (dObj) {
          session.update(dObj.id, raw);
          return {
            intentId: dObj.id,
            title: dObj.title,
            response: dObj.response,
            chips: dObj.chips,
            overflow: [],
            latencyMs: parseFloat((performance.now() - startTime).toFixed(2))
          };
        }
      }
      session.update('faculty_profile', raw);
      return {
        intentId: 'faculty_profile',
        title: facultyFound.name,
        response: formatFacultyResponse(facultyFound),
        chips: ["Faculty Directory", "Principal Bio", "Contact Directory"],
        overflow: [],
        sourceUrl: facultyFound.profileUrl || null,
        latencyMs: parseFloat((performance.now() - startTime).toFixed(2))
      };
    }

    // 2. GRAMMAR & STOP-WORDS REMOVAL
    const rawTokens = sanitized.split(/[^a-z0-9_-]+/i).filter(Boolean);
    const cleanedTokens = [];
    for (const t of rawTokens) {
      if (PROTECTED_TOKENS.has(t)) continue;
      if (!STOP_WORDS.has(t)) {
        // 3. LEVENSHTEIN TYPO CORRECTION
        cleanedTokens.push(correctTypo(t));
      }
    }
    const processedQuery = cleanedTokens.join(' ');

    // 6. COMPOSITE INTENT RESOLUTION MATRIX (Check explicit compound terms first)
    const compositeId = resolveCompositeIntent(sanitized, cleanedTokens);
    if (compositeId) {
      const intentObj = INTENTS.find(i => i.id === compositeId);
      if (intentObj) {
        session.update(intentObj.id, raw);
        return {
          intentId: intentObj.id,
          title: intentObj.title,
          response: intentObj.response,
          chips: intentObj.chips,
          overflow: [],
          latencyMs: parseFloat((performance.now() - startTime).toFixed(2))
        };
      }
    }

    // 10. MULTI-TURN CONTEXT MEMORY CHECK
    const followUpIntent = session.resolveFollowUp(raw);
    if (followUpIntent) {
      const intentObj = INTENTS.find(i => i.id === followUpIntent);
      if (intentObj) {
        session.update(intentObj.id, raw);
        return {
          intentId: intentObj.id,
          title: intentObj.title,
          response: intentObj.response,
          chips: intentObj.chips,
          overflow: [],
          latencyMs: parseFloat((performance.now() - startTime).toFixed(2))
        };
      }
    }

    // 8. MULTI-INTENT SPLIT & OVERFLOW DETECTION
    // Detect compound questions like "tell me about fees and hostels and placements"
    const matchedIntents = [];

    for (const item of INTENTS) {
      let matched = false;
      let matchIdx = -1;

      for (const kw of item.keywords) {
        let idx = -1;
        if (kw.length <= 4) {
          // Word boundary check for short acronyms/words to avoid collision (e.g. 'nsp' in 'transport')
          const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i');
          const m = sanitized.match(regex);
          if (m) {
            idx = sanitized.indexOf(kw, m.index);
          }
        } else {
          idx = sanitized.indexOf(kw);
        }

        if (idx !== -1) {
          // Check Negation Shield
          if (!hasNegation(sanitized, idx)) {
            matched = true;
            matchIdx = idx;
            break;
          }
        }
      }

      // Check token-level exact match if not substring matched, also respecting Negation Shield
      if (!matched) {
        for (const kw of item.keywords) {
          if (cleanedTokens.includes(kw)) {
            const tokenIdx = sanitized.indexOf(kw);
            if (!hasNegation(sanitized, tokenIdx)) {
              matched = true;
              matchIdx = tokenIdx;
              break;
            }
          }
        }
      }

      if (matched) {
        item.matchIdx = matchIdx >= 0 ? matchIdx : 999;
        matchedIntents.push(item);
      }
    }

    // 5. PRIORITY-WEIGHTED RESOLUTION:
    // Specific child intents (lower p, e.g. p <= 0.85) cleanly beat broad root parents (p = 1.0).
    // When intents are at the same hierarchical tier, appearance order in the query wins.
    matchedIntents.sort((a, b) => {
      if (Math.abs(a.priority - b.priority) > 0.15) {
        return a.priority - b.priority;
      }
      return (a.matchIdx ?? 999) - (b.matchIdx ?? 999);
    });

    if (matchedIntents.length > 0) {
      const primary = matchedIntents[0];
      const overflow = matchedIntents.slice(1).map(i => ({
        id: i.id,
        label: i.title,
        chipText: i.title
      }));

      session.update(primary.id, raw);

      return {
        intentId: primary.id,
        title: primary.title,
        response: primary.response,
        chips: primary.chips,
        overflow: overflow,
        latencyMs: parseFloat((performance.now() - startTime).toFixed(2))
      };
    }

    // Conversational assistance check (e.g. 'can you help me', 'i have questions', 'who are you')
    if (/^(help|assist|can\s+you\s+help|who\s+are\s+you|what\s+can\s+you\s+do|i\s+have\s+a\s+question|what\s+is\s+this)\b/i.test(sanitized)) {
      return {
        intentId: "greeting",
        title: "RVCA Information Assistant",
        response: `Hello and a very warm welcome! I am your official **RV College of Architecture** Institutional AI Assistant.\n\nI can provide comprehensive, verified guidance on our **B.Arch & M.Arch academic programs**, **direct management admissions & CET/COMEDK quotas**, **fee structures**, **experiential drafting studios**, **campus life & hostels**, and our **63 eminent faculty members**.\n\nHow may I help you today? Please choose an option below or ask me any question!`,
        chips: ["About RVCA", "Courses", "Admissions", "Facilities", "Contact Us"],
        overflow: [],
        latencyMs: parseFloat((performance.now() - startTime).toFixed(2))
      };
    }

    // 12. SMART HUMANIZED RELEVANCE SEARCH (Zero Hallucination Factual Matcher)
    // Runs when exact keyword matching does not find an intent.
    // Scores all INTENTS based on title, keywords, and knowledge content.
    let bestIntent = null;
    let highestScore = 0;
    const secondaryMatches = [];

    const queryTokens = cleanedTokens.filter(t => t.length >= 3 && !STOP_WORDS.has(t));

    if (queryTokens.length > 0) {
      for (const item of INTENTS) {
        let score = 0;
        const titleLower = item.title.toLowerCase();
        const responseLower = item.response.toLowerCase();

        for (const token of queryTokens) {
          // Title match: high weight
          if (titleLower.includes(token)) score += 8;

          // Keyword match: high weight
          for (const kw of item.keywords) {
            if (kw === token) score += 10;
            else if (kw.includes(token)) score += 5;
          }

          // Response body match: lower weight
          if (responseLower.includes(token)) score += 1;
        }

        // Penalty for high priority numbers (slight bias toward specific topics)
        score -= (item.priority * 1.5);

        if (score > highestScore && score >= 4) {
          highestScore = score;
          bestIntent = item;
        }
      }

      if (bestIntent) {
        for (const item of INTENTS) {
          if (item.id !== bestIntent.id) {
            let s = 0;
            for (const token of queryTokens) {
              if (item.title.toLowerCase().includes(token) || item.keywords.some(k => k.includes(token))) {
                s += 3;
              }
            }
            if (s >= 3) {
              secondaryMatches.push({
                id: item.id,
                label: item.title,
                chipText: item.title
              });
            }
          }
        }
      }
    }

    if (bestIntent && highestScore >= 4) {
      session.update(bestIntent.id, raw);
      const warmIntro = `I'd be delighted to assist you with that! Here is the relevant information regarding **${bestIntent.title}** at RV College of Architecture:\n\n`;
      return {
        intentId: bestIntent.id,
        title: bestIntent.title,
        response: warmIntro + bestIntent.response,
        chips: bestIntent.chips,
        overflow: secondaryMatches.slice(0, 3),
        latencyMs: parseFloat((performance.now() - startTime).toFixed(2))
      };
    }

    // Warm & Empathetic Institutional Counselor Fallback
    return {
      intentId: "fallback_guidance",
      title: "RVCA Information Assistance",
      response: `Thank you for reaching out! I want to ensure you get complete, accurate guidance regarding **RV College of Architecture**.\n\nWhile I didn't find specific records matching "${raw.slice(0, 50)}", as your dedicated institutional assistant I can provide full details on:\n\n• **B.Arch & M.Arch Programs, CBCS Syllabus & Studio Work**\n• **Direct Management Quota (Strict Zero-Broker Policy), KEA (E-244) & COMEDK**\n• **Fee Structures, Concessions & State Scholarships**\n• **Hostel Accommodation, Pure-Veg Mess & Campus Dining**\n• **63 Faculty Members, 100% Mandatory Internship Training & GlobEd Abroad Guidance**\n\nWhat would you like to explore? Feel free to select any option below, or reach our admissions desk directly at principal.rvca@rvei.edu.in.`,
      chips: ["About RVCA", "Courses", "Admissions", "Facilities", "Contact Us"],
      overflow: [],
      latencyMs: parseFloat((performance.now() - startTime).toFixed(2))
    };
  }

  return {
    classify,
    INTENTS,
    INTENT_LABELS,
    ConversationSession,
    levenshteinDistance,
    correctTypo,
    sanitizeAcronyms,
    findFacultyMember
  };
});
