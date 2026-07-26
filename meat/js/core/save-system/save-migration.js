/* ==========================================================
   1. SAVE MIGRATION
   ----------------------------------------------------------
   Repairs missing fields, preserves producer ownership,
   restores permanent producer reveal progress, records the
   highest producer tier, migrates Harvester unlock data, and
   preserves permanent save-integrity trust records.
========================================================== */

function migrateGameState(savedState) {
  const defaultState = createDefaultGameState();
  const savedVersion = Number.isInteger(savedState.saveVersion) ? savedState.saveVersion : 0;
  const savedModifiedSave = savedState.modifiedSave === true;
  const savedModifiedSaveReasons = savedModifiedSave
    ? normalizeModifiedSaveReasons(savedState.modifiedSaveReasons)
    : [];
  const savedProducers = savedState.producers && typeof savedState.producers === "object" && !Array.isArray(savedState.producers) ? savedState.producers : {};
  const savedProducerLifetimeMeat = savedState.producerLifetimeMeat && typeof savedState.producerLifetimeMeat === "object" && !Array.isArray(savedState.producerLifetimeMeat) ? savedState.producerLifetimeMeat : {};
  const savedProducerHighestTier = savedState.producerHighestTier && typeof savedState.producerHighestTier === "object" && !Array.isArray(savedState.producerHighestTier) ? savedState.producerHighestTier : {};
  const savedFeatures = savedState.features && typeof savedState.features === "object" && !Array.isArray(savedState.features) ? savedState.features : {};
  const savedHarvesterState = savedFeatures.harvester && typeof savedFeatures.harvester === "object" && !Array.isArray(savedFeatures.harvester) ? savedFeatures.harvester : {};
  const savedNachtRaidersState = savedFeatures.nachtRaiders && typeof savedFeatures.nachtRaiders === "object" && !Array.isArray(savedFeatures.nachtRaiders) ? savedFeatures.nachtRaiders : {};
  const migratedNachtRaidersState = migrateNachtRaidersState(savedNachtRaidersState);
  const savedHarvesterPosition = savedHarvesterState.position && typeof savedHarvesterState.position === "object" && !Array.isArray(savedHarvesterState.position) ? savedHarvesterState.position : {};
  const savedHarvesterPositionX = Number(savedHarvesterPosition.x);
  const savedHarvesterPositionY = Number(savedHarvesterPosition.y);
  const migratedHarvesterPosition = {
    x: Number.isFinite(savedHarvesterPositionX) ? Math.min(1, Math.max(0, savedHarvesterPositionX)) : 0.5,
    y: Number.isFinite(savedHarvesterPositionY) ? Math.min(1, Math.max(0, savedHarvesterPositionY)) : 0.5
  };
  const migrationTimestamp = Date.now();

  function migrateHarvesterNumber(value) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
  }

  const savedHarvesterActiveStartedAt = migrateHarvesterNumber(savedHarvesterState.activeStartedAt);
  const savedHarvesterLastProcessedAt = migrateHarvesterNumber(savedHarvesterState.lastProcessedAt);
  const migratedHarvesterPassiveMpsSnapshot = migrateHarvesterNumber(savedHarvesterState.passiveMpsSnapshot);
  const migratedHarvesterOwnedBuildingSnapshot = Math.floor(migrateHarvesterNumber(savedHarvesterState.ownedBuildingSnapshot));
  const migratedHarvesterOutputPerSecondSnapshot = migrateHarvesterNumber(savedHarvesterState.outputPerSecondSnapshot);
  const savedHarvesterCooldownStartedAt = migrateHarvesterNumber(savedHarvesterState.cooldownStartedAt);
  const savedHarvesterCooldownEndsAt = migrateHarvesterNumber(savedHarvesterState.cooldownEndsAt);
  const migratedHarvesterStoredMeat = migrateHarvesterNumber(savedHarvesterState.storedMeat);
  const migratedHarvesterLifetimeMeat = migrateHarvesterNumber(savedHarvesterState.lifetimeMeat);
  const migratedProducers = {};
  const migratedProducerLifetimeMeat = {};
  const migratedProducerHighestTier = {};

  producerOrder.forEach((producerKey) => {
    const savedOwnedAmount = savedProducers[producerKey];
    const migratedOwnedAmount = Number.isInteger(savedOwnedAmount) && savedOwnedAmount >= 0 ? savedOwnedAmount : 0;
    migratedProducers[producerKey] = migratedOwnedAmount;

    const savedLifetimeAmount = Number(savedProducerLifetimeMeat[producerKey]);
    migratedProducerLifetimeMeat[producerKey] = Number.isFinite(savedLifetimeAmount) && savedLifetimeAmount >= 0 ? savedLifetimeAmount : 0;

    const inferredCurrentTier = migratedOwnedAmount > 0 && typeof getTemporaryProducerTierForOwnedAmount === "function"
      ? getTemporaryProducerTierForOwnedAmount(producerKey, migratedOwnedAmount)
      : (migratedOwnedAmount > 0 ? 1 : 0);
    const savedHighestTier = Number(savedProducerHighestTier[producerKey]);
    const validatedSavedHighestTier = Number.isInteger(savedHighestTier) && savedHighestTier >= 0 && savedHighestTier <= 3 ? savedHighestTier : 0;
    migratedProducerHighestTier[producerKey] = Math.max(inferredCurrentTier, validatedSavedHighestTier);
  });

  const legacySaveHasProgress = Number(savedState.totalMeat) > 0 ||
    Number(savedState.totalClicks) > 0 ||
    Object.values(migratedProducers).some((ownedAmount) => ownedAmount > 0) ||
    Object.values(migratedProducerLifetimeMeat).some((lifetimeAmount) => lifetimeAmount > 0);

  /*
   * Version 6 introduces permanent producer-tier history.
   *
   * Older progressed saves cannot prove whether Tier III was
   * reached and later sold away, so they are grandfathered.
   */
  const shouldGrandfatherHarvester = savedVersion < 6 && legacySaveHasProgress;
  const harvesterTierWasRecorded = migratedProducerHighestTier.silverSpoon >= 3;
  const harvesterWasAlreadyUnlocked = savedHarvesterState.unlocked === true;
  const harvesterWasAlreadyGrandfathered = savedHarvesterState.legacyGrandfathered === true;
  const harvesterShouldBeUnlocked = harvesterWasAlreadyUnlocked || harvesterTierWasRecorded || shouldGrandfatherHarvester;
  const harvesterShouldBeDeployed = harvesterShouldBeUnlocked && savedHarvesterState.deployed === true;
  const migratedActiveStartedAt = harvesterShouldBeDeployed
    ? (savedHarvesterActiveStartedAt > 0 ? savedHarvesterActiveStartedAt : migrationTimestamp)
    : 0;
  const migratedLastProcessedAt = harvesterShouldBeDeployed
    ? (savedHarvesterLastProcessedAt > 0 ? savedHarvesterLastProcessedAt : migratedActiveStartedAt)
    : 0;
  const savedCooldownIsStillActive = !harvesterShouldBeDeployed && savedHarvesterCooldownEndsAt > migrationTimestamp;
  const migratedCooldownStartedAt = savedCooldownIsStillActive ? savedHarvesterCooldownStartedAt : 0;
  const migratedCooldownEndsAt = savedCooldownIsStillActive ? savedHarvesterCooldownEndsAt : 0;
  const savedMeatValue = Number(savedState.meat);

  const migratedState = {
    ...defaultState,
    ...savedState,
    saveIntegrityVersion: CURRENT_SAVE_INTEGRITY_VERSION,
    modifiedSave: savedModifiedSave,
    modifiedSaveReasons: savedModifiedSaveReasons,
    meat: clampMeatAmount(savedState.meat),
    totalMeat: clampMeatAmount(savedState.totalMeat),
    infiniteMeat: savedState.infiniteMeat === true || savedMeatValue > MEAT_DISPLAY_LIMIT,
    meatRemainder: clampMeatAmount(savedState.meatRemainder),
    totalMeatRemainder: clampMeatAmount(savedState.totalMeatRemainder),
    producers: migratedProducers,
    producerHighestTier: migratedProducerHighestTier,
    producerLifetimeMeat: migratedProducerLifetimeMeat,
    features: {
      ...defaultState.features,
      ...savedFeatures,
      harvester: {
        ...defaultState.features.harvester,
        ...savedHarvesterState,
        unlocked: harvesterShouldBeUnlocked,
        legacyGrandfathered: harvesterWasAlreadyGrandfathered || shouldGrandfatherHarvester,
        deployed: harvesterShouldBeDeployed,
        position: migratedHarvesterPosition,
        activeStartedAt: migratedActiveStartedAt,
        lastProcessedAt: migratedLastProcessedAt,
        passiveMpsSnapshot: migratedHarvesterPassiveMpsSnapshot,
        ownedBuildingSnapshot: migratedHarvesterOwnedBuildingSnapshot,
        outputPerSecondSnapshot: migratedHarvesterOutputPerSecondSnapshot,
        cooldownStartedAt: migratedCooldownStartedAt,
        cooldownEndsAt: migratedCooldownEndsAt,
        storedMeat: migratedHarvesterStoredMeat,
        lifetimeMeat: migratedHarvesterLifetimeMeat
      },
            nachtRaiders:
        migratedNachtRaidersState
    },
    settings: {
      ...defaultState.settings,
      ...(savedState.settings || {})
    }
  };

  const savedRevealIndex = Number.isInteger(savedState.highestRevealedProducerIndex) ? savedState.highestRevealedProducerIndex : -1;
  let highestOwnedProducerIndex = -1;

  producerOrder.forEach((producerKey, producerIndex) => {
    const amountOwned = migratedProducers[producerKey] ?? 0;
    if (amountOwned > 0) {
      highestOwnedProducerIndex = producerIndex;
    }
  });

  const boundedSavedRevealIndex = Math.min(producerOrder.length - 1, Math.max(-1, savedRevealIndex));
  migratedState.highestRevealedProducerIndex = Math.max(boundedSavedRevealIndex, highestOwnedProducerIndex);
  migratedState.saveVersion = CURRENT_SAVE_VERSION;

  return migratedState;
}
