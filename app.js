/**
 * EventPass — Tech Summit & Digital Badge Portal
 * AWS Amplify Demonstration Application Logic
 * Client-Side SPA Hash Router & State Management
 */

// ============================================================================
// 1. Mock Data Sets
// ============================================================================

const SESSIONS_DATA = [
  {
    id: "ses-101",
    title: "Zero to Serverless: High-Throughput Architectures with AWS Lambda & DynamoDB",
    category: "serverless",
    categoryLabel: "Serverless & Edge",
    level: "ADVANCED (300)",
    time: "Day 1 • 10:00 - 11:30 WIB",
    room: "Auditorium Hall A",
    speaker: "Maya Indira",
    speakerOrg: "Principal Serverless Architect",
    avatarInitials: "MI",
    description: "Deep dive into event-driven design, cold-start mitigation techniques in Node.js 24 and Python 3.12, and DynamoDB single-table design patterns under high concurrency."
  },
  {
    id: "ses-102",
    title: "Autonomous Cloud Ops: Building Agentic DevOps Pipelines on AWS",
    category: "ai",
    categoryLabel: "AI & Agentic Systems",
    level: "INTERMEDIATE (200)",
    time: "Day 1 • 13:00 - 14:15 WIB",
    room: "Stage 2 (Edge Zone)",
    speaker: "Kevin Alexander",
    speakerOrg: "Staff Platform Engineer",
    avatarInitials: "KA",
    description: "Exploring LLM-powered incident recovery, automated root-cause analysis with CloudWatch Logs Insights, and self-healing IaC deployment loops."
  },
  {
    id: "ses-103",
    title: "Global Static & Edge Delivery: AWS Amplify Hosting vs Custom CloudFront",
    category: "architecture",
    categoryLabel: "Architecture & Data",
    level: "FOUNDATIONAL (100)",
    time: "Day 2 • 09:30 - 10:45 WIB",
    room: "Auditorium Hall A",
    speaker: "Sarah Chen",
    speakerOrg: "VP of Cloud Engineering",
    avatarInitials: "SC",
    description: "Benchmark comparison of managed AWS Amplify Hosting vs manual CloudFront + S3 setups. Covering atomic rollbacks, managed SSL, and SPA rewrite behavior."
  },
  {
    id: "ses-104",
    title: "Zero-Trust Edge Security: AWS WAF, Shield, and IAM Scoping at Scale",
    category: "security",
    categoryLabel: "Security & SRE",
    level: "ADVANCED (300)",
    time: "Day 2 • 11:15 - 12:30 WIB",
    room: "Cyber Lab Room 4",
    speaker: "Rizky Pratama",
    speakerOrg: "Head of Infrastructure Security",
    avatarInitials: "RP",
    description: "Real-world war stories defending critical cloud infrastructure against DDoS attacks, automated credential stuffing, and unauthorized IAM role assumptions."
  },
  {
    id: "ses-105",
    title: "Multi-Region Active-Active Disaster Recovery with Route 53 & Aurora Global",
    category: "architecture",
    categoryLabel: "Architecture & Data",
    level: "EXPERT (400)",
    time: "Day 3 • 10:00 - 11:30 WIB",
    room: "Auditorium Hall B",
    speaker: "Sarah Chen",
    speakerOrg: "VP of Cloud Engineering",
    avatarInitials: "SC",
    description: "Hands-on architectural patterns for sub-second RTO and zero-RPO database replication across Virginia (us-east-1) and Singapore (ap-southeast-1)."
  },
  {
    id: "ses-106",
    title: "Next-Gen Event Streaming: Kinesis vs MSK Serverless vs SQS/SNS",
    category: "serverless",
    categoryLabel: "Serverless & Edge",
    level: "INTERMEDIATE (200)",
    time: "Day 3 • 14:00 - 15:30 WIB",
    room: "Stage 2 (Edge Zone)",
    speaker: "Kevin Alexander",
    speakerOrg: "Staff Platform Engineer",
    avatarInitials: "KA",
    description: "Decision matrix for choosing the right serverless message broker when decoupling mission-critical enterprise microservices."
  }
];

const SPEAKERS_DATA = [
  {
    name: "Maya Indira",
    role: "Principal Serverless Architect",
    company: "CloudScale Systems",
    bio: "AWS Community Hero and author of 'Serverless Design at Scale'. Specializes in high-velocity distributed backends and event streams.",
    avatarInitials: "MI",
    topic: "Serverless & DynamoDB"
  },
  {
    name: "Sarah Chen",
    role: "VP of Cloud Engineering",
    company: "Vanguard Global",
    bio: "14+ years scaling multi-region cloud infrastructures. Led the migration of Fortune 500 financial backends to serverless architectures.",
    avatarInitials: "SC",
    topic: "Multi-Region & DR"
  },
  {
    name: "Kevin Alexander",
    role: "Staff Platform Engineer",
    company: "DevAutomate Labs",
    bio: "Pioneer in autonomous agentic infrastructure and GitOps observability loops on Kubernetes and AWS Lambda.",
    avatarInitials: "KA",
    topic: "Agentic DevOps & SRE"
  },
  {
    name: "Rizky Pratama",
    role: "Head of Infrastructure Security",
    company: "SecureCloud Asia",
    bio: "Certified AWS Security Specialist specializing in automated compliance, zero-trust enforcement, and red-team penetration testing.",
    avatarInitials: "RP",
    topic: "Zero-Trust Cloud WAF"
  }
];

// ============================================================================
// 2. Storage Helpers & State
// ============================================================================

const STORAGE_KEY = "eventpass_registered_tickets";

function getStoredTickets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("Could not read from localStorage:", err);
    return [];
  }
}

function saveTicket(ticket) {
  const current = getStoredTickets();
  current.unshift(ticket);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn("Could not save to localStorage:", err);
  }
  updatePassBadgeCount();
  return ticket;
}

function updatePassBadgeCount() {
  const count = getStoredTickets().length;
  const badge = document.getElementById("pass-count-badge");
  if (badge) {
    badge.textContent = count;
  }
}

// Generate Attendee Initials
function getInitials(name) {
  if (!name) return "AP";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ============================================================================
// 3. Client-Side SPA Hash Router
// ============================================================================

const ROUTES = ["explore", "speakers", "tickets", "my-pass"];

function handleRouting() {
  const hash = window.location.hash.replace(/^#\/?/, "") || "explore";
  const route = ROUTES.includes(hash) ? hash : "explore";

  // Toggle active view
  document.querySelectorAll(".spa-view").forEach(view => {
    view.classList.remove("active");
  });
  const targetView = document.getElementById(`view-${route}`);
  if (targetView) {
    targetView.classList.add("active");
  }

  // Toggle active nav link
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");
    if (item.getAttribute("data-view") === route) {
      item.classList.add("active");
    }
  });

  // Re-render specific views if needed
  if (route === "my-pass") {
    renderPasses();
  }
}

window.addEventListener("hashchange", handleRouting);

// ============================================================================
// 4. View Renderers
// ============================================================================

// Render Sessions
let currentCategoryFilter = "all";
let currentSearchQuery = "";

function renderSessions() {
  const grid = document.getElementById("sessions-grid");
  if (!grid) return;

  const filtered = SESSIONS_DATA.filter(session => {
    const matchesCategory = currentCategoryFilter === "all" || session.category === currentCategoryFilter;
    const query = currentSearchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      session.title.toLowerCase().includes(query) ||
      session.description.toLowerCase().includes(query) ||
      session.speaker.toLowerCase().includes(query) ||
      session.categoryLabel.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: rgba(18, 25, 42, 0.4); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.1);">
        <p style="color: var(--text-secondary); font-size: 1rem;">No conference sessions matched your search query.</p>
        <button onclick="resetFilters()" style="margin-top: 14px; background: none; border: 1px solid var(--aws-orange); color: var(--aws-orange); padding: 6px 16px; border-radius: 999px; cursor: pointer;">Reset Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <article class="session-card">
      <div class="card-top">
        <span class="session-tag ${item.category}">${item.categoryLabel}</span>
        <span class="session-level">${item.level}</span>
      </div>
      <h3 class="session-title">${item.title}</h3>
      <p class="session-desc">${item.description}</p>
      
      <div class="session-speaker-info">
        <div class="speaker-avatar-circle">${item.avatarInitials}</div>
        <div class="speaker-meta">
          <span class="speaker-name">${item.speaker}</span>
          <span class="speaker-org">${item.speakerOrg}</span>
        </div>
      </div>

      <div class="session-footer">
        <div class="session-time">
          <span>🕒</span>
          <span>${item.time}</span>
        </div>
        <div class="session-room">
          <span>📍 ${item.room}</span>
        </div>
      </div>
    </article>
  `).join("");
}

window.resetFilters = function() {
  currentCategoryFilter = "all";
  currentSearchQuery = "";
  const searchInput = document.getElementById("session-search");
  if (searchInput) searchInput.value = "";
  document.querySelectorAll("#category-chips .chip").forEach(c => c.classList.remove("active"));
  const allChip = document.querySelector("#category-chips .chip[data-category='all']");
  if (allChip) allChip.classList.add("active");
  renderSessions();
};

// Render Speakers
function renderSpeakers() {
  const grid = document.getElementById("speakers-grid");
  if (!grid) return;

  grid.innerHTML = SPEAKERS_DATA.map(speaker => `
    <div class="speaker-card">
      <div class="speaker-avatar-lg">${speaker.avatarInitials}</div>
      <h3>${speaker.name}</h3>
      <p class="speaker-card-role">${speaker.role}</p>
      <p class="speaker-card-company">${speaker.company}</p>
      <p class="speaker-card-bio">${speaker.bio}</p>
      <span class="speaker-topic-pill">Keynote: ${speaker.topic}</span>
    </div>
  `).join("");
}

// Render Registered Passes
function renderPasses() {
  const container = document.getElementById("passes-container");
  if (!container) return;

  const tickets = getStoredTickets();

  if (tickets.length === 0) {
    container.innerHTML = `
      <div class="pass-empty-state">
        <div style="font-size: 3rem; margin-bottom: 12px;">🎟️</div>
        <h3>No Passes Registered Yet</h3>
        <p>Choose an attendee tier to reserve your seat and generate your official digital conference lanyard badge.</p>
        <a href="#/tickets" class="btn-primary" style="display: inline-flex;">Claim Your Summit Pass</a>
      </div>
    `;
    return;
  }

  container.innerHTML = tickets.map((t, index) => `
    <div class="pass-card-mini">
      <div class="pass-mini-header">
        <span class="pass-mini-tier">${t.tier}</span>
        <span class="pass-mini-code">${t.id}</span>
      </div>
      <div class="pass-mini-body">
        <div class="pass-mini-avatar">${getInitials(t.name)}</div>
        <div class="pass-mini-info">
          <h4>${escapeHtml(t.name)}</h4>
          <p>${escapeHtml(t.role || "Attendee")} • ${escapeHtml(t.org || "Individual")}</p>
          <small style="color: var(--emerald); font-size: 0.72rem; font-weight: 700;">● CONFIRMED PASS</small>
        </div>
      </div>
      <button class="btn-view-badge" onclick="openBadgeByIndex(${index})">
        View Lanyard Badge
      </button>
    </div>
  `).join("");
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ============================================================================
// 5. Tier Selection & Form Submission
// ============================================================================

window.selectTier = function(tierName, price) {
  const label = document.getElementById("selected-tier-label");
  const tierInput = document.getElementById("form-tier-input");
  const priceInput = document.getElementById("form-price-input");

  if (label) label.textContent = `${tierName} (${price === 0 ? "Free" : "$" + price})`;
  if (tierInput) tierInput.value = tierName;
  if (priceInput) priceInput.value = price;

  // Highlight selected pricing card
  document.querySelectorAll(".pricing-card").forEach(c => c.classList.remove("featured"));
  const matchingCard = document.querySelector(`.pricing-card[data-tier="${tierName}"]`);
  if (matchingCard) matchingCard.classList.add("featured");

  // Smooth scroll down to registration form
  const checkoutSection = document.getElementById("checkout-section");
  if (checkoutSection) {
    checkoutSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Focus on name input
  setTimeout(() => {
    const nameInput = document.getElementById("attendee-name");
    if (nameInput) nameInput.focus();
  }, 400);
};

// ============================================================================
// 6. Modal Lanyard Badge Display
// ============================================================================

function showBadgeModal(ticket) {
  const modal = document.getElementById("badge-modal");
  if (!modal) return;

  document.getElementById("modal-badge-name").textContent = ticket.name;
  document.getElementById("modal-badge-role").textContent = ticket.role || "Cloud Practitioner";
  document.getElementById("modal-badge-org").textContent = ticket.org || "Community Attendee";
  document.getElementById("modal-badge-tier").textContent = ticket.tier.toUpperCase();
  document.getElementById("modal-badge-id").textContent = ticket.id;
  document.getElementById("modal-badge-avatar").textContent = getInitials(ticket.name);

  modal.classList.add("active");
}

window.openBadgeByIndex = function(index) {
  const tickets = getStoredTickets();
  if (tickets[index]) {
    showBadgeModal(tickets[index]);
  }
};

function closeModal() {
  const modal = document.getElementById("badge-modal");
  if (modal) {
    modal.classList.remove("active");
  }
  // Navigate to passes tab
  window.location.hash = "#/my-pass";
}

// ============================================================================
// 7. Edge Latency Ping & Countdown Simulator
// ============================================================================

function measureEdgeLatency() {
  const pingEl = document.getElementById("edge-latency-ping");
  if (!pingEl) return;

  const start = performance.now();
  fetch("style.css?ping=" + Date.now(), { method: "HEAD" })
    .then(() => {
      const ms = Math.max(8, Math.round(performance.now() - start));
      pingEl.textContent = `CloudFront • ${ms}ms`;
    })
    .catch(() => {
      const simulated = Math.floor(Math.random() * 15) + 12;
      pingEl.textContent = `CloudFront • ${simulated}ms`;
    });
}

function startCountdown() {
  const timer = document.getElementById("countdown-timer");
  if (!timer) return;

  // Fixed target date 14 days out
  let secondsRemaining = 14 * 86400 + 8 * 3600 + 24 * 60;

  setInterval(() => {
    secondsRemaining = Math.max(0, secondsRemaining - 1);
    const d = Math.floor(secondsRemaining / 86400);
    const h = Math.floor((secondsRemaining % 86400) / 3600);
    const m = Math.floor((secondsRemaining % 3600) / 60);
    timer.textContent = `${d}d : ${String(h).padStart(2, "0")}h : ${String(m).padStart(2, "0")}m`;
  }, 1000);
}

// ============================================================================
// 8. App Initialization & Event Listeners
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initial Routing & Views
  handleRouting();
  renderSessions();
  renderSpeakers();
  updatePassBadgeCount();
  measureEdgeLatency();
  startCountdown();

  // 2. Search Filter Listener
  const searchInput = document.getElementById("session-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value;
      renderSessions();
    });
  }

  // 3. Category Chip Filter Listeners
  const chipContainer = document.getElementById("category-chips");
  if (chipContainer) {
    chipContainer.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;

      chipContainer.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      currentCategoryFilter = chip.getAttribute("data-category");
      renderSessions();
    });
  }

  // 4. Registration Form Submission
  const form = document.getElementById("pass-registration-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("attendee-name").value.trim();
      const email = document.getElementById("attendee-email").value.trim();
      const org = document.getElementById("attendee-org").value.trim();
      const role = document.getElementById("attendee-role").value.trim();
      const track = document.getElementById("attendee-track").value;
      const tier = document.getElementById("form-tier-input").value || "Professional Pass";
      const price = document.getElementById("form-price-input").value || "49";

      if (!name || !email) {
        alert("Please provide both your name and email address.");
        return;
      }

      // Generate unique ticket ID
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const ticketId = `#SUMMIT-${randomCode}`;

      const newTicket = {
        id: ticketId,
        name,
        email,
        org,
        role,
        track,
        tier,
        price,
        registeredAt: new Date().toISOString()
      };

      saveTicket(newTicket);
      form.reset();
      showBadgeModal(newTicket);
    });
  }

  // 5. Modal Event Listeners
  const closeModalBtn = document.getElementById("btn-close-modal");
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  }

  const modalOverlay = document.getElementById("badge-modal");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }
});
