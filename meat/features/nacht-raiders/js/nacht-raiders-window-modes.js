/* ==========================================================
   1. WINDOW MODE STATE
========================================================== */

let nachtRaidersLastFullScreenName = null;

/* ==========================================================
   2. WINDOW MODE ACCESS
========================================================== */

function getNachtRaidersWindowMode() {
  const renderedMode =
    nachtRaidersWindow?.dataset.windowMode;

  if (
    NACHT_RAIDERS_WINDOW_MODES.includes(
      renderedMode
    )
  ) {
    return renderedMode;
  }

  const nachtRaidersState =
    ensureNachtRaidersFeatureState();

  return normalizeNachtRaidersWindowMode(
    nachtRaidersState.window.mode
  );
}

function isNachtRaidersFullWindowMode() {
  return (
    getNachtRaidersWindowMode() ===
    NACHT_RAIDERS_WINDOW_MODE_FULL
  );
}

function isNachtRaidersFloatingWindowMode(
  mode = getNachtRaidersWindowMode()
) {
  return (
    mode ===
      NACHT_RAIDERS_WINDOW_MODE_COMPACT ||
    mode ===
      NACHT_RAIDERS_WINDOW_MODE_TERMINAL
  );
}

function getNachtRaidersCurrentScreenName() {
  const screenName =
    nachtRaidersWindow
      ?.dataset
      .nachtRaidersScreen;

  return getNachtRaidersScreenElements()
    .has(
      screenName
    )
      ? screenName
      : null;
}

/* ==========================================================
   3. FULL-SCREEN RESTORE TARGET
========================================================== */

function rememberNachtRaidersFullScreen() {
  const screenName =
    getNachtRaidersCurrentScreenName();

  if (screenName) {
    nachtRaidersLastFullScreenName =
      screenName;
  }

  return nachtRaidersLastFullScreenName;
}

function getNachtRaidersFullScreenRestoreTarget() {
  if (
    getNachtRaidersScreenElements()
      .has(
        nachtRaidersLastFullScreenName
      )
  ) {
    return nachtRaidersLastFullScreenName;
  }

  return ensureNachtRaidersFeatureState()
    .hasStarted
      ? NACHT_RAIDERS_SCREEN_GAME
      : NACHT_RAIDERS_SCREEN_MENU;
}

/* ==========================================================
   4. MODE-SPECIFIC SCREEN PREPARATION
========================================================== */

function prepareNachtRaidersWindowScreenForMode(
  mode
) {
  const normalizedMode =
    normalizeNachtRaidersWindowMode(
      mode
    );

  const nachtRaidersState =
    ensureNachtRaidersFeatureState();

  if (
    normalizedMode ===
    NACHT_RAIDERS_WINDOW_MODE_FULL
  ) {
    return showNachtRaidersScreen(
      getNachtRaidersFullScreenRestoreTarget()
    );
  }

  if (
    typeof cancelNachtRaidersBootSequence ===
    "function"
  ) {
    cancelNachtRaidersBootSequence(
      false
    );
  }

  return showNachtRaidersScreen(
    nachtRaidersState.hasStarted
      ? NACHT_RAIDERS_SCREEN_GAME
      : NACHT_RAIDERS_SCREEN_MENU
  );
}

/* ==========================================================
   5. WINDOW CONTROL PRESENTATION
========================================================== */

function updateNachtRaidersWindowModeControls(
  mode
) {
  if (nachtRaidersCompactButton) {
    nachtRaidersCompactButton.hidden =
      mode ===
      NACHT_RAIDERS_WINDOW_MODE_COMPACT;
  }

  if (nachtRaidersTerminalButton) {
    nachtRaidersTerminalButton.hidden =
      mode ===
      NACHT_RAIDERS_WINDOW_MODE_TERMINAL;
  }

  if (nachtRaidersFullButton) {
    nachtRaidersFullButton.hidden =
      mode ===
      NACHT_RAIDERS_WINDOW_MODE_FULL;
  }

  if (!nachtRaidersWindowTitle) {
    return;
  }

  const windowTitles = {
    [NACHT_RAIDERS_WINDOW_MODE_FULL]:
      "Nacht-Raiders.exe - Command Prompt",

    [NACHT_RAIDERS_WINDOW_MODE_COMPACT]:
      "Nacht-Raiders.exe - Field Monitor",

    [NACHT_RAIDERS_WINDOW_MODE_TERMINAL]:
      "Nacht-Raiders.exe - Field Link"
  };

  nachtRaidersWindowTitle.textContent =
    windowTitles[mode];
}

function focusNachtRaidersWindowForMode() {
  const mode =
    getNachtRaidersWindowMode();

  const preferredControl =
    mode ===
      NACHT_RAIDERS_WINDOW_MODE_FULL
      ? nachtRaidersCloseButton
      : nachtRaidersFullButton;

  (
    preferredControl ||
    nachtRaidersCloseButton ||
    nachtRaidersWindow
  )?.focus({
    preventScroll: true
  });
}

/* ==========================================================
   6. WINDOW MODE APPLICATION
========================================================== */

function applyNachtRaidersWindowMode(
  mode,
  options = {}
) {
  if (
    !nachtRaidersOverlay ||
    !nachtRaidersWindow
  ) {
    return false;
  }

  const normalizedMode =
    normalizeNachtRaidersWindowMode(
      mode
    );

  const nachtRaidersState =
    ensureNachtRaidersFeatureState();

  const previousMode =
    normalizeNachtRaidersWindowMode(
      nachtRaidersState.window.mode
    );

  const floatingMode =
    isNachtRaidersFloatingWindowMode(
      normalizedMode
    );

  const windowIsOpen =
    isNachtRaidersWindowOpen();

  if (
    previousMode ===
      NACHT_RAIDERS_WINDOW_MODE_FULL &&
    normalizedMode !==
      NACHT_RAIDERS_WINDOW_MODE_FULL
  ) {
    rememberNachtRaidersFullScreen();
  }

  nachtRaidersState.window.mode =
    normalizedMode;

  nachtRaidersOverlay.dataset.windowMode =
    normalizedMode;

  nachtRaidersWindow.dataset.windowMode =
    normalizedMode;

  nachtRaidersOverlay.classList.toggle(
    "is-floating",
    floatingMode
  );

  if (
    normalizedMode ===
    NACHT_RAIDERS_WINDOW_MODE_FULL
  ) {
    nachtRaidersWindow.setAttribute(
      "aria-modal",
      "true"
    );
  } else {
    nachtRaidersWindow.removeAttribute(
      "aria-modal"
    );
  }

  document.body.classList.toggle(
    "nacht-raiders-window-open",
    (
      windowIsOpen &&
      normalizedMode ===
        NACHT_RAIDERS_WINDOW_MODE_FULL
    )
  );

  document.body.classList.toggle(
    "nacht-raiders-window-floating",
    (
      windowIsOpen &&
      floatingMode
    )
  );

  updateNachtRaidersWindowModeControls(
    normalizedMode
  );

  if (
    windowIsOpen &&
    options.prepareScreen !== false
  ) {
    prepareNachtRaidersWindowScreenForMode(
      normalizedMode
    );
  }

  if (
    normalizedMode ===
    NACHT_RAIDERS_WINDOW_MODE_FULL
  ) {
    if (
      typeof clearNachtRaidersFloatingWindowPosition ===
      "function"
    ) {
      clearNachtRaidersFloatingWindowPosition();
    }
  } else if (
    typeof positionNachtRaidersFloatingWindow ===
    "function"
  ) {
    positionNachtRaidersFloatingWindow(
      nachtRaidersState.window.position
    );
  }

  if (options.save !== false) {
    saveGame();
  }

  document.dispatchEvent(
    new CustomEvent(
      "nacht-raiders:window-mode-changed",
      {
        detail: {
          mode:
            normalizedMode,

          previousMode
        }
      }
    )
  );

  return true;
}

function setNachtRaidersWindowMode(
  mode
) {
  const changed =
    applyNachtRaidersWindowMode(
      mode,
      {
        save: true,
        prepareScreen: true
      }
    );

  if (!changed) {
    return false;
  }

  window.requestAnimationFrame(
    focusNachtRaidersWindowForMode
  );

  return true;
}

/* ==========================================================
   7. WINDOW MODE INPUT
========================================================== */

nachtRaidersCompactButton
  ?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      setNachtRaidersWindowMode(
        NACHT_RAIDERS_WINDOW_MODE_COMPACT
      );
    }
  );

nachtRaidersTerminalButton
  ?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      setNachtRaidersWindowMode(
        NACHT_RAIDERS_WINDOW_MODE_TERMINAL
      );
    }
  );

nachtRaidersFullButton
  ?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      setNachtRaidersWindowMode(
        NACHT_RAIDERS_WINDOW_MODE_FULL
      );
    }
  );
