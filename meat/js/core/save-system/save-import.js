/* ==========================================================
   SAVE IMPORT
   ----------------------------------------------------------
   Reads, validates, migrates, and stores an exported MEAT.exe
   save file.
========================================================== */

function isValidImportedNumber(value, allowZero = true) {
  return typeof value === "number" && Number.isFinite(value) && (allowZero ? value >= 0 : value > 0);
}

function validateImportedGameState(importedState) {
  if (!importedState || typeof importedState !== "object" || Array.isArray(importedState)) {
    throw new Error("The imported save data is invalid.");
  }

  const requiredNumbers = ["meat", "totalMeat", "totalClicks", "meatPerClick", "runStartedAt"];

  requiredNumbers.forEach((propertyName) => {
    if (!isValidImportedNumber(importedState[propertyName])) {
      throw new Error(`Invalid save value: ${propertyName}`);
    }
  });

  if (importedState.lastSavedAt !== undefined && !isValidImportedNumber(importedState.lastSavedAt)) {
    throw new Error("Invalid save value: lastSavedAt");
  }

  if (!Number.isInteger(importedState.totalClicks)) {
    throw new Error("The imported click count is invalid.");
  }

  if (!importedState.producers || typeof importedState.producers !== "object" || Array.isArray(importedState.producers)) {
    throw new Error("The imported producer data is invalid.");
  }

  producerOrder.forEach((producerKey) => {
    const ownedAmount = importedState.producers[producerKey] ?? 0;
    if (!Number.isInteger(ownedAmount) || ownedAmount < 0) {
      throw new Error(`Invalid producer amount: ${producerKey}`);
    }
  });

  if (importedState.producerLifetimeMeat !== undefined) {
    if (!importedState.producerLifetimeMeat || typeof importedState.producerLifetimeMeat !== "object" || Array.isArray(importedState.producerLifetimeMeat)) {
      throw new Error("The imported producer lifetime data is invalid.");
    }

    producerOrder.forEach((producerKey) => {
      const lifetimeAmount = importedState.producerLifetimeMeat[producerKey] ?? 0;
      if (typeof lifetimeAmount !== "number" || !Number.isFinite(lifetimeAmount) || lifetimeAmount < 0) {
        throw new Error(`Invalid producer lifetime amount: ${producerKey}`);
      }
    });
  }

  if (importedState.producerHighestTier !== undefined) {
    if (!importedState.producerHighestTier || typeof importedState.producerHighestTier !== "object" || Array.isArray(importedState.producerHighestTier)) {
      throw new Error("The imported producer tier history is invalid.");
    }

    producerOrder.forEach((producerKey) => {
      const highestTier = importedState.producerHighestTier[producerKey] ?? 0;
      if (!Number.isInteger(highestTier) || highestTier < 0 || highestTier > 3) {
        throw new Error(`Invalid highest producer tier: ${producerKey}`);
      }
    });
  }

  if (importedState.features !== undefined) {
    if (!importedState.features || typeof importedState.features !== "object" || Array.isArray(importedState.features)) {
      throw new Error("The imported feature data is invalid.");
    }

    const importedHarvesterState = importedState.features.harvester;

    if (importedHarvesterState !== undefined && (!importedHarvesterState || typeof importedHarvesterState !== "object" || Array.isArray(importedHarvesterState))) {
      throw new Error("The imported Harvester data is invalid.");
    }

    if (importedHarvesterState !== undefined) {
      if (importedHarvesterState.unlocked !== undefined && typeof importedHarvesterState.unlocked !== "boolean") {
        throw new Error("The imported Harvester unlock state is invalid.");
      }

      if (importedHarvesterState.legacyGrandfathered !== undefined && typeof importedHarvesterState.legacyGrandfathered !== "boolean") {
        throw new Error("The imported Harvester legacy state is invalid.");
      }

      if (importedHarvesterState.deployed !== undefined && typeof importedHarvesterState.deployed !== "boolean") {
        throw new Error("The imported Harvester deployment state is invalid.");
      }

      if (importedHarvesterState.position !== undefined) {
        const importedPosition = importedHarvesterState.position;

        if (!importedPosition || typeof importedPosition !== "object" || Array.isArray(importedPosition)) {
          throw new Error("The imported Harvester position is invalid.");
        }

        ["x", "y"].forEach((axis) => {
          const coordinate = importedPosition[axis];
          if (typeof coordinate !== "number" || !Number.isFinite(coordinate) || coordinate < 0 || coordinate > 1) {
            throw new Error(`Invalid Harvester position: ${axis}`);
          }
        });

        const importedNachtRaidersState = importedState.features.nachtRaiders;

        if (importedNachtRaidersState !== undefined && (!importedNachtRaidersState || typeof importedNachtRaidersState !== "object" || Array.isArray(importedNachtRaidersState))) {
          throw new Error("The imported Nacht Raiders data is invalid.");
        }

        if (importedNachtRaidersState?.hasStarted !== undefined && typeof importedNachtRaidersState.hasStarted !== "boolean") {
          throw new Error("The imported Nacht Raiders start state is invalid.");
        }
      }

      [
        "activeStartedAt",
        "lastProcessedAt",
        "passiveMpsSnapshot",
        "outputPerSecondSnapshot",
        "cooldownStartedAt",
        "cooldownEndsAt",
        "storedMeat",
        "lifetimeMeat"
      ].forEach((propertyName) => {
        const propertyValue = importedHarvesterState[propertyName];
        if (propertyValue === undefined) {
          return;
        }
        if (typeof propertyValue !== "number" || !Number.isFinite(propertyValue) || propertyValue < 0) {
          throw new Error(`Invalid Harvester value: ${propertyName}`);
        }
      });

      if (importedHarvesterState.ownedBuildingSnapshot !== undefined && (!Number.isInteger(importedHarvesterState.ownedBuildingSnapshot) || importedHarvesterState.ownedBuildingSnapshot < 0)) {
        throw new Error("The imported Harvester ownership snapshot is invalid.");
      }
    }
  }

  if (importedState.settings !== undefined && (!importedState.settings || typeof importedState.settings !== "object" || Array.isArray(importedState.settings))) {
    throw new Error("The imported settings are invalid.");
  }

  if (importedState.settings?.sound !== undefined && typeof importedState.settings.sound !== "boolean") {
    throw new Error("The imported sound setting is invalid.");
  }

  if (importedState.settings?.animations !== undefined && typeof importedState.settings.animations !== "boolean") {
    throw new Error("The imported animation setting is invalid.");
  }

  if (importedState.settings?.nachtRaidersBootScreen !== undefined && typeof importedState.settings.nachtRaidersBootScreen !== "boolean") {
    throw new Error("The imported Nacht Raiders boot-screen setting is invalid.");
  }

  return true;
}

async function importGameSave(file) {
  try {
    if (!(file instanceof File)) {
      throw new Error("No save file was selected.");
    }

    const fileContents = await file.text();
    const importPackage = JSON.parse(fileContents);

    if (!importPackage || typeof importPackage !== "object" || importPackage.game !== "MEAT.exe" || importPackage.exportVersion !== 1 || !importPackage.saveData) {
      throw new Error("This is not a valid MEAT.exe save export.");
    }

    validateImportedGameState(importPackage.saveData);
    gameState = migrateGameState(importPackage.saveData);
    calculateMeatPerSecond();

    const saveSucceeded = saveGame();
    if (!saveSucceeded) {
      throw new Error("The imported save could not be stored.");
    }

    return true;
  } catch (error) {
    console.error("MEAT.exe save could not be imported:", error);
    return false;
  }
}
