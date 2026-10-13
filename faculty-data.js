/**
 * Complete RVCA Faculty & Staff Directory (63 Verified Members)
 * Directly scraped and decoded from official RVCA Elementor filterable gallery
 * and dedicated faculty profile endpoints on https://rvca.edu.in
 */

const RVCA_FACULTY = [
  {
    name: "Dr. Rakesh K. S.",
    role: "Principal",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B. Arch. [SAP, Chennai], M. Arch. [SAP, Chennai], Ph.D. [SAP, Chennai]",
    specialisation: "Climatic Design, Sustainable Architecture, Contemporary Architecture",
    email: "principal.rvca@rvei.edu.in",
    phone: "080-35095001 / 080-35095002",
    profileUrl: "https://rvca.edu.in/faculty/dr_rakesh_k_s/"
  },
  {
    name: "Dinesh Rao",
    role: "Professor / Design Chair",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "Practicing Architect with 36+ years experience",
    specialisation: "Principal Architect at Monsoon Design, Architectural Planning, Interior Design",
    profileUrl: "https://rvca.edu.in/faculty/dinesh_rao/"
  },
  {
    name: "Suresh K Murthy",
    role: "Dean / Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B. Arch. [MSU, Baroda], M.Tech. [BS & CM] IIT-Delhi",
    specialisation: "Building Science & Construction Management, Climatology, Environmental Responsive Architecture",
    profileUrl: "https://rvca.edu.in/faculty/suresh-k-murthy/"
  },
  {
    name: "Phani Ram Pingali",
    role: "Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [JNTU], MS (Arch.) [Louisiana State University], P.G. Dip (Management) [AIMA]",
    specialisation: "Architecture, Pedagogical Design, Studio Practice",
    profileUrl: "https://rvca.edu.in/faculty/phani-ram-pingali/"
  },
  {
    name: "Prasanna Rao",
    role: "Professor / Associate Dean (PG Studies)",
    department: "Postgraduate Studies (M.Arch Urban Design)",
    category: "m-arch",
    qualification: "B.Arch. [Mysore University], M.Arch (Urban Design) [CEPT, Ahmedabad]",
    specialisation: "Urban Design, Urban Transformation, Studio Research",
    email: "prasannarao.rvca@rvei.edu.in",
    phone: "080-35094924",
    profileUrl: "https://rvca.edu.in/faculty/prasanna-rao/"
  },
  {
    name: "Dr. M S Amarnath",
    role: "Associate Professor / Warden (Boys Hostel)",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.F.A [Bangalore University], MFA [MSU, Baroda], Ph.D. [Jain University]",
    specialisation: "Fine Arts, Visual Arts, Art Appreciation, Clay Modelling",
    email: "amarnathms.rvca@rvei.edu.in",
    phone: "080-35092402",
    profileUrl: "https://rvca.edu.in/faculty/dr-m-s-amarnath/"
  },
  {
    name: "Dr. H R Manjunath",
    role: "Associate Professor / Associate Dean (VTU Affairs)",
    department: "Civil & Structural Engineering",
    category: "b-arch",
    qualification: "B.E. Civil, M.E. Structures [Karnataka University, Dharwad], Ph.D. [VTU]",
    specialisation: "Civil Engineering & Structural Engineering, 30+ years teaching experience",
    email: "assocdean-vtu.rvca@rvei.edu.in",
    phone: "080-35094929",
    profileUrl: "https://rvca.edu.in/faculty/dr-h-r-manjunath/"
  },
  {
    name: "Dr. Shikha Verma",
    role: "Associate Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [NIT Bhopal], M.Tech. (Envi. Geotechnology) [MNNIT Allahabad], Ph.D. [MNNIT Allahabad]",
    specialisation: "Solid Waste Management, Environmental Geotechnology, Research Guide (Ph.D.)",
    profileUrl: "https://rvca.edu.in/faculty/dr-shikha-verma/"
  },
  {
    name: "Dr. Mahalakshmi Karnad",
    role: "Associate Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch [Bangalore University], MLA [SPA New Delhi], Ph.D. [SPA New Delhi]",
    specialisation: "Landscape Architecture, Ecological Architecture & Design, Architectural Design Pedagogy, Research Guide (Ph.D.)",
    profileUrl: "https://rvca.edu.in/faculty/dr-mahalakshmi-karnad/"
  },
  {
    name: "Bikramjit Chakraborty",
    role: "Associate Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [Jadavpur University], M.Arch. (Arch. Conservation) [SPA, New Delhi]",
    specialisation: "Architectural Conservation, Urban Transformation and Change",
    profileUrl: "https://rvca.edu.in/faculty/bikramjit-chakraborty/"
  },
  {
    name: "Seema Maiya U",
    role: "Associate Professor",
    department: "Department of Architecture / M.Arch",
    category: "m-arch",
    qualification: "B.Arch. [Bangalore University], M.Arch (Urban Design) [University of Glasgow]",
    specialisation: "Architectural History & Theory, Design Thinking, Historic Urban Precinct Regeneration",
    profileUrl: "https://rvca.edu.in/faculty/seema-maiya-u/"
  },
  {
    name: "Dr. Saisanath",
    role: "Associate Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch [JNAFAU Hyderabad], M.Tech (Urban & Regional Planning) [JNTU], Ph.D [SPA Bhopal]",
    specialisation: "Urban and Regional Planning, Spatial Analysis",
    profileUrl: "https://rvca.edu.in/faculty/dr_saisanath/"
  },
  {
    name: "Anupriya Saxena",
    role: "Associate Professor / Internship Coordinator",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [BIT, Mesra], M.BEM [SPA, New Delhi], PhD Research Scholar [NIT Tiruchirappalli]",
    specialisation: "Building Engineering & Management, Climatic Design, Sustainable Architecture",
    email: "ptcoordinator.rvca@rvei.edu.in",
    phone: "080-35094933",
    profileUrl: "https://rvca.edu.in/faculty/anupriya-saxena/"
  },
  {
    name: "Archana Vittal",
    role: "Associate Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [VTU], M.Arch (Urban Design) [CEPT, Ahmedabad]",
    specialisation: "Urban Design, Contemporary Spatial Interventions",
    profileUrl: "https://rvca.edu.in/faculty/archana-vittal/"
  },
  {
    name: "Nishant",
    role: "Associate Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [SPA, New Delhi], M.Arch. (Architectural Conservation) [SPA, New Delhi]",
    specialisation: "Heritage Conservation, Vernacular Architecture, Traditional Construction Systems",
    profileUrl: "https://rvca.edu.in/faculty/nishant/"
  },
  {
    name: "Hiranmayi Shankavaram",
    role: "Associate Professor",
    department: "Postgraduate Studies (M.Arch)",
    category: "m-arch",
    qualification: "B.Arch. [VTU], M.Sc. (Urb. Mgmt. & Dev.) [Erasmus University, Rotterdam]",
    specialisation: "Urban Management & Development, Urban Planning and Strategies, Urban Resilience, Urban Governance",
    profileUrl: "https://rvca.edu.in/faculty/hiranmayi-shankavaram/"
  },
  {
    name: "Dr. Chinnu S Kumar",
    role: "Associate Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch [TKM College of Engineering, Kollam], M.U.D. [SPA New Delhi], Ph.D. [MNIT Jaipur]",
    specialisation: "Urban Design, Spatial Modeling",
    profileUrl: "https://rvca.edu.in/faculty/dr_chinnu_s_kumar/"
  },
  {
    name: "Dharshini YG",
    role: "Senior Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [VTU], M.Arch. (Urban Design) [VTU]",
    specialisation: "Urban Design, Built Environment Studies",
    profileUrl: "https://rvca.edu.in/faculty/dharshini-yg/"
  },
  {
    name: "Ramya Krishna",
    role: "Senior Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [BMSCE / VTU], Master of Urban Design [University of Colorado, Denver, USA]",
    specialisation: "Urban Design, Community Development, Architecture Studio",
    profileUrl: "https://rvca.edu.in/faculty/ramya-krishna/"
  },
  {
    name: "Pedaparthi Shweta",
    role: "Senior Assistant Professor / Rotaract Incharge",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [VTU]",
    specialisation: "Space Planning, Management, Studio Mentoring, Rotaract Club",
    profileUrl: "https://rvca.edu.in/faculty/pedaparthi-shweta/"
  },
  {
    name: "Vidya V",
    role: "Senior Assistant Professor / Placement & Internship Cell",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [VTU]",
    specialisation: "Architecture, Institutional Consultancy, Training & Placement Cell",
    email: "vidyav.rvca@rvei.edu.in",
    phone: "080-35094938",
    profileUrl: "https://rvca.edu.in/faculty/vidya-v/"
  },
  {
    name: "Mayank Singh",
    role: "Senior Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [BIT, Mesra], M.Tech. (Structural Engg. Design) [CEPT, Ahmedabad]",
    specialisation: "Structural Engineering Design, Construction Technology",
    profileUrl: "https://rvca.edu.in/faculty/mayank-singh/"
  },
  {
    name: "Megala Gurumurthi",
    role: "Assistant Professor / Internship Incharge",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [VTU]",
    specialisation: "Architecture and Identity Design, Professional Practice",
    email: "ptcoordinator.rvca@rvei.edu.in",
    phone: "080-35094933",
    profileUrl: "https://rvca.edu.in/faculty/megala-gurumurthi/"
  },
  {
    name: "Nitin Bhardwaj",
    role: "Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [Gateway College, Sonipat], M.U.D. [SPA Delhi]",
    specialisation: "Urban Design, Parametric Architecture",
    profileUrl: "https://rvca.edu.in/faculty/nitin_bhardwaj/"
  },
  {
    name: "Pappu Harcharan",
    role: "Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [SPA, Vijayawada], M.U.R.P [Mysore University]",
    specialisation: "Urban and Regional Planning, Spatial Informatics",
    profileUrl: "https://rvca.edu.in/faculty/pappu-harcharan/"
  },
  {
    name: "Ajinkya Kanitkar",
    role: "Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [VNIT, Nagpur], M.U.R.P [SPA, Bhopal]",
    specialisation: "Urban and Regional Planning, Climate Change and Built Environment",
    profileUrl: "https://rvca.edu.in/faculty/ajinkya-kanitkar/"
  },
  {
    name: "Ishani Gogoi",
    role: "Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch [AAyojan School of Architecture, RTU], M.Arch. (Urban Design) [RTU], Ph.D Scholar [Amity Univ]",
    specialisation: "Urban Design, Architectural Research",
    profileUrl: "https://rvca.edu.in/faculty/ishani-gogoi/"
  },
  {
    name: "Abhinandan K. S",
    role: "Assistant Professor",
    department: "Civil & Structural Engineering",
    category: "b-arch",
    qualification: "B.E. Civil [SEA College / VTU], M.Tech Structural Engineering [DSCE / VTU]",
    specialisation: "Structural Mechanics, Building Analysis",
    profileUrl: "https://rvca.edu.in/faculty/abhinandan-k-s/"
  },
  {
    name: "Dr. Asmita Yadav",
    role: "Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "Ph.D. in Architecture",
    specialisation: "Architectural Theory, Design Research",
    profileUrl: "https://rvca.edu.in/faculty/dr_asmita_yadav/"
  },
  {
    name: "Deepthi V",
    role: "Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [VTU], M.Arch",
    specialisation: "Architectural Design Studio, Graphics",
    profileUrl: "https://rvca.edu.in/faculty/deepthi_v/"
  },
  {
    name: "Akanksha Singh",
    role: "Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [RTMNU], M.Arch. (Landscape Architecture) [SPA, Bhopal], PhD [NIT]",
    specialisation: "Landscape Architecture, Sustainability Studies, Ecological Design",
    profileUrl: "https://rvca.edu.in/faculty/akanksha-singh/"
  },
  {
    name: "Ujjayant Bhattacharyya",
    role: "Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [Piloo Mody College, BPUT], M.Arch. [Chandigarh College of Architecture]",
    specialisation: "Public Architecture, Community Architecture, Form Study & Settlement Ecologies",
    profileUrl: "https://rvca.edu.in/faculty/ujjayant-bhattacharyya/"
  },
  {
    name: "Lavanya Anbazhagan",
    role: "Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch, M.Arch (Landscape Architecture) [CEPT University, Ahmedabad]",
    specialisation: "Landscape Architecture, Environmental Systems",
    profileUrl: "https://rvca.edu.in/faculty/lavanya/"
  },
  {
    name: "Akanksha Ruchi Horo",
    role: "Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch [Birla Institute of Technology, Mesra], M.Arch (Urban Design) [SPA Bhopal]",
    specialisation: "Urban Design, Architectural Documentation",
    profileUrl: "https://rvca.edu.in/faculty/akanksha_horo/"
  },
  {
    name: "Abhirami A",
    role: "Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch [MG University], M.Arch (Architectural Conservation) [SPA Bhopal], PhD Scholar [Srishti]",
    specialisation: "Architectural Conservation, Cultural Heritage, Architectural Phenomenology",
    profileUrl: "https://rvca.edu.in/faculty/abhirami_a/"
  },
  {
    name: "Kiranjee",
    role: "Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch [VNIT Nagpur], M.Arch (Sustainable Architecture) [SPA Vijayawada]",
    specialisation: "Sustainable Architecture, Energy Efficiency",
    profileUrl: "https://rvca.edu.in/faculty/kiranjee/"
  },
  {
    name: "Goutham K.B.",
    role: "Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch [RV College of Architecture], M.Plan [SPA Vijayawada], M.Sc. UMD",
    specialisation: "Urban Planning, Housing, Design Studio",
    profileUrl: "https://rvca.edu.in/faculty/goutham_k_b/"
  },
  {
    name: "Sunain Dalwani",
    role: "Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [VTU]",
    specialisation: "Architectural Design, Digital Prototyping",
    profileUrl: "https://rvca.edu.in/faculty/sunain-dalwani/"
  },
  {
    name: "Raghavendra Kuppusamy",
    role: "Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch [SPA Vijayawada], M.Arch [IIT Roorkee], Doctoral Scholar [SASTRA Univ]",
    specialisation: "Vāstuśāstra Literature, Traditional Indian Architecture, Building Systems",
    profileUrl: "https://rvca.edu.in/faculty/raghavendra_kuppusamy/"
  },
  {
    name: "William George Kennedy",
    role: "Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch, M.Arch",
    specialisation: "Architectural Studio, Construction Documentation",
    profileUrl: "https://rvca.edu.in/faculty/william_george_kennedy/"
  },
  {
    name: "Puneeth H K",
    role: "Assistant Director – Physical Education & Sports",
    department: "Department of Physical Education",
    category: "b-arch",
    qualification: "M.P.Ed, Sports Coaching",
    specialisation: "Sports Administration, State-Level Table Tennis, Fitness Training",
    email: "puneethhk.rvca@rvei.edu.in",
    profileUrl: "https://rvca.edu.in/faculty/puneeth_h_k/"
  },
  {
    name: "Archita Bandyopadhyay",
    role: "Assistant Professor [Tenure]",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [Mumbai University], M.Arch. (History & Theory) [CEPT, Ahmedabad]",
    specialisation: "History, Theory & Criticism, Interdisciplinary Studies, Critical Thinking",
    profileUrl: "https://rvca.edu.in/faculty/archita-bandyopadhyay/"
  },
  {
    name: "Deepika Varadarajan",
    role: "Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch (Major: Interior Design) [Anna Univ], M.Sc. (Environmental Design) [Univ of Bath, UK]",
    specialisation: "Environmental Design, Interior Architecture, Building Performance",
    profileUrl: "https://rvca.edu.in/faculty/deepika-varadarajan/"
  },
  {
    name: "Dr. Om Prakash Bawane",
    role: "Former Principal / Senior Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [NIT, Bhopal], M.Arch. [IIT, Roorkee], M.sc. [SMU], Ph.D. [VMU]",
    specialisation: "Sustainable Development, Building Services, Quality Management",
    profileUrl: "https://rvca.edu.in/faculty/dr-om-prakash-bawane/"
  },
  {
    name: "Girish Ramanathan",
    role: "Associate Professor / Training & Placement Cell",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [University of Roorkee], M.U.P [SPA, New Delhi]",
    specialisation: "Urban Planning, Placement Assistance Cell, Studio Jury",
    email: "placements2020.rvca@rvei.edu.in",
    profileUrl: "https://rvca.edu.in/faculty/girish-ramanathan/"
  },
  {
    name: "K Sreedhar",
    role: "Professor, Social Welfare Officer",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [JNTU, Andhra Pradesh], M. Design [IIT-Bombay]",
    specialisation: "Architecture & Product Design, Heritage Buildings Documentation",
    profileUrl: "https://rvca.edu.in/faculty/k-sreedhar/"
  },
  {
    name: "Prakruthi S Karadagi",
    role: "Assistant Professor",
    department: "Department of Architecture",
    category: "b-arch",
    qualification: "B.Arch. [VTU], M.Arch. (Urban Design) [VTU]",
    specialisation: "Urban Design, Design Studio, Graphics",
    profileUrl: "https://rvca.edu.in/faculty/prakruthi-s-karadagi/"
  },

  // Administrative & Technical Staff
  { name: "Srinivas A M", role: "Assistant Chief Manager – HR & Administration", department: "Administration", category: "non-teaching-faculty", email: "srinivas.rvca@rvei.edu.in", phone: "080-35095004" },
  { name: "Prashantha K T", role: "Senior Engineer", department: "Campus Engineering & Infrastructure", category: "non-teaching-faculty" },
  { name: "Girish Kumar P", role: "Foreman", department: "Workshops & Laboratories", category: "non-teaching-faculty" },
  { name: "Vaishali Kulkarni", role: "Deputy Manager", department: "Administration", category: "non-teaching-faculty" },
  { name: "Raghavendra Prabhu", role: "Senior Executive", department: "Administration", category: "non-teaching-faculty" },
  { name: "Bhaskar K R", role: "Senior Executive / Results In-Charge", department: "Student Records & Examination", category: "non-teaching-faculty", email: "bhaskarkr.rvca@rvei.edu.in", phone: "080-35094945" },
  { name: "Lokesha M", role: "Senior Executive – Finance", department: "Finance & Accounts", category: "non-teaching-faculty" },
  { name: "Hanumanthaiah H R", role: "Senior Electrician", department: "Maintenance & Electrical", category: "non-teaching-faculty" },
  { name: "Ramaprasad C", role: "Senior Library Executive", department: "Library & Information Centre", category: "non-teaching-faculty" },
  { name: "Chetankumar Jain", role: "Assistant Librarian", department: "Library & Information Centre", category: "non-teaching-faculty" },
  { name: "P Vivekananda", role: "Assistant Instructor – Laboratory", department: "Workshops & Labs", category: "non-teaching-faculty" },
  { name: "Anand B P", role: "Assistant Foreman", department: "Model Making Workshop", category: "non-teaching-faculty" },
  { name: "Soniya V", role: "Residential Warden", department: "Hostel Administration", category: "non-teaching-faculty" },
  { name: "Prashant Kumar", role: "Office Assistant", department: "Administration", category: "non-teaching-faculty" },
  { name: "Thimmaiah C M", role: "Helper", department: "Support Staff", category: "non-teaching-faculty" },
  { name: "Prakash Laxman Kini", role: "Peon", department: "Support Staff", category: "non-teaching-faculty" }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RVCA_FACULTY;
}
if (typeof window !== 'undefined') {
  window.RVCA_FACULTY = RVCA_FACULTY;
}
