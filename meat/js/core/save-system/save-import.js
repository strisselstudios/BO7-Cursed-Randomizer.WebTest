/* ==========================================================
   1. IMPORT FILE READING
   ----------------------------------------------------------
   Reads one bounded save file before parsing its contents.
========================================================== */

async function readImportedSaveFile(file) {
  if (!(file instanceof File)) {
    throw new Error("No save file was selected.");
  }

  if (file.size <= 0 || file.size > MAX_SAVE_FILE_SIZE_BYTES) {
    throw new Error("The selected save file is empty or too large.");
  }

  return file.text();
}

/* ==========================================================
   2. LEGACY JSON PACKAGE VALIDATION
   ----------------------------------------------------------
   Keeps old version-1 backups usable, but classifies them as
   unsigned and therefore untrusted after import.
========================================================== */

function parseLegacyJsonSavePackage(fileContents) {
  let importPackage;

  try {
    importPackage = JSON.parse(fileContents);
  } catch (error) {
    throw new Error("The selected file does not contain valid MEAT.exe save data.");
  }

  requirePlainSaveObject(
    importPackage,
    "The imported save package"
  );

  validateSaveDataSafety(
    importPackage,
    "importPackage"
  );

  rejectUnknownObjectKeys(
    importPackage,
    [
      "game",
      "exportVersion",
      "exportedAt",
      "saveData"
    ],
    "The legacy save package"
  );

  if (
    importPackage.game !== "MEAT.exe" ||
    importPackage.exportVersion !== 1 ||
    !importPackage.saveData
  ) {
    throw new Error("This is not a valid legacy MEAT.exe save export.");
  }

  requireSaveNumber(
    importPackage.exportedAt,
    "The legacy export timestamp",
    {
      allowUndefined: false,
      integer: true,
      maximum: Number.MAX_SAFE_INTEGER
    }
  );

  validateGameStateStructure(importPackage.saveData);
  return importPackage;
}

/* ==========================================================
   3. ENCRYPTED PACKAGE VALIDATION
========================================================== */

async function parseEncryptedSavePackage(fileContents) {
  const importPackage = await decodeEncryptedSaveExportString(fileContents);

  requirePlainSaveObject(
    importPackage,
    "The decrypted save package"
  );

  validateSaveDataSafety(
    importPackage,
    "importPackage"
  );

  rejectUnknownObjectKeys(
    importPackage,
    [
      "game",
      "exportVersion",
      "saveIntegrityVersion",
      "exportedAt",
      "saveData"
    ],
    "The encrypted save package"
  );

  if (
    importPackage.game !== "MEAT.exe" ||
    importPackage.exportVersion !== SAVE_EXPORT_VERSION ||
    importPackage.saveIntegrityVersion !== CURRENT_SAVE_INTEGRITY_VERSION ||
    !importPackage.saveData
  ) {
    throw new Error("This is not a supported encrypted MEAT.exe save export.");
  }

  requireSaveNumber(
    importPackage.exportedAt,
    "The encrypted export timestamp",
    {
      allowUndefined: false,
      integer: true,
      maximum: Number.MAX_SAFE_INTEGER
    }
  );

  validateGameStateStructure(importPackage.saveData);
  return importPackage;
}

/* ==========================================================
   4. IMPORT FORMAT SELECTION
========================================================== */

async function parseImportedSavePackage(fileContents) {
  const trimmedContents = typeof fileContents === "string"
    ? fileContents.trim()
    : "";

  if (trimmedContents.startsWith(SAVE_EXPORT_MAGIC)) {
    return {
      importPackage: await parseEncryptedSavePackage(trimmedContents),
      trustReasons: []
    };
  }

  return {
    importPackage: parseLegacyJsonSavePackage(trimmedContents),
    trustReasons: [
      "Imported from an unsigned legacy JSON export."
    ]
  };
}

/* ==========================================================
   5. IMPORTED STATE ACCEPTANCE
   ----------------------------------------------------------
   Preserves imported trust records, impossible-state findings,
   and any modified status already attached to this installation.
========================================================== */

function acceptImportedGameState(
  importedState,
  additionalReasons = []
) {
  const existingTrustState = {
    saveIntegrityVersion: gameState.saveIntegrityVersion,
    modifiedSave: gameState.modifiedSave === true,
    modifiedSaveReasons: normalizeModifiedSaveReasons(
      gameState.modifiedSaveReasons
    )
  };

  const impossibleStateReasons = inspectGameStateForImpossibleProgress(
    importedState
  );

  const migratedState = migrateGameState(
    importedState
  );

  mergeSaveTrustState(
    migratedState,
    importedState,
    [
      ...additionalReasons,
      ...impossibleStateReasons
    ]
  );

  mergeSaveTrustState(
    migratedState,
    existingTrustState
  );

  validateGameStateStructure(
    migratedState
  );

  gameState = migratedState;
  calculateMeatPerSecond();

  if (!saveGame()) {
    throw new Error("The imported save could not be stored.");
  }

  return true;
}

/* ==========================================================
   6. SAVE IMPORT
========================================================== */

async function importGameSave(file) {
  try {
    const fileContents = await readImportedSaveFile(file);

    const {
      importPackage,
      trustReasons
    } = await parseImportedSavePackage(fileContents);

    return acceptImportedGameState(
      importPackage.saveData,
      trustReasons
    );
  } catch (error) {
    console.error("MEAT.exe save could not be imported:", error);
    return false;
  }
}
