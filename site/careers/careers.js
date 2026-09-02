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
// ---------- Application form (FormSubmit → princealexdigital@gmail.com)
(function applyForm() {
  "use strict";
  const form = document.getElementById("career-apply-form");
  if (!form) return;
  const alertEl = document.getElementById("apply-alert");
  const successEl = document.getElementById("apply-success");
  const submitBtn = document.getElementById("apply-submit");
  const btnLabel = submitBtn ? submitBtn.querySelector(".btn-label") : null;
  const emailInput = document.getElementById("apply-email");
  const replyTo   = document.getElementById("apply-replyto");
  const nameField = document.getElementById("apply-name");
  const anotherBtn = document.getElementById("apply-another");
  const cvInput = document.getElementById("apply-cv");
  const cvWrap = document.getElementById("cv-upload");
  const cvTitle = document.getElementById("cv-title");
  const cvHint = document.getElementById("cv-hint");
  const cvFilenameInput = document.getElementById("apply-cv-filename");

  // FormSubmit accepts attachments named "attachment", max 5 MB
  const CV_MAX_BYTES = 5 * 1024 * 1024;
  const CV_ALLOWED_EXT = [".pdf", ".doc", ".docx"];

  function formatBytes(bytes) {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    if (bytes >= 1024) return Math.round(bytes / 1024) + " KB";
    return bytes + " B";
  }

  function validateCvFile(file) {
    if (!file) return "";
    const name = String(file.name || "").toLowerCase();
    const ext = name.slice(name.lastIndexOf("."));
    if (CV_ALLOWED_EXT.indexOf(ext) === -1) {
      return "Please upload your CV as a PDF or Word document (.pdf, .doc or .docx).";
    }
    if (file.size > CV_MAX_BYTES) {
      return "That file is too large (" + formatBytes(file.size) + "). Please upload a CV of 5 MB or less.";
    }
    return "";
  }

  function setCvUi(file) {
    // Record the CV name as a plain field too, so it always appears in the
    // FormSubmit email table alongside the attached file itself.
    if (cvFilenameInput) cvFilenameInput.value = file ? file.name : "";
    if (!cvWrap) return;
    if (file) {
      cvWrap.classList.add("is-filled");
      cvWrap.classList.remove("is-error");
      if (cvTitle) cvTitle.textContent = file.name;
      if (cvHint) cvHint.textContent = formatBytes(file.size) + " — click to replace";
    } else {
      cvWrap.classList.remove("is-filled", "is-error");
      if (cvTitle) cvTitle.textContent = "Drag & drop your CV here, or click to choose a file";
      if (cvHint) cvHint.textContent = "PDF or Word document · max 5 MB";
    }
  }

  function resetCvUi() {
    if (cvInput) cvInput.value = "";
    setCvUi(null);
  }

  function handleCvSelection() {
    const file = cvInput && cvInput.files && cvInput.files[0] ? cvInput.files[0] : null;
    const err = validateCvFile(file);
    if (err) {
      if (cvWrap) { cvWrap.classList.add("is-error"); cvWrap.classList.remove("is-filled"); }
      if (cvInput) cvInput.value = "";
      setCvUi(null);
      showAlert(err, true);
      return;
    }
    hideAlert();
    setCvUi(file);
  }

  // Dev visibility: list every field (and the CV file) being sent
  function logSubmission() {
    try {
      const parts = [];
      new FormData(form).forEach(function (value, key) {
        parts.push(key + (value instanceof File ? " → " + value.name + " (" + value.size + " bytes)" : ""));
      });
      console.info("Submitting application to FormSubmit:", parts.join(" | "));
    } catch (err) { /* logging must never break the submission */ }
  }

  function setLoading(on) {
    if (!submitBtn) return;
    if (on) {
      submitBtn.setAttribute("disabled", "disabled");
      submitBtn.classList.add("is-loading");
      if (btnLabel) btnLabel.textContent = "Applying...";
    } else {
      submitBtn.removeAttribute("disabled");
      submitBtn.classList.remove("is-loading");
      if (btnLabel) btnLabel.textContent = "Send Application";
    }
  }

  function showAlert(message, isError) {
    if (!alertEl) return;
    alertEl.textContent = message;
    alertEl.className = "apply-alert" + (isError ? " is-error" : " is-success");
    alertEl.hidden = false;
    alertEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function hideAlert() {
    if (alertEl) { alertEl.hidden = true; alertEl.textContent = ""; }
  }

  // Keep FormSubmit replies going to whoever submitted the application
  function syncReplyTo() {
    if (emailInput && replyTo) replyTo.value = emailInput.value.trim();
  }
  if (emailInput && replyTo) {
    emailInput.addEventListener("input", syncReplyTo);
    emailInput.addEventListener("change", syncReplyTo);
  }

  // CV upload — validate on pick + drag & drop support
  if (cvInput) {
    cvInput.addEventListener("change", handleCvSelection);

    if (cvWrap) {
      ["dragenter", "dragover"].forEach(function (evt) {
        cvWrap.addEventListener(evt, function (e) { e.preventDefault(); cvWrap.classList.add("is-dragover"); });
      });
      ["dragleave", "drop"].forEach(function (evt) {
        cvWrap.addEventListener(evt, function () { cvWrap.classList.remove("is-dragover"); });
      });
      cvWrap.addEventListener("drop", function (e) {
        e.preventDefault();
        const dropped = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length ? e.dataTransfer.files : null;
        if (!dropped) return;
        try {
          cvInput.files = dropped; // assign dropped files (supported in all modern browsers)
        } catch (err) {
          // Assignment unsupported — fall back to the native picker
          if (cvHint) cvHint.textContent = "Please click to choose your CV";
          return;
        }
        handleCvSelection();
      });
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    hideAlert();

    // Honeypot spam trap
    let honey = null;
    try { honey = form.querySelector('input[name="_honey"]'); } catch (err) { honey = null; }
    if (honey && honey.value) { form.reset(); return; }

    if (form.checkValidity && !form.checkValidity()) {
      if (form.reportValidity) form.reportValidity();
      return;
    }

    // CV checks — the picker's `accept` is only a hint, so enforce type + size
    const cvErr = validateCvFile(cvInput && cvInput.files && cvInput.files[0]);
    if (cvErr) {
      if (cvWrap) cvWrap.classList.add("is-error");
      showAlert(cvErr, true);
      return;
    }

    setLoading(true);
    syncReplyTo();
    logSubmission();

    // AJAX submit to FormSubmit — no page refresh (same pattern as contact.js).
    // new FormData(form) carries EVERY named field on the form — role, name,
    // email, phone, message and the CV file itself (input name="attachment").
    fetch("https://formsubmit.co/ajax/princealexdigital@gmail.com", {
      method: "POST",
      headers: { "Accept": "application/json" },
      body: new FormData(form)
    }).then(function (res) {
      if (!res.ok) { throw new Error("Request failed (" + res.status + ")"); }
      return res.json();
    }).then(function (json) {
      var ok = json && (json["success"] === true || json["success"] === "true");
      if (!ok) { throw new Error(json && json.message ? json.message : "Rejected by FormSubmit"); }
      hideAlert();
      form.reset();
      resetCvUi();
      form.hidden = true;
      if (successEl) successEl.hidden = false;
    }).catch(function () {
      // Offline? A classic POST cannot work either — explain instead.
      if (navigator.onLine === false) {
        showAlert("You appear to be offline. Please try again once you're back online, or email us directly at princealexdigital@gmail.com.", true);
        setLoading(false);
        return;
      }
      // AJAX blocked or refused → classic multipart POST (the guaranteed
      // attachment path). _next returns the visitor to /careers/?submitted=1
      // on success, where the success panel is shown below.
      classicSubmit();
    }).then(function () {
      // Re-enable the button only if we are still on the page
      setLoading(false);
    });
  });

  // Guaranteed-multipart fallback: let the browser POST the form itself
  // (the <form> carries enctype="multipart/form-data"). This is FormSubmit's
  // documented attachment path and runs only when the AJAX request fails.
  function classicSubmit() {
    syncReplyTo();
    form.submit(); // native submission — bypasses this handler, no loop
  }

  // Return trip from the classic fallback: FormSubmit redirects back to
  // /careers/?submitted=1 only after it has accepted the application.
  (function handleFallbackReturn() {
    try {
      const query = window.location.search || "";
      if (query.indexOf("submitted=1") === -1) return;
      form.hidden = true;
      if (successEl) {
        successEl.hidden = false;
        successEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      window.history.replaceState({}, "", window.location.pathname);
    } catch (err) { /* never block the page */ }
  })();

  // "Submit another application" — bring the form back for the next applicant
  if (anotherBtn) {
    anotherBtn.addEventListener("click", function () {
      if (successEl) successEl.hidden = true;
      form.hidden = false;
      hideAlert();
      resetCvUi();
      if (roleSelect) roleSelect.value = "";
      if (nameField) nameField.focus({ preventScroll: true });
    });
  }
})();
