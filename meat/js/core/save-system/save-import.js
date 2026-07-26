/* ==========================================================
   1. SAVE IMPORT STATUS
   ----------------------------------------------------------
   Defines the three possible results of pre-import inspection.
========================================================== */

const SAVE_IMPORT_STATUS_TRUSTED = "trusted";
const SAVE_IMPORT_STATUS_UNTRUSTED = "untrusted";
const SAVE_IMPORT_STATUS_REJECTED = "rejected";

/* ==========================================================
   2. IMPORT FILE READING
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
   3. LEGACY JSON PACKAGE VALIDATION
   ----------------------------------------------------------
   Keeps version-1 JSON backups usable while classifying them
   as unsigned and therefore permanently untrusted.
========================================================== */

function parseLegacyJsonSavePackage(fileContents) {
  let importPackage;

  try {
    importPackage = JSON.parse(fileContents);
  } catch (error) {
    throw new Error("The selected file does not contain valid MEAT.exe save data.");
  }

  requirePlainSaveObject(importPackage, "The imported save package");
  validateSaveDataSafety(importPackage, "importPackage");

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
   4. ENCRYPTED PACKAGE VALIDATION
========================================================== */

async function parseEncryptedSavePackage(fileContents) {
  const importPackage = await decodeEncryptedSaveExportString(fileContents);

  requirePlainSaveObject(importPackage, "The decrypted save package");
  validateSaveDataSafety(importPackage, "importPackage");

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
   5. IMPORT FORMAT SELECTION
========================================================== */

async function parseImportedSavePackage(fileContents) {
  const trimmedContents = typeof fileContents === "string"
    ? fileContents.trim()
    : "";

  if (trimmedContents.startsWith(SAVE_EXPORT_MAGIC)) {
    return {
      importPackage: await parseEncryptedSavePackage(trimmedContents),
      sourceFormat: "encrypted",
      trustReasons: []
    };
  }

  return {
    importPackage: parseLegacyJsonSavePackage(trimmedContents),
    sourceFormat: "legacy-json",
    trustReasons: [
      "Imported from an unsigned legacy JSON export."
    ]
  };
}

/* ==========================================================
   6. TRUST REASON COLLECTION
   ----------------------------------------------------------
   Combines file-format warnings, imported trust records,
   impossible progression, and the current installation state.
========================================================== */

function collectSaveImportTrustReasons(
  importedState,
  initialReasons = []
) {
  const reasons = [
    ...initialReasons
  ];

  const importedTrustState = getSaveTrustState(importedState);

  if (importedState.modifiedSave === true) {
    if (importedTrustState.reasons.length > 0) {
      reasons.push(...importedTrustState.reasons);
    } else {
      reasons.push("The imported save is already marked as modified.");
    }
  }

  if (
    importedTrustState.integrityVersion !==
    CURRENT_SAVE_INTEGRITY_VERSION
  ) {
    reasons.push("The imported save has no verifiable integrity record.");
  }

  reasons.push(
    ...inspectGameStateForImpossibleProgress(importedState)
  );

  const currentTrustState = getSaveTrustState(gameState);

  if (currentTrustState.modified) {
    if (currentTrustState.reasons.length > 0) {
      reasons.push(...currentTrustState.reasons);
    } else {
      reasons.push("The current game is already marked as modified.");
    }
  }

  return normalizeModifiedSaveReasons(reasons);
}

/* ==========================================================
   7. REJECTED ASSESSMENT CREATION
========================================================== */

function createRejectedSaveImportAssessment(error) {
  return {
    status: SAVE_IMPORT_STATUS_REJECTED,
    sourceFormat: "unknown",
    importPackage: null,
    importedState: null,
    trustReasons: [],
    errorMessage: error instanceof Error
      ? error.message
      : "Unknown save import error."
  };
}

/* ==========================================================
   8. PRE-IMPORT INSPECTION
   ----------------------------------------------------------
   Reads, decrypts, parses, validates, and classifies a save
   without changing the active game or localStorage.
========================================================== */

async function inspectSaveImport(file) {
  try {
    const fileContents = await readImportedSaveFile(file);

    const {
      importPackage,
      sourceFormat,
      trustReasons
    } = await parseImportedSavePackage(fileContents);

    const importedState = importPackage.saveData;

    const combinedTrustReasons = collectSaveImportTrustReasons(
      importedState,
      trustReasons
    );

    return {
      status: combinedTrustReasons.length > 0
        ? SAVE_IMPORT_STATUS_UNTRUSTED
        : SAVE_IMPORT_STATUS_TRUSTED,
      sourceFormat,
      importPackage,
      importedState,
      trustReasons: combinedTrustReasons,
      errorMessage: ""
    };
  } catch (error) {
    console.error("MEAT.exe save inspection failed:", error);
    return createRejectedSaveImportAssessment(error);
  }
}

/* ==========================================================
   9. IMPORTED STATE PREPARATION
   ----------------------------------------------------------
   Revalidates the inspected state immediately before commitment
   and merges every permanent trust record.
========================================================== */

function prepareInspectedSaveState(assessment) {
  validateGameStateStructure(assessment.importedState);

  const existingTrustState = {
    saveIntegrityVersion: gameState.saveIntegrityVersion,
    modifiedSave: gameState.modifiedSave === true,
    modifiedSaveReasons: normalizeModifiedSaveReasons(
      gameState.modifiedSaveReasons
    )
  };

  const finalInspectionReasons =
    inspectGameStateForImpossibleProgress(
      assessment.importedState
    );

  const migratedState = migrateGameState(
    assessment.importedState
  );

  mergeSaveTrustState(
    migratedState,
    assessment.importedState,
    [
      ...assessment.trustReasons,
      ...finalInspectionReasons
    ]
  );

  mergeSaveTrustState(
    migratedState,
    existingTrustState
  );

  validateGameStateStructure(migratedState);

  return migratedState;
}

/* ==========================================================
   10. INSPECTED SAVE COMMITMENT
   ----------------------------------------------------------
   Replaces the active game only after the interface receives
   explicit confirmation. Failed storage restores the old state.
========================================================== */

function commitInspectedSaveImport(assessment) {
  const importableStatus = assessment?.status === SAVE_IMPORT_STATUS_TRUSTED ||
    assessment?.status === SAVE_IMPORT_STATUS_UNTRUSTED;

  if (!importableStatus || !assessment.importedState) {
    return false;
  }

  const previousGameState = gameState;

  try {
    const importedGameState = prepareInspectedSaveState(assessment);

    gameState = importedGameState;
    calculateMeatPerSecond();

    if (!saveGame()) {
      throw new Error("The imported save could not be stored.");
    }

    return true;
  } catch (error) {
    gameState = previousGameState;
    calculateMeatPerSecond();

    console.error("MEAT.exe inspected save could not be imported:", error);
    return false;
  }
}
