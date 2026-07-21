/* ==========================================================
   SAVE TRANSFER INTERFACE
   ----------------------------------------------------------
   Controls the transfer dialog, code countdown, save preview,
   confirmation, and final page reload.
========================================================== */

let transferCountdownInterval = null;
let previewedTransferCode = "";

/* ==========================================================
   DIALOG HELPERS
========================================================== */

function openSaveTransferDialog(mode) {
  clearTransferCountdown();

  generatedTransferCode.textContent =
    "-------";

  transferCountdown.textContent = "";
  transferCreateStatus.textContent = "";
  transferReceiveStatus.textContent = "";

  transferPreview.hidden = true;
  confirmTransferButton.disabled = false;

  previewedTransferCode = "";

  if (mode === "create") {
    transferDialogTitle.textContent =
      "CREATE SAVE TRANSFER";

    transferCreatePanel.hidden = false;
    transferReceivePanel.hidden = true;
  } else {
    transferDialogTitle.textContent =
      "RECEIVE SAVE TRANSFER";

    transferCreatePanel.hidden = true;
    transferReceivePanel.hidden = false;

    transferCodeInput.value = "";
  }

  if (!saveTransferDialog.open) {
    saveTransferDialog.showModal();
  }

  if (mode === "receive") {
    transferCodeInput.focus();
  }
}

function closeSaveTransferDialog() {
  clearTransferCountdown();

  if (saveTransferDialog.open) {
    saveTransferDialog.close();
  }
}

/* ==========================================================
   COUNTDOWN
========================================================== */

function startTransferCountdown(expiresAt) {
  clearTransferCountdown();

  function updateCountdown() {
    const remainingMilliseconds =
      Date.parse(expiresAt) - Date.now();

    if (remainingMilliseconds <= 0) {
      transferCountdown.textContent =
        "TRANSFER EXPIRED";

      clearTransferCountdown();
      return;
    }

    const remainingSeconds =
      Math.ceil(
        remainingMilliseconds / 1000
      );

    const minutes =
      Math.floor(
        remainingSeconds / 60
      );

    const seconds =
      remainingSeconds % 60;

    transferCountdown.textContent =
      `EXPIRES IN ${minutes}:` +
      String(seconds).padStart(2, "0");
  }

  updateCountdown();

  transferCountdownInterval =
    window.setInterval(
      updateCountdown,
      1000
    );
}

function clearTransferCountdown() {
  if (transferCountdownInterval !== null) {
    window.clearInterval(
      transferCountdownInterval
    );

    transferCountdownInterval = null;
  }
}

/* ==========================================================
   PREVIEW FORMATTING
========================================================== */

function formatTransferPreviewNumber(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0";
  }

  return numericValue.toLocaleString(
    undefined,
    {
      maximumFractionDigits: 3
    }
  );
}

function formatTransferPreviewDate(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

/* ==========================================================
   INPUT FILTERING
========================================================== */

transferCodeInput.addEventListener(
  "input",
  () => {
    transferCodeInput.value =
      normalizeTransferCode(
        transferCodeInput.value
      );

    transferPreview.hidden = true;
    previewedTransferCode = "";
  }
);

/* ==========================================================
   CREATE TRANSFER
========================================================== */

createTransferButton.addEventListener(
  "click",
  async () => {
    openSaveTransferDialog("create");

    createTransferButton.disabled = true;

    transferCreateStatus.textContent =
      "CREATING TRANSFER...";

    try {
      const transfer =
        await createSaveTransfer();

      generatedTransferCode.textContent =
        transfer.code;

      transferCreateStatus.textContent =
        "CODE READY";

      startTransferCountdown(
        transfer.expiresAt
      );
    } catch (error) {
      transferCreateStatus.textContent =
        error.message;
    } finally {
      createTransferButton.disabled = false;
    }
  }
);

/* ==========================================================
   OPEN RECEIVE DIALOG
========================================================== */

receiveTransferButton.addEventListener(
  "click",
  () => {
    openSaveTransferDialog("receive");
  }
);

/* ==========================================================
   CHECK TRANSFER CODE
========================================================== */

checkTransferCodeButton.addEventListener(
  "click",
  async () => {
    const code = normalizeTransferCode(
      transferCodeInput.value
    );

    transferReceiveStatus.textContent =
      "CHECKING TRANSFER...";

    transferPreview.hidden = true;
    previewedTransferCode = "";

    checkTransferCodeButton.disabled = true;

    try {
      const metadata =
        await previewSaveTransfer(code);

      const summary =
        metadata.summary || {};

      transferPreviewMeat.textContent =
        formatTransferPreviewNumber(
          summary.meat
        );

      transferPreviewLifetimeMeat.textContent =
        formatTransferPreviewNumber(
          summary.totalMeat
        );

      transferPreviewClicks.textContent =
        formatTransferPreviewNumber(
          summary.totalClicks
        );

      transferPreviewProducers.textContent =
        formatTransferPreviewNumber(
          summary.producersOwned
        );

      transferPreviewDate.textContent =
        formatTransferPreviewDate(
          summary.lastSavedAt
        );

      previewedTransferCode = code;

      transferPreview.hidden = false;

      transferReceiveStatus.textContent =
        "TRANSFER FOUND";
    } catch (error) {
      transferReceiveStatus.textContent =
        error.message;
    } finally {
      checkTransferCodeButton.disabled =
        false;
    }
  }
);

/* ==========================================================
   CLAIM AND APPLY TRANSFER
========================================================== */

confirmTransferButton.addEventListener(
  "click",
  async () => {
    if (!previewedTransferCode) {
      transferReceiveStatus.textContent =
        "CHECK THE TRANSFER CODE FIRST";

      return;
    }

    confirmTransferButton.disabled = true;

    transferReceiveStatus.textContent =
      "RECEIVING SAVE...";

    try {
      const transferPackage =
        await claimSaveTransfer(
          previewedTransferCode
        );

      applyTransferredSave(
        transferPackage
      );

      transferReceiveStatus.textContent =
        "TRANSFER COMPLETE";

      window.setTimeout(
        () => {
          window.location.reload();
        },
        500
      );
    } catch (error) {
      transferReceiveStatus.textContent =
        error.message;

      confirmTransferButton.disabled =
        false;
    }
  }
);

/* ==========================================================
   CLOSE DIALOG
========================================================== */

closeSaveTransferDialogButton.addEventListener(
  "click",
  closeSaveTransferDialog
);

saveTransferDialog.addEventListener(
  "cancel",
  () => {
    clearTransferCountdown();
  }
);

saveTransferDialog.addEventListener(
  "click",
  (event) => {
    if (event.target === saveTransferDialog) {
      closeSaveTransferDialog();
    }
  }
);

/* ==========================================================
   ENTER KEY
========================================================== */

transferCodeInput.addEventListener(
  "keydown",
  (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    checkTransferCodeButton.click();
  }
);
