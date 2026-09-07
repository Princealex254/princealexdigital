(function loadSharedChatWidget() {
  const existingWidget = document.getElementById("chat-box");
  const existingButton = document.getElementById("chat-btn");
  if (existingWidget) existingWidget.remove();
  if (existingButton) existingButton.remove();
  const existingTooltip = document.getElementById("chat-tooltip");
  if (existingTooltip) existingTooltip.remove();

  const frame = document.createElement("iframe");
  frame.src = "/chat-widget.html";
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
    "background: transparent"
  ].join(";");
  document.body.appendChild(frame);
})();
