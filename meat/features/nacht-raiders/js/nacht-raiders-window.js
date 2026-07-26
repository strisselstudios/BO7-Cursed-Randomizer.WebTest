/* ==========================================================
   1. NACHT RAIDERS WINDOW STATE
========================================================== */

const NACHT_RAIDERS_SCREEN_LOADING = "loading";
const NACHT_RAIDERS_SCREEN_MENU = "menu";
const NACHT_RAIDERS_SCREEN_RECORDS = "records";
const NACHT_RAIDERS_SCREEN_GAME = "game";

let nachtRaidersWindowIsOpen = false;
let nachtRaidersPreviouslyFocusedElement = null;

/* ==========================================================
   2. INTERFACE SCREEN SWITCHING
========================================================== */

function getNachtRaidersScreenElements() {
  return new Map([
    [NACHT_RAIDERS_SCREEN_LOADING, nachtRaidersLoadingScreen],
    [NACHT_RAIDERS_SCREEN_MENU, nachtRaidersMenuScreen],
    [NACHT_RAIDERS_SCREEN_RECORDS, nachtRaidersRecordsScreen],
    [NACHT_RAIDERS_SCREEN_GAME, nachtRaidersGameScreen]
  ]);
}

function showNachtRaidersScreen(screenName) {
  if (!nachtRaidersWindow) return false;

  const screens = getNachtRaidersScreenElements();

  if (!screens.has(screenName) || [...screens.values()].some((screen) => !screen)) {
    return false;
  }

  for (const [registeredScreenName, screen] of screens) {
    screen.hidden = registeredScreenName !== screenName;
  }

  nachtRaidersWindow.dataset.nachtRaidersScreen = screenName;

  document.dispatchEvent(
    new CustomEvent("nacht-raiders:screen-changed", {
      detail: {
        screen: screenName
      }
    })
  );

  return true;
}

function showNachtRaidersLoadingScreen() {
  return showNachtRaidersScreen(NACHT_RAIDERS_SCREEN_LOADING);
}

function showNachtRaidersMenuScreen() {
  return showNachtRaidersScreen(NACHT_RAIDERS_SCREEN_MENU);
}

function showNachtRaidersRecordsScreen() {
  return showNachtRaidersScreen(NACHT_RAIDERS_SCREEN_RECORDS);
}

function showNachtRaidersGameScreen() {
  return showNachtRaidersScreen(NACHT_RAIDERS_SCREEN_GAME);
}
/* ==========================================================
   3. WINDOW ACCESS
========================================================== */

function isNachtRaidersWindowOpen() {
  return (
    nachtRaidersWindowIsOpen &&
    nachtRaidersOverlay &&
    !nachtRaidersOverlay.hidden
  );
}

/* ==========================================================
   4. FOCUS MANAGEMENT
========================================================== */

function getNachtRaidersFocusableElements() {
  if (!nachtRaidersWindow) {
    return [];
  }

  const focusableSelector = [
    "button:not([disabled])",
    "a[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])'
  ].join(",");

  return Array.from(
    nachtRaidersWindow.querySelectorAll(
      focusableSelector
    )
  ).filter(
    (element) => {
      return (
        !element.hidden &&
        element.getClientRects().length >
          0
      );
    }
  );
}

function trapNachtRaidersFocus(
  event
) {
  if (
    event.key !== "Tab" ||
    !isNachtRaidersWindowOpen()
  ) {
    return;
  }

  const focusableElements =
    getNachtRaidersFocusableElements();

  if (
    focusableElements.length === 0
  ) {
    event.preventDefault();

    nachtRaidersWindow?.focus({
      preventScroll: true
    });

    return;
  }

  const firstFocusableElement =
    focusableElements[0];

  const lastFocusableElement =
    focusableElements[
      focusableElements.length - 1
    ];

  const activeElement =
    document.activeElement;

  if (
    event.shiftKey &&
    (
      activeElement ===
        firstFocusableElement ||
      !nachtRaidersWindow.contains(
        activeElement
      )
    )
  ) {
    event.preventDefault();

    lastFocusableElement.focus({
      preventScroll: true
    });

    return;
  }

  if (
    !event.shiftKey &&
    (
      activeElement ===
        lastFocusableElement ||
      !nachtRaidersWindow.contains(
        activeElement
      )
    )
  ) {
    event.preventDefault();

    firstFocusableElement.focus({
      preventScroll: true
    });
  }
}

/* ==========================================================
   5. OPEN WINDOW
========================================================== */

function openNachtRaidersWindow() {
  if (
    typeof shouldShowNachtRaidersLauncher ===
      "function" &&
    !shouldShowNachtRaidersLauncher()
  ) {
    return false;
  }

  if (
    !nachtRaidersOverlay ||
    !nachtRaidersWindow ||
    !nachtRaidersCloseButton
  ) {
    return false;
  }

  if (isNachtRaidersWindowOpen()) {
    nachtRaidersCloseButton.focus({
      preventScroll: true
    });

    return true;
  }

  nachtRaidersPreviouslyFocusedElement =
    document.activeElement instanceof
      HTMLElement
      ? document.activeElement
      : nachtRaidersLauncherButton;

  /*
   * Until the real boot controller is added, every launch
   * begins on the prepared loading-screen shell.
   */
  showNachtRaidersScreen(
    NACHT_RAIDERS_SCREEN_LOADING
  );

  nachtRaidersOverlay.hidden =
    false;

  nachtRaidersOverlay.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "nacht-raiders-window-open"
  );

  nachtRaidersWindowIsOpen =
    true;

  window.requestAnimationFrame(
    () => {
      nachtRaidersCloseButton.focus({
        preventScroll: true
      });
    }
  );

  document.dispatchEvent(
    new CustomEvent(
      "nacht-raiders:opened"
    )
  );

  return true;
}

/* ==========================================================
   6. CLOSE WINDOW
========================================================== */

function closeNachtRaidersWindow() {
  if (
    !nachtRaidersOverlay ||
    !nachtRaidersWindowIsOpen
  ) {
    return false;
  }

  nachtRaidersWindowIsOpen =
    false;

  nachtRaidersOverlay.hidden =
    true;

  nachtRaidersOverlay.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "nacht-raiders-window-open"
  );

  document.dispatchEvent(
    new CustomEvent(
      "nacht-raiders:closed"
    )
  );

  const elementToRestore =
    nachtRaidersPreviouslyFocusedElement;

  nachtRaidersPreviouslyFocusedElement =
    null;

  if (
    elementToRestore instanceof
      HTMLElement &&
    elementToRestore.isConnected &&
    !elementToRestore.hidden
  ) {
    window.requestAnimationFrame(
      () => {
        elementToRestore.focus({
          preventScroll: true
        });
      }
    );
  } else {
    nachtRaidersLauncherButton?.focus({
      preventScroll: true
    });
  }

  return true;
}

/* ==========================================================
   7. GLOBAL KEYBOARD INPUT
========================================================== */

function handleNachtRaidersWindowKeydown(
  event
) {
  if (!isNachtRaidersWindowOpen()) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();

    closeNachtRaidersWindow();

    return;
  }

  trapNachtRaidersFocus(
    event
  );
}

/* ==========================================================
   8. WINDOW INPUT
========================================================== */

document.addEventListener(
  "nacht-raiders:open-requested",
  () => {
    openNachtRaidersWindow();
  }
);

nachtRaidersCloseButton
  ?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      closeNachtRaidersWindow();
    }
  );

nachtRaidersOverlay
  ?.addEventListener(
    "click",
    (event) => {
      /*
       * Only close when the dark backdrop itself was clicked.
       * Clicking anywhere inside the DOS window does nothing.
       */
      if (
        event.target !==
        nachtRaidersOverlay
      ) {
        return;
      }

      closeNachtRaidersWindow();
    }
  );

nachtRaidersWindow
  ?.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();
    }
  );

document.addEventListener(
  "keydown",
  handleNachtRaidersWindowKeydown
);
