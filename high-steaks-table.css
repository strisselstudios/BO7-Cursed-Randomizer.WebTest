/* ==========================================================
   1. HIGH STEAKS WINDOW STATE
========================================================== */

HighSteaks.windowIsOpen = false;
HighSteaks.previouslyFocusedElement = null;

/* ==========================================================
   2. WINDOW AND FOCUS ACCESS
========================================================== */

HighSteaks.isWindowOpen = function isWindowOpen() {
  return HighSteaks.windowIsOpen && highSteaksOverlay && !highSteaksOverlay.hidden;
};

HighSteaks.getFocusableElements = function getFocusableElements() {
  if (!highSteaksWindow) return [];

  const focusableSelector = [
    "button:not([disabled])",
    "a[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])'
  ].join(",");

  return Array.from(highSteaksWindow.querySelectorAll(focusableSelector))
    .filter((element) => !element.hidden && element.getClientRects().length > 0);
};

HighSteaks.trapFocus = function trapFocus(event) {
  if (event.key !== "Tab" || !HighSteaks.isWindowOpen()) return;

  const focusableElements = HighSteaks.getFocusableElements();

  if (focusableElements.length === 0) {
    event.preventDefault();
    highSteaksWindow?.focus({ preventScroll: true });
    return;
  }

  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];
  const activeElement = document.activeElement;

  if (event.shiftKey && (activeElement === firstFocusableElement || !highSteaksWindow.contains(activeElement))) {
    event.preventDefault();
    lastFocusableElement.focus({ preventScroll: true });
    return;
  }

  if (!event.shiftKey && (activeElement === lastFocusableElement || !highSteaksWindow.contains(activeElement))) {
    event.preventDefault();
    firstFocusableElement.focus({ preventScroll: true });
  }
};

/* ==========================================================
   3. OPEN AND CLOSE WINDOW
========================================================== */

HighSteaks.openWindow = function openWindow() {
  if (typeof HighSteaks.shouldShowLauncher === "function" && !HighSteaks.shouldShowLauncher()) return false;
  if (!highSteaksOverlay || !highSteaksWindow || !highSteaksCloseButton) return false;

  if (HighSteaks.isWindowOpen()) {
    highSteaksCloseButton.focus({ preventScroll: true });
    return true;
  }

  HighSteaks.previouslyFocusedElement = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : highSteaksLauncherButton;

  highSteaksOverlay.hidden = false;
  highSteaksOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("high-steaks-window-open");
  HighSteaks.windowIsOpen = true;
  document.dispatchEvent(new CustomEvent("high-steaks:opened"));

  window.requestAnimationFrame(() => highSteaksCloseButton.focus({ preventScroll: true }));
  return true;
};

HighSteaks.closeWindow = function closeWindow() {
  if (!highSteaksOverlay || !HighSteaks.windowIsOpen) return false;

  HighSteaks.windowIsOpen = false;
  highSteaksOverlay.hidden = true;
  highSteaksOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("high-steaks-window-open");
  document.dispatchEvent(new CustomEvent("high-steaks:closed"));

  const elementToRestore = HighSteaks.previouslyFocusedElement;
  HighSteaks.previouslyFocusedElement = null;

  window.requestAnimationFrame(() => {
    if (elementToRestore instanceof HTMLElement && elementToRestore.isConnected && !elementToRestore.hidden) {
      elementToRestore.focus({ preventScroll: true });
      return;
    }

    highSteaksLauncherButton?.focus({ preventScroll: true });
  });

  return true;
};

/* ==========================================================
   4. WINDOW INPUT
========================================================== */

function handleHighSteaksWindowKeydown(event) {
  if (!HighSteaks.isWindowOpen()) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    HighSteaks.closeWindow();
    return;
  }

  HighSteaks.trapFocus(event);
}

document.addEventListener("high-steaks:open-requested", HighSteaks.openWindow);
document.addEventListener("keydown", handleHighSteaksWindowKeydown);

highSteaksCloseButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  HighSteaks.closeWindow();
});

highSteaksOverlay?.addEventListener("click", (event) => {
  if (event.target === highSteaksOverlay) HighSteaks.closeWindow();
});

highSteaksWindow?.addEventListener("click", (event) => event.stopPropagation());
