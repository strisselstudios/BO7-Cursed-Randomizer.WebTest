/* ==========================================================
   1. LOCAL SAVE CONFIGURATION
   ----------------------------------------------------------
   Defines local save recovery storage and startup result states.
========================================================== */

const MEAT_INVALID_SAVE_BACKUP_KEY = "meatExeInvalidSaveBackup";
const MEAT_INVALID_SAVE_BACKUP_SECONDARY_KEY = "meatExeInvalidSaveBackupSecondary";
const MEAT_INVALID_SAVE_BACKUP_PREFIX = "MEAT_INVALID_SAVE_BACKUP_V1:";
const MEAT_INVALID_SAVE_BACKUP_SLOT_KEYS = Object.freeze([
  MEAT_INVALID_SAVE_BACKUP_KEY,
  MEAT_INVALID_SAVE_BACKUP_SECONDARY_KEY
]);

const LOCAL_SAVE_LOAD_STATUS_NEW = "new";
const LOCAL_SAVE_LOAD_STATUS_LOADED = "loaded";
const LOCAL_SAVE_LOAD_STATUS_MODIFIED = "modified";
const LOCAL_SAVE_LOAD_STATUS_RECOVERED = "recovered";

const LOCAL_SAVE_BACKUP_STORAGE_NONE = "none";
const LOCAL_SAVE_BACKUP_STORAGE_MEMORY = "memory";
const LOCAL_SAVE_BACKUP_STORAGE_PERSISTENT = "persistent";

const MAX_LOCAL_SAVE_ERROR_LENGTH = 240;

const LOCAL_SAVE_WRITE_STATUS_EVENT =
  "meatlocalsavewritestatuschange";

const LOCAL_SAVE_WRITE_STATUS_IDLE =
  "idle";

const LOCAL_SAVE_WRITE_STATUS_SAVED =
  "saved";

const LOCAL_SAVE_WRITE_STATUS_FAILED =
  "failed";
/* ==========================================================
   2. LOCAL SAVE LOAD RESULT
   ----------------------------------------------------------
   Records what occurred during startup so the interface can
   report recovery without coupling UI code to storage logic.
========================================================== */

let volatileInvalidLocalSaveBackups = [];
let localSaveWritesBlocked = false;
let localSaveLoadResult = {
  status: LOCAL_SAVE_LOAD_STATUS_NEW,
  modifiedReasons: [],
  backupAvailable: false,
  backupStorage: LOCAL_SAVE_BACKUP_STORAGE_NONE,
  errorMessage: ""
};

let localSaveWriteStatus = {
  status: LOCAL_SAVE_WRITE_STATUS_IDLE,
  errorMessage: "",
  changedAt: 0
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
function getLocalSaveWriteStatus() {
  return {
    ...localSaveWriteStatus
  };
}

function setLocalSaveWriteStatus(
  status,
  errorMessage = ""
) {
  localSaveWriteStatus = {
    status,
    errorMessage:
      typeof errorMessage === "string"
        ? errorMessage
        : "",
    changedAt: Date.now()
  };

  window.dispatchEvent(
    new CustomEvent(
      LOCAL_SAVE_WRITE_STATUS_EVENT,
      {
        detail:
          getLocalSaveWriteStatus()
      }
    )
  );

  return getLocalSaveWriteStatus();
}

function markLocalSaveWriteSucceeded() {
  return setLocalSaveWriteStatus(
    LOCAL_SAVE_WRITE_STATUS_SAVED
  );
}

function markLocalSaveWriteFailed(
  error
) {
  return setLocalSaveWriteStatus(
    LOCAL_SAVE_WRITE_STATUS_FAILED,
    normalizeLocalSaveError(error)
  );
}

function setLocalSaveLoadResult(status, options = {}) {
  localSaveLoadResult = {
    status,
    modifiedReasons: normalizeModifiedSaveReasons(options.modifiedReasons),
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
    modifiedReasons: [...localSaveLoadResult.modifiedReasons]
  };
}

function setLocalSaveWritesBlocked(blocked) {
  localSaveWritesBlocked = blocked === true;
  return localSaveWritesBlocked;
}

function areLocalSaveWritesBlocked() {
  return localSaveWritesBlocked;
}

/* ==========================================================
   3. INVALID SAVE QUARANTINE
   ----------------------------------------------------------
   Copies invalid raw saves into two rotating recovery slots before
   the active save key may be replaced. Failed persistent backup
   writes leave the active stored save untouched.
========================================================== */

function createInvalidLocalSaveBackupEnvelope(rawSave, createdAt) {
  return `${MEAT_INVALID_SAVE_BACKUP_PREFIX}${createdAt}\n${rawSave}`;
}

function parseInvalidLocalSaveBackupSlot(storedValue, storageKey) {
  if (typeof storedValue !== "string" || !storedValue) return null;

  if (storedValue.startsWith(MEAT_INVALID_SAVE_BACKUP_PREFIX)) {
    const timestampEndIndex = storedValue.indexOf("\n", MEAT_INVALID_SAVE_BACKUP_PREFIX.length);

    if (timestampEndIndex > 0) {
      const createdAt = Number(storedValue.slice(MEAT_INVALID_SAVE_BACKUP_PREFIX.length, timestampEndIndex));
      const rawSave = storedValue.slice(timestampEndIndex + 1);

      if (Number.isFinite(createdAt) && rawSave) return { rawSave, createdAt, storageKey };
    }
  }

  return { rawSave: storedValue, createdAt: 0, storageKey };
}

function getPersistentInvalidLocalSaveBackups() {
  try {
    return MEAT_INVALID_SAVE_BACKUP_SLOT_KEYS
      .map((storageKey) => parseInvalidLocalSaveBackupSlot(localStorage.getItem(storageKey), storageKey))
      .filter(Boolean)
      .sort((leftBackup, rightBackup) => rightBackup.createdAt - leftBackup.createdAt);
  } catch (error) {
    console.error("MEAT.exe persistent recovery backups could not be read:", error);
    return [];
  }
}

function createInvalidLocalSaveBackupCreatedAt(persistentBackups) {
  const newestCreatedAt = [...persistentBackups, ...volatileInvalidLocalSaveBackups]
    .reduce((currentNewest, backup) => Math.max(currentNewest, Number(backup.createdAt) || 0), 0);

  return Math.max(Date.now(), newestCreatedAt + 1);
}

function rememberVolatileInvalidLocalSaveBackup(rawSave, createdAt) {
  volatileInvalidLocalSaveBackups = [
    { rawSave, createdAt },
    ...volatileInvalidLocalSaveBackups.filter((backup) => backup.rawSave !== rawSave)
  ].slice(0, MEAT_INVALID_SAVE_BACKUP_SLOT_KEYS.length);
}

function forgetVolatileInvalidLocalSaveBackup(rawSave) {
  volatileInvalidLocalSaveBackups = volatileInvalidLocalSaveBackups.filter((backup) => backup.rawSave !== rawSave);
}

function chooseInvalidLocalSaveBackupSlot(persistentBackups) {
  const emptyStorageKey = MEAT_INVALID_SAVE_BACKUP_SLOT_KEYS
    .find((storageKey) => !persistentBackups.some((backup) => backup.storageKey === storageKey));

  if (emptyStorageKey) return emptyStorageKey;

  return [...persistentBackups]
    .sort((leftBackup, rightBackup) => leftBackup.createdAt - rightBackup.createdAt)[0]
    .storageKey;
}

function quarantineInvalidLocalSave(rawSave) {
  const persistentBackups = getPersistentInvalidLocalSaveBackups();
  const createdAt = createInvalidLocalSaveBackupCreatedAt(persistentBackups);

  rememberVolatileInvalidLocalSaveBackup(rawSave, createdAt);

  try {
    if (persistentBackups.some((backup) => backup.rawSave === rawSave)) {
      forgetVolatileInvalidLocalSaveBackup(rawSave);
      return LOCAL_SAVE_BACKUP_STORAGE_PERSISTENT;
    }

    const targetStorageKey = chooseInvalidLocalSaveBackupSlot(persistentBackups);
    const backupEnvelope = createInvalidLocalSaveBackupEnvelope(rawSave, createdAt);

    localStorage.setItem(targetStorageKey, backupEnvelope);
    forgetVolatileInvalidLocalSaveBackup(rawSave);

    return LOCAL_SAVE_BACKUP_STORAGE_PERSISTENT;
  } catch (error) {
    console.error("MEAT.exe invalid save could not be quarantined persistently:", error);
    return LOCAL_SAVE_BACKUP_STORAGE_MEMORY;
  }
}

function getInvalidLocalSaveBackups() {
  return [
    ...getPersistentInvalidLocalSaveBackups(),
    ...volatileInvalidLocalSaveBackups.map((backup) => ({ ...backup, storageKey: "" }))
  ].sort((leftBackup, rightBackup) => rightBackup.createdAt - leftBackup.createdAt);
}

function getInvalidLocalSaveBackup() {
  return getInvalidLocalSaveBackups()[0]?.rawSave || "";
}

function hasInvalidLocalSaveBackup() {
  return getInvalidLocalSaveBackup().length > 0;
}

function clearInvalidLocalSaveBackup() {
  volatileInvalidLocalSaveBackups = [];
  MEAT_INVALID_SAVE_BACKUP_SLOT_KEYS.forEach((storageKey) => localStorage.removeItem(storageKey));
}

function createInvalidLocalSaveBackupTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function downloadInvalidLocalSaveBackup() {
  const rawBackup = getInvalidLocalSaveBackup();

  if (!rawBackup) return false;

  const backupBlob = new Blob([rawBackup], { type: "text/plain;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(backupBlob);
  const downloadLink = document.createElement("a");

  downloadLink.href = downloadUrl;
  downloadLink.download = `MEAT-exe-invalid-save-${createInvalidLocalSaveBackupTimestamp()}.txt`;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);

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
   Validates and migrates stored data before activating it. Only
   data-processing failures enter save recovery; later runtime
   initialization errors do not falsely classify the save as corrupt.
========================================================== */

function recoverInvalidLocalSave(savedData, error) {
  console.error("MEAT.exe local save failed safety checks:", error);

  const backupStorage = quarantineInvalidLocalSave(savedData);

  gameState = createDefaultGameState();
  calculateMeatPerSecond();

  if (backupStorage === LOCAL_SAVE_BACKUP_STORAGE_PERSISTENT) {
    setLocalSaveWritesBlocked(false);

    const replacementStored = saveGame();

    if (!replacementStored) {
      console.error("MEAT.exe replacement save could not be stored after recovery.");
    }
  } else {
    setLocalSaveWritesBlocked(true);

    const blockedSaveError =
      new Error(
        "Saving is blocked because a persistent recovery backup could not be created."
      );

    markLocalSaveWriteFailed(
      blockedSaveError
    );

    console.error(
      "MEAT.exe normal save writes were blocked because no persistent recovery backup could be created."
    );
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

function loadGame() {
  const savedData = localStorage.getItem(MEAT_SAVE_KEY);

  if (!savedData) {
    setLocalSaveWritesBlocked(false);
    gameState = createDefaultGameState();
    setLocalSaveLoadResult(LOCAL_SAVE_LOAD_STATUS_NEW);
    return true;
  }

  let migratedState;

  try {
    if (new Blob([savedData]).size > MAX_SAVE_FILE_SIZE_BYTES) {
      throw new Error("The stored save exceeds the maximum supported size.");
    }

    const parsedSave = JSON.parse(savedData);

    validateStoredGameStateBeforeMigration(parsedSave);

    const preMigrationTrustReasons = collectStoredSavePreMigrationTrustReasons(parsedSave);

    migratedState = migrateGameState(parsedSave);

    const impossibleStateReasons = inspectGameStateForImpossibleProgress(migratedState);

    mergeSaveTrustState(
      migratedState,
      parsedSave,
      [
        ...preMigrationTrustReasons,
        ...impossibleStateReasons
      ]
    );

    validateGameStateStructure(migratedState);
  } catch (error) {
    return recoverInvalidLocalSave(savedData, error);
  }

  setLocalSaveWritesBlocked(false);
  gameState = migratedState;
  calculateMeatPerSecond();

  const trustState = getSaveTrustState(gameState);

  setLocalSaveLoadResult(
    trustState.modified
      ? LOCAL_SAVE_LOAD_STATUS_MODIFIED
      : LOCAL_SAVE_LOAD_STATUS_LOADED,
    {
      modifiedReasons: trustState.reasons
    }
  );

  return true;
}

/* ==========================================================
   6. LOCAL SAVE STORAGE
   ----------------------------------------------------------
   Refuses to overwrite the last stored state when the active
   runtime state is structurally invalid or writes are blocked.
========================================================== */

function saveGame() {
  const previousLastSavedAt =
    gameState?.lastSavedAt;

  try {
    if (
      areLocalSaveWritesBlocked()
    ) {
      throw new Error(
        "Saving is blocked to preserve the original stored save without a persistent recovery backup."
      );
    }

    compactNachtRaidersFieldRecords(
      gameState.features?.nachtRaiders
    );

    gameState.lastSavedAt =
      Date.now();

    validateGameStateStructure(
      gameState
    );

    const serializedGameState =
      JSON.stringify(
        gameState
      );

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

    markLocalSaveWriteSucceeded();

    return true;
  } catch (error) {
    if (
      gameState &&
      typeof gameState === "object"
    ) {
      gameState.lastSavedAt =
        previousLastSavedAt;
    }

    markLocalSaveWriteFailed(
      error
    );

    console.error(
      "MEAT.exe save could not be stored:",
      error
    );

    return false;
  }
}
