/* ==========================================================
   1. SAVE VALIDATION CONFIGURATION
   ----------------------------------------------------------
   Defines hard limits used before imported save data reaches
   migration or active gameplay state.
========================================================== */

const MAX_SAVE_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_SAVE_OBJECT_DEPTH = 40;
const MAX_SAVE_OBJECT_ENTRIES = 250000;
const MAX_SAVE_STRING_LENGTH = 1000000;
const SAVE_FUTURE_TIMESTAMP_TOLERANCE_MS =
  7 * 24 * 60 * 60 * 1000;

const DANGEROUS_SAVE_PROPERTY_NAMES =
  Object.freeze([
    "__proto__",
    "prototype",
    "constructor"
  ]);

/* ==========================================================
   2. GENERAL VALIDATION HELPERS
========================================================== */

function isPlainSaveObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function requirePlainSaveObject(
  value,
  label
) {
  if (!isPlainSaveObject(value)) {
    throw new Error(
      `${label} is invalid.`
    );
  }
}

function requireSaveBoolean(
  value,
  label,
  allowUndefined = true
) {
  if (
    value === undefined &&
    allowUndefined
  ) {
    return;
  }

  if (typeof value !== "boolean") {
    throw new Error(
      `${label} is invalid.`
    );
  }
}

function requireSaveString(
  value,
  label,
  options = {}
) {
  const {
    allowUndefined = true,
    allowEmpty = false,
    maximumLength = 160
  } = options;

  if (
    value === undefined &&
    allowUndefined
  ) {
    return;
  }

  if (
    typeof value !== "string" ||
    (
      !allowEmpty &&
      !value.trim()
    ) ||
    value.length > maximumLength
  ) {
    throw new Error(
      `${label} is invalid.`
    );
  }
}

function requireSaveNumber(
  value,
  label,
  options = {}
) {
  const {
    allowUndefined = true,
    integer = false,
    minimum = 0,
    maximum = MEAT_DISPLAY_LIMIT
  } = options;

  if (
    value === undefined &&
    allowUndefined
  ) {
    return;
  }

  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum ||
    (
      integer &&
      !Number.isInteger(value)
    )
  ) {
    throw new Error(
      `${label} is invalid.`
    );
  }
}

function requireSaveArray(
  value,
  label,
  maximumLength
) {
  if (
    !Array.isArray(value) ||
    value.length > maximumLength
  ) {
    throw new Error(
      `${label} is invalid.`
    );
  }
}

function rejectUnknownObjectKeys(
  object,
  allowedKeys,
  label
) {
  requirePlainSaveObject(
    object,
    label
  );

  Object.keys(object)
    .forEach((propertyName) => {
      if (
        !allowedKeys.includes(
          propertyName
        )
      ) {
        throw new Error(
          `${label} contains an unknown property: ${propertyName}`
        );
      }
    });
}

/* ==========================================================
   3. RECURSIVE DATA SAFETY
   ----------------------------------------------------------
   Rejects dangerous property names, excessive nesting, huge
   strings, and intentionally oversized object graphs.
========================================================== */

function validateSaveDataSafety(
  value,
  path = "saveData",
  depth = 0,
  tracker = {
    entries: 0
  }
) {
  if (
    depth >
    MAX_SAVE_OBJECT_DEPTH
  ) {
    throw new Error(
      "The save data is nested too deeply."
    );
  }

  if (
    typeof value === "string"
  ) {
    if (
      value.length >
      MAX_SAVE_STRING_LENGTH
    ) {
      throw new Error(
        `${path} contains an oversized text value.`
      );
    }

    return true;
  }

  if (
    value === null ||
    typeof value !== "object"
  ) {
    return true;
  }

  const entries =
    Array.isArray(value)
      ? value.map(
          (
            entry,
            index
          ) => [
            String(index),
            entry
          ]
        )
      : Object.entries(value);

  tracker.entries +=
    entries.length;

   if (
    tracker.entries >
    MAX_SAVE_OBJECT_ENTRIES
  ) {
    throw new Error(
      `The save data contains too many entries near ${path} (${tracker.entries} > ${MAX_SAVE_OBJECT_ENTRIES}).`
    );
  }

  entries.forEach(
    ([
      propertyName,
      propertyValue
    ]) => {
      if (
        DANGEROUS_SAVE_PROPERTY_NAMES
          .includes(
            propertyName
          )
      ) {
        throw new Error(
          `The save data contains a forbidden property: ${propertyName}`
        );
      }

      validateSaveDataSafety(
        propertyValue,
        `${path}.${propertyName}`,
        depth + 1,
        tracker
      );
    }
  );

  return true;
}

/* ==========================================================
   4. PRODUCER VALIDATION
========================================================== */

function validateProducerSaveMap(
  object,
  label,
  valueValidator
) {
  requirePlainSaveObject(
    object,
    label
  );

  rejectUnknownObjectKeys(
    object,
    producerOrder,
    label
  );

  producerOrder.forEach(
    (producerKey) => {
      valueValidator(
        object[producerKey] ?? 0,
        producerKey
      );
    }
  );
}

/* ==========================================================
   5. HARVESTER VALIDATION
========================================================== */

function validateHarvesterSaveState(
  harvesterState
) {
  requirePlainSaveObject(
    harvesterState,
    "The Harvester save data"
  );

  requireSaveBoolean(
    harvesterState.unlocked,
    "The Harvester unlock state"
  );

  requireSaveBoolean(
    harvesterState
      .legacyGrandfathered,
    "The Harvester legacy state"
  );

  requireSaveBoolean(
    harvesterState.deployed,
    "The Harvester deployment state"
  );

  if (
    harvesterState.position !==
    undefined
  ) {
    requirePlainSaveObject(
      harvesterState.position,
      "The Harvester position"
    );

    rejectUnknownObjectKeys(
      harvesterState.position,
      [
        "x",
        "y"
      ],
      "The Harvester position"
    );

    requireSaveNumber(
      harvesterState.position.x,
      "The Harvester x position",
      {
        allowUndefined: false,
        maximum: 1
      }
    );

    requireSaveNumber(
      harvesterState.position.y,
      "The Harvester y position",
      {
        allowUndefined: false,
        maximum: 1
      }
    );
  }

  [
    "activeStartedAt",
    "lastProcessedAt",
    "cooldownStartedAt",
    "cooldownEndsAt"
  ].forEach(
    (propertyName) => {
      requireSaveNumber(
        harvesterState[
          propertyName
        ],
        `The Harvester ${propertyName} value`,
        {
          maximum:
            Number.MAX_SAFE_INTEGER
        }
      );
    }
  );

  [
    "passiveMpsSnapshot",
    "outputPerSecondSnapshot",
    "storedMeat",
    "lifetimeMeat"
  ].forEach(
    (propertyName) => {
      requireSaveNumber(
        harvesterState[
          propertyName
        ],
        `The Harvester ${propertyName} value`
      );
    }
  );

  requireSaveNumber(
    harvesterState
      .ownedBuildingSnapshot,
    "The Harvester ownership snapshot",
    {
      integer: true,
      maximum:
        Number.MAX_SAFE_INTEGER
    }
  );
}

/* ==========================================================
   6. NACHT RAIDERS VALIDATION
   ----------------------------------------------------------
   Validates persistent Nacht Raiders state before its existing
   migration system normalizes individual gameplay records.
========================================================== */

function validateNachtRaidersSaveState(
  nachtRaidersState,
  options = {}
) {
  const allowRecordPruning =
    options.allowRecordPruning === true;

  requirePlainSaveObject(
    nachtRaidersState,
    "The Nacht Raiders save data"
  );

  requireSaveNumber(
    nachtRaidersState.stateVersion,
    "The Nacht Raiders state version",
    {
      integer: true,
      maximum:
        NACHT_RAIDERS_STATE_VERSION
    }
  );

  requireSaveBoolean(
    nachtRaidersState.hasStarted,
    "The Nacht Raiders start state"
  );

  if (
    nachtRaidersState.status !==
      undefined &&
    ![
      NACHT_RAIDERS_STATUS_INACTIVE,
      NACHT_RAIDERS_STATUS_RUNNING
    ].includes(
      nachtRaidersState.status
    )
  ) {
    throw new Error(
      "The Nacht Raiders status is invalid."
    );
  }

  if (
    nachtRaidersState.doctrine !==
      undefined &&
    !NACHT_RAIDERS_DOCTRINES
      .includes(
        nachtRaidersState.doctrine
      )
  ) {
    throw new Error(
      "The Nacht Raiders doctrine is invalid."
    );
  }

  requireSaveNumber(
    nachtRaidersState.cycleCount,
    "The Nacht Raiders cycle count",
    {
      integer: true,
      maximum:
        Number.MAX_SAFE_INTEGER
    }
  );

  if (
    nachtRaidersState.expedition !==
    undefined
  ) {
    const expedition =
      nachtRaidersState.expedition;

    requirePlainSaveObject(
      expedition,
      "The Nacht Raiders expedition state"
    );

    [
      "seed",
      "rngState",
      "eventSequence",
      "zoneDepth",
      "lastSimulationAt"
    ].forEach(
      (propertyName) => {
        requireSaveNumber(
          expedition[propertyName],
          `The Nacht Raiders ${propertyName} value`,
          {
            integer: true,
            maximum:
              Number.MAX_SAFE_INTEGER
          }
        );
      }
    );

    requireSaveNumber(
      expedition.travelProgress,
      "The Nacht Raiders travel progress",
      {
        maximum:
          Number.MAX_SAFE_INTEGER
      }
    );

    requireSaveString(
      expedition.zoneId,
      "The Nacht Raiders zone identifier",
      {
        maximumLength: 120
      }
    );

    if (
      expedition.currentEncounter !==
        undefined &&
      expedition.currentEncounter !==
        null
    ) {
      requirePlainSaveObject(
        expedition.currentEncounter,
        "The Nacht Raiders encounter state"
      );
    }
  }

  if (
    nachtRaidersState.operative !==
    undefined
  ) {
    const operative =
      nachtRaidersState.operative;

    requirePlainSaveObject(
      operative,
      "The Nacht Raiders operative state"
    );

    requireSaveNumber(
      operative.level,
      "The Nacht Raiders operative level",
      {
        integer: true,
        minimum: 1,
        maximum:
          NACHT_RAIDERS_LEVEL_SETTINGS
            .maximumLevel
      }
    );

    [
      "xp",
      "health",
      "maxHealth",
      "attack",
      "defense",
      "speed"
    ].forEach(
      (propertyName) => {
        requireSaveNumber(
          operative[propertyName],
          `The Nacht Raiders operative ${propertyName} value`,
          {
            maximum:
              Number.MAX_SAFE_INTEGER
          }
        );
      }
    );
  }

  if (
    nachtRaidersState.resources !==
    undefined
  ) {
    requirePlainSaveObject(
      nachtRaidersState.resources,
      "The Nacht Raiders resources"
    );

    Object.entries(
      nachtRaidersState.resources
    ).forEach(
      ([
        resourceKey,
        resourceValue
      ]) => {
        requireSaveNumber(
          resourceValue,
          `The Nacht Raiders ${resourceKey} resource`,
          {
            allowUndefined: false,
            integer: true,
            maximum:
              Number.MAX_SAFE_INTEGER
          }
        );
      }
    );
  }

  if (
    nachtRaidersState.statistics !==
    undefined
  ) {
    requirePlainSaveObject(
      nachtRaidersState.statistics,
      "The Nacht Raiders statistics"
    );

    Object.entries(
      nachtRaidersState.statistics
    ).forEach(
      ([
        statisticKey,
        statisticValue
      ]) => {
        requireSaveNumber(
          statisticValue,
          `The Nacht Raiders ${statisticKey} statistic`,
          {
            allowUndefined: false,
            maximum:
              Number.MAX_SAFE_INTEGER
          }
        );
      }
    );
  }

  if (
    nachtRaidersState.fieldRecords !==
    undefined
  ) {
    const fieldRecords =
      nachtRaidersState.fieldRecords;

    requirePlainSaveObject(
      fieldRecords,
      "The Nacht Raiders field records"
    );

    requireSaveNumber(
      fieldRecords.reportSequence,
      "The Nacht Raiders report sequence",
      {
        integer: true,
        maximum:
          Number.MAX_SAFE_INTEGER
      }
    );

    if (
      fieldRecords.pendingEntries !==
      undefined
    ) {
      requireSaveArray(
        fieldRecords.pendingEntries,
        "The Nacht Raiders pending records",
        allowRecordPruning
          ? MAX_SAVE_OBJECT_ENTRIES
          : NACHT_RAIDERS_PENDING_RECORD_LIMIT
      );

      fieldRecords.pendingEntries
        .forEach((record) => {
          requirePlainSaveObject(
            record,
            "A Nacht Raiders pending record"
          );
        });
    }

    if (
      fieldRecords.reports !==
      undefined
    ) {
      requireSaveArray(
        fieldRecords.reports,
        "The Nacht Raiders report archive",
        allowRecordPruning
          ? MAX_SAVE_OBJECT_ENTRIES
          : NACHT_RAIDERS_REPORT_ARCHIVE_LIMIT
      );

      fieldRecords.reports
        .forEach((record) => {
          requirePlainSaveObject(
            record,
            "A Nacht Raiders archived report"
          );
        });
    }
  }

  if (
    nachtRaidersState.window !==
    undefined
  ) {
    const windowState =
      nachtRaidersState.window;

    requirePlainSaveObject(
      windowState,
      "The Nacht Raiders window state"
    );

    if (
  windowState.mode !== undefined &&
  !NACHT_RAIDERS_WINDOW_MODES.includes(
    windowState.mode
  ) &&
  !NACHT_RAIDERS_LEGACY_WINDOW_MODES.includes(
    windowState.mode
  )
) {
  throw new Error(
    "The Nacht Raiders window mode is invalid."
  );
}

    if (
      windowState.position !==
      undefined
    ) {
      requirePlainSaveObject(
        windowState.position,
        "The Nacht Raiders window position"
      );

      [
        "x",
        "y"
      ].forEach((axis) => {
        requireSaveNumber(
          windowState.position[axis],
          `The Nacht Raiders window ${axis} position`,
          {
            allowUndefined: false,
            maximum: 1
          }
        );
      });
    }
  }
}

/* ==========================================================
   7. STORED STATE PRE-MIGRATION VALIDATION
   ----------------------------------------------------------
   Validates every field that exists in an older local save
   without requiring fields that migration is responsible for
   creating.
========================================================== */

function validateStoredGameStateBeforeMigration(saveState) {
  requirePlainSaveObject(saveState, "The stored save data");
  validateSaveDataSafety(saveState);

  requireSaveNumber(saveState.saveVersion, "The stored save version", {
    integer: true,
    maximum: CURRENT_SAVE_VERSION
  });

  requireSaveNumber(saveState.saveIntegrityVersion, "The stored save integrity version", {
    integer: true,
    maximum: CURRENT_SAVE_INTEGRITY_VERSION
  });

  requireSaveBoolean(saveState.modifiedSave, "The stored modified-save state");

  if (saveState.modifiedSaveReasons !== undefined) {
    requireSaveArray(
      saveState.modifiedSaveReasons,
      "The stored modified-save reasons",
      MAX_MODIFIED_SAVE_REASONS
    );

    saveState.modifiedSaveReasons.forEach((reason) => {
      requireSaveString(reason, "A stored modified-save reason", {
        allowUndefined: false,
        maximumLength: MAX_MODIFIED_SAVE_REASON_LENGTH
      });
    });
  }

  [
    "meat",
    "totalMeat",
    "meatPerClick",
    "meatPerSecond",
    "meatRemainder",
    "totalMeatRemainder"
  ].forEach((propertyName) => {
    requireSaveNumber(
      saveState[propertyName],
      `The stored ${propertyName} value`
    );
  });

  requireSaveNumber(saveState.totalClicks, "The stored total click count", {
    integer: true,
    maximum: Number.MAX_SAFE_INTEGER
  });

  requireSaveBoolean(saveState.infiniteMeat, "The stored infinite-MEAT state");

  requireSaveNumber(
    saveState.highestRevealedProducerIndex,
    "The stored producer reveal index",
    {
      integer: true,
      minimum: -1,
      maximum: producerOrder.length - 1
    }
  );

  if (saveState.producers !== undefined) {
    validateProducerSaveMap(
      saveState.producers,
      "The stored producer ownership data",
      (value, producerKey) => {
        requireSaveNumber(value, `The stored ${producerKey} ownership amount`, {
          allowUndefined: false,
          integer: true,
          maximum: Number.MAX_SAFE_INTEGER
        });
      }
    );
  }

  if (saveState.producerLifetimeMeat !== undefined) {
    validateProducerSaveMap(
      saveState.producerLifetimeMeat,
      "The stored producer lifetime data",
      (value, producerKey) => {
        requireSaveNumber(value, `The stored ${producerKey} lifetime amount`, {
          allowUndefined: false
        });
      }
    );
  }

  if (saveState.producerHighestTier !== undefined) {
    validateProducerSaveMap(
      saveState.producerHighestTier,
      "The stored producer tier-history data",
      (value, producerKey) => {
        requireSaveNumber(value, `The stored ${producerKey} highest tier`, {
          allowUndefined: false,
          integer: true,
          maximum: 3
        });
      }
    );
  }

  requireSaveNumber(saveState.runStartedAt, "The stored run-start timestamp", {
    integer: true,
    maximum: Number.MAX_SAFE_INTEGER
  });

  requireSaveNumber(saveState.lastSavedAt, "The stored last-save timestamp", {
    integer: true,
    maximum: Number.MAX_SAFE_INTEGER
  });

  if (saveState.features !== undefined) {
    requirePlainSaveObject(saveState.features, "The stored feature data");

    if (saveState.features.harvester !== undefined) {
      validateHarvesterSaveState(saveState.features.harvester);
    }

        if (
      saveState.features.nachtRaiders !==
      undefined
    ) {
      validateNachtRaidersSaveState(
        saveState.features.nachtRaiders,
        {
          allowRecordPruning: true
        }
      );
    }
  }

  if (saveState.settings !== undefined) {
    requirePlainSaveObject(saveState.settings, "The stored settings data");

    requireSaveBoolean(saveState.settings.sound, "The stored sound setting");
    requireSaveBoolean(saveState.settings.animations, "The stored animation setting");
    requireSaveBoolean(
      saveState.settings.nachtRaidersBootScreen,
      "The stored Nacht Raiders boot-screen setting"
    );
  }

  return true;
}

/* ==========================================================
   8. COMPLETE GAME-STATE VALIDATION
========================================================== */

function validateGameStateStructure(
  saveState
) {
  requirePlainSaveObject(
    saveState,
    "The imported save data"
  );

  validateSaveDataSafety(
    saveState
  );

  requireSaveNumber(
    saveState.saveVersion,
    "The save version",
    {
      integer: true,
      maximum:
        CURRENT_SAVE_VERSION
    }
  );

  requireSaveNumber(
    saveState.saveIntegrityVersion,
    "The save integrity version",
    {
      integer: true,
      maximum:
        CURRENT_SAVE_INTEGRITY_VERSION
    }
  );

  requireSaveBoolean(
    saveState.modifiedSave,
    "The modified-save state"
  );

  if (
    saveState.modifiedSaveReasons !==
    undefined
  ) {
    requireSaveArray(
      saveState.modifiedSaveReasons,
      "The modified-save reasons",
      MAX_MODIFIED_SAVE_REASONS
    );

    saveState.modifiedSaveReasons
      .forEach((reason) => {
        requireSaveString(
          reason,
          "A modified-save reason",
          {
            allowUndefined: false,
            maximumLength:
              MAX_MODIFIED_SAVE_REASON_LENGTH
          }
        );
      });
  }

  [
    "meat",
    "totalMeat",
    "meatPerClick",
    "meatPerSecond",
    "meatRemainder",
    "totalMeatRemainder"
  ].forEach(
    (propertyName) => {
      requireSaveNumber(
        saveState[propertyName],
        `The ${propertyName} value`,
        {
          allowUndefined:
            ![
              "meat",
              "totalMeat",
              "meatPerClick"
            ].includes(
              propertyName
            )
        }
      );
    }
  );

  requireSaveNumber(
    saveState.totalClicks,
    "The total click count",
    {
      allowUndefined: false,
      integer: true,
      maximum:
        Number.MAX_SAFE_INTEGER
    }
  );

  requireSaveBoolean(
    saveState.infiniteMeat,
    "The infinite-MEAT state"
  );

  requireSaveNumber(
    saveState
      .highestRevealedProducerIndex,
    "The producer reveal index",
    {
      integer: true,
      minimum: -1,
      maximum:
        producerOrder.length - 1
    }
  );

  validateProducerSaveMap(
    saveState.producers,
    "The producer ownership data",
    (
      value,
      producerKey
    ) => {
      requireSaveNumber(
        value,
        `The ${producerKey} ownership amount`,
        {
          allowUndefined: false,
          integer: true,
          maximum:
            Number.MAX_SAFE_INTEGER
        }
      );
    }
  );

  if (
    saveState.producerLifetimeMeat !==
    undefined
  ) {
    validateProducerSaveMap(
      saveState.producerLifetimeMeat,
      "The producer lifetime data",
      (
        value,
        producerKey
      ) => {
        requireSaveNumber(
          value,
          `The ${producerKey} lifetime amount`,
          {
            allowUndefined: false
          }
        );
      }
    );
  }

  if (
    saveState.producerHighestTier !==
    undefined
  ) {
    validateProducerSaveMap(
      saveState.producerHighestTier,
      "The producer tier-history data",
      (
        value,
        producerKey
      ) => {
        requireSaveNumber(
          value,
          `The ${producerKey} highest tier`,
          {
            allowUndefined: false,
            integer: true,
            maximum: 3
          }
        );
      }
    );
  }

  requireSaveNumber(
    saveState.runStartedAt,
    "The run-start timestamp",
    {
      allowUndefined: false,
      integer: true,
      maximum:
        Number.MAX_SAFE_INTEGER
    }
  );

  requireSaveNumber(
    saveState.lastSavedAt,
    "The last-save timestamp",
    {
      integer: true,
      maximum:
        Number.MAX_SAFE_INTEGER
    }
  );

  if (
    saveState.features !==
    undefined
  ) {
    requirePlainSaveObject(
      saveState.features,
      "The feature save data"
    );

    if (
      saveState.features.harvester !==
      undefined
    ) {
      validateHarvesterSaveState(
        saveState.features.harvester
      );
    }

    if (
      saveState.features.nachtRaiders !==
      undefined
    ) {
      validateNachtRaidersSaveState(
        saveState.features.nachtRaiders
      );
    }
  }

  if (
    saveState.settings !==
    undefined
  ) {
    requirePlainSaveObject(
      saveState.settings,
      "The settings save data"
    );

    requireSaveBoolean(
      saveState.settings.sound,
      "The sound setting"
    );

    requireSaveBoolean(
      saveState.settings.animations,
      "The animation setting"
    );

    requireSaveBoolean(
      saveState.settings
        .nachtRaidersBootScreen,
      "The Nacht Raiders boot-screen setting"
    );
  }

  return true;
}

/* ==========================================================
   9. IMPOSSIBLE-STATE COMPARISON
========================================================== */

function isMeaningfullyGreater(
  value,
  comparisonValue
) {
  const tolerance =
    Math.max(
      0.000001,
      Math.abs(
        comparisonValue
      ) * 1e-12
    );

  return (
    value >
    comparisonValue +
      tolerance
  );
}

/* ==========================================================
   10. IMPOSSIBLE-STATE INSPECTION
   ----------------------------------------------------------
   Identifies contradictory but structurally valid progression.
   These findings mark a save as modified instead of deleting it.
========================================================== */

function inspectGameStateForImpossibleProgress(
  saveState,
  currentTime = Date.now()
) {
  const reasons = [];

  const addReason = (reason) => {
    if (
      !reasons.includes(reason)
    ) {
      reasons.push(reason);
    }
  };

  const totalMeat =
    Number(
      saveState.totalMeat
    ) || 0;

  const currentMeat =
    Number(
      saveState.meat
    ) || 0;

  if (
    isMeaningfullyGreater(
      currentMeat,
      totalMeat
    )
  ) {
    addReason(
      "Current MEAT exceeds lifetime MEAT."
    );
  }

  if (
    saveState.modifiedSave !== true &&
    Array.isArray(
      saveState.modifiedSaveReasons
    ) &&
    saveState.modifiedSaveReasons
      .length > 0
  ) {
    addReason(
      "Modified-save reasons exist while the modified-save flag is disabled."
    );
  }

  const futureTimestampLimit =
    currentTime +
    SAVE_FUTURE_TIMESTAMP_TOLERANCE_MS;

  if (
    Number(
      saveState.runStartedAt
    ) >
    futureTimestampLimit
  ) {
    addReason(
      "The run-start timestamp is implausibly far in the future."
    );
  }

  if (
    Number(
      saveState.lastSavedAt
    ) >
    futureTimestampLimit
  ) {
    addReason(
      "The last-save timestamp is implausibly far in the future."
    );
  }

  if (
    Number(
      saveState.lastSavedAt
    ) > 0 &&
    Number(
      saveState.runStartedAt
    ) >
    Number(
      saveState.lastSavedAt
    )
  ) {
    addReason(
      "The run-start timestamp occurs after the last-save timestamp."
    );
  }

  let trackedProducerLifetimeMeat =
    0;

  if (
    isPlainSaveObject(
      saveState.producerLifetimeMeat
    )
  ) {
    producerOrder.forEach(
      (producerKey) => {
        const lifetimeAmount =
          Number(
            saveState
              .producerLifetimeMeat[
                producerKey
              ]
          ) || 0;

        if (
          isMeaningfullyGreater(
            lifetimeAmount,
            totalMeat
          )
        ) {
          addReason(
            `${producerData[producerKey].name} lifetime production exceeds lifetime MEAT.`
          );
        }

        trackedProducerLifetimeMeat =
          addClampedMeatValues(
            trackedProducerLifetimeMeat,
            lifetimeAmount
          );
      }
    );
  }

  if (
    isMeaningfullyGreater(
      trackedProducerLifetimeMeat,
      totalMeat
    )
  ) {
    addReason(
      "Tracked producer output exceeds lifetime MEAT."
    );
  }

  const harvesterState =
    saveState.features
      ?.harvester;

  if (
    isPlainSaveObject(
      harvesterState
    )
  ) {
    const harvesterLifetimeMeat =
      Number(
        harvesterState.lifetimeMeat
      ) || 0;

    if (
      isMeaningfullyGreater(
        harvesterLifetimeMeat,
        totalMeat
      )
    ) {
      addReason(
        "Harvester lifetime production exceeds lifetime MEAT."
      );
    }

    if (
      harvesterState.deployed ===
        true &&
      harvesterState.unlocked !==
        true
    ) {
      addReason(
        "The Harvester is deployed without being unlocked."
      );
    }

    if (
      harvesterState.unlocked ===
        true &&
      harvesterState
        .legacyGrandfathered !==
        true &&
      Number(
        saveState
          .producerHighestTier
          ?.silverSpoon || 0
      ) < 3
    ) {
      addReason(
        "The Harvester is unlocked without Silver Spoon Tier III history."
      );
    }

    if (
      harvesterState.deployed ===
        true &&
      Number(
        harvesterState
          .activeStartedAt
      ) <= 0
    ) {
      addReason(
        "The deployed Harvester has no active-start timestamp."
      );
    }

    if (
      Number(
        harvesterState
          .lastProcessedAt
      ) > 0 &&
      Number(
        harvesterState
          .activeStartedAt
      ) >
      Number(
        harvesterState
          .lastProcessedAt
      )
    ) {
      addReason(
        "The Harvester was processed before its active cycle began."
      );
    }

    if (
      Number(
        harvesterState
          .cooldownEndsAt
      ) > 0 &&
      Number(
        harvesterState
          .cooldownStartedAt
      ) >
      Number(
        harvesterState
          .cooldownEndsAt
      )
    ) {
      addReason(
        "The Harvester cooldown ends before it begins."
      );
    }
  }

  if (
    isPlainSaveObject(
      saveState.producers
    )
  ) {
    let highestOwnedProducerIndex =
      -1;

    producerOrder.forEach(
      (
        producerKey,
        producerIndex
      ) => {
        const ownedAmount =
          Number(
            saveState.producers[
              producerKey
            ]
          ) || 0;

        if (
          ownedAmount > 0
        ) {
          highestOwnedProducerIndex =
            producerIndex;
        }

        if (
          ownedAmount > 0 &&
          isPlainSaveObject(
            saveState
              .producerHighestTier
          ) &&
          typeof
            getTemporaryProducerTierForOwnedAmount ===
            "function"
        ) {
          const inferredTier =
            getTemporaryProducerTierForOwnedAmount(
              producerKey,
              ownedAmount
            );

          const recordedTier =
            Number(
              saveState
                .producerHighestTier[
                  producerKey
                ]
            ) || 0;

          if (
            recordedTier <
            inferredTier
          ) {
            addReason(
              `${producerData[producerKey].name} ownership exceeds its recorded tier history.`
            );
          }
        }
      }
    );

    if (
      Number.isInteger(
        saveState
          .highestRevealedProducerIndex
      ) &&
      saveState
        .highestRevealedProducerIndex <
      highestOwnedProducerIndex
    ) {
      addReason(
        "Owned producers exceed the recorded producer reveal progress."
      );
    }
  }

  const nachtRaidersState =
    saveState.features
      ?.nachtRaiders;

  if (
    isPlainSaveObject(
      nachtRaidersState
    )
  ) {
    if (
      nachtRaidersState.hasStarted ===
        false &&
      nachtRaidersState.status ===
        NACHT_RAIDERS_STATUS_RUNNING
    ) {
      addReason(
        "Nacht Raiders is running without having started."
      );
    }

    const operative =
      nachtRaidersState.operative;

    if (
      isPlainSaveObject(
        operative
      ) &&
      Number(
        operative.health
      ) >
      Number(
        operative.maxHealth
      )
    ) {
      addReason(
        "Nacht Raiders operative health exceeds maximum health."
      );
    }

    const statistics =
      nachtRaidersState.statistics;

    if (
      isPlainSaveObject(
        statistics
      )
    ) {
      const resolvedEncounters =
        Number(
          statistics.victories || 0
        ) +
        Number(
          statistics.stalemates || 0
        );

      if (
        resolvedEncounters >
        Number(
          statistics.encounters || 0
        )
      ) {
        addReason(
          "Nacht Raiders resolved encounters exceed total encounters."
        );
      }
    }
  }

  return normalizeModifiedSaveReasons(
    reasons
  );
}
