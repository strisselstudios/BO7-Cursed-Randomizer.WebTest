/* ==========================================================
   1. GAME INITIALIZATION
   ----------------------------------------------------------
   Loads the save, rebuilds derived values, restores the
   interface, and starts the game in a valid state.
========================================================== */

loadGame();
initializeLocalSaveRecoveryUi();

initializeNachtRaidersSimulation();

calculateMeatPerSecond();

const initialOfflineProductionSummary =
  initializeOfflineProduction();

soundToggle.checked =
  gameState.settings.sound;

if (animationToggle) {
  animationToggle.checked =
    gameState.settings.animations;
}

/* ==========================================================
   ANIMATION SETTING
   ----------------------------------------------------------
   Applies the saved animation preference and immediately
   removes active effects when animations are disabled.
========================================================== */

function clearActiveAnimationEffects() {
  floatingTextLayer
    .querySelectorAll(
      ".floating-meat-text, .meat-particle"
    )
    .forEach((element) => {
      element.remove();
    });

  meatButton.classList.remove(
    "meat-held",
    "meat-release",
    "meat-settle"
  );

  meatView.classList.remove(
    "meat-screen-shake"
  );

  meatButton
    .parentElement
    .classList.remove("meat-interacting");

  resetMeatAura();
}


function applyAnimationSetting() {
  const animationsDisabled =
    !gameState.settings.animations;

  document.body.classList.toggle(
    "animations-disabled",
    animationsDisabled
  );

  if (animationsDisabled) {
    clearActiveAnimationEffects();
  }
}


applyAnimationSetting();


if (animationToggle) {
  animationToggle.addEventListener(
    "change",
    () => {
      gameState.settings.animations =
        animationToggle.checked;

      applyAnimationSetting();
      saveGame();
    }
  );
}


/* ==========================================================
   EXPORT SAVE BUTTON
   ----------------------------------------------------------
   Compresses and encrypts the current save, downloads the
   .meat file, and displays temporary result feedback.
========================================================== */

let exportSaveFeedbackTimeout = null;

function setExportSaveButtonText(
  message,
  restoreDefault = true
) {
  const exportLabel = exportSaveButton?.querySelector(
    "span:last-child"
  );

  if (!exportLabel) {
    return;
  }

  exportLabel.textContent = message;

  clearTimeout(
    exportSaveFeedbackTimeout
  );

  if (!restoreDefault) {
    return;
  }

  exportSaveFeedbackTimeout = setTimeout(
    () => {
      exportLabel.textContent = "EXPORT SAVE";
    },
    1800
  );
}

async function handleExportSaveRequest() {
  if (
    !exportSaveButton ||
    exportSaveButton.disabled
  ) {
    return;
  }

  exportSaveButton.disabled = true;
  exportSaveButton.setAttribute(
    "aria-busy",
    "true"
  );

  setExportSaveButtonText(
    "ENCRYPTING...",
    false
  );

  let exportSucceeded = false;

  try {
    exportSucceeded = await exportGameSave();
  } catch (error) {
    console.error(
      "MEAT.exe export request failed:",
      error
    );
  } finally {
    exportSaveButton.disabled = false;
    exportSaveButton.removeAttribute(
      "aria-busy"
    );
  }

  setExportSaveButtonText(
    exportSucceeded
      ? "SAVE EXPORTED"
      : "EXPORT FAILED"
  );
}

exportSaveButton?.addEventListener(
  "click",
  handleExportSaveRequest
);

/* ==========================================================
   RESET GAME CONTROLS
   ----------------------------------------------------------
   Opens the confirmation dialog and permanently resets the
   game only after explicit confirmation.
========================================================== */

let resetPreviouslyFocusedElement = null;


function openResetConfirmation() {
  resetPreviouslyFocusedElement =
    document.activeElement;

  resetConfirmationOverlay.hidden =
    false;

  document.body.classList.add(
    "reset-dialog-open"
  );

  cancelResetButton.focus();
}


function closeResetConfirmation() {
  resetConfirmationOverlay.hidden =
    true;

  document.body.classList.remove(
    "reset-dialog-open"
  );

  if (
    resetPreviouslyFocusedElement
      instanceof HTMLElement
  ) {
    resetPreviouslyFocusedElement.focus();
  }
}


function performPermanentReset() {
  const resetSucceeded =
    resetGameState();

  if (!resetSucceeded) {
    console.error(
      "The permanent reset failed."
    );

    return;
  }

  soundToggle.checked =
    gameState.settings.sound;

  if (animationToggle) {
    animationToggle.checked =
      gameState.settings.animations;
  }

  applyAnimationSetting();
  updateGameDisplay();
  restoreResponsiveLayout();

  closeResetConfirmation();
}


if (
  resetGameButton &&
  resetConfirmationOverlay &&
  cancelResetButton &&
  confirmResetButton
) {
  resetGameButton.addEventListener(
    "click",
    openResetConfirmation
  );

  cancelResetButton.addEventListener(
    "click",
    closeResetConfirmation
  );

  confirmResetButton.addEventListener(
    "click",
    performPermanentReset
  );

  resetConfirmationOverlay.addEventListener(
    "click",
    (event) => {
      if (
        event.target ===
        resetConfirmationOverlay
      ) {
        closeResetConfirmation();
      }
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        !resetConfirmationOverlay.hidden
      ) {
        closeResetConfirmation();
      }
    }
  );
}

/* ==========================================================
   2. DEVELOPER DEBUG MODE — REMOVE BEFORE LAUNCH
   ----------------------------------------------------------
   Exposes testing commands only when the page is opened with
   ?debug=1 at the end of the URL.
========================================================== */

const debugModeEnabled =
  new URLSearchParams(
    window.location.search
  ).get("debug") === "1";

if (debugModeEnabled) {

  function validateDebugAmount(value) {
    const amount = Number(value);

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      throw new Error(
        "Debug MEAT amount must be a valid non-negative number."
      );
    }

    return amount;
  }

  window.meatDebug = {

    set(amount) {
      const validatedAmount =
        validateDebugAmount(amount);

      gameState.meat =
        validatedAmount;

      gameState.totalMeat =
        Math.max(
          gameState.totalMeat,
          validatedAmount
        );

      updateGameDisplay();
      saveGame();

      console.log(
        `MEAT bank set to ${formatMeat(
          validatedAmount
        )}.`
      );
    },

    add(amount) {
      const validatedAmount =
        validateDebugAmount(amount);

      gameState.meat +=
        validatedAmount;

      gameState.totalMeat +=
        validatedAmount;

      updateGameDisplay();
      saveGame();

      console.log(
        `${formatMeat(
          validatedAmount
        )} MEAT added.`
      );
    },

        reset() {
      const resetSucceeded =
        resetGameState();

      if (!resetSucceeded) {
        console.error(
          "MEAT.exe debug reset failed."
        );

        return;
      }

      soundToggle.checked =
        gameState.settings.sound;

      if (animationToggle) {
        animationToggle.checked =
          gameState.settings.animations;
      }

      applyAnimationSetting();
      updateGameDisplay();

      console.log(
        "MEAT.exe save completely reset."
      );
    }

  };

  console.log(
    "MEAT.exe debug mode enabled. Use meatDebug.set(), meatDebug.add(), or meatDebug.reset()."
  );
}


/* ==========================================================
   3. INITIAL DISPLAY RESTORATION
   ----------------------------------------------------------
   Draws the loaded game state and confirms the correct
   responsive layout after every supporting script has loaded.
========================================================== */

updateGameDisplay();
restoreResponsiveLayout();

showOfflineProductionDialog(
  initialOfflineProductionSummary
);
