/* ==========================================================
   1. MENU DISPLAY
========================================================== */

function updateNachtRaidersMenu() {
  if (
    !nachtRaidersPrimaryButton ||
    !nachtRaidersPrimaryButtonLabel ||
    !nachtRaidersMenuStatus
  ) {
    return;
  }

  const nachtRaidersState =
    ensureNachtRaidersFeatureState();

  const hasStarted =
    nachtRaidersState.hasStarted;

  nachtRaidersPrimaryButtonLabel
    .textContent =
      hasStarted
        ? "CONTINUE"
        : "START";

  nachtRaidersPrimaryButton
    .setAttribute(
      "aria-label",
      hasStarted
        ? "Continue Nacht Raiders"
        : "Start Nacht Raiders"
    );

  nachtRaidersMenuStatus.textContent =
    hasStarted
      ? "FIELD RECORD DETECTED"
      : "NO FIELD RECORD DETECTED";
}

/* ==========================================================
   2. START OR CONTINUE
   ----------------------------------------------------------
   Gameplay is deliberately not started here yet.

   The button marks that Nacht Raiders has been entered and
   opens the prepared staging screen.
========================================================== */

function enterNachtRaidersGameStage() {
  if (
    typeof isNachtRaidersUnlocked ===
      "function" &&
    !isNachtRaidersUnlocked()
  ) {
    return false;
  }

  if (
    typeof isNachtRaidersWindowOpen !==
      "function" ||
    !isNachtRaidersWindowOpen()
  ) {
    return false;
  }

  const nachtRaidersState =
    ensureNachtRaidersFeatureState();

  const isFirstStart =
    !nachtRaidersState.hasStarted;

    if (isFirstStart) {
    nachtRaidersState.hasStarted = true;
    nachtRaidersState.status = NACHT_RAIDERS_STATUS_RUNNING;
    nachtRaidersState.expedition.seed = createNachtRaidersExpeditionSeed();
    nachtRaidersState.expedition.lastSimulationAt = Date.now();

    saveGame();
  }

  updateNachtRaidersMenu();

  const screenChanged =
    showNachtRaidersScreen(
      NACHT_RAIDERS_SCREEN_GAME
    );

  if (!screenChanged) {
    return false;
  }

  document.dispatchEvent(
    new CustomEvent(
      "nacht-raiders:game-stage-entered",
      {
        detail: {
          isFirstStart
        }
      }
    )
  );

  return true;
}

/* ==========================================================
   3. RETURN TO MENU
========================================================== */

function returnToNachtRaidersMenu() {
  const screenChanged =
    showNachtRaidersScreen(
      NACHT_RAIDERS_SCREEN_MENU
    );

  if (!screenChanged) {
    return false;
  }

  document.dispatchEvent(
    new CustomEvent(
      "nacht-raiders:menu-returned"
    )
  );

  return true;
}

/* ==========================================================
   4. EXIT TO MEAT.exe
========================================================== */

function exitNachtRaidersToMeatExe() {
  if (
    typeof closeNachtRaidersWindow !==
      "function"
  ) {
    return false;
  }

  return closeNachtRaidersWindow();
}

/* ==========================================================
   5. MENU INPUT
========================================================== */

nachtRaidersPrimaryButton
  ?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      enterNachtRaidersGameStage();
    }
  );

nachtRaidersExitButton
  ?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      exitNachtRaidersToMeatExe();
    }
  );

nachtRaidersGameBackButton
  ?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      returnToNachtRaidersMenu();
    }
  );

/* ==========================================================
   6. SCREEN-CHANGE INTEGRATION
========================================================== */

document.addEventListener(
  "nacht-raiders:screen-changed",
  (event) => {
    const screenName =
      event.detail?.screen;

    if (
      screenName ===
      NACHT_RAIDERS_SCREEN_MENU
    ) {
      updateNachtRaidersMenu();

      window.requestAnimationFrame(
        () => {
          nachtRaidersPrimaryButton
            ?.focus({
              preventScroll: true
            });
        }
      );

      return;
    }

    if (
      screenName ===
      NACHT_RAIDERS_SCREEN_GAME
    ) {
      window.requestAnimationFrame(
        () => {
          nachtRaidersGameBackButton
            ?.focus({
              preventScroll: true
            });
        }
      );
    }
  }
);

document.addEventListener(
  "nacht-raiders:opened",
  () => {
    updateNachtRaidersMenu();
  }
);
