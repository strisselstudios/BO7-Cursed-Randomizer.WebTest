/* ==========================================================
   1. WINDOW MODE STATE
========================================================== */

let nachtRaidersLastFullScreenName = null;

/* ==========================================================
   1.1 FLOATING-MODE DISPLAY REQUIREMENTS
   ----------------------------------------------------------
   Compact and terminal modes are restricted to large landscape
   layouts. Portrait devices and short phone-landscape layouts
   always use the complete full-window interface.
========================================================== */

const nachtRaidersFloatingModeMediaQuery =
  window.matchMedia(
    "(orientation: landscape) and (min-width: 900px) and (min-height: 540px)"
  );

function canUseNachtRaidersFloatingWindowModes() {
  return nachtRaidersFloatingModeMediaQuery.matches;
}

function resolveNachtRaidersAvailableWindowMode(
  mode
) {
  const normalizedMode =
    normalizeNachtRaidersWindowMode(
      mode
    );

  if (
    isNachtRaidersFloatingWindowMode(
      normalizedMode
    ) &&
    !canUseNachtRaidersFloatingWindowModes()
  ) {
    return NACHT_RAIDERS_WINDOW_MODE_FULL;
  }

  return normalizedMode;
}

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

    return resolveNachtRaidersAvailableWindowMode(
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
     const floatingModesAvailable =
    canUseNachtRaidersFloatingWindowModes();
   
   if (nachtRaidersCompactButton) {
    nachtRaidersCompactButton.hidden =
      !floatingModesAvailable ||
      mode ===
        NACHT_RAIDERS_WINDOW_MODE_COMPACT;
  }

  if (nachtRaidersTerminalButton) {
    nachtRaidersTerminalButton.hidden =
      !floatingModesAvailable ||
      mode ===
        NACHT_RAIDERS_WINDOW_MODE_TERMINAL;
  }
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
   5.1 MODE-SPECIFIC MONITOR DISPLAY
========================================================== */

function updateNachtRaidersModeSpecificDisplays(
  mode
) {
  const compactMode =
    mode ===
    NACHT_RAIDERS_WINDOW_MODE_COMPACT;

  const terminalMode =
    mode ===
    NACHT_RAIDERS_WINDOW_MODE_TERMINAL;

  nachtRaidersCompactHud?.setAttribute(
    "aria-hidden",
    String(!compactMode)
  );

  nachtRaidersCompactFooter?.setAttribute(
    "aria-hidden",
    String(!compactMode)
  );

  if (nachtRaidersTerminalMonitor) {
    nachtRaidersTerminalMonitor.hidden =
      !terminalMode;

    nachtRaidersTerminalMonitor.setAttribute(
      "aria-hidden",
      String(!terminalMode)
    );
  }

  if (
    compactMode &&
    typeof renderNachtRaidersCompactMonitorState ===
      "function"
  ) {
    renderNachtRaidersCompactMonitorState();
  }

  if (
    terminalMode &&
    typeof renderNachtRaidersTerminalMonitor ===
      "function"
  ) {
    renderNachtRaidersTerminalMonitor();
  }
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
    resolveNachtRaidersAvailableWindowMode(
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
    options.refreshDisplays !== false
  ) {
    updateNachtRaidersModeSpecificDisplays(
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
   7. WINDOW MODE AVAILABILITY
========================================================== */

function enforceNachtRaidersWindowModeAvailability() {
  const renderedMode =
    normalizeNachtRaidersWindowMode(
      nachtRaidersWindow
        ?.dataset
        .windowMode ||
      ensureNachtRaidersFeatureState()
        .window
        .mode
    );

  if (
    !canUseNachtRaidersFloatingWindowModes() &&
    isNachtRaidersFloatingWindowMode(
      renderedMode
    )
  ) {
    applyNachtRaidersWindowMode(
      NACHT_RAIDERS_WINDOW_MODE_FULL,
      {
        save: true,
        prepareScreen: true,
        refreshDisplays: true
      }
    );

    return true;
  }

  updateNachtRaidersWindowModeControls(
    getNachtRaidersWindowMode()
  );

  return false;
}

nachtRaidersFloatingModeMediaQuery
  .addEventListener(
    "change",
    enforceNachtRaidersWindowModeAvailability
  );

window.addEventListener(
  "orientationchange",
  () => {
    window.requestAnimationFrame(
      enforceNachtRaidersWindowModeAvailability
    );
  }
);

window.visualViewport
  ?.addEventListener(
    "resize",
    () => {
      window.requestAnimationFrame(
        enforceNachtRaidersWindowModeAvailability
      );
    }
  );
/* ==========================================================
   8. WINDOW MODE INPUT
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
