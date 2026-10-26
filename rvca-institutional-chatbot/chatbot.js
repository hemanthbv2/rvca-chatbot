/**
 * RVCA Institutional AI Chatbot Widget (chatbot.js)
 * Mounts interactive Canvas particle background, Glassmorphic Chat Window,
 * Pulse-animated FAB, NLP classifier hook, and non-blocking telemetry.
 */

(function() {
  if (typeof window === 'undefined') return;

  function mountChatbot() {
    if (document.getElementById('rvca-chatbot-root')) return;

    if (!document.body) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountChatbot);
        return;
      }
      setTimeout(mountChatbot, 50);
      return;
    }

    // Auto-inject chatbot.css if missing
    if (!document.querySelector('link[href*="chatbot.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/chatbot.css';
      document.head.appendChild(link);
    }

    // Safe Telemetry fallback (ensures widget never fails if telemetry script fails or is delayed)
    let telemetry;
    try {
      if (typeof window.RVCATelemetry === 'function') {
        telemetry = new window.RVCATelemetry({
          wpRestUrl: window.RVCA_WP_ENDPOINT || '/wp-json/rvca-chatbot/v1/telemetry',
          vercelUrl: window.RVCA_VERCEL_ENDPOINT || '/api/dashboard/interactions',
          leadUrl: '/send-lead'
        });
      }
    } catch (e) {
      console.warn('[RVCA Chatbot] Telemetry initialization note:', e);
    }

    if (!telemetry) {
      telemetry = {
        track: () => {},
        trackMessageSent: () => {},
        trackScrollDepth: () => {},
        trackKeyStroke: () => {},
        trackHoverStart: () => {},
        trackHoverEnd: () => {},
        submitLead: async () => true
      };
    }

    // Safe Session fallback
    let session = null;
    try {
      if (window.RVCAEngine && typeof window.RVCAEngine.ConversationSession === 'function') {
        session = new window.RVCAEngine.ConversationSession();
      }
    } catch (e) {}

    // Create Root Element
    const root = document.createElement('div');
    root.id = 'rvca-chatbot-root';
    document.body.appendChild(root);

  root.innerHTML = `
    <!-- Floating Action Button (FAB) -->
    <button class="rvca-fab" id="rvca-fab" title="Toggle RVCA AI Assistant" aria-label="Toggle RVCA Chatbot">
      <svg class="rvca-fab-icon rvca-fab-icon-chat" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        <path d="M7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z"/>
      </svg>
      <svg class="rvca-fab-icon rvca-fab-icon-close" viewBox="0 0 24 24">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
      <span class="rvca-fab-badge">AI</span>
    </button>

    <!-- Main Chat Window -->
    <div class="rvca-window rvca-hidden" id="rvca-window">
      <!-- Background Canvas for Particles -->
      <canvas class="rvca-bg-canvas" id="rvca-bg-canvas"></canvas>

      <!-- Header -->
      <header class="rvca-header">
        <div class="rvca-header-left">
          <div class="rvca-avatar">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
            </svg>
            <span class="rvca-online-dot" title="System Online"></span>
          </div>
          <div class="rvca-header-title">
            <h3>RVCA ASSISTANT <span class="rvca-badge-vtu">VTU / COA</span></h3>
            <span class="rvca-header-subtitle">
              <span>● Official Institutional AI</span>
            </span>
          </div>
        </div>

        <div class="rvca-header-actions">
          <button class="rvca-header-btn" id="rvca-btn-theme" title="Switch to Light Theme" aria-label="Toggle Theme">
            <svg class="rvca-icon-moon" viewBox="0 0 24 24" fill="currentColor"><path d="M12.3 2a10 10 0 0 0-.19 20 10 10 0 0 0 8.35-4.5 1 1 0 0 0-.84-1.5 8 8 0 0 1-7.82-10.4 1 1 0 0 0-.5-1.1A1 1 0 0 0 12.3 2z"/></svg>
            <svg class="rvca-icon-sun" style="display:none;" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0V3a1 1 0 0 0-1-1zm0 18a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1zm10-9h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2zM4 11H2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2zm14.07-6.07a1 1 0 0 0-1.41 0l-1.42 1.42a1 1 0 1 0 1.42 1.41l1.41-1.41a1 1 0 0 0 0-1.42zM6.76 16.24a1 1 0 0 0-1.42 0l-1.41 1.41a1 1 0 1 0 1.41 1.42l1.42-1.42a1 1 0 0 0 0-1.41zm12.72 1.41-1.41-1.41a1 1 0 0 0-1.42 1.41l1.41 1.42a1 1 0 0 0 1.42-1.42zM6.76 7.76 5.34 6.34a1 1 0 0 0-1.41 1.42l1.41 1.41a1 1 0 0 0 1.42-1.41z"/></svg>
          </button>
          <button class="rvca-header-btn" id="rvca-btn-lead" title="Request Admissions Callback">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
          </button>
          <button class="rvca-header-btn" id="rvca-btn-reset" title="Restart Conversation">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
          </button>
          <button class="rvca-header-btn" id="rvca-btn-close" title="Minimize Chatbot">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
      </header>

      <!-- Institutional Notification Ticker -->
      <div class="rvca-ticker">
        <span class="rvca-ticker-badge">NOTICE</span>
        <span class="rvca-ticker-text">B.Arch & M.Arch Admissions Open • KEA Code E-244 • Zero Broker Direct Applications</span>
      </div>

      <!-- Messages Stream -->
      <div class="rvca-messages" id="rvca-messages">
        <!-- Injected dynamically -->
      </div>

      <!-- Quick Question Tray -->
      <div class="rvca-quick-tray" id="rvca-quick-tray">
        <span class="rvca-tray-chip" data-query="Faculty Search">🔍 Faculty Search</span>
        <span class="rvca-tray-chip" data-query="Research & Innovation">🔬 Research Hub</span>
        <span class="rvca-tray-chip" data-query="About RVCA">About RVCA</span>
        <span class="rvca-tray-chip" data-query="B.Arch Program">B.Arch</span>
        <span class="rvca-tray-chip" data-query="M.Arch Urban Design">M.Arch</span>
        <span class="rvca-tray-chip" data-query="Admissions">Admissions</span>
        <span class="rvca-tray-chip" data-query="Fee Structure">Fee Structure</span>
        <span class="rvca-tray-chip" data-query="Eligibility (NATA)">Eligibility</span>
        <span class="rvca-tray-chip" data-query="Hostel Facilities">Hostels</span>
        <span class="rvca-tray-chip" data-query="Placements">Placements</span>
        <span class="rvca-tray-chip" data-query="Student Clubs">Clubs</span>
        <span class="rvca-tray-chip" data-query="Skill Labs">Skill Labs</span>
        <span class="rvca-tray-chip" data-query="Contact Us">Contact Us</span>
      </div>

      <!-- Input Bar with Live Typeahead (RVCE Standard) -->
      <footer class="rvca-footer">
        <div id="rvca-typeahead" class="rvca-typeahead hidden"></div>
        <form class="rvca-input-bar" id="rvca-form">
          <input type="text" class="rvca-input" id="rvca-input" placeholder="Search faculty, research, B.Arch, fees..." autocomplete="off">
          <button type="submit" class="rvca-send-btn" id="rvca-send" title="Send Query">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>
        <div class="rvca-status-bar">
          <span><span class="rvca-status-dot"></span>Zero-Hallucination Verified KB</span>
          <span>RSST Bengaluru</span>
        </div>
      </footer>

      <!-- Admissions Callback Modal -->
      <div class="rvca-lead-modal" id="rvca-lead-modal" style="display: none;">
        <div class="rvca-lead-header">
          <h4 class="rvca-lead-title">Official Admissions Callback</h4>
          <button class="rvca-lead-close" id="rvca-lead-close">&times;</button>
        </div>
        <p class="rvca-lead-desc">Submit your inquiry directly to the RSST / RVCA admissions office. Strict zero-broker direct admission policy.</p>

        <form id="rvca-lead-form">
          <div class="rvca-form-group">
            <label class="rvca-form-label">Full Name</label>
            <input type="text" class="rvca-form-control" id="lead-name" placeholder="Candidate's Name" required>
          </div>
          <div class="rvca-form-group">
            <label class="rvca-form-label">Email Address</label>
            <input type="email" class="rvca-form-control" id="lead-email" placeholder="student@example.com" required>
          </div>
          <div class="rvca-form-group">
            <label class="rvca-form-label">WhatsApp / Phone Number</label>
            <input type="tel" class="rvca-form-control" id="lead-phone" placeholder="10-digit mobile number" required>
          </div>
          <div class="rvca-form-group">
            <label class="rvca-form-label">Program of Interest</label>
            <select class="rvca-form-control" id="lead-program">
              <option value="B.Arch">Bachelor of Architecture (B.Arch - 5 Yrs)</option>
              <option value="M.Arch (Urban Design)">Master of Architecture (M.Arch - 2 Yrs)</option>
              <option value="Ph.D.">Ph.D. in Architecture</option>
            </select>
          </div>
          <div class="rvca-form-group">
            <label class="rvca-form-label">State / Domicile</label>
            <input type="text" class="rvca-form-control" id="lead-state" placeholder="e.g. Karnataka / Other State">
          </div>
          <button type="submit" class="rvca-lead-submit">Submit Direct Application</button>
        </form>
      </div>
    </div>
  `;

  // DOM Elements
  const fab = document.getElementById('rvca-fab');
  const windowEl = document.getElementById('rvca-window');
  const btnClose = document.getElementById('rvca-btn-close');
  const btnReset = document.getElementById('rvca-btn-reset');
  const btnLead = document.getElementById('rvca-btn-lead');
  const btnTheme = document.getElementById('rvca-btn-theme');
  const iconMoon = btnTheme.querySelector('.rvca-icon-moon');
  const iconSun = btnTheme.querySelector('.rvca-icon-sun');
  const leadModal = document.getElementById('rvca-lead-modal');
  const leadClose = document.getElementById('rvca-lead-close');
  const leadForm = document.getElementById('rvca-lead-form');
  const formEl = document.getElementById('rvca-form');
  const inputEl = document.getElementById('rvca-input');
  const typeaheadEl = document.getElementById('rvca-typeahead');
  const messagesEl = document.getElementById('rvca-messages');
  const quickTray = document.getElementById('rvca-quick-tray');

  // Theme Management (Light / Dark)
  function applyTheme(theme) {
    if (theme === 'light') {
      root.classList.add('rvca-theme-light');
      document.body.classList.add('rvca-theme-light');
      if (iconMoon && iconSun) {
        iconMoon.style.display = 'none';
        iconSun.style.display = 'block';
      }
      btnTheme.title = 'Switch to Dark Theme';
    } else {
      root.classList.remove('rvca-theme-light');
      document.body.classList.remove('rvca-theme-light');
      if (iconMoon && iconSun) {
        iconMoon.style.display = 'block';
        iconSun.style.display = 'none';
      }
      btnTheme.title = 'Switch to Light Theme';
    }
    try {
      localStorage.setItem('rvca_theme', theme);
    } catch (e) {}
  }

  const initialTheme = (function() {
    try {
      return localStorage.getItem('rvca_theme') || 'dark';
    } catch (e) {
      return 'dark';
    }
  })();
  applyTheme(initialTheme);

  btnTheme.addEventListener('click', () => {
    const isLight = root.classList.contains('rvca-theme-light');
    const targetTheme = isLight ? 'dark' : 'light';
    applyTheme(targetTheme);
    telemetry.track('theme_toggled', { theme: targetTheme });
  });

  let isOpen = false;

  // Toggle Window
  function toggleChat(open) {
    isOpen = (typeof open === 'boolean') ? open : !isOpen;
    if (isOpen) {
      windowEl.classList.remove('rvca-hidden');
      fab.classList.add('rvca-fab-active');
      fab.setAttribute('title', 'Minimize RVCA AI Assistant');
      telemetry.track('chatbot_opened');
      setTimeout(() => inputEl.focus(), 300);
      if (messagesEl.children.length === 0) {
        sendGreeting();
      }
    } else {
      windowEl.classList.add('rvca-hidden');
      fab.classList.remove('rvca-fab-active');
      fab.setAttribute('title', 'Chat with RVCA Institutional Assistant');
      telemetry.track('chatbot_closed');
    }
    // Broadcast event for custom toggle buttons and header widgets
    window.dispatchEvent(new CustomEvent('rvca-chat-toggled', { detail: { isOpen } }));
  }

  fab.addEventListener('click', () => toggleChat());
  btnClose.addEventListener('click', () => toggleChat(false));

  // ESC key closes chat
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      toggleChat(false);
    }
  });

  // Expose Global Public API for external buttons & header navigation
  window.RVCAChatbot = {
    toggle: toggleChat,
    open: () => toggleChat(true),
    close: () => toggleChat(false),
    isOpen: () => isOpen,
    ask: (q) => {
      toggleChat(true);
      setTimeout(() => {
        handleUserSubmit(q);
      }, 350);
    }
  };

  btnLead.addEventListener('click', () => {
    leadModal.style.display = 'flex';
    telemetry.track('lead_modal_opened');
  });

  leadClose.addEventListener('click', () => {
    leadModal.style.display = 'none';
  });

  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const leadData = {
      name: document.getElementById('lead-name').value.trim(),
      email: document.getElementById('lead-email').value.trim(),
      phone: document.getElementById('lead-phone').value.trim(),
      program: document.getElementById('lead-program').value,
      state: document.getElementById('lead-state').value.trim()
    };

    await telemetry.submitLead(leadData);
    leadModal.style.display = 'none';
    appendBotMessage(`Thank you, **${leadData.name}**! Your inquiry for **${leadData.program}** has been recorded directly with the RVCA admissions desk. An official representative will contact you shortly.`);
  });

  btnReset.addEventListener('click', () => {
    messagesEl.innerHTML = '';
    sendGreeting();
    telemetry.track('chat_reset');
  });

  // Track scrolling
  messagesEl.addEventListener('scroll', () => {
    telemetry.trackScrollDepth(messagesEl);
  });

  // Live Typeahead Dataset (Matches RVCE Benchmark: Faculty, Research Labs, Centres, Courses, Admissions)
  const INSTITUTIONAL_TYPEAHEAD = [
    // Core Research & Innovation
    { label: 'Research & Innovation Hub', query: 'Research & Innovation', category: 'Research', icon: '🔬', badge: 'Centre' },
    { label: 'Smart City SAAR 1.0 & 2.0 (MoHUA & NIUA Projects)', query: 'Smart City SAAR Research Projects', category: 'Research', icon: '🏙️', badge: 'MoHUA' },
    { label: 'Urban Design Research & Consultancy Cell (UDRCC)', query: 'Urban Design Cell (UDRCC)', category: 'Research', icon: '🏛️', badge: 'Cell' },
    { label: 'Ruhr-University Bochum (Germany) Global Research Studio', query: 'Global Research Collaborations', category: 'Research', icon: '🌐', badge: 'Global' },
    { label: 'DAIDA Foundation Awards & Affordable Housing Research', query: 'DAIDA Foundation Awards', category: 'Research', icon: '🏆', badge: 'Awards' },
    { label: 'VTU Ph.D. Research Centre & Doctoral Mentors', query: 'Doctoral Mentors (Ph.D.)', category: 'Research', icon: '🎓', badge: 'Ph.D.' },
    { label: 'KALPA Architectural Research Magazine', query: 'KALPA Magazine', category: 'Publications', icon: '📖', badge: 'Pub' },
    { label: 'sub:version Peer-Reviewed Academic Journal', query: 'sub:version Journal', category: 'Publications', icon: '📑', badge: 'Journal' },
    { label: 'Faculty Research Papers & Publications', query: 'Faculty Research Publications', category: 'Publications', icon: '📄', badge: 'Papers' },
    { label: 'Climate Simulation & Heliodon Lab', query: 'Climate Simulation Lab', category: 'Labs', icon: '☀️', badge: 'Lab' },
    { label: 'Ceramic Clay & Pottery Studio', query: 'Ceramic Clay Pottery Lab', category: 'Labs', icon: '🏺', badge: 'Studio' },
    { label: '3D Fabrication Lab & Laser Cutting', query: '3D Fabrication Lab', category: 'Labs', icon: '🖨️', badge: 'Lab' },
    { label: 'Spatial Analytics & GIS Lab', query: 'GIS Spatial Analytics Lab', category: 'Labs', icon: '🗺️', badge: 'Lab' },

    // Faculty & Academic Leadership
    { label: 'Faculty Search & Directory Portal', query: 'Faculty Search', category: 'Faculty', icon: '🔍', badge: 'Search' },
    { label: 'Senior Academic Council & Professors', query: 'Professors & Leadership', category: 'Faculty', icon: '👥', badge: 'Professors' },
    { label: 'Associate Professors Directory', query: 'Associate Professors', category: 'Faculty', icon: '👥', badge: 'Assoc Prof' },
    { label: 'Assistant Professors Directory', query: 'Assistant Professors', category: 'Faculty', icon: '👥', badge: 'Asst Prof' },
    { label: 'Doctoral Mentors & Ph.D. Guides', query: 'Doctoral Mentors (Ph.D.)', category: 'Faculty', icon: '🎓', badge: 'Ph.D.' },
    { label: 'Principal Dr. Rakesh K.S.', query: 'Principal', category: 'Leadership', icon: '👔', badge: 'Principal' },
    { label: 'Dean Prof. Suresh K. Murthy', query: 'Dean', category: 'Leadership', icon: '👔', badge: 'Dean' },

    // Academic Programs
    { label: 'B.Arch Degree (Bachelor of Architecture - 5 Yrs)', query: 'B.Arch Program', category: 'Program', icon: '📐', badge: 'UG' },
    { label: 'M.Arch in Urban Design (Master of Architecture - 2 Yrs)', query: 'M.Arch Urban Design', category: 'Program', icon: '🌆', badge: 'PG' },
    { label: 'Ph.D. in Architecture & Built Environment', query: 'Ph.D. in Architecture', category: 'Program', icon: '🎓', badge: 'Doctoral' },
    { label: 'VTU Scheme & Syllabus (2021 Curriculum)', query: 'Curriculum and Syllabus', category: 'Academics', icon: '📚', badge: 'VTU' },

    // Admissions, Fees & Scholarships
    { label: 'Admissions Guidelines & Process', query: 'Admissions', category: 'Admissions', icon: '📝', badge: 'Admissions' },
    { label: 'KEA Code E-244 & KCET Admissions', query: 'Admissions', category: 'Admissions', icon: '🏛️', badge: 'KEA E-244' },
    { label: 'Fee Structure & Direct Admission Guidelines', query: 'Fee Structure', category: 'Admissions', icon: '💳', badge: 'Fees' },
    { label: 'NATA Eligibility & Score Requirements', query: 'Eligibility (NATA)', category: 'Admissions', icon: '🎯', badge: 'NATA' },
    { label: 'Cutoffs & Rank Analysis (KEA / COMEDK)', query: 'Cutoffs and Scores', category: 'Admissions', icon: '📊', badge: 'Cutoffs' },
    { label: 'Scholarships & Financial Aid Schemes', query: 'Scholarships & Aid', category: 'Admissions', icon: '💰', badge: 'Aid' },

    // Campus Infrastructure & Student Life
    { label: 'Hostel Facilities (Boys & Girls Blocks & Mess)', query: 'Hostel Facilities', category: 'Campus', icon: '🏢', badge: 'Hostel' },
    { label: 'Campus Placements & Architectural Firms', query: 'Placements', category: 'Careers', icon: '💼', badge: 'Placements' },
    { label: 'Practical Training & Internships', query: 'Internships', category: 'Careers', icon: '🛠️', badge: 'Training' },
    { label: 'GlobEd International Studies & Career Cell', query: 'GlobEd Cell', category: 'Careers', icon: '✈️', badge: 'GlobEd' },
    { label: 'NASA India Student Chapter & Accolades', query: 'NASA India Chapter', category: 'Clubs', icon: '🏆', badge: 'NASA' },
    { label: 'Student Clubs & Cultural Life', query: 'Student Clubs', category: 'Campus', icon: '🎭', badge: 'Clubs' },
    { label: 'Campus Infrastructure & Experiential Studios', query: 'Campus Facilities', category: 'Campus', icon: '🏛️', badge: 'Campus' },
    { label: 'Architecture Resource Centre & Library', query: 'Resource Centre Library', category: 'Campus', icon: '📚', badge: 'Library' },
    { label: 'Study Tours & Architectural Expeditions', query: 'Study Tours', category: 'Campus', icon: '🗺️', badge: 'Tours' },
    { label: 'Live Site Visits & Practical Pedagogy', query: 'Site Visits', category: 'Campus', icon: '🏗️', badge: 'Site' },
    { label: 'Campus Canteen & Dining Facilities', query: 'Canteen and Dining', category: 'Campus', icon: '☕', badge: 'Dining' },
    { label: 'Sports, Gymnasium & Physical Education', query: 'Sports and Fitness', category: 'Campus', icon: '⚽', badge: 'Sports' },
    { label: 'Anti-Ragging Committee & Student Safety', query: 'Anti-Ragging Committee', category: 'Support', icon: '🛡️', badge: 'Safety' },
    { label: 'How to Reach RVCA & Campus Location', query: 'Location & How to Reach', category: 'Contact', icon: '📍', badge: 'Location' },
    { label: 'Contact Directory & Helpline', query: 'Contact Us', category: 'Contact', icon: '📞', badge: 'Contact' }
  ];

  function getTypeaheadList() {
    const list = [...INSTITUTIONAL_TYPEAHEAD];
    const facultySource = (window.RVCA_FACULTY && Array.isArray(window.RVCA_FACULTY))
      ? window.RVCA_FACULTY
      : (typeof FACULTY !== 'undefined' && Array.isArray(FACULTY) ? FACULTY : []);

    facultySource.forEach(f => {
      if (!f || !f.name) return;
      const roleBadge = f.role ? f.role.split('/')[0].trim() : 'Faculty';
      list.push({
        label: `${f.name} (${roleBadge})`,
        query: f.name,
        category: 'Faculty',
        icon: '👤',
        badge: roleBadge.length > 13 ? roleBadge.slice(0, 11) + '..' : roleBadge
      });
    });
    return list;
  }

  let typeaheadActiveIndex = -1;

  function hideTypeahead() {
    if (typeaheadEl) {
      typeaheadEl.classList.add('hidden');
      typeaheadEl.innerHTML = '';
      typeaheadActiveIndex = -1;
    }
  }

  function renderTypeahead(items, query) {
    if (!typeaheadEl) return;
    if (!items || items.length === 0) {
      hideTypeahead();
      return;
    }

    const qLower = query.toLowerCase();
    typeaheadEl.innerHTML = items.map((item, idx) => {
      const labelText = item.label;
      const idxMatch = labelText.toLowerCase().indexOf(qLower);
      let highlighted = escapeHtml(labelText);
      if (idxMatch >= 0) {
        const before = escapeHtml(labelText.slice(0, idxMatch));
        const matched = escapeHtml(labelText.slice(idxMatch, idxMatch + qLower.length));
        const after = escapeHtml(labelText.slice(idxMatch + qLower.length));
        highlighted = `${before}<span class="rvca-typeahead-highlight">${matched}</span>${after}`;
      }

      return `
        <div class="rvca-typeahead-item" data-query="${escapeHtml(item.query)}" data-index="${idx}">
          <span class="rvca-typeahead-icon">${item.icon || '🔍'}</span>
          <span class="rvca-typeahead-label">${highlighted}</span>
          <span class="rvca-typeahead-badge">${escapeHtml(item.badge || item.category)}</span>
        </div>
      `;
    }).join('');

    typeaheadEl.classList.remove('hidden');
    typeaheadActiveIndex = -1;

    typeaheadEl.querySelectorAll('.rvca-typeahead-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedQuery = el.getAttribute('data-query');
        hideTypeahead();
        handleUserSubmit(selectedQuery);
      });
    });
  }

  // Track typing keystrokes & trigger live autocomplete
  inputEl.addEventListener('input', () => {
    telemetry.trackKeyStroke();
    const val = inputEl.value.trim();
    if (val.length < 2) {
      hideTypeahead();
      return;
    }

    const qLower = val.toLowerCase();
    const all = getTypeaheadList();
    const matched = [];
    const seen = new Set();

    for (const item of all) {
      const matchLabel = item.label.toLowerCase().includes(qLower);
      const matchQuery = item.query.toLowerCase().includes(qLower);
      const matchCategory = item.category.toLowerCase().includes(qLower);

      if ((matchLabel || matchQuery || matchCategory) && !seen.has(item.query.toLowerCase())) {
        seen.add(item.query.toLowerCase());
        matched.push(item);
        if (matched.length >= 7) break;
      }
    }

    renderTypeahead(matched, val);
  });

  // Keyboard navigation inside input (Arrow Up/Down, Enter, Escape)
  inputEl.addEventListener('keydown', (e) => {
    if (!typeaheadEl || typeaheadEl.classList.contains('hidden')) return;
    const items = typeaheadEl.querySelectorAll('.rvca-typeahead-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      typeaheadActiveIndex = (typeaheadActiveIndex + 1) % items.length;
      updateTypeaheadActiveItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      typeaheadActiveIndex = (typeaheadActiveIndex - 1 + items.length) % items.length;
      updateTypeaheadActiveItem(items);
    } else if (e.key === 'Enter' && typeaheadActiveIndex >= 0 && typeaheadActiveIndex < items.length) {
      e.preventDefault();
      const selectedQuery = items[typeaheadActiveIndex].getAttribute('data-query');
      hideTypeahead();
      handleUserSubmit(selectedQuery);
    } else if (e.key === 'Escape') {
      hideTypeahead();
    }
  });

  function updateTypeaheadActiveItem(items) {
    items.forEach((it, idx) => {
      if (idx === typeaheadActiveIndex) {
        it.style.background = 'rgba(217, 107, 79, 0.22)';
        it.style.color = '#FFFFFF';
        it.scrollIntoView({ block: 'nearest' });
      } else {
        it.style.background = '';
        it.style.color = '';
      }
    });
  }

  // Close typeahead when clicking outside
  document.addEventListener('click', (e) => {
    if (typeaheadEl && !typeaheadEl.contains(e.target) && e.target !== inputEl) {
      hideTypeahead();
    }
  });

  // Quick tray delegation
  quickTray.addEventListener('click', (e) => {
    const chip = e.target.closest('.rvca-tray-chip');
    if (chip) {
      const q = chip.dataset.query;
      handleUserSubmit(q);
    }
  });

  // Greeting Message
  function sendGreeting() {
    let greeting;
    if (window.RVCAEngine && typeof window.RVCAEngine.classify === 'function') {
      greeting = window.RVCAEngine.classify('');
    } else {
      greeting = {
        response: "Hello! Welcome to **RV College of Architecture (RVCA)**. How may I assist you today? Please select an option below or type your question:",
        chips: [
          'About RVCA',
          'B.Arch Program',
          'M.Arch Urban Design',
          'Admissions',
          'Fee Structure',
          'Research & Innovation',
          'Faculty Directory',
          'Eligibility (NATA)',
          'Hostel Facilities',
          'Placements',
          'Facilities',
          'Contact Us'
        ],
        overflow: []
      };
    }
    appendBotMessage(greeting.response, greeting.chips, greeting.overflow);
  }

  // Handle User Input Submission
  function handleUserSubmit(userText) {
    hideTypeahead();
    const query = String(userText || '').trim();
    if (!query) return;

    telemetry.trackMessageSent(query);

    appendUserMessage(query);
    inputEl.value = '';

    // Show typing indicator
    const typingEl = showTypingIndicator();

    setTimeout(() => {
      typingEl.remove();

      let result;
      if (window.RVCAEngine && typeof window.RVCAEngine.classify === 'function') {
        result = window.RVCAEngine.classify(query, session);
      } else {
        result = {
          response: "Thank you for reaching out. Please contact the RVCA admissions desk directly at **080-68136600** or email **principal.rvca@rvei.edu.in**.",
          chips: ['Admissions', 'Courses', 'Contact Us'],
          intentId: 'fallback',
          latencyMs: 1.0,
          title: 'General Support'
        };
      }

      // Log interaction telemetry
      telemetry.track('message_query', {
        query,
        intent: result.intentId,
        latencyMs: result.latencyMs,
        title: result.title
      });

      // Manage pending overflows queue (RVCE Architecture Standard)
      if (session) {
        if (!session.pendingOverflows) session.pendingOverflows = [];

        // If current query satisfies an intent from pendingOverflows, remove it
        if (result && result.intentId) {
          const pIdx = session.pendingOverflows.findIndex(o => (typeof o === 'string' ? o : o.id) === result.intentId);
          if (pIdx !== -1) {
            session.pendingOverflows.splice(pIdx, 1);
          }
        }

        // If new overflows detected, update pending queue
        if (result && result.overflow && result.overflow.length > 0) {
          session.pendingOverflows = [...result.overflow];
        } else if (session.pendingOverflows.length > 0) {
          // Carry over remaining pending overflows into result.overflow
          result.overflow = [...session.pendingOverflows];
        }
      }

      appendBotMessage(result.response, result.chips, result.overflow, getSourceLink(result));
    }, 280);
  }

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    handleUserSubmit(inputEl.value);
  });

  // Message Renderers
  function appendUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'rvca-msg rvca-msg-user';
    msg.innerHTML = `
      <div class="rvca-msg-content">
        <div class="rvca-bubble">${escapeHtml(text)}</div>
        <span class="rvca-msg-time">${getTimeStr()}</span>
      </div>
    `;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // Official rvca.edu.in page shown below each answer
  const SOURCE_LINKS = {
    about_rvca:            { label: 'Visit Official About Us Page', url: 'https://rvca.edu.in/about_us/' },
    why_rvca:              { label: 'Visit Official About Us Page', url: 'https://rvca.edu.in/about_us/' },
    everything_overview:   { label: 'RVCA Official Website', url: 'https://rvca.edu.in/' },
    board_of_management:   { label: 'Board of Management', url: 'https://rvca.edu.in/board_of_management/' },
    principal:             { label: 'Principal Dr. Rakesh K.S.', url: 'https://rvca.edu.in/faculty/dr_rakesh_k_s/' },
    dean:                  { label: 'Dean Prof. Suresh K. Murthy', url: 'https://rvca.edu.in/faculty/suresh-k-murthy/' },
    fac_multi:             { label: 'Faculty Directory & Search', url: 'https://rvca.edu.in/faculty/' },
    faculty_directory:     { label: 'Official Faculty Directory', url: 'https://rvca.edu.in/faculty/' },
    courses_overview:      { label: 'Academic Programmes', url: 'https://rvca.edu.in/programmes/' },
    barch_program:         { label: 'B.Arch Degree Overview', url: 'https://rvca.edu.in/ugprogramme/' },
    march_program:         { label: 'M.Arch in Urban Design', url: 'https://rvca.edu.in/pgprogramme/' },
    phd_program:           { label: 'Ph.D. Research Centre', url: 'https://rvca.edu.in/phdprogramme/' },
    curriculum_and_syllabus: { label: 'VTU Scheme & Syllabus', url: 'https://rvca.edu.in/programmes/ugprogramme/ug_2021_scheme__syllabus/' },
    admissions_overview:   { label: 'Admissions Guidelines', url: 'https://rvca.edu.in/admission/' },
    barch_eligibility:     { label: 'Admission Criteria & NATA', url: 'https://rvca.edu.in/admission/' },
    management_quota:      { label: 'Direct Admission Policy', url: 'https://rvca.edu.in/admission/' },
    cutoffs_and_scores:    { label: 'KEA & COMEDK Cutoffs', url: 'https://rvca.edu.in/admission/' },
    fees:                  { label: 'Fee Structure Circulars', url: 'https://rvca.edu.in/admission/' },
    scholarships_aid:      { label: 'Scholarships & Aid', url: 'https://rvca.edu.in/admission/' },
    placements:            { label: 'Placements & Recruiters', url: 'https://rvca.edu.in/placement/' },
    internships:           { label: 'Practical Training Cell', url: 'https://rvca.edu.in/placement/' },
    globed:                { label: 'GlobEd Study Abroad Cell', url: 'https://rvca.edu.in/placement/' },
    campus_facilities:     { label: 'Campus Infrastructure', url: 'https://rvca.edu.in/infrastructure/' },
    experiential_studios:  { label: 'Experiential Studios', url: 'https://rvca.edu.in/infrastructure/experiential-learning-spaces/' },
    hostels:               { label: 'Hostel Accommodation', url: 'https://rvca.edu.in/infrastructure/hostel/' },
    library:               { label: 'Resource Centre & Library', url: 'https://rvca.edu.in/infrastructure/library/' },
    skill_labs:            { label: 'Skill Labs & Workshops', url: 'https://rvca.edu.in/infrastructure/SKILL%20LABS/' },
    study_tours:           { label: 'Study Tours Documentation', url: 'https://rvca.edu.in/infrastructure/STUDY%20TOUR/' },
    site_visits:           { label: 'Live Site Visits', url: 'https://rvca.edu.in/infrastructure/SITE%20VISITS/' },
    canteen_and_dining:    { label: 'Campus Canteen', url: 'https://rvca.edu.in/infrastructure/canteen/' },
    sports_and_fitness:    { label: 'Physical Education & Sports', url: 'https://rvca.edu.in/infrastructure/physical-education/' },
    clubs:                 { label: 'Student Clubs & Culture', url: 'https://rvca.edu.in/clubs/' },
    campus_life:           { label: 'Campus Life & Activities', url: 'https://rvca.edu.in/clubs/' },
    publications:          { label: 'Publications & Magazines', url: 'https://rvca.edu.in/rvca_publications/' },
    publications_deep:     { label: 'Kalpa & sub:version Publications', url: 'https://rvca.edu.in/rvca_publications/' },
    research_overview:     { label: 'RVCA Research & Innovation', url: 'https://rvca.edu.in/research/' },
    smart_city_research:   { label: 'Smart City SAAR Projects', url: 'https://rvca.edu.in/research/' },
    research_guides:       { label: 'Ph.D. Research Guides & Centre', url: 'https://rvca.edu.in/programmes/phdprogramme/' },
    faculty_professors:    { label: 'Senior Academic Council & Leadership', url: 'https://rvca.edu.in/faculty/' },
    faculty_associate_professors: { label: 'Associate Professors Directory', url: 'https://rvca.edu.in/faculty/' },
    faculty_assistant_professors: { label: 'Assistant Professors & Instructors', url: 'https://rvca.edu.in/faculty/' },
    faculty_phd_holders:   { label: 'Doctoral Faculty Mentors (Ph.D.)', url: 'https://rvca.edu.in/faculty/' },
    faculty_by_dept:       { label: 'Faculty by Academic Wing', url: 'https://rvca.edu.in/faculty/' },
    achievements:          { label: 'Student Accolades & Awards', url: 'https://rvca.edu.in/achievements/' },
    antiragging:           { label: 'Anti-Ragging Committee', url: 'https://rvca.edu.in/statutory-compliance/' },
    committees:            { label: 'Statutory Committees', url: 'https://rvca.edu.in/statutory-compliance/' },
    contact_directory:     { label: 'Official Contact Desk', url: 'https://rvca.edu.in/contact-us/' },
    how_to_reach_location: { label: 'Location & Campus Map', url: 'https://rvca.edu.in/contact-us/' },
    timings_and_schedule:  { label: 'College Timings & Office', url: 'https://rvca.edu.in/contact-us/' },

    // Student Clubs & NASA India
    club_art:              { label: 'Art Club — RVCA', url: 'https://rvca.edu.in/clubs/' },
    club_book:             { label: 'Book Club — RVCA', url: 'https://rvca.edu.in/clubs/' },
    club_dance:            { label: 'Originals Dance Club — RVCA', url: 'https://rvca.edu.in/clubs/' },
    club_drama:            { label: 'Frameworks Drama Club — RVCA', url: 'https://rvca.edu.in/clubs/' },
    club_health:           { label: 'Health & Wellness Club — RVCA', url: 'https://rvca.edu.in/clubs/' },
    club_heritage:         { label: 'Heritage Club — RVCA', url: 'https://rvca.edu.in/clubs/' },
    club_music:            { label: 'Decibels Music Club — RVCA', url: 'https://rvca.edu.in/clubs/' },
    club_quiz:             { label: 'Quiz Club — RVCA', url: 'https://rvca.edu.in/clubs/' },
    club_sports:           { label: 'Sports Club & Activities — RVCA', url: 'https://rvca.edu.in/infrastructure/physical-education/' },
    club_sustainability:   { label: 'Sustainability & Nature Club — RVCA', url: 'https://rvca.edu.in/clubs/' },
    club_terra:            { label: 'Terra Thoughts Pottery Club — RVCA', url: 'https://rvca.edu.in/clubs/' },
    club_cinema:           { label: 'The Journey Shared Cinema Club — RVCA', url: 'https://rvca.edu.in/clubs/' },
    club_trail:            { label: 'Trail Travel & Photography Club — RVCA', url: 'https://rvca.edu.in/clubs/' },
    nasa_india:            { label: 'NASA India Student Chapter — RVCA', url: 'https://rvca.edu.in/achievements/' },

    // Staff & Roles
    hostel_warden:         { label: 'Hostel Administration & Wardens', url: 'https://rvca.edu.in/infrastructure/hostel/' },
    faculty_club_incharges:{ label: 'Faculty In-Charges of Clubs', url: 'https://rvca.edu.in/clubs/' },
    faculty_non_teaching:  { label: 'Non-Teaching & Administrative Staff', url: 'https://rvca.edu.in/faculty/' },
    faculty_incharges_committees: { label: 'Institutional Cells & Committee Heads', url: 'https://rvca.edu.in/statutory-compliance/' },

    // Publications & Papers
    kalpa_magazine:        { label: 'KALPA Architectural Research Magazine', url: 'https://rvca.edu.in/kalpa/' },
    subversion_journal:    { label: 'sub:version Academic Journal', url: 'https://rvca.edu.in/subversion/' },
    faculty_publications_papers: { label: 'Faculty Research Papers & Publications', url: 'https://rvca.edu.in/research/' },

    // Research, Consultancy & Skill Labs
    research_udrcc:        { label: 'Urban Design Research & Consultancy Cell', url: 'https://rvca.edu.in/research/' },
    research_collaborations:{ label: 'Global Research Collaborations (Bochum, Florida, KRVIA)', url: 'https://rvca.edu.in/research/' },
    lab_climate:           { label: 'Climate Simulation & Heliodon Lab', url: 'https://rvca.edu.in/infrastructure/SKILL%20LABS/' },
    lab_pottery:           { label: 'Ceramic Clay & Pottery Studio', url: 'https://rvca.edu.in/infrastructure/SKILL%20LABS/' },
    lab_fab:               { label: '3D Fabrication Lab & Model Workshop', url: 'https://rvca.edu.in/infrastructure/SKILL%20LABS/' },
    lab_gis:               { label: 'Spatial Analytics & GIS Lab', url: 'https://rvca.edu.in/infrastructure/SKILL%20LABS/' },

    // Academic Departments
    department_barch:      { label: 'Department of Architecture (UG B.Arch)', url: 'https://rvca.edu.in/ugprogramme/' },
    department_march:      { label: 'Department of Urban Design (PG M.Arch)', url: 'https://rvca.edu.in/pgprogramme/' },
    department_phd:        { label: 'VTU Research Centre (Doctoral Ph.D.)', url: 'https://rvca.edu.in/phdprogramme/' },
    departments_all:       { label: 'Academic Departments Directory', url: 'https://rvca.edu.in/programmes/' },

    // Collaborations, Consultancy & Events
    collaborations_overview: { label: 'Collaborations & MoUs', url: 'https://rvca.edu.in/collaborations/' },
    academic_collaborations: { label: 'Academic Collaborations', url: 'https://rvca.edu.in/collaborations/' },
    industry_collaborations: { label: 'Industry Collaborations', url: 'https://rvca.edu.in/collaborations/' },
    institutional_memberships: { label: 'Institutional Memberships', url: 'https://rvca.edu.in/collaborations/' },
    consultancy_cell:        { label: 'Consultancy Cell & Services', url: 'https://rvca.edu.in/consultancy-cell/' },
    events_and_workshops:    { label: 'Events & Workshops', url: 'https://rvca.edu.in/events-workshops/' }
  };

  function getSourceLink(result) {
    if (!result) return null;
    if (result.sourceUrl) return { label: (result.title || 'Faculty') + ' Profile', url: result.sourceUrl };
    return SOURCE_LINKS[result.intentId] || null;
  }

  function appendBotMessage(text, chips = [], overflow = [], source = null) {
    const msg = document.createElement('div');
    msg.className = 'rvca-msg rvca-msg-bot';

    const formattedText = renderMarkdown(text);

    const sourceHtml = (source && source.url) ? `
        <a class="rvca-source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7zm5 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z"/></svg>
          <span>${escapeHtml(source.label)}</span>
          <span class="rvca-source-domain">rvca.edu.in ↗</span>
        </a>` : '';

    let chipsHtml = '';
    if (chips && chips.length > 0) {
      chipsHtml = `<div class="rvca-chips-container">` +
        chips.map(c => `<button class="rvca-chip" data-chip="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('') +
        `</div>`;
    }

    // 8. Multi-Intent Split Overflow Queue
    let overflowHtml = '';
    if (overflow && overflow.length > 0) {
      overflowHtml = `
        <div class="rvca-overflow-divider">⬇️ Also Asked ⬇️</div>
        <div class="rvca-overflow-chips">
          ${overflow.map(o => `<button class="rvca-overflow-chip" data-chip="${escapeHtml(o.chipText)}">${escapeHtml(o.label)}</button>`).join('')}
        </div>
      `;
    }

    msg.innerHTML = `
      <div class="rvca-msg-avatar">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9z"/>
        </svg>
      </div>
      <div class="rvca-msg-content" style="max-width: calc(100% - 38px);">
        <div class="rvca-bubble">${formattedText}</div>
        ${sourceHtml}
        ${overflowHtml}
        ${chipsHtml}
        <span class="rvca-msg-time">${getTimeStr()}</span>
      </div>
    `;

    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    setTimeout(() => { messagesEl.scrollTop = messagesEl.scrollHeight; }, 60);

    // Delegate chips click (0ms Button Bypass)
    msg.querySelectorAll('.rvca-chip, .rvca-overflow-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const chipText = e.currentTarget.dataset.chip;
        telemetry.track('chip_clicked', { label: chipText });
        handleUserSubmit(chipText);
      });

      // 500ms+ Hover Interest Tracking
      btn.addEventListener('mouseenter', () => {
        telemetry.trackHoverStart('chip_' + btn.textContent.trim(), { label: btn.textContent.trim() });
      });
      btn.addEventListener('mouseleave', () => {
        telemetry.trackHoverEnd('chip_' + btn.textContent.trim());
      });
    });
  }

  function showTypingIndicator() {
    const typing = document.createElement('div');
    typing.className = 'rvca-msg rvca-msg-bot';
    typing.innerHTML = `
      <div class="rvca-msg-avatar">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3z"/>
        </svg>
      </div>
      <div class="rvca-typing">
        <div class="rvca-typing-dot"></div>
        <div class="rvca-typing-dot"></div>
        <div class="rvca-typing-dot"></div>
      </div>
    `;
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    setTimeout(() => { messagesEl.scrollTop = messagesEl.scrollHeight; }, 40);
    return typing;
  }

  function renderMarkdown(md) {
    if (!md) return '';
    let html = escapeHtml(md);

    // Headers
    html = html.replace(/^### (.*$)/gm, '<h4 style="margin:6px 0 2px;font-size:0.95rem;color:var(--rvca-accent);">$1</h4>');
    html = html.replace(/^## (.*$)/gm, '<h3 style="margin:8px 0 4px;font-size:1rem;color:var(--rvca-accent);">$1</h3>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italics
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Links [Text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--rvca-accent);text-decoration:underline;">$1</a>');
    // Bullet lists
    html = html.replace(/^[•\-\*]\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
    // Numbered lists
    html = html.replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>');
    // Paragraph breaks
    html = html.replace(/\n\n+/g, '</p><p>');
    html = '<p>' + html.replace(/\n/g, '<br>') + '</p>';
    html = html.replace(/<p><\/p>/g, '');
    return html;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getTimeStr() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // HTML5 Canvas Particle Background Matching Brand Colors (#192023, #A3AA37, #CB5C4A)
  function initParticleCanvas() {
    const canvas = document.getElementById('rvca-bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight);

    window.addEventListener('resize', () => {
      if (canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      }
    });

    const particles = [];
    const colors = ['#A3AA37', '#ADB61C', '#CB5C4A', '#F5EEE7'];

    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.2
      });
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        // Connect nearby particles with subtle drafting line
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 75) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = '#A3AA37';
            ctx.globalAlpha = (1 - dist / 75) * 0.15;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    }
    animate();
  }

    // Initialize canvas after DOM ready
    setTimeout(initParticleCanvas, 100);
  }

  // Trigger mounting safely
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountChatbot);
  } else {
    mountChatbot();
  }

})();
