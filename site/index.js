/* ============================================================
   PRINCE ALEX DIGITAL — HOMEPAGE-SPECIFIC BEHAVIOUR
   (shared behaviour lives in /assets/js/pad.js)
   ============================================================ */
(function () {
  "use strict";

  // Subtle tilt on the hero product preview — decorative only.
  var hero = document.querySelector(".hero-mock");
  if (hero && window.PAD && !window.PAD.reduceMotion) {
    document.addEventListener(
      "mousemove",
      function (e) {
        var x = e.clientX / window.innerWidth - 0.5;
        var y = e.clientY / window.innerHeight - 0.5;
        hero.style.transform =
          "perspective(1200px) rotateY(" + (x * -5).toFixed(2) + "deg) rotateX(" + (y * 3).toFixed(2) + "deg)";
      },
      { passive: true }
    );
  }
})();