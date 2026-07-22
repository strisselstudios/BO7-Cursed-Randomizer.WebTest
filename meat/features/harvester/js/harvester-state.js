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

const HARVESTER_DEFAULT_POSITION = {
  x: 0.5,
  y: 0.5
};

/* ==========================================================
   2. HARVESTER POSITION NORMALIZATION
   ----------------------------------------------------------
   Keeps saved Harvester coordinates inside the complete MEAT
   side.
========================================================== */

function normalizeHarvesterPosition(
  position
) {
  const normalizedX =
    Number(position?.x);

  const normalizedY =
    Number(position?.y);

  return {
    x:
      Number.isFinite(
        normalizedX
      )
        ? Math.min(
            1,
            Math.max(
              0,
              normalizedX
            )
          )
        : HARVESTER_DEFAULT_POSITION.x,

    y:
      Number.isFinite(
        normalizedY
      )
        ? Math.min(
            1,
            Math.max(
              0,
              normalizedY
            )
          )
        : HARVESTER_DEFAULT_POSITION.y
  };
}

/* ==========================================================
   3. HARVESTER STATE SAFETY
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
      legacyGrandfathered: false,
      deployed: false,

      position: {
        ...HARVESTER_DEFAULT_POSITION
      }
    };
  }

  const harvesterState =
    gameState.features.harvester;

  if (
    typeof harvesterState.unlocked !==
    "boolean"
  ) {
    harvesterState.unlocked =
      false;
  }

  if (
    typeof harvesterState
      .legacyGrandfathered !==
    "boolean"
  ) {
    harvesterState
      .legacyGrandfathered =
        false;
  }

  if (
    typeof harvesterState.deployed !==
    "boolean"
  ) {
    harvesterState.deployed =
      false;
  }

  harvesterState.position =
    normalizeHarvesterPosition(
      harvesterState.position
    );

  /*
   * A locked Harvester can never remain deployed, even if a
   * malformed save attempts to force that state.
   */
  if (!harvesterState.unlocked) {
    harvesterState.deployed =
      false;
  }

  return harvesterState;
}

/* ==========================================================
   4. HARVESTER UNLOCK REQUIREMENT
   ----------------------------------------------------------
   Accepts either the current producer tier or the permanently
   recorded highest historical tier.
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
   5. HARVESTER UNLOCK ACCESS
========================================================== */

function isHarvesterUnlocked() {
  return ensureHarvesterState()
    .unlocked;
}

/* ==========================================================
   6. PERMANENT HARVESTER UNLOCK
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

/* ==========================================================
   7. HARVESTER DEPLOYMENT ACCESS
========================================================== */

function isHarvesterDeployed() {
  return ensureHarvesterState()
    .deployed;
}

function getHarvesterSavedPosition() {
  const savedPosition =
    ensureHarvesterState()
      .position;

  return {
    x: savedPosition.x,
    y: savedPosition.y
  };
}

/* ==========================================================
   8. HARVESTER DEPLOYMENT MUTATION
========================================================== */

function deployHarvesterAtPosition(
  position
) {
  const harvesterState =
    ensureHarvesterState();

  if (!harvesterState.unlocked) {
    return false;
  }

  harvesterState.position =
    normalizeHarvesterPosition(
      position
    );

  harvesterState.deployed =
    true;

  saveGame();

  return true;
}

function setHarvesterRetracted() {
  const harvesterState =
    ensureHarvesterState();

  if (!harvesterState.deployed) {
    return false;
  }

  harvesterState.deployed =
    false;

  saveGame();

  return true;
}
