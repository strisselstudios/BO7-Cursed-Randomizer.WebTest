/* ==========================================================
   1. MANUAL SAVE CONTROL
   ----------------------------------------------------------
   Saves the current game immediately and displays temporary
   confirmation directly on the Save Game button.
========================================================== */

const SAVE_BUTTON_DEFAULT_TEXT =
  "SAVE GAME";

const SAVE_BUTTON_SUCCESS_TEXT =
  "GAME SAVED";

const SAVE_BUTTON_FAILURE_TEXT =
  "SAVE FAILED";

const SAVE_BUTTON_FEEDBACK_DURATION_MS =
  1500;

let saveButtonFeedbackTimeout =
  null;

/* ==========================================================
   2. SAVE BUTTON FEEDBACK
========================================================== */

function setSaveButtonFeedback(
  message
) {
  if (!saveGameButtonLabel) {
    return;
  }

  saveGameButtonLabel.textContent =
    message;

  window.clearTimeout(
    saveButtonFeedbackTimeout
  );

  saveButtonFeedbackTimeout =
    window.setTimeout(
      () => {
        if (!saveGameButtonLabel) {
          return;
        }

        saveGameButtonLabel.textContent =
          SAVE_BUTTON_DEFAULT_TEXT;
      },
      SAVE_BUTTON_FEEDBACK_DURATION_MS
    );
}

/* ==========================================================
   3. MANUAL SAVE REQUEST
========================================================== */

function handleManualSaveRequest(
  event
) {
  event.preventDefault();
  event.stopPropagation();

  const saveSucceeded =
    typeof saveGame === "function" &&
    saveGame();

  setSaveButtonFeedback(
    saveSucceeded
      ? SAVE_BUTTON_SUCCESS_TEXT
      : SAVE_BUTTON_FAILURE_TEXT
  );
}

/* ==========================================================
   4. SAVE BUTTON INPUT
========================================================== */

saveGameButton
  ?.addEventListener(
    "click",
    handleManualSaveRequest
  );
