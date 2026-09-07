(function loadSharedChatWidget() {
  document.querySelectorAll("#chat-box, #chat-btn, #chat-tooltip, iframe[data-chat-widget]")
    .forEach((element) => element.remove());

  const launcher = document.createElement("button");
  launcher.id = "chat-widget-launcher";
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Open chat with Alex");
  launcher.style.cssText = [
    "position: fixed",
    "right: 25px",
    "bottom: 25px",
    "width: 60px",
    "height: 60px",
    "border: 0",
    "border-radius: 50%",
    "background: transparent",
    "color: transparent",
    "font-size: 0",
    "cursor: pointer",
    "z-index: 2147483646"
  ].join(";");

  const frame = document.createElement("iframe");
  frame.src = "/chat-widget.html";
  frame.dataset.chatWidget = "true";
  frame.title = "Prince Alex Digital AI Chat";
  frame.setAttribute("aria-label", "Prince Alex Digital AI Chat");
  frame.setAttribute("allow", "microphone");
  frame.setAttribute("allowtransparency", "true");
  frame.style.cssText = [
    "position: fixed",
    "inset: 0",
    "width: 100vw",
    "height: 100vh",
    "border: 0",
    "z-index: 2147483647",
    "background: transparent",
    "pointer-events: none"
  ].join(";");

  let frameReady = false;
  let pendingOpen = false;
  function sendToggle() {
    if (!frameReady) {
      pendingOpen = true;
      return;
    }
    frame.contentWindow.postMessage({ type: "chat-widget-toggle" }, "*");
  }

  launcher.addEventListener("click", sendToggle);
  frame.addEventListener("load", () => {
    frameReady = true;
    if (pendingOpen) {
      pendingOpen = false;
      sendToggle();
    }
  });
  window.addEventListener("message", (event) => {
    if (event.source !== frame.contentWindow || !event.data || event.data.source !== "chat-widget") return;
    const isOpen = event.data.chatOpen === true;
    frame.style.pointerEvents = isOpen ? "auto" : "none";
    launcher.hidden = isOpen;
  });

  document.body.appendChild(launcher);
  document.body.appendChild(frame);
})();
