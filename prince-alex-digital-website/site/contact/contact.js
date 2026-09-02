/* ============================================================
   PRINCE ALEX DIGITAL - CONTACT PAGE BEHAVIOUR  (contact.js)
   "Send us a Message" form - reconstructed to work exactly like
   the careers application form (/careers/careers.js):

     - AJAX submit to FormSubmit (princealexdigital@gmail.com)
     - loading spinner + disabled button while sending
     - honeypot spam trap + native validation
     - on success: hide the form, show the success panel
     - on AJAX failure: guaranteed native multipart POST fallback
     - ?sent=success return trip shows the success panel
     - "Send another message" restores the form
     - _replyto kept in sync + deep-link prefill

   NOTE: the contact page currently runs this identical logic
   inlined at the bottom of index.html (so it always executes
   after the form markup exists). This file is the standalone
   mirror of that implementation, matching /careers/careers.js
   pattern-for-pattern.
   ============================================================ */
(function () {
  "use strict";

  function el(id) { return document.getElementById(id); }

  var form       = el("contact-form");
  var alertEl    = el("cf-alert");
  var successEl  = el("cf-success");
  var submitBtn  = el("cf-submit");
  var btnLabel   = submitBtn ? submitBtn.querySelector(".btn-label") : null;
  var emailInput = el("cf-email");
  var replyTo    = el("cf-replyto");
  var anotherBtn = el("cf-another");

  if (!form) return; // nothing to bind

  function showAlert(message, isError) {
    if (!alertEl) return;
    alertEl.textContent = message;
    alertEl.className = "apply-alert" + (isError ? " is-error" : " is-success");
    alertEl.hidden = false;
    alertEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function hideAlert() {
    if (alertEl) alertEl.hidden = true;
  }

  function setLoading(on) {
    if (!submitBtn) return;
    if (on) {
      submitBtn.setAttribute("disabled", "disabled");
      submitBtn.classList.add("is-loading");
      if (btnLabel) btnLabel.textContent = "Sending...";
    } else {
      submitBtn.removeAttribute("disabled");
      submitBtn.classList.remove("is-loading");
      if (btnLabel) btnLabel.textContent = "Send Message";
    }
  }

  // Keep the FormSubmit _replyto field in sync with the email the visitor types.
  function syncReplyTo() {
    if (replyTo && emailInput) replyTo.value = emailInput.value.trim();
  }
  if (emailInput && replyTo) {
    emailInput.addEventListener("input", syncReplyTo);
    emailInput.addEventListener("change", syncReplyTo);
  }

  /* AJAX submit - no page reload (same pattern as careers.js). */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    hideAlert();

    // Honeypot spam trap
    var honey = null;
    try { honey = form.querySelector('input[name="_honey"]'); } catch (err) { honey = null; }
    if (honey && honey.value) { form.reset(); return; } // bot, abort quietly

    if (form.checkValidity && !form.checkValidity()) {
      if (form.reportValidity) form.reportValidity();
      return;
    }

    setLoading(true);
    syncReplyTo();

    // new FormData(form) carries EVERY named field on the form - name, email,
    // service and message, plus the hidden _subject/_captcha/_template/_next/
    // _replyto/_honey controls.
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
      // Success! Hide the form, show the unmistakable success panel.
      hideAlert();
      form.reset();
      form.hidden = true;
      if (successEl) {
        successEl.hidden = false;
        successEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }).catch(function () {
      // Offline? A classic POST cannot work either - explain instead.
      if (navigator.onLine === false) {
        showAlert("You appear to be offline. Please try again once you're back online, or email us directly at princealexdigital@gmail.com.", true);
        setLoading(false);
        return;
      }
      // AJAX blocked or refused -> classic multipart POST (the guaranteed path).
      // _next returns the visitor to /contact/?sent=success on acceptance,
      // where the success panel is shown below.
      classicSubmit();
    }).then(function () {
      // Re-enable the button only if we are still on the page
      setLoading(false);
    });
  });

  // Guaranteed-multipart fallback: let the browser POST the form itself
  // (the <form> carries enctype="multipart/form-data"). This is FormSubmit's
  // documented path and runs only when the AJAX request fails.
  function classicSubmit() {
    syncReplyTo();
    form.submit(); // native submission - bypasses this handler, no loop
  }

  // Return trip from the classic fallback: FormSubmit redirects back to
  // /contact/?sent=success only after it has accepted the message.
  (function handleFallbackReturn() {
    try {
      var query = window.location.search || "";
      if (query.indexOf("sent=success") === -1) return;
      form.hidden = true;
      if (successEl) {
        successEl.hidden = false;
        successEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      window.history.replaceState({}, "", window.location.pathname);
    } catch (err) { /* never block the page */ }
  })();

  // "Send another message" - bring the form back for the next enquiry
  if (anotherBtn) {
    anotherBtn.addEventListener("click", function () {
      if (successEl) successEl.hidden = true;
      form.hidden = false;
      hideAlert();
      if (emailInput) emailInput.focus({ preventScroll: true });
    });
  }

  /* Deep-link prefill - isolated in its own try/catch so it can NEVER
     prevent the submit handler above from being attached. */
  try {
    var query = window.location.search || "";
    var pairs = query.charAt(0) === "?" ? query.substring(1) : query;
    var params = {};
    var parts = pairs.length ? pairs.split("&") : [];
    for (var pi = 0; pi < parts.length; pi++) {
      var kv = parts[pi].split("=");
      var k = decodeURIComponent(kv[0] || "");
      var v = decodeURIComponent(kv[1] || "");
      if (k) params[k] = v;
    }
    var type = String(params["type"] || params["service"] || "").toLowerCase();

    var SERVICE_MAP = {
      website: "Business Website",
      webapp: "Web Application",
      ecommerce: "E-Commerce",
      software: "Custom Software",
      pos: "POS System",
      schools: "School Management System",
      systems: "Business Management System",
      automation: "AI & Automation",
      ai: "AI & Automation",
      uiux: "UI/UX Design",
      design: "UI/UX Design",
      branding: "Branding",
      marketing: "Digital Marketing & Growth",
      growth: "Digital Marketing & Growth",
      other: "Other"
    };
    var select = el("cf-service");
    if (select && type && SERVICE_MAP[type]) {
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].value === SERVICE_MAP[type]) {
          select.selectedIndex = i;
          break;
        }
      }
    }

    var MESSAGE_PRESETS = {
      careers: "I\u2019d like to join the Prince Alex Digital team. A bit about me and the role I\u2019m interested in:\n\n",
      newsletter: "Please add me to the newsletter list."
    };
    if (type && MESSAGE_PRESETS[type]) {
      var msgEl = el("cf-message");
      if (msgEl) msgEl.value = MESSAGE_PRESETS[type];
    }
  } catch (err) { /* non-fatal: ignore */ }
})();
