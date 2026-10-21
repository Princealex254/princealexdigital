/* Career application form (FormSubmit). Classic script, kept separate from
   careers.js so it works even if the Firebase module fails to load. */
// ---------- Application form (FormSubmit → princealexdigital@gmail.com)
(function applyForm() {
  "use strict";
  const roleSelect = document.getElementById("apply-role");
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
      showAlert("Finishing your submission, please wait...", false);
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
