/* ==========================================================
   1. NACHT RAIDERS WINDOW STATE
========================================================== */

const NACHT_RAIDERS_SCREEN_LOADING = "loading";
const NACHT_RAIDERS_SCREEN_TITLE = "title";
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
    [NACHT_RAIDERS_SCREEN_TITLE, nachtRaidersTitleScreen],
    [NACHT_RAIDERS_SCREEN_MENU, nachtRaidersMenuScreen],
    [NACHT_RAIDERS_SCREEN_RECORDS, nachtRaidersRecordsScreen],
    [NACHT_RAIDERS_SCREEN_GAME, nachtRaidersGameScreen]
  ]);
}

function showNachtRaidersScreen(screenName) {
  if (!nachtRaidersWindow) return false;

  const screens = getNachtRaidersScreenElements();

  if (
    !screens.has(screenName) ||
    [...screens.values()].some((screen) => !screen)
  ) {
    return false;
  }

  for (const [registeredScreenName, screen] of screens) {
    screen.hidden =
      registeredScreenName !== screenName;
  }

  nachtRaidersWindow.dataset.nachtRaidersScreen =
    screenName;

  document.dispatchEvent(
    new CustomEvent(
      "nacht-raiders:screen-changed",
      {
        detail: {
          screen: screenName
        }
      }
    )
  );

  return true;
}

function showNachtRaidersLoadingScreen() {
  return showNachtRaidersScreen(
    NACHT_RAIDERS_SCREEN_LOADING
  );
}

function showNachtRaidersTitleScreen() {
  return showNachtRaidersScreen(
    NACHT_RAIDERS_SCREEN_TITLE
  );
}

function showNachtRaidersMenuScreen() {
  return showNachtRaidersScreen(
    NACHT_RAIDERS_SCREEN_MENU
  );
}

function showNachtRaidersRecordsScreen() {
  return showNachtRaidersScreen(
    NACHT_RAIDERS_SCREEN_RECORDS
  );
}

function showNachtRaidersGameScreen() {
  return showNachtRaidersScreen(
    NACHT_RAIDERS_SCREEN_GAME
  );
}

/* ==========================================================
   3. WINDOW ACCESS
========================================================== */

function isNachtRaidersWindowOpen() {
  return Boolean(
    nachtRaidersWindowIsOpen &&
    nachtRaidersOverlay &&
    !nachtRaidersOverlay.hidden
  );
}

/* ==========================================================
   4. FOCUS MANAGEMENT
========================================================== */

function getNachtRaidersFocusableElements() {
  if (!nachtRaidersWindow) return [];

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
  ).filter((element) => {
    return (
      !element.hidden &&
      element.getClientRects().length > 0
    );
  });
}

function trapNachtRaidersFocus(event) {
  if (
    event.key !== "Tab" ||
    !isNachtRaidersWindowOpen() ||
    typeof isNachtRaidersFullWindowMode !==
      "function" ||
    !isNachtRaidersFullWindowMode()
  ) {
    return;
  }

  const focusableElements =
    getNachtRaidersFocusableElements();

  if (focusableElements.length === 0) {
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
    if (
      typeof focusNachtRaidersWindowForMode ===
      "function"
    ) {
      focusNachtRaidersWindowForMode();
    } else {
      nachtRaidersCloseButton.focus({
        preventScroll: true
      });
    }

    return true;
  }

  nachtRaidersPreviouslyFocusedElement =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : nachtRaidersLauncherButton;

  const nachtRaidersState =
    ensureNachtRaidersFeatureState();

  const windowMode =
    typeof resolveNachtRaidersAvailableWindowMode ===
      "function"
      ? resolveNachtRaidersAvailableWindowMode(
          nachtRaidersState.window.mode
        )
      : normalizeNachtRaidersWindowMode(
          nachtRaidersState.window.mode
        );

  nachtRaidersWindowIsOpen = true;
  nachtRaidersOverlay.hidden = false;

  nachtRaidersOverlay.setAttribute(
    "aria-hidden",
    "false"
  );

  applyNachtRaidersWindowMode(
    windowMode,
    {
      save: false,
      prepareScreen: false,
      refreshDisplays: false
    }
  );

  if (
    windowMode ===
    NACHT_RAIDERS_WINDOW_MODE_FULL
  ) {
    showNachtRaidersLoadingScreen();
  } else {
    prepareNachtRaidersWindowScreenForMode(
      windowMode
    );
  }

  if (
    typeof updateNachtRaidersModeSpecificDisplays ===
      "function"
  ) {
    updateNachtRaidersModeSpecificDisplays(
      windowMode
    );
  }

  window.requestAnimationFrame(() => {
    if (
      windowMode ===
        NACHT_RAIDERS_WINDOW_MODE_COMPACT &&
      typeof renderNachtRaidersGameState ===
        "function"
    ) {
      renderNachtRaidersGameState();

      if (
        typeof renderNachtRaidersCompactMonitorState ===
          "function"
      ) {
        renderNachtRaidersCompactMonitorState(
          nachtRaidersState
        );
      }
    }

    if (
      windowMode ===
        NACHT_RAIDERS_WINDOW_MODE_TERMINAL &&
      typeof renderNachtRaidersTerminalMonitor ===
        "function"
    ) {
      renderNachtRaidersTerminalMonitor();
    }

    if (
      typeof focusNachtRaidersWindowForMode ===
        "function"
    ) {
      focusNachtRaidersWindowForMode();
    } else {
      nachtRaidersCloseButton.focus({
        preventScroll: true
      });
    }
  });

  document.dispatchEvent(
    new CustomEvent(
      "nacht-raiders:opened",
      {
        detail: {
          mode: windowMode
        }
      }
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

  if (
    typeof cancelNachtRaidersWindowDrag ===
    "function"
  ) {
    cancelNachtRaidersWindowDrag();
  }

  nachtRaidersWindowIsOpen = false;
  nachtRaidersOverlay.hidden = true;

  nachtRaidersOverlay.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "nacht-raiders-window-open",
    "nacht-raiders-window-floating"
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
    elementToRestore instanceof HTMLElement &&
    elementToRestore.isConnected &&
    !elementToRestore.hidden
  ) {
    window.requestAnimationFrame(() => {
      elementToRestore.focus({
        preventScroll: true
      });
    });
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

function handleNachtRaidersWindowKeydown(event) {
  if (!isNachtRaidersWindowOpen()) {
    return;
  }

  if (event.key === "Escape") {
    const fullMode =
      typeof isNachtRaidersFullWindowMode !==
        "function" ||
      isNachtRaidersFullWindowMode();

    const focusIsInsideWindow =
      nachtRaidersWindow?.contains(
        document.activeElement
      );

    if (
      !fullMode &&
      !focusIsInsideWindow
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    closeNachtRaidersWindow();

    return;
  }

  trapNachtRaidersFocus(event);
}

/* ==========================================================
   8. WINDOW INPUT
========================================================== */

document.addEventListener(
  "nacht-raiders:open-requested",
  openNachtRaidersWindow
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
      if (
        event.target !==
          nachtRaidersOverlay ||
        (
          typeof isNachtRaidersFullWindowMode ===
            "function" &&
          !isNachtRaidersFullWindowMode()
        )
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
