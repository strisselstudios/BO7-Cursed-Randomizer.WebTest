/* ==========================================================
   1. SAVE FAILURE PRESENTATION
   ----------------------------------------------------------
   Displays a persistent global warning whenever the latest save
   operation failed. A successful save clears the warning.
========================================================== */

const SAVE_FAILURE_BASE_MESSAGE =
  "Your current progress could not be stored. Do not clear browser data or close this page until saving succeeds.";

/* ==========================================================
   2. STATUS RENDERING
========================================================== */

function renderLocalSaveWriteStatus(
  status =
    getLocalSaveWriteStatus()
) {
  if (
    !saveFailureBanner ||
    !saveFailureMessage
  ) {
    return false;
  }

  const saveFailed =
    status?.status ===
    LOCAL_SAVE_WRITE_STATUS_FAILED;

  saveFailureBanner.hidden =
    !saveFailed;

  if (!saveFailed) {
    saveFailureMessage.textContent =
      "";

    return true;
  }

  const errorMessage =
    typeof status.errorMessage ===
      "string"
      ? status.errorMessage.trim()
      : "";

  saveFailureMessage.textContent =
    errorMessage
      ? `${SAVE_FAILURE_BASE_MESSAGE} Reason: ${errorMessage}`
      : SAVE_FAILURE_BASE_MESSAGE;

  return true;
}

/* ==========================================================
   3. STATUS EVENTS
========================================================== */

window.addEventListener(
  LOCAL_SAVE_WRITE_STATUS_EVENT,
  (event) => {
    renderLocalSaveWriteStatus(
      event.detail
    );
  }
);

renderLocalSaveWriteStatus();
