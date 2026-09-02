/* ============================================================
   PRINCE ALEX DIGITAL — PORTFOLIO PAGE
   Renders work published via the admin panel.

   This module talks to the exact same Firebase project, appId and
   Firestore collection as admin.html (`artifacts/{appId}/public/
   data/portfolio`), so anything posted through the admin appears
   here automatically — including edits, hide/show toggles and
   deletions, live via onSnapshot.

   Data source: Firestore only — there is no hardcoded fallback
   content. The SDK uses a persistent local cache (IndexedDB), so
   once data has been fetched it is stored on-device: repeat visits
   and offline sessions paint instantly from cached data and then
   reconcile with the server. When nothing is published, the page
   shows an honest empty state.
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  query,
  where,
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
// Persistent local cache (IndexedDB, shared across tabs): onSnapshot is
// served from the cache first — instant paint from cached data — then
// reconciles with the server as soon as a connection is available.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

const statusBox = document.getElementById("portfolio-status");
const emptyState = document.getElementById("portfolio-empty");
const grid = document.getElementById("portfolio-grid");
const swipeHint = document.querySelector(".portfolio-swipe-hint");

// statusBox doubles as the loading and error surface (role="status")
function setStatus(message) {
  if (!statusBox) return;
  statusBox.textContent = message || "";
  statusBox.hidden = !message;
}

// Escape any admin-entered content before it hits the DOM
function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cardHTML(item) {
  const title = escapeHtml(item.title || "Untitled Project");
  const description = escapeHtml(item.description || "");
  const link = escapeHtml(item.link || "#");
  const linkText = escapeHtml(item.linkText || "View Project");
  const imageUrl = item.imageUrl ? escapeHtml(item.imageUrl) : "";
  const initial = escapeHtml((item.title || "P").trim().charAt(0).toUpperCase());

  // Monogram sits underneath the image; if the image fails to load it is
  // removed and the branded monogram is revealed — never an empty box.
  const img = imageUrl
    ? `<img class="pf-media-img" src="${imageUrl}" alt="${title}" loading="lazy" onerror="this.remove()">`
    : "";

  return `
    <article class="pf-card el-card" data-reveal>
      <div class="pf-media">
        <span class="pf-monogram" aria-hidden="true">${initial}</span>
        ${img}
      </div>
      <div class="pf-body">
        <h3 class="pf-title">${title}</h3>
        <p class="pf-desc">${description}</p>
        <a class="pf-link" href="${link}" target="_blank" rel="noopener">${linkText} <span aria-hidden="true">→</span></a>
      </div>
    </article>`;
}

// Newest first (createdAt is a Firestore Timestamp), then alphabetical
function sortItems(items) {
  return items.sort((a, b) => {
    const ta = a.createdAt && typeof a.createdAt.toMillis === "function" ? a.createdAt.toMillis() : 0;
    const tb = b.createdAt && typeof b.createdAt.toMillis === "function" ? b.createdAt.toMillis() : 0;
    return tb - ta || String(a.title || "").localeCompare(String(b.title || ""));
  });
}

function revealCards(container) {
  container.querySelectorAll("[data-reveal]").forEach((el, i) => {
    setTimeout(() => el.classList.add("is-visible"), Math.min(i * 60, 360));
  });
}

function render(snapshot) {
  const items = [];
  snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));

  // A snapshot has arrived (from the cache or the server) — the loading
  // surface is done either way, so retire it before branching.
  setStatus("");

  if (!items.length) {
    // Nothing published (or everything hidden) → honest empty state,
    // driven by the same Firestore query (live or cached).
    if (grid) grid.innerHTML = "";
    if (swipeHint) swipeHint.hidden = true;
    if (emptyState) emptyState.hidden = false;
    return;
  }

  if (emptyState) emptyState.hidden = true;
  if (swipeHint) swipeHint.hidden = false;
  if (grid) grid.innerHTML = sortItems(items).map(cardHTML).join("");
  revealCards(grid);
}

function showError(error) {
  // Firestore was unreachable AND the local cache had nothing usable.
  // There is no static fallback — say so honestly.
  console.error("Portfolio data unavailable:", error);
  if (grid) grid.innerHTML = "";
  if (emptyState) emptyState.hidden = true;
  if (swipeHint) swipeHint.hidden = true;
  setStatus("We couldn't load our work right now — please refresh in a moment.");
}

setStatus("Loading our work…");

// Listen for changes: add, edit, hide/show and delete all reflect live.
// onSnapshot is served from the persistent cache first, then the server.
const portfolioRef = collection(db, `artifacts/${appId}/public/data/portfolio`);
const q = query(portfolioRef, where("status", "==", "show"));
onSnapshot(q, render, showError);
