/* ==========================================================
   1. IMPORT FILE READING
   ----------------------------------------------------------
   Reads one bounded save file before parsing its contents.
========================================================== */

async function readImportedSaveFile(
  file
) {
  if (
    !(file instanceof File)
  ) {
    throw new Error(
      "No save file was selected."
    );
  }

  if (
    file.size <= 0 ||
    file.size >
      MAX_SAVE_FILE_SIZE_BYTES
  ) {
    throw new Error(
      "The selected save file is empty or too large."
    );
  }

  return file.text();
}

/* ==========================================================
   2. LEGACY JSON PACKAGE VALIDATION
   ----------------------------------------------------------
   Accepts the current version-1 JSON export until encrypted
   version-2 exports replace it in the next implementation step.
========================================================== */

function parseLegacyJsonSavePackage(
  fileContents
) {
  let importPackage;

  try {
    importPackage =
      JSON.parse(
        fileContents
      );
  } catch (error) {
    throw new Error(
      "The selected file does not contain valid JSON."
    );
  }

  requirePlainSaveObject(
    importPackage,
    "The imported save package"
  );

  validateSaveDataSafety(
    importPackage,
    "importPackage"
  );

  if (
    importPackage.game !==
      "MEAT.exe" ||
    importPackage.exportVersion !==
      1 ||
    !importPackage.saveData
  ) {
    throw new Error(
      "This is not a valid MEAT.exe save export."
    );
  }

  validateGameStateStructure(
    importPackage.saveData
  );

  return importPackage;
}

/* ==========================================================
   3. IMPORTED STATE ACCEPTANCE
   ----------------------------------------------------------
   Migrates validated data, preserves existing trust records,
   and permanently records impossible-state findings.
========================================================== */

function acceptImportedGameState(
  importedState
) {
  const impossibleStateReasons =
    inspectGameStateForImpossibleProgress(
      importedState
    );

  const migratedState =
    migrateGameState(
      importedState
    );

  mergeSaveTrustState(
    migratedState,
    importedState,
    impossibleStateReasons
  );

  gameState =
    migratedState;

  calculateMeatPerSecond();

  if (
    !saveGame()
  ) {
    throw new Error(
      "The imported save could not be stored."
    );
  }

  return true;
}

/* ==========================================================
   4. SAVE IMPORT
========================================================== */

async function importGameSave(
  file
) {
  try {
    const fileContents =
      await readImportedSaveFile(
        file
      );

    const importPackage =
      parseLegacyJsonSavePackage(
        fileContents
      );

    return acceptImportedGameState(
      importPackage.saveData
    );
  } catch (error) {
    console.error(
      "MEAT.exe save could not be imported:",
      error
    );

    return false;
  }
}
