/* ============================================================
   PRINCE ALEX DIGITAL — SHARED BEHAVIOUR  (pad.js)
   Loaded by every page alongside page-specific JS.
   Handles: theme, sticky header, mobile nav, dropdowns,
   scroll reveal, count-up numbers, year.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* ---------- THEME (dark / light) ---------- */
  var storedTheme = null;
  try { storedTheme = localStorage.getItem("pad-theme"); } catch (err) { /* ignore */ }
  var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var theme = storedTheme || (systemDark ? "dark" : "light");
  root.setAttribute("data-theme", theme);

  var themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    themeToggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      themeToggle.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
      try { localStorage.setItem("pad-theme", next); } catch (err) { /* ignore */ }
    });
  }

  /* ---------- STICKY HEADER SHADOW ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- MOBILE NAV TOGGLE ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".primary-nav");
  function closeNav() {
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
    if (nav) nav.classList.remove("is-open");
    document.body.style.overflow = "";
  }
  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
      document.body.style.overflow = !open ? "hidden" : "";
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });
  }

  /* ---------- SOLUTIONS DROPDOWN ---------- */
  var dropdownTriggers = document.querySelectorAll(".nav-item.has-dropdown .nav-link");
  dropdownTriggers.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      var wasOpen = btn.getAttribute("aria-expanded") === "true";
      document.querySelectorAll(".nav-item.has-dropdown").forEach(function (item) {
        var b = item.querySelector(".nav-link");
        if (b) b.setAttribute("aria-expanded", "false");
        item.classList.remove("is-open");
      });
      var open = !wasOpen;
      btn.setAttribute("aria-expanded", String(open));
      var item = btn.closest(".has-dropdown");
      if (item) item.classList.toggle("is-open", open);
      e.stopPropagation();
    });
  });
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest(".has-dropdown")) return;
    document.querySelectorAll(".has-dropdown.is-open").forEach(function (item) {
      item.classList.remove("is-open");
      var b = item.querySelector(".nav-link");
      if (b) b.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- SCROLL REVEAL ---------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      revealEls.forEach(function (el) { revealIO.observe(el); });
    }
  }

  /* ---------- COUNT-UP NUMBERS ---------- */
  var numEls = document.querySelectorAll("[data-count]");
  if (numEls.length) {
    var runCounter = function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      var duration = 1400;
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1 && !reduceMotion) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(step);
    };
    if (reduceMotion || !("IntersectionObserver" in window)) {
      numEls.forEach(runCounter);
    } else {
      var counterIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          counterIO.unobserve(entry.target);
          runCounter(entry.target);
        });
      }, { threshold: 0.4 });
      numEls.forEach(function (el) { counterIO.observe(el); });
    }
  }

  /* ---------- CURRENT-YEAR STAMP ---------- */
  var currentYear = new Date().getFullYear();
  document.querySelectorAll("[data-current-year]").forEach(function (el) {
    el.textContent = currentYear;
  });

  window.PAD = { reduceMotion: reduceMotion, theme: theme };
})();