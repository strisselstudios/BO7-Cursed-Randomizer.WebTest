/* ==========================================================
   1. HARVESTER FEATURE CONFIGURATION
   ----------------------------------------------------------
   Connects the Harvester feature to the Silver Spoon producer
   family and its Tier III progression milestone.
========================================================== */

const HARVESTER_SOURCE_PRODUCER_KEY =
  "silverSpoon";

const HARVESTER_REQUIRED_PRODUCER_TIER =
  3;

/* ==========================================================
   2. HARVESTER STATE SAFETY
========================================================== */

function ensureHarvesterState() {
  if (
    !gameState.features ||
    typeof gameState.features !==
      "object" ||
    Array.isArray(
      gameState.features
    )
  ) {
    gameState.features = {};
  }

  if (
    !gameState.features.harvester ||
    typeof gameState.features
      .harvester !== "object" ||
    Array.isArray(
      gameState.features.harvester
    )
  ) {
    gameState.features.harvester = {
      unlocked: false,
      legacyGrandfathered: false
    };
  }

  if (
    typeof gameState.features
      .harvester
      .unlocked !== "boolean"
  ) {
    gameState.features
      .harvester
      .unlocked = false;
  }

  if (
    typeof gameState.features
      .harvester
      .legacyGrandfathered !==
      "boolean"
  ) {
    gameState.features
      .harvester
      .legacyGrandfathered = false;
  }

  return gameState
    .features
    .harvester;
}

/* ==========================================================
   3. HARVESTER UNLOCK REQUIREMENT
   ----------------------------------------------------------
   Accepts either the currently visible producer tier or the
   permanently recorded highest historical tier.
========================================================== */

function hasReachedHarvesterUnlockTier() {
  const currentProducerTier =
    typeof getTemporaryProducerTier ===
      "function"
      ? getTemporaryProducerTier(
          HARVESTER_SOURCE_PRODUCER_KEY
        )
      : 0;

  const highestRecordedTier =
    typeof getProducerHighestTier ===
      "function"
      ? getProducerHighestTier(
          HARVESTER_SOURCE_PRODUCER_KEY
        )
      : 0;

  return (
    Math.max(
      currentProducerTier,
      highestRecordedTier
    ) >=
    HARVESTER_REQUIRED_PRODUCER_TIER
  );
}

/* ==========================================================
   4. HARVESTER UNLOCK ACCESS
========================================================== */

function isHarvesterUnlocked() {
  return ensureHarvesterState()
    .unlocked;
}

/* ==========================================================
   5. PERMANENT HARVESTER UNLOCK
========================================================== */

function updateHarvesterUnlockState() {
  const harvesterState =
    ensureHarvesterState();

  if (harvesterState.unlocked) {
    return false;
  }

  if (
    !hasReachedHarvesterUnlockTier()
  ) {
    return false;
  }

  harvesterState.unlocked = true;

  saveGame();

  return true;
}
