/* ==========================================================
   1. HARVESTER FEATURE CONFIGURATION
   ----------------------------------------------------------
   Connects the Harvester feature to the Silver Spoon producer
   family and unlocks it when that producer reaches Tier III.

   The ownership requirement is intentionally not stored here.
   Changing the Tier III requirement later will not require a
   Harvester-specific code change.
========================================================== */

const HARVESTER_SOURCE_PRODUCER_KEY =
  "silverSpoon";

const HARVESTER_REQUIRED_PRODUCER_TIER =
  3;

/* ==========================================================
   2. HARVESTER STATE SAFETY
   ----------------------------------------------------------
   Ensures the Harvester feature always has a valid state
   object, including during development and save migration.
========================================================== */

function ensureHarvesterState() {
  if (
    !gameState.features ||
    typeof gameState.features !== "object" ||
    Array.isArray(gameState.features)
  ) {
    gameState.features = {};
  }

  if (
    !gameState.features.harvester ||
    typeof gameState.features.harvester !==
      "object" ||
    Array.isArray(
      gameState.features.harvester
    )
  ) {
    gameState.features.harvester = {
      unlocked: false
    };
  }

  if (
    typeof gameState.features.harvester
      .unlocked !== "boolean"
  ) {
    gameState.features.harvester.unlocked =
      false;
  }

  return gameState.features.harvester;
}

/* ==========================================================
   3. HARVESTER UNLOCK REQUIREMENT
   ----------------------------------------------------------
   Reads the producer's calculated tier instead of checking a
   hardcoded ownership amount.
========================================================== */

function hasReachedHarvesterUnlockTier() {
  if (
    typeof getTemporaryProducerTier !==
    "function"
  ) {
    return false;
  }

  return (
    getTemporaryProducerTier(
      HARVESTER_SOURCE_PRODUCER_KEY
    ) >=
    HARVESTER_REQUIRED_PRODUCER_TIER
  );
}

/* ==========================================================
   4. HARVESTER UNLOCK ACCESS
   ----------------------------------------------------------
   Returns whether the feature has ever been unlocked.
========================================================== */

function isHarvesterUnlocked() {
  const harvesterState =
    ensureHarvesterState();

  return harvesterState.unlocked;
}

/* ==========================================================
   5. PERMANENT HARVESTER UNLOCK
   ----------------------------------------------------------
   Permanently unlocks the Harvester the first time the Silver
   Spoon producer family reaches Tier III.

   Selling buildings later does not remove the unlock.
========================================================== */

function updateHarvesterUnlockState() {
  const harvesterState =
    ensureHarvesterState();

  if (harvesterState.unlocked) {
    return false;
  }

  if (!hasReachedHarvesterUnlockTier()) {
    return false;
  }

  harvesterState.unlocked = true;

  saveGame();

  return true;
}
