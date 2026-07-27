/* ==========================================================
   1. SAVE TRANSFER CONFIGURATION
   ----------------------------------------------------------
   Defines the Worker endpoint, version-2 transport format,
   local recovery backup key, and accepted transfer codes.
========================================================== */

const MEAT_TRANSFER_API_BASE =
  "https://meat-save-transfer.dopefishlivesagain.workers.dev";

const MEAT_TRANSFER_VERSION = 2;

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
   3. COMPRESSED TRANSFER REQUEST CREATION
   ----------------------------------------------------------
   Freezes one save snapshot, compresses it, and sends only the
   compact payload. Preview metadata is rebuilt by the Worker.
========================================================== */

async function createTransferSavePackage() {
  prepareCurrentSaveForTransfer();

  const exportPackage =
    createSaveExportPackage();

  const compressedPayload =
    await createCompressedSaveTransferPayload(
      exportPackage
    );

  return {
    game: "MEAT.exe",
    transferVersion:
      MEAT_TRANSFER_VERSION,
    compressedPayload
  };
}

/* ==========================================================
   4. SERVER-VERIFIED TRANSFER VALIDATION
   ----------------------------------------------------------
   Validates Worker responses, preview summaries, compressed
   claim envelopes, and the decoded save before trust assessment.
========================================================== */

function validateTransferDateString(
  value,
  label
) {
  requireSaveString(
    value,
    label,
    {
      allowUndefined: false,
      maximumLength: 64
    }
  );

  if (
    Number.isNaN(
      Date.parse(value)
    )
  ) {
    throw new Error(
      `${label} is invalid.`
    );
  }
}

function validateTransferSummary(
  summary
) {
  requirePlainSaveObject(
    summary,
    "The transfer summary"
  );

  rejectUnknownObjectKeys(
    summary,
    [
      "meat",
      "totalMeat",
      "totalClicks",
      "producersOwned",
      "lastSavedAt"
    ],
    "The transfer summary"
  );

  requireSaveNumber(
    summary.meat,
    "The transfer current-MEAT summary",
    {
      allowUndefined: false
    }
  );

  requireSaveNumber(
    summary.totalMeat,
    "The transfer lifetime-MEAT summary",
    {
      allowUndefined: false
    }
  );

  requireSaveNumber(
    summary.totalClicks,
    "The transfer click summary",
    {
      allowUndefined: false,
      integer: true,
      maximum:
        Number.MAX_SAFE_INTEGER
    }
  );

  requireSaveNumber(
    summary.producersOwned,
    "The transfer producer summary",
    {
      allowUndefined: false,
      integer: true,
      maximum:
        Number.MAX_SAFE_INTEGER
    }
  );

  requireSaveNumber(
    summary.lastSavedAt,
    "The transfer save-date summary",
    {
      allowUndefined: false,
      integer: true,
      maximum:
        Number.MAX_SAFE_INTEGER
    }
  );

  return true;
}

function calculateTransferProducerCount(
  saveState
) {
  const totalOwned = producerOrder.reduce(
    (
      runningTotal,
      producerKey
    ) => {
      const nextTotal =
        runningTotal +
        Number(
          saveState.producers?.[
            producerKey
          ] || 0
        );

      if (!Number.isSafeInteger(nextTotal)) {
        throw new Error(
          "The transferred producer total is invalid."
        );
      }

      return nextTotal;
    },
    0
  );

  return totalOwned;
}

function validateTransferSummaryMatchesSave(
  summary,
  saveState
) {
  const expectedSummary = {
    meat:
      saveState.meat,
    totalMeat:
      saveState.totalMeat,
    totalClicks:
      saveState.totalClicks,
    producersOwned:
      calculateTransferProducerCount(
        saveState
      ),
    lastSavedAt:
      saveState.lastSavedAt
  };

  Object.keys(
    expectedSummary
  ).forEach(
    (propertyName) => {
      if (
        summary[propertyName] !==
        expectedSummary[propertyName]
      ) {
        throw new Error(
          `The transfer ${propertyName} summary does not match the transferred save.`
        );
      }
    }
  );

  return true;
}

function validateTransferCreationResponse(
  transfer
) {
  requirePlainSaveObject(
    transfer,
    "The transfer creation response"
  );

  rejectUnknownObjectKeys(
    transfer,
    [
      "code",
      "transferVersion",
      "serverVerified",
      "expiresAt"
    ],
    "The transfer creation response"
  );

  requireValidTransferCode(
    transfer.code
  );

  if (
    transfer.transferVersion !==
      MEAT_TRANSFER_VERSION ||
    transfer.serverVerified !== true
  ) {
    throw new Error(
      "The transfer server did not verify the created transfer."
    );
  }

  validateTransferDateString(
    transfer.expiresAt,
    "The transfer expiration date"
  );

  return true;
}

function validateTransferMetadata(
  metadata
) {
  requirePlainSaveObject(
    metadata,
    "The transfer metadata"
  );

  rejectUnknownObjectKeys(
    metadata,
    [
      "code",
      "transferVersion",
      "serverVerified",
      "createdAt",
      "expiresAt",
      "summary"
    ],
    "The transfer metadata"
  );

  requireValidTransferCode(
    metadata.code
  );

  if (
    metadata.transferVersion !==
      MEAT_TRANSFER_VERSION ||
    metadata.serverVerified !== true
  ) {
    throw new Error(
      "The transfer metadata failed server verification."
    );
  }

  validateTransferDateString(
    metadata.createdAt,
    "The transfer creation date"
  );

  validateTransferDateString(
    metadata.expiresAt,
    "The transfer expiration date"
  );

  validateTransferSummary(
    metadata.summary
  );

  return true;
}

function validateClaimedTransferEnvelope(
  transfer
) {
  requirePlainSaveObject(
    transfer,
    "The claimed transfer"
  );

  rejectUnknownObjectKeys(
    transfer,
    [
      "game",
      "transferVersion",
      "serverVerified",
      "createdAt",
      "expiresAt",
      "summary",
      "compressedPayload"
    ],
    "The claimed transfer"
  );

  if (
    transfer.game !== "MEAT.exe" ||
    transfer.transferVersion !==
      MEAT_TRANSFER_VERSION ||
    transfer.serverVerified !== true
  ) {
    throw new Error(
      "The claimed transfer failed server verification."
    );
  }

  validateTransferDateString(
    transfer.createdAt,
    "The claimed transfer creation date"
  );

  validateTransferDateString(
    transfer.expiresAt,
    "The claimed transfer expiration date"
  );

  validateTransferSummary(
    transfer.summary
  );

  requireSaveString(
    transfer.compressedPayload,
    "The claimed compressed payload",
    {
      allowUndefined: false,
      maximumLength:
        Math.ceil(
          MAX_TRANSFER_COMPRESSED_BYTES *
          4 /
          3
        ) + 64
    }
  );

  if (
    !transfer.compressedPayload
      .startsWith(
        SAVE_TRANSFER_PAYLOAD_MAGIC
      )
  ) {
    throw new Error(
      "The claimed compressed payload is invalid."
    );
  }

  return true;
}

function validateTransferredExportPackage(
  exportPackage
) {
  requirePlainSaveObject(
    exportPackage,
    "The transferred export package"
  );

  validateSaveDataSafety(
    exportPackage,
    "transferExportPackage"
  );

  rejectUnknownObjectKeys(
    exportPackage,
    [
      "game",
      "exportVersion",
      "saveIntegrityVersion",
      "exportedAt",
      "saveData"
    ],
    "The transferred export package"
  );

  if (
    exportPackage.game !==
      "MEAT.exe" ||
    exportPackage.exportVersion !==
      SAVE_EXPORT_VERSION ||
    exportPackage
      .saveIntegrityVersion !==
      CURRENT_SAVE_INTEGRITY_VERSION
  ) {
    throw new Error(
      "The transferred export format is unsupported."
    );
  }

  requireSaveNumber(
    exportPackage.exportedAt,
    "The transferred export timestamp",
    {
      allowUndefined: false,
      integer: true,
      maximum:
        Number.MAX_SAFE_INTEGER
    }
  );

  validateGameStateStructure(
    exportPackage.saveData
  );

  return true;
}

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
      "transferVersion",
      "serverVerified",
      "createdAt",
      "expiresAt",
      "summary",
      "saveData"
    ],
    "The received transfer package"
  );

  if (
    transferPackage.game !==
      "MEAT.exe" ||
    transferPackage.transferVersion !==
      MEAT_TRANSFER_VERSION ||
    transferPackage.serverVerified !==
      true
  ) {
    throw new Error(
      "The received transfer is not server-verified MEAT.exe data."
    );
  }

  validateTransferDateString(
    transferPackage.createdAt,
    "The received transfer creation date"
  );

  validateTransferDateString(
    transferPackage.expiresAt,
    "The received transfer expiration date"
  );

  validateTransferSummary(
    transferPackage.summary
  );

  validateGameStateStructure(
    transferPackage.saveData
  );

  validateTransferSummaryMatchesSave(
    transferPackage.summary,
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
    await createTransferSavePackage();

  const responseData =
    await requestSaveTransfer(
      "/transfer",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body:
          JSON.stringify(
            transferPackage
          )
      }
    );

  validateTransferCreationResponse(
    responseData
  );

  return responseData;
}

/* ==========================================================
   8. PREVIEW SAVE TRANSFER
========================================================== */

async function previewSaveTransfer(
  code
) {
  const normalizedCode =
    requireValidTransferCode(
      code
    );

  const metadata =
    await requestSaveTransfer(
      `/transfer/${normalizedCode}/meta`,
      {
        method: "GET"
      }
    );

  validateTransferMetadata(
    metadata
  );

  return metadata;
}

/* ==========================================================
   9. CLAIM AND DECODE SAVE TRANSFER
   ----------------------------------------------------------
   Requires Worker verification, decodes the compact payload,
   validates the export, and reconstructs the transfer package.
========================================================== */

async function claimSaveTransfer(
  code
) {
  const normalizedCode =
    requireValidTransferCode(
      code
    );

  const responseData =
    await requestSaveTransfer(
      `/transfer/${normalizedCode}/claim`,
      {
        method: "POST"
      }
    );

  validateClaimedTransferEnvelope(
    responseData.transfer
  );

  const exportPackage =
    await decodeCompressedSaveTransferPayload(
      responseData.transfer
        .compressedPayload
    );

  validateTransferredExportPackage(
    exportPackage
  );

  const transferPackage = {
    game: "MEAT.exe",
    transferVersion:
      MEAT_TRANSFER_VERSION,
    serverVerified: true,
    createdAt:
      responseData.transfer
        .createdAt,
    expiresAt:
      responseData.transfer
        .expiresAt,
    summary:
      responseData.transfer
        .summary,
    saveData:
      exportPackage.saveData
  };

  validateTransferSavePackage(
    transferPackage
  );

  return transferPackage;
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
