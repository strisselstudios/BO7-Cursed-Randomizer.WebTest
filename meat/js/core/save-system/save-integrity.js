/* ==========================================================
   1. SAVE INTEGRITY CONFIGURATION
   ----------------------------------------------------------
   Defines bounded metadata limits for modified-save records.
========================================================== */

const MAX_MODIFIED_SAVE_REASONS = 20;
const MAX_MODIFIED_SAVE_REASON_LENGTH = 160;

/* ==========================================================
   2. MODIFIED-SAVE REASON NORMALIZATION
   ----------------------------------------------------------
   Converts integrity reasons into bounded, unique strings.
========================================================== */

function normalizeModifiedSaveReason(reason) {
  if (typeof reason !== "string") {
    return "";
  }

  return reason
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_MODIFIED_SAVE_REASON_LENGTH);
}

function normalizeModifiedSaveReasons(reasons) {
  if (!Array.isArray(reasons)) {
    return [];
  }

  const normalizedReasons = [];

  reasons.forEach((reason) => {
    const normalizedReason = normalizeModifiedSaveReason(reason);

    if (
      normalizedReason &&
      !normalizedReasons.includes(normalizedReason)
    ) {
      normalizedReasons.push(normalizedReason);
    }
  });

  return normalizedReasons.slice(0, MAX_MODIFIED_SAVE_REASONS);
}

/* ==========================================================
   3. SAVE TRUST STATE
   ----------------------------------------------------------
   Reads and updates the persistent modified-save state.
========================================================== */

function getSaveTrustState(saveState = gameState) {
  const validSaveState =
    saveState &&
    typeof saveState === "object" &&
    !Array.isArray(saveState);

  if (!validSaveState) {
    return {
      trusted: false,
      modified: true,
      integrityVersion: 0,
      reasons: ["Save state is missing or invalid."]
    };
  }

  const integrityVersion = Number.isInteger(
    saveState.saveIntegrityVersion
  )
    ? saveState.saveIntegrityVersion
    : 0;

  const modified = saveState.modifiedSave === true;
  const reasons = modified
    ? normalizeModifiedSaveReasons(saveState.modifiedSaveReasons)
    : [];

  return {
    trusted:
      !modified &&
      integrityVersion === CURRENT_SAVE_INTEGRITY_VERSION,
    modified,
    integrityVersion,
    reasons
  };
}

function isSaveModified(saveState = gameState) {
  return getSaveTrustState(saveState).modified;
}

function markSaveAsModified(reason, saveState = gameState) {
  const validSaveState =
    saveState &&
    typeof saveState === "object" &&
    !Array.isArray(saveState);

  if (!validSaveState) {
    return false;
  }

  const existingReasons = normalizeModifiedSaveReasons(
    saveState.modifiedSaveReasons
  );
  const normalizedReason = normalizeModifiedSaveReason(reason);

  if (
    normalizedReason &&
    !existingReasons.includes(normalizedReason)
  ) {
    existingReasons.push(normalizedReason);
  }

  saveState.saveIntegrityVersion =
    CURRENT_SAVE_INTEGRITY_VERSION;
  saveState.modifiedSave = true;
  saveState.modifiedSaveReasons = existingReasons.slice(
    0,
    MAX_MODIFIED_SAVE_REASONS
  );

  return true;
}

function mergeSaveTrustState(
  targetState,
  sourceState,
  additionalReasons = []
) {
  const validTargetState =
    targetState &&
    typeof targetState === "object" &&
    !Array.isArray(targetState);

  if (!validTargetState) {
    return false;
  }

  const validSourceState =
    sourceState &&
    typeof sourceState === "object" &&
    !Array.isArray(sourceState);

  const targetWasModified = targetState.modifiedSave === true;
  const sourceWasModified =
    validSourceState &&
    sourceState.modifiedSave === true;

  const targetReasons = Array.isArray(
    targetState.modifiedSaveReasons
  )
    ? targetState.modifiedSaveReasons
    : [];

  const sourceReasons =
    validSourceState &&
    Array.isArray(sourceState.modifiedSaveReasons)
      ? sourceState.modifiedSaveReasons
      : [];

  const normalizedAdditionalReasons =
    normalizeModifiedSaveReasons(additionalReasons);

  const shouldBeModified =
    targetWasModified ||
    sourceWasModified ||
    normalizedAdditionalReasons.length > 0;

  const combinedReasons = shouldBeModified
    ? normalizeModifiedSaveReasons([
        ...targetReasons,
        ...sourceReasons,
        ...normalizedAdditionalReasons
      ])
    : [];

  targetState.saveIntegrityVersion =
    CURRENT_SAVE_INTEGRITY_VERSION;
  targetState.modifiedSave = shouldBeModified;
  targetState.modifiedSaveReasons = combinedReasons;

  return shouldBeModified;
}

/* ==========================================================
   4. TRUSTED-FEATURE ACCESS
   ----------------------------------------------------------
   Provides one centralized gate for future shared systems.
========================================================== */

function canUseTrustedSaveFeatures(saveState = gameState) {
  return getSaveTrustState(saveState).trusted;
}
