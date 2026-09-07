/* ============================================================
   PRINCE ALEX DIGITAL — SERVICES PAGE-SPECIFIC BEHAVIOUR
   (shared behaviour lives in /assets/js/pad.js)
   ============================================================ */
(function () {
  "use strict";

  /* Highlight the current category in the jump nav while scrolling. */
  var sections = document.querySelectorAll(".svc-category[id]");
  var links = document.querySelectorAll(".jump-nav a[href^='#']");
  if (!sections.length || !links.length || !("IntersectionObserver" in window)) return;

  var map = {};
  links.forEach(function (link) {
    map[link.getAttribute("href").slice(1)] = link;
  });

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove("is-active"); });
        var current = map[entry.target.id];
        if (current) current.classList.add("is-active");
      });
    },
    { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
  );

  sections.forEach(function (sec) {
    if (map[sec.id]) io.observe(sec);
  });
})();