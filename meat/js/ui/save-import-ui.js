/* ==========================================================
   1. SAVE IMPORT FILE INPUT
   ----------------------------------------------------------
   Creates the hidden file picker for encrypted and legacy saves.
========================================================== */

const importSaveFileInput = document.createElement("input");

importSaveFileInput.type = "file";
importSaveFileInput.accept =
  ".meat,.json,application/x-meat-save,application/json,application/octet-stream,text/plain";
importSaveFileInput.hidden = true;

document.body.appendChild(importSaveFileInput);

/* ==========================================================
   2. SAVE IMPORT INTERFACE STATE
========================================================== */

let pendingSaveImportAssessment = null;
let saveImportPreviouslyFocusedElement = null;
let saveImportFeedbackTimeout = null;
let saveImportCommitInProgress = false;

/* ==========================================================
   3. IMPORT BUTTON FEEDBACK
========================================================== */

function setImportSaveButtonText(
  message,
  restoreDefault = true
) {
  const importLabel = importSaveButton?.querySelector(
    "span:last-child"
  );

  if (!importLabel) {
    return;
  }

  importLabel.textContent = message;
  clearTimeout(saveImportFeedbackTimeout);

  if (!restoreDefault) {
    return;
  }

  saveImportFeedbackTimeout = setTimeout(
    () => {
      importLabel.textContent = "IMPORT SAVE";
    },
    1800
  );
}

/* ==========================================================
   4. DIALOG CONTENT
========================================================== */

function configureSaveImportDialog(assessment) {
  saveImportDialog.dataset.importStatus = assessment.status;
  confirmSaveImportButton.disabled = false;
  cancelSaveImportButton.disabled = false;

  if (assessment.status === SAVE_IMPORT_STATUS_TRUSTED) {
    saveImportStatus.textContent = "> SAVE VERIFIED";
    saveImportTitle.textContent = "IMPORT SAVE?";
    saveImportMessage.textContent =
      "This verified save will replace your current progress on this device.";
    cancelSaveImportButton.textContent = "CANCEL";
    confirmSaveImportButton.textContent = "IMPORT SAVE";
    confirmSaveImportButton.hidden = false;
    return;
  }

  if (assessment.status === SAVE_IMPORT_STATUS_UNTRUSTED) {
    saveImportStatus.textContent = "> SAVE UNVERIFIED";
    saveImportTitle.textContent = "UNTRUSTED SAVE";
    saveImportMessage.textContent =
      "This save cannot be verified. Importing it will permanently mark this game as modified and disable leaderboards, shared achievements and rewards, competitive events, and trusted save transfers. Only a full game reset, which deletes all progress, can restore trusted status.";
    cancelSaveImportButton.textContent = "CANCEL";
    confirmSaveImportButton.textContent = "IMPORT ANYWAY";
    confirmSaveImportButton.hidden = false;
    return;
  }

  saveImportStatus.textContent = "> IMPORT REJECTED";
  saveImportTitle.textContent = "IMPORT REJECTED";
  saveImportMessage.textContent =
    "This save is corrupted, altered, or unsupported. Your current progress was not changed.";
  cancelSaveImportButton.textContent = "CLOSE";
  confirmSaveImportButton.hidden = true;
}

/* ==========================================================
   5. DIALOG OPENING AND CLOSING
========================================================== */

function openSaveImportDialog(assessment) {
  pendingSaveImportAssessment = assessment;
  saveImportPreviouslyFocusedElement = document.activeElement;

  configureSaveImportDialog(assessment);

  saveImportOverlay.hidden = false;
  document.body.classList.add("save-import-dialog-open");

  cancelSaveImportButton.focus();
}

function closeSaveImportDialog() {
  if (saveImportCommitInProgress) {
    return;
  }

  saveImportOverlay.hidden = true;
  document.body.classList.remove("save-import-dialog-open");

  pendingSaveImportAssessment = null;

  if (saveImportPreviouslyFocusedElement instanceof HTMLElement) {
    saveImportPreviouslyFocusedElement.focus();
  }

  saveImportPreviouslyFocusedElement = null;
}

/* ==========================================================
   6. POST-IMPORT DISPLAY RESTORATION
========================================================== */

function refreshGameAfterSaveImport() {
  soundToggle.checked = gameState.settings.sound;

  if (animationToggle) {
    animationToggle.checked = gameState.settings.animations;
  }

  applyAnimationSetting();
  updateGameDisplay();
  restoreResponsiveLayout();
}

/* ==========================================================
   7. SELECTED FILE INSPECTION
========================================================== */

async function inspectSelectedSaveFile() {
  const selectedFile = importSaveFileInput.files?.[0];

  if (!selectedFile) {
    return;
  }

  importSaveButton.disabled = true;
  importSaveButton.setAttribute("aria-busy", "true");

  setImportSaveButtonText("CHECKING SAVE...", false);

  const assessment = await inspectSaveImport(selectedFile);

  importSaveButton.disabled = false;
  importSaveButton.removeAttribute("aria-busy");
  importSaveFileInput.value = "";

  setImportSaveButtonText(
    assessment.status === SAVE_IMPORT_STATUS_REJECTED
      ? "IMPORT REJECTED"
      : "SAVE CHECKED"
  );

  openSaveImportDialog(assessment);
}

/* ==========================================================
   8. CONFIRMED IMPORT
========================================================== */

function confirmPendingSaveImport() {
  if (
    !pendingSaveImportAssessment ||
    pendingSaveImportAssessment.status ===
      SAVE_IMPORT_STATUS_REJECTED ||
    saveImportCommitInProgress
  ) {
    return;
  }

  const completedAssessment =
    pendingSaveImportAssessment;

  const commitHandler =
    typeof completedAssessment
      .commitHandler === "function"
      ? completedAssessment
          .commitHandler
      : commitInspectedSaveImport;

  saveImportCommitInProgress = true;

  confirmSaveImportButton.disabled = true;
  cancelSaveImportButton.disabled = true;
  confirmSaveImportButton.textContent =
    "IMPORTING...";

  const importSucceeded =
    commitHandler(
      completedAssessment
    );

  saveImportCommitInProgress = false;

  if (!importSucceeded) {
    const rejectedAssessment =
      createRejectedSaveImportAssessment(
        new Error(
          "The inspected save could not be stored."
        )
      );

    pendingSaveImportAssessment =
      rejectedAssessment;

    configureSaveImportDialog(
      rejectedAssessment
    );

    setImportSaveButtonText(
      "IMPORT FAILED"
    );

    return;
  }

  closeSaveImportDialog();

  if (
    completedAssessment
      .reloadAfterCommit === true
  ) {
    window.setTimeout(
      () => {
        window.location.reload();
      },
      250
    );

    return;
  }

  refreshGameAfterSaveImport();
  setImportSaveButtonText(
    "SAVE IMPORTED"
  );
}

/* ==========================================================
   9. DIALOG FOCUS CONTROL
========================================================== */

function trapSaveImportDialogFocus(event) {
  if (
    event.key !== "Tab" ||
    saveImportOverlay.hidden
  ) {
    return;
  }

  const focusableElements = [
    cancelSaveImportButton,
    confirmSaveImportButton
  ].filter((element) => {
    return !element.hidden && !element.disabled;
  });

  if (focusableElements.length === 0) {
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[
    focusableElements.length - 1
  ];

  if (
    event.shiftKey &&
    document.activeElement === firstElement
  ) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (
    !event.shiftKey &&
    document.activeElement === lastElement
  ) {
    event.preventDefault();
    firstElement.focus();
  }
}

/* ==========================================================
   10. SAVE IMPORT EVENTS
========================================================== */

if (
  importSaveButton &&
  saveImportOverlay &&
  saveImportDialog &&
  saveImportStatus &&
  saveImportTitle &&
  saveImportMessage &&
  cancelSaveImportButton &&
  confirmSaveImportButton
) {
  importSaveButton.addEventListener(
    "click",
    () => {
      importSaveFileInput.value = "";
      importSaveFileInput.click();
    }
  );

  importSaveFileInput.addEventListener(
    "change",
    inspectSelectedSaveFile
  );

  cancelSaveImportButton.addEventListener(
    "click",
    closeSaveImportDialog
  );

  confirmSaveImportButton.addEventListener(
    "click",
    confirmPendingSaveImport
  );

  saveImportOverlay.addEventListener(
    "click",
    (event) => {
      if (event.target === saveImportOverlay) {
        closeSaveImportDialog();
      }
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (saveImportOverlay.hidden) {
        return;
      }

      if (event.key === "Escape") {
        closeSaveImportDialog();
        return;
      }

      trapSaveImportDialogFocus(event);
    }
  );
}
