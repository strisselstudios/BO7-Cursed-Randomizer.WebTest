/* ==========================================================
   1. MANUAL SAVE CONTROL
   ----------------------------------------------------------
   Saves the current game immediately and displays temporary
   confirmation directly on the Save Game button.
========================================================== */

const SAVE_BUTTON_DEFAULT_TEXT = "SAVE GAME";
const SAVE_BUTTON_SUCCESS_TEXT = "GAME SAVED";
const SAVE_BUTTON_FAILURE_TEXT = "SAVE FAILED";

let saveButtonFeedbackTimeout = null;


function setSaveButtonFeedback(message) {
  const buttonLabel =
    saveGameButton?.querySelector(
      "span:last-child"
    );

  if (!buttonLabel) {
    return;
  }

  buttonLabel.textContent = message;

  clearTimeout(saveButtonFeedbackTimeout);

  saveButtonFeedbackTimeout = setTimeout(() => {
    buttonLabel.textContent =
      SAVE_BUTTON_DEFAULT_TEXT;
  }, 1500);
}


if (saveGameButton) {
  saveGameButton.addEventListener(
    "click",
    () => {
      const saveSucceeded = saveGame();

      setSaveButtonFeedback(
        saveSucceeded
          ? SAVE_BUTTON_SUCCESS_TEXT
          : SAVE_BUTTON_FAILURE_TEXT
      );
    }
  );
}
