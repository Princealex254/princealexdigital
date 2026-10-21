/* ============================================================
   PRINCE ALEX DIGITAL — CAREERS PAGE

   Renders open positions published via the admin panel and submits
   job applications through FormSubmit (to princealexdigital@gmail.com).

   This module talks to the exact same Firebase project, appId and
   Firestore collection as admin.html (`artifacts/{appId}/public/
   data/careers`), so job posts, edits, open/close toggles and
   deletions appear here automatically, live via onSnapshot.

   Progressive enhancement: the HTML ships with an honest "no open
   positions" empty state. When the admin has open positions, this
   module hides it and shows the live list instead.
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Firebase configuration — MUST match admin.html
const firebaseConfig = {
  apiKey: "AIzaSyCW0BqYOirnrPRkgvSvtSjK2-OGVTa71uQ",
  authDomain: "princealexdigital-4848c.firebaseapp.com",
  projectId: "princealexdigital-4848c",
  storageBucket: "princealexdigital-4848c.firebasestorage.app",
  messagingSenderId: "1316427677",
  appId: "1:1316427677:web:21bdffbf2095d1d5064174"
};

// Same appId resolution as admin.html — both ends target the same data
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const staticRoles = document.getElementById("static-roles");
const liveWrap = document.getElementById("live-roles");
const statusBox = document.getElementById("careers-status");
const grid = document.getElementById("live-roles-grid");
const roleSelect = document.getElementById("apply-role");

const OPEN_APPLICATION_VALUE = "Open application (no specific role)";

// ---------- Helpers ----------
function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function splitList(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map(function (line) { return line.replace(/^\s*[-–•*]\s*/, "").replace(/^\s*\d+[.)]\s*/, "").trim(); })
    .filter(Boolean);
}

function formatDate(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function showLive() {
  if (staticRoles) staticRoles.hidden = true;
  if (liveWrap) liveWrap.hidden = false;
}

function showStatic() {
  if (liveWrap) liveWrap.hidden = true;
  if (staticRoles) staticRoles.hidden = false;
}
// ---------- Job cards ----------
function jobCardHTML(job) {
  const title = escapeHtml(job.title || "Untitled role");
  const summary = escapeHtml(job.summary || "");
  const type = escapeHtml(job.type || "");
  const location = escapeHtml(job.location || "");
  const salary = escapeHtml(job.salary || "");
  const deadline = formatDate(job.deadline);
  const responsibilities = splitList(job.responsibilities);
  const qualifications = splitList(job.qualifications);
  const safeTitle = escapeHtml(job.title || "").replace(/"/g, "&quot;");
  const hasDetails = responsibilities.length > 0 || qualifications.length > 0;

  var chips = "";
  if (type) chips += `<span class="job-chip">${type}</span>`;
  if (location) chips += `<span class="job-chip chip-location"><i class="fa-solid fa-location-dot"></i> ${location}</span>`;
  if (salary) chips += `<span class="job-chip chip-salary">${salary}</span>`;
  if (deadline) chips += `<span class="job-chip chip-deadline"><i class="fa-solid fa-hourglass-end"></i> Apply by ${deadline}</span>`;

  var lists = "";
  if (responsibilities.length) {
    lists += `
      <div class="job-block">
        <h3>What you'll do</h3>
        <ul class="job-list">${responsibilities.map(function (li) { return `<li>${escapeHtml(li)}</li>`; }).join("")}</ul>
      </div>`;
  }
  if (qualifications.length) {
    lists += `
      <div class="job-block">
        <h3>What you'll need</h3>
        <ul class="job-list">${qualifications.map(function (li) { return `<li>${escapeHtml(li)}</li>`; }).join("")}</ul>
      </div>`;
  }

  return `
    <article class="job-card" data-reveal>
      <div class="job-head">
        <div>
          <h3 class="job-title">${title}</h3>
          <div class="job-chips">${chips}</div>
        </div>
        <button type="button" class="btn btn-primary btn-sm job-apply" data-role="${safeTitle}">Apply <span aria-hidden="true">→</span></button>
      </div>
      ${summary ? `<p class="job-summary is-clamped">${summary}</p>` : ""}
      ${lists ? `<div class="job-details" hidden>${lists}</div>` : ""}
      ${(hasDetails || summary) ? `<button type="button" class="job-toggle" aria-expanded="false">View more<span class="job-toggle-icon"><i class="fa-solid fa-chevron-down"></i></span></button>` : ""}
    </article>`;
}

// ---------- Firebase rendering ----------
function render(snapshot) {
  const jobs = [];
  snapshot.forEach(function (doc) { jobs.push(doc.data()); });

  // Only open (visible) positions show on the site
  const open = jobs.filter(function (j) { return j.status === "open"; });

  // Populate the role selector (always includes the no-specific-role option)
  if (roleSelect) {
    roleSelect.innerHTML = '<option value="">Select a role...</option>';
    open.forEach(function (j) {
      const opt = document.createElement("option");
      opt.value = j.title || "";
      opt.textContent = j.title || "Untitled role";
      roleSelect.appendChild(opt);
    });
    const fallback = document.createElement("option");
    fallback.value = OPEN_APPLICATION_VALUE;
    fallback.textContent = "Open application (no specific role)";
    roleSelect.appendChild(fallback);
  }

  if (!open.length) {
    // Nothing active → show the honest "no open positions" state
    grid.innerHTML = "";
    showStatic();
    if (statusBox) statusBox.textContent = "";
    return;
  }

  showLive();
  grid.innerHTML = open.map(jobCardHTML).join("");
  reveal();
}

function reveal() {
  const els = grid.querySelectorAll("[data-reveal]");
  els.forEach(function (el, i) {
    setTimeout(function () { el.classList.add("is-visible"); }, Math.min(i * 70, 420));
  });
}

function showError(err) {
  // Firebase unavailable or blocked → empty state, never stale/fake roles
  grid.innerHTML = "";
  showStatic();
  if (statusBox) statusBox.textContent = "";
  console.warn("Careers live data unavailable, showing no-openings state:", err);
}

// Live listener — admin posts, edits, open/close toggles and deletions all reflect instantly
try {
  const ref = collection(db, `artifacts/${appId}/public/data/careers`);
  onSnapshot(query(ref), render, showError);
} catch (err) {
  showError(err);
}

// ---------- Apply buttons (delegated — works for dynamically rendered cards)
document.addEventListener("click", function (e) {
  const btn = e.target.closest(".job-apply");
  if (!btn) return;
  e.preventDefault();
  const role = btn.getAttribute("data-role") || "";
  if (roleSelect) {
    if (roleSelect.value !== role) {
      for (var i = 0; i < roleSelect.options.length; i++) {
        if (roleSelect.options[i].value === role) { roleSelect.selectedIndex = i; break; }
      }
    }
  }
  document.getElementById("apply").scrollIntoView({ behavior: "smooth" });
  const nameEl = document.getElementById("apply-name");
  if (nameEl) setTimeout(function () { nameEl.focus({ preventScroll: true }); }, 350);
});

// ---------- View more / View less (expand job details inline)
document.addEventListener("click", function (e) {
  const tgl = e.target.closest(".job-toggle");
  if (!tgl) return;
  const card = tgl.closest(".job-card");
  if (!card) return;
  const details = card.querySelector(".job-details");
  const summary = card.querySelector(".job-summary");
  const isOpen = tgl.getAttribute("aria-expanded") === "true";
  tgl.setAttribute("aria-expanded", isOpen ? "false" : "true");
  tgl.innerHTML = (isOpen ? "View more" : "View less") +
    '<span class="job-toggle-icon"><i class="fa-solid fa-chevron-down"></i></span>';
  if (details) details.hidden = isOpen;
  if (summary) summary.classList.toggle("is-clamped", isOpen);
  card.classList.toggle("is-open", !isOpen);
});
