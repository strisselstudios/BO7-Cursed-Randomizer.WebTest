/* ==========================================================
   1. SAVE MIGRATION
   ----------------------------------------------------------
   Repairs missing fields, preserves producer ownership,
   restores permanent producer reveal progress, records the
   highest producer tier, and migrates Harvester unlock data.
========================================================== */

function migrateGameState(savedState) {
  const defaultState =
    createDefaultGameState();

  const savedVersion =
    Number.isInteger(
      savedState.saveVersion
    )
      ? savedState.saveVersion
      : 0;

  const savedProducers =
    savedState.producers &&
    typeof savedState.producers ===
      "object" &&
    !Array.isArray(
      savedState.producers
    )
      ? savedState.producers
      : {};

  const savedProducerLifetimeMeat =
    savedState.producerLifetimeMeat &&
    typeof savedState
      .producerLifetimeMeat ===
      "object" &&
    !Array.isArray(
      savedState.producerLifetimeMeat
    )
      ? savedState.producerLifetimeMeat
      : {};

  const savedProducerHighestTier =
    savedState.producerHighestTier &&
    typeof savedState
      .producerHighestTier ===
      "object" &&
    !Array.isArray(
      savedState.producerHighestTier
    )
      ? savedState.producerHighestTier
      : {};

  const savedFeatures =
    savedState.features &&
    typeof savedState.features ===
      "object" &&
    !Array.isArray(
      savedState.features
    )
      ? savedState.features
      : {};

  const savedHarvesterState =
    savedFeatures.harvester &&
    typeof savedFeatures.harvester ===
      "object" &&
    !Array.isArray(
      savedFeatures.harvester
    )
      ? savedFeatures.harvester
      : {};

   const savedHarvesterPosition =
  savedHarvesterState.position &&
  typeof savedHarvesterState.position ===
    "object" &&
  !Array.isArray(
    savedHarvesterState.position
  )
    ? savedHarvesterState.position
    : {};

const savedHarvesterPositionX =
  Number(
    savedHarvesterPosition.x
  );

const savedHarvesterPositionY =
  Number(
    savedHarvesterPosition.y
  );

const migratedHarvesterPosition = {
  x:
    Number.isFinite(
      savedHarvesterPositionX
    )
      ? Math.min(
          1,
          Math.max(
            0,
            savedHarvesterPositionX
          )
        )
      : 0.5,

  y:
    Number.isFinite(
      savedHarvesterPositionY
    )
      ? Math.min(
          1,
          Math.max(
            0,
            savedHarvesterPositionY
          )
        )
      : 0.5
};

const migrationTimestamp =
  Date.now();

function migrateHarvesterNumber(
  value
) {
  const numericValue =
    Number(value);

  return (
    Number.isFinite(
      numericValue
    ) &&
    numericValue >= 0
  )
    ? numericValue
    : 0;
}

const savedHarvesterActiveStartedAt =
  migrateHarvesterNumber(
    savedHarvesterState
      .activeStartedAt
  );

const savedHarvesterLastProcessedAt =
  migrateHarvesterNumber(
    savedHarvesterState
      .lastProcessedAt
  );

const savedHarvesterCooldownStartedAt =
  migrateHarvesterNumber(
    savedHarvesterState
      .cooldownStartedAt
  );

const savedHarvesterCooldownEndsAt =
  migrateHarvesterNumber(
    savedHarvesterState
      .cooldownEndsAt
  );

const migratedHarvesterStoredMeat =
  migrateHarvesterNumber(
    savedHarvesterState
      .storedMeat
  );

const migratedHarvesterLifetimeMeat =
  migrateHarvesterNumber(
    savedHarvesterState
      .lifetimeMeat
  );

  const migratedProducers = {};

  const migratedProducerLifetimeMeat =
    {};

  const migratedProducerHighestTier =
    {};

  producerOrder.forEach(
    (producerKey) => {
      const savedOwnedAmount =
        savedProducers[
          producerKey
        ];

      const migratedOwnedAmount =
        Number.isInteger(
          savedOwnedAmount
        ) &&
        savedOwnedAmount >= 0
          ? savedOwnedAmount
          : 0;

      migratedProducers[
        producerKey
      ] = migratedOwnedAmount;

      const savedLifetimeAmount =
        Number(
          savedProducerLifetimeMeat[
            producerKey
          ]
        );

      migratedProducerLifetimeMeat[
        producerKey
      ] =
        Number.isFinite(
          savedLifetimeAmount
        ) &&
        savedLifetimeAmount >= 0
          ? savedLifetimeAmount
          : 0;

      const inferredCurrentTier =
        migratedOwnedAmount > 0 &&
        typeof
          getTemporaryProducerTierForOwnedAmount ===
          "function"
          ? getTemporaryProducerTierForOwnedAmount(
              producerKey,
              migratedOwnedAmount
            )
          : (
              migratedOwnedAmount > 0
                ? 1
                : 0
            );

      const savedHighestTier =
        Number(
          savedProducerHighestTier[
            producerKey
          ]
        );

      const validatedSavedHighestTier =
        Number.isInteger(
          savedHighestTier
        ) &&
        savedHighestTier >= 0 &&
        savedHighestTier <= 3
          ? savedHighestTier
          : 0;

      migratedProducerHighestTier[
        producerKey
      ] = Math.max(
        inferredCurrentTier,
        validatedSavedHighestTier
      );
    }
  );

  const legacySaveHasProgress =
    Number(savedState.totalMeat) > 0 ||
    Number(savedState.totalClicks) > 0 ||
    Object.values(
      migratedProducers
    ).some(
      (ownedAmount) =>
        ownedAmount > 0
    ) ||
    Object.values(
      migratedProducerLifetimeMeat
    ).some(
      (lifetimeAmount) =>
        lifetimeAmount > 0
    );

  /*
   * Version 6 introduces permanent producer-tier history.
   *
   * Older progressed saves cannot prove whether Tier III was
   * reached and later sold away, so they are grandfathered.
   */
  const shouldGrandfatherHarvester =
    savedVersion < 6 &&
    legacySaveHasProgress;

  const harvesterTierWasRecorded =
    migratedProducerHighestTier
      .silverSpoon >= 3;

  const harvesterWasAlreadyUnlocked =
    savedHarvesterState.unlocked ===
    true;

  const harvesterWasAlreadyGrandfathered =
    savedHarvesterState
      .legacyGrandfathered === true;

 const harvesterShouldBeUnlocked =
  harvesterWasAlreadyUnlocked ||
  harvesterTierWasRecorded ||
  shouldGrandfatherHarvester;

const harvesterShouldBeDeployed =
  harvesterShouldBeUnlocked &&
  savedHarvesterState.deployed ===
    true;


 const migratedActiveStartedAt =
  harvesterShouldBeDeployed
    ? (
        savedHarvesterActiveStartedAt >
        0
          ? savedHarvesterActiveStartedAt
          : migrationTimestamp
      )
    : 0;

const migratedLastProcessedAt =
  harvesterShouldBeDeployed
    ? (
        savedHarvesterLastProcessedAt >
        0
          ? savedHarvesterLastProcessedAt
          : migratedActiveStartedAt
      )
    : 0;

const savedCooldownIsStillActive =
  !harvesterShouldBeDeployed &&
  savedHarvesterCooldownEndsAt >
    migrationTimestamp;

const migratedCooldownStartedAt =
  savedCooldownIsStillActive
    ? savedHarvesterCooldownStartedAt
    : 0;

const migratedCooldownEndsAt =
  savedCooldownIsStillActive
    ? savedHarvesterCooldownEndsAt
    : 0;
   
  const migratedState = {
    ...defaultState,
    ...savedState,

    producers:
      migratedProducers,

    producerHighestTier:
      migratedProducerHighestTier,

    producerLifetimeMeat:
      migratedProducerLifetimeMeat,

    features: {
      ...defaultState.features,
      ...savedFeatures,

      harvester: {
        ...defaultState
          .features
          .harvester,

        ...savedHarvesterState,

        unlocked:
          harvesterShouldBeUnlocked,

        legacyGrandfathered:
          harvesterWasAlreadyGrandfathered ||
          shouldGrandfatherHarvester,

        deployed:
          harvesterShouldBeDeployed,

        position:
          migratedHarvesterPosition,

        activeStartedAt:
          migratedActiveStartedAt,

        lastProcessedAt:
          migratedLastProcessedAt,

        cooldownStartedAt:
          migratedCooldownStartedAt,

        cooldownEndsAt:
          migratedCooldownEndsAt,

        storedMeat:
          migratedHarvesterStoredMeat,

        lifetimeMeat:
          migratedHarvesterLifetimeMeat
      }
    },

    settings: {
      ...defaultState.settings,
      ...(savedState.settings || {})
    }
  };

  const savedRevealIndex =
    Number.isInteger(
      savedState
        .highestRevealedProducerIndex
    )
      ? savedState
          .highestRevealedProducerIndex
      : -1;

  let highestOwnedProducerIndex =
    -1;

  producerOrder.forEach(
    (
      producerKey,
      producerIndex
    ) => {
      const amountOwned =
        migratedProducers[
          producerKey
        ] ?? 0;

      if (amountOwned > 0) {
        highestOwnedProducerIndex =
          producerIndex;
      }
    }
  );

  const boundedSavedRevealIndex =
    Math.min(
      producerOrder.length - 1,
      Math.max(
        -1,
        savedRevealIndex
      )
    );

  migratedState
    .highestRevealedProducerIndex =
      Math.max(
        boundedSavedRevealIndex,
        highestOwnedProducerIndex
      );

  migratedState.saveVersion =
    CURRENT_SAVE_VERSION;

  return migratedState;
}

/* ==========================================================
   2. LOCAL SAVE SYSTEM
   ----------------------------------------------------------
   Loads and saves MEAT.exe progress using localStorage.
========================================================== */

function loadGame() {
  const savedData =
    localStorage.getItem(
      MEAT_SAVE_KEY
    );

  if (!savedData) {
    gameState =
      createDefaultGameState();

    return;
  }

  try {
    const parsedSave =
      JSON.parse(savedData);

    gameState =
      migrateGameState(
        parsedSave
      );

    calculateMeatPerSecond();
  } catch (error) {
    console.error(
      "MEAT.exe save could not be loaded:",
      error
    );

    gameState =
      createDefaultGameState();
  }
}

function saveGame() {
  gameState.lastSavedAt =
    Date.now();

  try {
    localStorage.setItem(
      MEAT_SAVE_KEY,
      JSON.stringify(gameState)
    );

    return true;
  } catch (error) {
    console.error(
      "MEAT.exe save could not be stored:",
      error
    );

    return false;
  }
}

/* ==========================================================
   3. SAVE EXPORT
   ----------------------------------------------------------
   Downloads the current MEAT.exe progress as a JSON file that
   can be transferred to another device.
========================================================== */

function exportGameSave() {
  try {
    saveGame();

    const exportPackage = {
      game: "MEAT.exe",
      exportVersion: 1,
      exportedAt: Date.now(),
      saveData: gameState
    };

    const saveFileContents =
      JSON.stringify(
        exportPackage,
        null,
        2
      );

    const saveBlob =
      new Blob(
        [saveFileContents],
        {
          type:
            "application/json"
        }
      );

    const downloadUrl =
      URL.createObjectURL(
        saveBlob
      );

    const downloadLink =
      document.createElement("a");

    const exportDate =
      new Date();

    const timestamp =
      [
        exportDate.getFullYear(),

        String(
          exportDate.getMonth() + 1
        ).padStart(2, "0"),

        String(
          exportDate.getDate()
        ).padStart(2, "0")
      ].join("-") +
      "_" +
      [
        String(
          exportDate.getHours()
        ).padStart(2, "0"),

        String(
          exportDate.getMinutes()
        ).padStart(2, "0"),

        String(
          exportDate.getSeconds()
        ).padStart(2, "0")
      ].join("-");

    downloadLink.href =
      downloadUrl;

    downloadLink.download =
      `MEAT-exe-save-${timestamp}.json`;

    document.body.appendChild(
      downloadLink
    );

    downloadLink.click();
    downloadLink.remove();

    window.setTimeout(
      () => {
        URL.revokeObjectURL(
          downloadUrl
        );
      },
      0
    );

    return true;
  } catch (error) {
    console.error(
      "MEAT.exe save could not be exported:",
      error
    );

    return false;
  }
}

/* ==========================================================
   4. SAVE IMPORT
   ----------------------------------------------------------
   Reads, validates, migrates, and stores an exported MEAT.exe
   save file.
========================================================== */

function isValidImportedNumber(
  value,
  allowZero = true
) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    (
      allowZero
        ? value >= 0
        : value > 0
    )
  );
}

function validateImportedGameState(
  importedState
) {
  if (
    !importedState ||
    typeof importedState !==
      "object" ||
    Array.isArray(
      importedState
    )
  ) {
    throw new Error(
      "The imported save data is invalid."
    );
  }

  const requiredNumbers = [
    "meat",
    "totalMeat",
    "totalClicks",
    "meatPerClick",
    "runStartedAt"
  ];

  requiredNumbers.forEach(
    (propertyName) => {
      if (
        !isValidImportedNumber(
          importedState[
            propertyName
          ]
        )
      ) {
        throw new Error(
          `Invalid save value: ${propertyName}`
        );
      }
    }
  );

  if (
    importedState.lastSavedAt !==
      undefined &&
    !isValidImportedNumber(
      importedState.lastSavedAt
    )
  ) {
    throw new Error(
      "Invalid save value: lastSavedAt"
    );
  }

  if (
    !Number.isInteger(
      importedState.totalClicks
    )
  ) {
    throw new Error(
      "The imported click count is invalid."
    );
  }

  if (
    !importedState.producers ||
    typeof importedState.producers !==
      "object" ||
    Array.isArray(
      importedState.producers
    )
  ) {
    throw new Error(
      "The imported producer data is invalid."
    );
  }

  producerOrder.forEach(
    (producerKey) => {
      const ownedAmount =
        importedState.producers[
          producerKey
        ] ?? 0;

      if (
        !Number.isInteger(
          ownedAmount
        ) ||
        ownedAmount < 0
      ) {
        throw new Error(
          `Invalid producer amount: ${producerKey}`
        );
      }
    }
  );

  if (
    importedState
      .producerLifetimeMeat !==
      undefined
  ) {
    if (
      !importedState
        .producerLifetimeMeat ||
      typeof importedState
        .producerLifetimeMeat !==
        "object" ||
      Array.isArray(
        importedState
          .producerLifetimeMeat
      )
    ) {
      throw new Error(
        "The imported producer lifetime data is invalid."
      );
    }

    producerOrder.forEach(
      (producerKey) => {
        const lifetimeAmount =
          importedState
            .producerLifetimeMeat[
              producerKey
            ] ?? 0;

        if (
          typeof lifetimeAmount !==
            "number" ||
          !Number.isFinite(
            lifetimeAmount
          ) ||
          lifetimeAmount < 0
        ) {
          throw new Error(
            `Invalid producer lifetime amount: ${producerKey}`
          );
        }
      }
    );
  }

  if (
    importedState
      .producerHighestTier !==
      undefined
  ) {
    if (
      !importedState
        .producerHighestTier ||
      typeof importedState
        .producerHighestTier !==
        "object" ||
      Array.isArray(
        importedState
          .producerHighestTier
      )
    ) {
      throw new Error(
        "The imported producer tier history is invalid."
      );
    }

    producerOrder.forEach(
      (producerKey) => {
        const highestTier =
          importedState
            .producerHighestTier[
              producerKey
            ] ?? 0;

        if (
          !Number.isInteger(
            highestTier
          ) ||
          highestTier < 0 ||
          highestTier > 3
        ) {
          throw new Error(
            `Invalid highest producer tier: ${producerKey}`
          );
        }
      }
    );
  }

  if (
    importedState.features !==
      undefined
  ) {
    if (
      !importedState.features ||
      typeof importedState.features !==
        "object" ||
      Array.isArray(
        importedState.features
      )
    ) {
      throw new Error(
        "The imported feature data is invalid."
      );
    }

    const importedHarvesterState =
      importedState
        .features
        .harvester;

    if (
      importedHarvesterState !==
        undefined &&
      (
        !importedHarvesterState ||
        typeof importedHarvesterState !==
          "object" ||
        Array.isArray(
          importedHarvesterState
        )
      )
    ) {
      throw new Error(
        "The imported Harvester data is invalid."
      );
    }

    if (
      importedHarvesterState
        ?.unlocked !== undefined &&
      typeof importedHarvesterState
        .unlocked !== "boolean"
    ) {
      throw new Error(
        "The imported Harvester unlock state is invalid."
      );
    }

    if (
      importedHarvesterState
        ?.legacyGrandfathered !==
        undefined &&
      typeof importedHarvesterState
        .legacyGrandfathered !==
        "boolean"
    ) {
      throw new Error(
        "The imported Harvester legacy state is invalid."
      );
    }
     if (
  importedHarvesterState
    ?.deployed !== undefined &&
  typeof importedHarvesterState
    .deployed !== "boolean"
) {
  throw new Error(
    "The imported Harvester deployment state is invalid."
  );
}

if (
  importedHarvesterState
    ?.position !== undefined
) {
  const importedPosition =
    importedHarvesterState.position;

  if (
    !importedPosition ||
    typeof importedPosition !==
      "object" ||
    Array.isArray(
      importedPosition
    )
  ) {
    throw new Error(
      "The imported Harvester position is invalid."
    );
  }

  [
    "x",
    "y"
  ].forEach(
    (axis) => {
      const coordinate =
        importedPosition[axis];

      if (
        typeof coordinate !==
          "number" ||
        !Number.isFinite(
          coordinate
        ) ||
        coordinate < 0 ||
        coordinate > 1
      ) {
        throw new Error(
          `Invalid Harvester position: ${axis}`
        );
      }
    }
  );
}
  }

[
  "activeStartedAt",
  "lastProcessedAt",
  "cooldownStartedAt",
  "cooldownEndsAt",
  "storedMeat",
  "lifetimeMeat"
].forEach(
  (propertyName) => {
    const propertyValue =
      importedHarvesterState?.[
        propertyName
      ];

    if (
      propertyValue === undefined
    ) {
      return;
    }

    if (
      typeof propertyValue !==
        "number" ||
      !Number.isFinite(
        propertyValue
      ) ||
      propertyValue < 0
    ) {
      throw new Error(
        `Invalid Harvester value: ${propertyName}`
      );
    }
  }
);

  if (
    importedState.settings !==
      undefined &&
    (
      !importedState.settings ||
      typeof importedState.settings !==
        "object" ||
      Array.isArray(
        importedState.settings
      )
    )
  ) {
    throw new Error(
      "The imported settings are invalid."
    );
  }

  if (
    importedState.settings?.sound !==
      undefined &&
    typeof importedState.settings
      .sound !== "boolean"
  ) {
    throw new Error(
      "The imported sound setting is invalid."
    );
  }

  if (
    importedState.settings
      ?.animations !== undefined &&
    typeof importedState.settings
      .animations !== "boolean"
  ) {
    throw new Error(
      "The imported animation setting is invalid."
    );
  }

  return true;
}

async function importGameSave(file) {
  try {
    if (!(file instanceof File)) {
      throw new Error(
        "No save file was selected."
      );
    }

    const fileContents =
      await file.text();

    const importPackage =
      JSON.parse(
        fileContents
      );

    if (
      !importPackage ||
      typeof importPackage !==
        "object" ||
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

    validateImportedGameState(
      importPackage.saveData
    );

    gameState =
      migrateGameState(
        importPackage.saveData
      );

    calculateMeatPerSecond();

    const saveSucceeded =
      saveGame();

    if (!saveSucceeded) {
      throw new Error(
        "The imported save could not be stored."
      );
    }

    return true;
  } catch (error) {
    console.error(
      "MEAT.exe save could not be imported:",
      error
    );

    return false;
  }
}

/* ==========================================================
   5. PERMANENT GAME RESET
   ----------------------------------------------------------
   Deletes the stored save and replaces the current state with
   a completely new game.
========================================================== */

function resetGameState() {
  try {
    localStorage.removeItem(
      MEAT_SAVE_KEY
    );

    gameState =
      createDefaultGameState();

    calculateMeatPerSecond();

    return saveGame();
  } catch (error) {
    console.error(
      "MEAT.exe could not be reset:",
      error
    );

    return false;
  }
}
