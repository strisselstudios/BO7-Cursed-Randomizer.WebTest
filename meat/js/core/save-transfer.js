/* ==========================================================
   SAVE TRANSFER SYSTEM
   ----------------------------------------------------------
   Creates temporary transfer codes, previews incoming saves,
   claims transfers, and safely applies received save data.
========================================================== */

const MEAT_TRANSFER_API_BASE =
  "https://meat-save-transfer.dopefishlivesagain.workers.dev";

const MEAT_TRANSFER_BACKUP_KEY =
  `${MEAT_SAVE_KEY}:pre-transfer-backup`;

const MEAT_TRANSFER_CODE_PATTERN =
  /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{7}$/;

/* ==========================================================
   CREATE TRANSFER PACKAGE
========================================================== */

function createTransferSavePackage() {
  const saveResult = saveGame();

  if (saveResult === false) {
    throw new Error(
      "The current save could not be prepared."
    );
  }

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
   VALIDATE TRANSFER PACKAGE
========================================================== */

function validateTransferSavePackage(
  transferPackage
) {
  if (
    !transferPackage ||
    typeof transferPackage !== "object" ||
    Array.isArray(transferPackage)
  ) {
    throw new Error(
      "The received transfer package is invalid."
    );
  }

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

  validateImportedGameState(
    transferPackage.saveData
  );
}

/* ==========================================================
   NORMALIZE TRANSFER CODE
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

/* ==========================================================
   API REQUEST HELPER
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
  } catch {
    throw new Error(
      "The transfer server could not be reached."
    );
  }

  let responseData;

  try {
    responseData = await response.json();
  } catch {
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
   CREATE SAVE TRANSFER
========================================================== */

async function createSaveTransfer() {
  const transferPackage =
    createTransferSavePackage();

  return requestSaveTransfer(
    "/transfer",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(
        transferPackage
      )
    }
  );
}

/* ==========================================================
   PREVIEW SAVE TRANSFER
========================================================== */

async function previewSaveTransfer(code) {
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

  return requestSaveTransfer(
    `/transfer/${normalizedCode}/meta`,
    {
      method: "GET"
    }
  );
}

/* ==========================================================
   CLAIM SAVE TRANSFER
========================================================== */

async function claimSaveTransfer(code) {
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
   APPLY TRANSFERRED SAVE
========================================================== */

function applyTransferredSave(
  transferPackage
) {
  validateTransferSavePackage(
    transferPackage
  );

  const currentSave =
    localStorage.getItem(
      MEAT_SAVE_KEY
    );

  /*
   * Preserve the receiving device's previous save.
   * This backup is replaced by the next successful transfer.
   */
  if (currentSave !== null) {
    localStorage.setItem(
      MEAT_TRANSFER_BACKUP_KEY,
      currentSave
    );
  }

  const previousGameState =
    JSON.parse(
      JSON.stringify(gameState)
    );

  try {
    gameState = migrateGameState(
      transferPackage.saveData
    );

    calculateMeatPerSecond();

    const saveResult = saveGame();

    if (saveResult === false) {
      throw new Error(
        "The transferred save could not be stored."
      );
    }
  } catch (error) {
    gameState = previousGameState;

    if (currentSave !== null) {
      localStorage.setItem(
        MEAT_SAVE_KEY,
        currentSave
      );
    }

    throw error;
  }
}
