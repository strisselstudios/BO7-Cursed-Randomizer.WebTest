/* ==========================================================
   1. HIGH STEAKS WINDOW STATE
========================================================== */

let highSteaksWindowIsOpen = false;
let highSteaksPreviouslyFocusedElement = null;

/* ==========================================================
   2. WINDOW ACCESS
========================================================== */

function isHighSteaksWindowOpen() {
  return highSteaksWindowIsOpen && highSteaksOverlay && !highSteaksOverlay.hidden;
}

/* ==========================================================
   3. FOCUS MANAGEMENT
========================================================== */

function getHighSteaksFocusableElements() {
  if (!highSteaksWindow) return [];

  const focusableSelector = [
    "button:not([disabled])",
    "a[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])'
  ].join(",");

  return Array.from(highSteaksWindow.querySelectorAll(focusableSelector)).filter((element) => {
    return !element.hidden && element.getClientRects().length > 0;
  });
}

function trapHighSteaksFocus(event) {
  if (event.key !== "Tab" || !isHighSteaksWindowOpen()) return;

  const focusableElements = getHighSteaksFocusableElements();

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
}

/* ==========================================================
   4. OPEN WINDOW
========================================================== */

function openHighSteaksWindow() {
  if (typeof shouldShowHighSteaksLauncher === "function" && !shouldShowHighSteaksLauncher()) return false;
  if (!highSteaksOverlay || !highSteaksWindow || !highSteaksCloseButton) return false;

  if (isHighSteaksWindowOpen()) {
    highSteaksCloseButton.focus({ preventScroll: true });
    return true;
  }

  highSteaksPreviouslyFocusedElement = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : highSteaksLauncherButton;

  highSteaksOverlay.hidden = false;
  highSteaksOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("high-steaks-window-open");
  highSteaksWindowIsOpen = true;

  window.requestAnimationFrame(() => {
    highSteaksCloseButton.focus({ preventScroll: true });
  });

  document.dispatchEvent(new CustomEvent("high-steaks:opened"));
  return true;
}

/* ==========================================================
   5. CLOSE WINDOW
========================================================== */

function closeHighSteaksWindow() {
  if (!highSteaksOverlay || !highSteaksWindowIsOpen) return false;

  highSteaksWindowIsOpen = false;
  highSteaksOverlay.hidden = true;
  highSteaksOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("high-steaks-window-open");
  document.dispatchEvent(new CustomEvent("high-steaks:closed"));

  const elementToRestore = highSteaksPreviouslyFocusedElement;
  highSteaksPreviouslyFocusedElement = null;

  if (elementToRestore instanceof HTMLElement && elementToRestore.isConnected && !elementToRestore.hidden) {
    window.requestAnimationFrame(() => {
      elementToRestore.focus({ preventScroll: true });
    });
  } else {
    highSteaksLauncherButton?.focus({ preventScroll: true });
  }

  return true;
}

/* ==========================================================
   6. GLOBAL KEYBOARD INPUT
========================================================== */

function handleHighSteaksWindowKeydown(event) {
  if (!isHighSteaksWindowOpen()) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeHighSteaksWindow();
    return;
  }

  trapHighSteaksFocus(event);
}

/* ==========================================================
   7. WINDOW INPUT
========================================================== */

document.addEventListener("high-steaks:open-requested", openHighSteaksWindow);

highSteaksCloseButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  closeHighSteaksWindow();
});

highSteaksOverlay?.addEventListener("click", (event) => {
  if (event.target === highSteaksOverlay) closeHighSteaksWindow();
});

highSteaksWindow?.addEventListener("click", (event) => {
  event.stopPropagation();
});

document.addEventListener("keydown", handleHighSteaksWindowKeydown);
