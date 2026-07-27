/* ==========================================================
   1. SAVE TRANSFER CONFIGURATION
   ----------------------------------------------------------
   Defines the Worker endpoint, local recovery backup key, and
   accepted transfer-code format.
========================================================== */

const MEAT_TRANSFER_API_BASE =
  "https://meat-save-transfer.dopefishlivesagain.workers.dev";

const MEAT_TRANSFER_BACKUP_KEY =
  `${MEAT_SAVE_KEY}:pre-transfer-backup`;

const MEAT_TRANSFER_CODE_PATTERN =
  /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{7}$/;

/* ==========================================================
   2. TRUSTED TRANSFER CREATION GATE
   ----------------------------------------------------------
   Rechecks the active save before allowing it to create a
   transfer intended for trusted use on another device.
========================================================== */

function prepareCurrentSaveForTransfer() {
  validateGameStateStructure(gameState);

  const impossibleStateReasons =
    inspectGameStateForImpossibleProgress(gameState);

  if (impossibleStateReasons.length > 0) {
    mergeSaveTrustState(
      gameState,
      gameState,
      impossibleStateReasons
    );
  }

  if (!saveGame()) {
    throw new Error(
      "The current save could not be prepared."
    );
  }

  if (!canUseTrustedSaveFeatures()) {
    throw new Error(
      "Modified saves cannot create trusted save transfers. Only a full game reset, which deletes all progress, can restore trusted status."
    );
  }

  return true;
}

/* ==========================================================
   3. TRANSFER PACKAGE CREATION
========================================================== */

function createTransferSavePackage() {
  prepareCurrentSaveForTransfer();

  return {
    game: "MEAT.exe",
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    saveData: JSON.parse(
      JSON.stringify(gameState)
    )
  };
}

/* ==========================================================
   4. TRANSFER PACKAGE VALIDATION
========================================================== */

function validateTransferSavePackage(
  transferPackage
) {
  requirePlainSaveObject(
    transferPackage,
    "The received transfer package"
  );

  validateSaveDataSafety(
    transferPackage,
    "transferPackage"
  );

  rejectUnknownObjectKeys(
    transferPackage,
    [
      "game",
      "exportVersion",
      "exportedAt",
      "saveData"
    ],
    "The received transfer package"
  );

  if (transferPackage.game !== "MEAT.exe") {
    throw new Error(
      "The received transfer is not a MEAT.exe save."
    );
  }

  if (transferPackage.exportVersion !== 1) {
    throw new Error(
      "The received transfer version is not supported."
    );
  }

  requireSaveString(
    transferPackage.exportedAt,
    "The transfer creation date",
    {
      allowUndefined: false,
      maximumLength: 64
    }
  );

  if (
    Number.isNaN(
      Date.parse(
        transferPackage.exportedAt
      )
    )
  ) {
    throw new Error(
      "The transfer creation date is invalid."
    );
  }

  validateGameStateStructure(
    transferPackage.saveData
  );

  return true;
}

/* ==========================================================
   5. TRANSFER CODE NORMALIZATION
========================================================== */

function normalizeTransferCode(value) {
  return String(value || "")
    .toUpperCase()
    .replace(
      /[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g,
      ""
    )
    .slice(0, 7);
}

function requireValidTransferCode(code) {
  const normalizedCode =
    normalizeTransferCode(code);

  if (
    !MEAT_TRANSFER_CODE_PATTERN.test(
      normalizedCode
    )
  ) {
    throw new Error(
      "Enter a valid seven-character transfer code."
    );
  }

  return normalizedCode;
}

/* ==========================================================
   6. TRANSFER API REQUEST
========================================================== */

async function requestSaveTransfer(
  path,
  options = {}
) {
  let response;

  try {
    response = await fetch(
      `${MEAT_TRANSFER_API_BASE}${path}`,
      {
        cache: "no-store",
        ...options
      }
    );
  } catch (error) {
    throw new Error(
      "The transfer server could not be reached."
    );
  }

  let responseData;

  try {
    responseData =
      await response.json();
  } catch (error) {
    throw new Error(
      "The transfer server returned an invalid response."
    );
  }

  if (!response.ok) {
    throw new Error(
      responseData.error ||
      "The transfer request failed."
    );
  }

  return responseData;
}

/* ==========================================================
   7. CREATE SAVE TRANSFER
========================================================== */

async function createSaveTransfer() {
  const transferPackage =
    createTransferSavePackage();

  return requestSaveTransfer(
    "/transfer",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify(
        transferPackage
      )
    }
  );
}

/* ==========================================================
   8. PREVIEW SAVE TRANSFER
========================================================== */

async function previewSaveTransfer(code) {
  const normalizedCode =
    requireValidTransferCode(code);

  return requestSaveTransfer(
    `/transfer/${normalizedCode}/meta`,
    {
      method: "GET"
    }
  );
}

/* ==========================================================
   9. CLAIM SAVE TRANSFER
   ----------------------------------------------------------
   Claims the one-use package and validates its outer structure
   before it can reach trust classification or active state.
========================================================== */

async function claimSaveTransfer(code) {
  const normalizedCode =
    requireValidTransferCode(code);

  const responseData =
    await requestSaveTransfer(
      `/transfer/${normalizedCode}/claim`,
      {
        method: "POST"
      }
    );

  validateTransferSavePackage(
    responseData.transfer
  );

  return responseData.transfer;
}

/* ==========================================================
   10. TRANSFER TRUST ASSESSMENT
   ----------------------------------------------------------
   Converts a claimed transfer into the same trusted, untrusted,
   or rejected assessment used by file imports.
========================================================== */

function inspectTransferredSavePackage(
  transferPackage
) {
  try {
    validateTransferSavePackage(
      transferPackage
    );

    const importedState =
      transferPackage.saveData;

    const trustReasons =
      collectSaveImportTrustReasons(
        importedState
      );

    return {
      status:
        trustReasons.length > 0
          ? SAVE_IMPORT_STATUS_UNTRUSTED
          : SAVE_IMPORT_STATUS_TRUSTED,
      sourceFormat: "save-transfer",
      importPackage: transferPackage,
      importedState,
      trustReasons,
      errorMessage: "",
      commitHandler:
        commitInspectedTransferSave,
      reloadAfterCommit: true
    };
  } catch (error) {
    console.error(
      "MEAT.exe transferred save inspection failed:",
      error
    );

    const assessment =
      createRejectedSaveImportAssessment(
        error
      );

    assessment.sourceFormat =
      "save-transfer";

    return assessment;
  }
}

/* ==========================================================
   11. PRE-TRANSFER BACKUP RESTORATION
========================================================== */

function restorePreviousTransferBackup(
  previousBackup
) {
  if (previousBackup === null) {
    localStorage.removeItem(
      MEAT_TRANSFER_BACKUP_KEY
    );

    return;
  }

  localStorage.setItem(
    MEAT_TRANSFER_BACKUP_KEY,
    previousBackup
  );
}

/* ==========================================================
   12. INSPECTED TRANSFER COMMITMENT
   ----------------------------------------------------------
   Preserves the receiving device's current save before using
   the central inspected-import commitment pathway.
========================================================== */

function commitInspectedTransferSave(
  assessment
) {
  if (
    assessment?.sourceFormat !==
    "save-transfer"
  ) {
    return false;
  }

  const currentSave =
    localStorage.getItem(
      MEAT_SAVE_KEY
    );

  const previousTransferBackup =
    localStorage.getItem(
      MEAT_TRANSFER_BACKUP_KEY
    );

  try {
    if (currentSave !== null) {
      localStorage.setItem(
        MEAT_TRANSFER_BACKUP_KEY,
        currentSave
      );
    }

    const importSucceeded =
      commitInspectedSaveImport(
        assessment
      );

    if (!importSucceeded) {
      throw new Error(
        "The transferred save could not be stored."
      );
    }

    return true;
  } catch (error) {
    try {
      restorePreviousTransferBackup(
        previousTransferBackup
      );
    } catch (backupError) {
      console.error(
        "MEAT.exe could not restore the previous transfer backup:",
        backupError
      );
    }

    console.error(
      "MEAT.exe inspected transfer could not be applied:",
      error
    );

    return false;
  }
}
