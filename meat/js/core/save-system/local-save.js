/* ==========================================================
   1. LOCAL SAVE CONFIGURATION
   ----------------------------------------------------------
   Defines local save recovery storage and startup result states.
========================================================== */

const MEAT_INVALID_SAVE_BACKUP_KEY = "meatExeInvalidSaveBackup";

const LOCAL_SAVE_LOAD_STATUS_NEW = "new";
const LOCAL_SAVE_LOAD_STATUS_LOADED = "loaded";
const LOCAL_SAVE_LOAD_STATUS_MODIFIED = "modified";
const LOCAL_SAVE_LOAD_STATUS_RECOVERED = "recovered";

const LOCAL_SAVE_BACKUP_STORAGE_NONE = "none";
const LOCAL_SAVE_BACKUP_STORAGE_MEMORY = "memory";
const LOCAL_SAVE_BACKUP_STORAGE_PERSISTENT = "persistent";

const MAX_LOCAL_SAVE_ERROR_LENGTH = 240;

/* ==========================================================
   2. LOCAL SAVE LOAD RESULT
   ----------------------------------------------------------
   Records what occurred during startup so the interface can
   report recovery without coupling UI code to storage logic.
========================================================== */

let volatileInvalidLocalSaveBackup = "";

let localSaveLoadResult = {
  status: LOCAL_SAVE_LOAD_STATUS_NEW,
  modifiedReasons: [],
  backupAvailable: false,
  backupStorage: LOCAL_SAVE_BACKUP_STORAGE_NONE,
  errorMessage: ""
};

function normalizeLocalSaveError(error) {
  const message = error instanceof Error
    ? error.message
    : "Unknown local save error.";

  return message
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_LOCAL_SAVE_ERROR_LENGTH);
}

function setLocalSaveLoadResult(status, options = {}) {
  localSaveLoadResult = {
    status,
    modifiedReasons: normalizeModifiedSaveReasons(
      options.modifiedReasons
    ),
    backupAvailable: options.backupAvailable === true,
    backupStorage: options.backupStorage || LOCAL_SAVE_BACKUP_STORAGE_NONE,
    errorMessage: typeof options.errorMessage === "string"
      ? options.errorMessage
      : ""
  };

  return getLocalSaveLoadResult();
}

function getLocalSaveLoadResult() {
  return {
    ...localSaveLoadResult,
    modifiedReasons: [
      ...localSaveLoadResult.modifiedReasons
    ]
  };
}

/* ==========================================================
   3. INVALID SAVE QUARANTINE
   ----------------------------------------------------------
   Moves an invalid raw save away from the active save key before
   a new game can be written.
========================================================== */

function quarantineInvalidLocalSave(rawSave) {
  volatileInvalidLocalSaveBackup = rawSave;

  try {
    localStorage.removeItem(MEAT_INVALID_SAVE_BACKUP_KEY);
    localStorage.removeItem(MEAT_SAVE_KEY);
    localStorage.setItem(MEAT_INVALID_SAVE_BACKUP_KEY, rawSave);

    volatileInvalidLocalSaveBackup = "";
    return LOCAL_SAVE_BACKUP_STORAGE_PERSISTENT;
  } catch (error) {
    console.error("MEAT.exe invalid save could not be quarantined persistently:", error);

    try {
      localStorage.setItem(MEAT_SAVE_KEY, rawSave);
    } catch (restoreError) {
      console.error("MEAT.exe invalid save could not be restored to its original key:", restoreError);
    }

    return LOCAL_SAVE_BACKUP_STORAGE_MEMORY;
  }
}

function getInvalidLocalSaveBackup() {
  const persistentBackup = localStorage.getItem(
    MEAT_INVALID_SAVE_BACKUP_KEY
  );

  if (persistentBackup) {
    return persistentBackup;
  }

  return volatileInvalidLocalSaveBackup;
}

function hasInvalidLocalSaveBackup() {
  return getInvalidLocalSaveBackup().length > 0;
}

function clearInvalidLocalSaveBackup() {
  volatileInvalidLocalSaveBackup = "";
  localStorage.removeItem(MEAT_INVALID_SAVE_BACKUP_KEY);
}

function createInvalidLocalSaveBackupTimestamp() {
  return new Date()
    .toISOString()
    .replace(/[:.]/g, "-");
}

function downloadInvalidLocalSaveBackup() {
  const rawBackup = getInvalidLocalSaveBackup();

  if (!rawBackup) {
    return false;
  }

  const backupBlob = new Blob(
    [rawBackup],
    {
      type: "text/plain;charset=utf-8"
    }
  );

  const downloadUrl = URL.createObjectURL(backupBlob);
  const downloadLink = document.createElement("a");

  downloadLink.href = downloadUrl;
  downloadLink.download =
    `MEAT-exe-invalid-save-${createInvalidLocalSaveBackupTimestamp()}.txt`;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  window.setTimeout(
    () => URL.revokeObjectURL(downloadUrl),
    0
  );

  return true;
}

/* ==========================================================
   4. PRE-MIGRATION TRUST INSPECTION
   ----------------------------------------------------------
   Preserves trust contradictions that ordinary migration would
   otherwise normalize away.
========================================================== */

function collectStoredSavePreMigrationTrustReasons(saveState) {
  const reasons = [];

  if (
    saveState.modifiedSave !== true &&
    Array.isArray(saveState.modifiedSaveReasons) &&
    saveState.modifiedSaveReasons.length > 0
  ) {
    reasons.push(
      "Modified-save reasons existed while the modified-save flag was disabled."
    );
  }

  return normalizeModifiedSaveReasons(reasons);
}

/* ==========================================================
   5. LOCAL SAVE LOADING
   ----------------------------------------------------------
   Validates the raw state, migrates it, validates the completed
   state, and quarantines anything that cannot be loaded safely.
========================================================== */

function loadGame() {
  const savedData = localStorage.getItem(MEAT_SAVE_KEY);

  if (!savedData) {
    gameState = createDefaultGameState();

    setLocalSaveLoadResult(
      LOCAL_SAVE_LOAD_STATUS_NEW
    );

    return true;
  }

  try {
    if (new Blob([savedData]).size > MAX_SAVE_FILE_SIZE_BYTES) {
      throw new Error("The stored save exceeds the maximum supported size.");
    }

    const parsedSave = JSON.parse(savedData);

    validateStoredGameStateBeforeMigration(
      parsedSave
    );

    const preMigrationTrustReasons =
      collectStoredSavePreMigrationTrustReasons(
        parsedSave
      );

    const migratedState = migrateGameState(
      parsedSave
    );

    const impossibleStateReasons =
      inspectGameStateForImpossibleProgress(
        migratedState
      );

    mergeSaveTrustState(
      migratedState,
      parsedSave,
      [
        ...preMigrationTrustReasons,
        ...impossibleStateReasons
      ]
    );

    validateGameStateStructure(
      migratedState
    );

    gameState = migratedState;
    calculateMeatPerSecond();

    const trustState = getSaveTrustState(
      gameState
    );

    setLocalSaveLoadResult(
      trustState.modified
        ? LOCAL_SAVE_LOAD_STATUS_MODIFIED
        : LOCAL_SAVE_LOAD_STATUS_LOADED,
      {
        modifiedReasons: trustState.reasons
      }
    );

    return true;
  } catch (error) {
    console.error("MEAT.exe local save failed safety checks:", error);

    const backupStorage = quarantineInvalidLocalSave(
      savedData
    );

    gameState = createDefaultGameState();
    calculateMeatPerSecond();

    const replacementStored = saveGame();

    if (!replacementStored) {
      console.error("MEAT.exe replacement save could not be stored after recovery.");
    }

    setLocalSaveLoadResult(
      LOCAL_SAVE_LOAD_STATUS_RECOVERED,
      {
        backupAvailable: hasInvalidLocalSaveBackup(),
        backupStorage,
        errorMessage: normalizeLocalSaveError(error)
      }
    );

    return false;
  }
}

/* ==========================================================
   6. LOCAL SAVE STORAGE
   ----------------------------------------------------------
   Refuses to overwrite the last stored state when the active
   runtime state is structurally invalid.
========================================================== */

function saveGame() {
  const previousLastSavedAt =
    gameState.lastSavedAt;

  try {
    compactNachtRaidersFieldRecords(
      gameState.features?.nachtRaiders
    );

    gameState.lastSavedAt =
      Date.now();

    validateGameStateStructure(
      gameState
    );

    const serializedGameState =
      JSON.stringify(gameState);

    if (
      new Blob([
        serializedGameState
      ]).size >
      MAX_SAVE_FILE_SIZE_BYTES
    ) {
      throw new Error(
        "The active save exceeds the maximum supported size."
      );
    }

    localStorage.setItem(
      MEAT_SAVE_KEY,
      serializedGameState
    );

    return true;
  } catch (error) {
    gameState.lastSavedAt = previousLastSavedAt;

    console.error(
      "MEAT.exe save could not be stored:",
      error
    );

    return false;
  }
}
