/* ==========================================================
   1. LOCAL SAVE RECOVERY INTERFACE STATE
========================================================== */

let localSaveRecoveryPreviouslyFocusedElement = null;

/* ==========================================================
   2. RECOVERY MESSAGE CONFIGURATION
========================================================== */

function configureLocalSaveRecoveryDialog() {
  const loadResult = getLocalSaveLoadResult();

  if (
    loadResult.backupStorage ===
    LOCAL_SAVE_BACKUP_STORAGE_PERSISTENT
  ) {
    localSaveRecoveryMessage.textContent =
      "Your stored save failed safety checks. The original data was quarantined and a new game was started. A recovery backup remains stored on this device. Download it before a full reset if you want it examined. The new game remains trusted.";
  } else {
    localSaveRecoveryMessage.textContent =
      "Your stored save failed safety checks. The original data is available only until this page closes or reloads. Download it now. A new trusted game was started.";
  }

  downloadLocalSaveBackupButton.hidden =
    !loadResult.backupAvailable;

  downloadLocalSaveBackupButton.textContent =
    "DOWNLOAD BACKUP";
}

/* ==========================================================
   3. RECOVERY DIALOG OPENING AND CLOSING
========================================================== */

function openLocalSaveRecoveryDialog() {
  const loadResult = getLocalSaveLoadResult();

  if (
    loadResult.status !==
    LOCAL_SAVE_LOAD_STATUS_RECOVERED
  ) {
    return false;
  }

  configureLocalSaveRecoveryDialog();

  localSaveRecoveryPreviouslyFocusedElement =
    document.activeElement;

  localSaveRecoveryOverlay.hidden = false;
  document.body.classList.add(
    "save-import-dialog-open"
  );

  if (!downloadLocalSaveBackupButton.hidden) {
    downloadLocalSaveBackupButton.focus();
  } else {
    continueLocalSaveRecoveryButton.focus();
  }

  return true;
}

function closeLocalSaveRecoveryDialog() {
  localSaveRecoveryOverlay.hidden = true;

  document.body.classList.remove(
    "save-import-dialog-open"
  );

  if (
    localSaveRecoveryPreviouslyFocusedElement
    instanceof HTMLElement
  ) {
    localSaveRecoveryPreviouslyFocusedElement.focus();
  }

  localSaveRecoveryPreviouslyFocusedElement = null;
}

/* ==========================================================
   4. RECOVERY BACKUP DOWNLOAD
========================================================== */

function handleLocalSaveBackupDownload() {
  const downloadSucceeded =
    downloadInvalidLocalSaveBackup();

  downloadLocalSaveBackupButton.textContent =
    downloadSucceeded
      ? "BACKUP DOWNLOADED"
      : "DOWNLOAD FAILED";
}

/* ==========================================================
   5. RECOVERY DIALOG FOCUS CONTROL
========================================================== */

function trapLocalSaveRecoveryFocus(event) {
  if (
    event.key !== "Tab" ||
    localSaveRecoveryOverlay.hidden
  ) {
    return;
  }

  const focusableElements = [
    downloadLocalSaveBackupButton,
    continueLocalSaveRecoveryButton
  ].filter((element) => {
    return !element.hidden && !element.disabled;
  });

  if (focusableElements.length === 0) {
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement =
    focusableElements[
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
   6. RECOVERY INTERFACE INITIALIZATION
========================================================== */

function initializeLocalSaveRecoveryUi() {
  if (
    !localSaveRecoveryOverlay ||
    !localSaveRecoveryDialog ||
    !localSaveRecoveryMessage ||
    !downloadLocalSaveBackupButton ||
    !continueLocalSaveRecoveryButton
  ) {
    return false;
  }

  downloadLocalSaveBackupButton.addEventListener(
    "click",
    handleLocalSaveBackupDownload
  );

  continueLocalSaveRecoveryButton.addEventListener(
    "click",
    closeLocalSaveRecoveryDialog
  );

  document.addEventListener(
    "keydown",
    trapLocalSaveRecoveryFocus
  );

  return openLocalSaveRecoveryDialog();
}
