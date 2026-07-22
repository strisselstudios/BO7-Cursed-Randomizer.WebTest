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
   1.1 HARVESTER DUTY STATES
========================================================== */

const HARVESTER_DUTY_STATE_LOCKED =
  "locked";

const HARVESTER_DUTY_STATE_READY =
  "ready";

const HARVESTER_DUTY_STATE_ACTIVE =
  "active";

const HARVESTER_DUTY_STATE_DEPLETED =
  "depleted";

const HARVESTER_DUTY_STATE_COOLDOWN =
  "cooldown";

/* ==========================================================
   2. HARVESTER VALUE NORMALIZATION
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

function normalizeHarvesterNumber(
  value
) {
  const normalizedValue =
    Number(value);

  return (
    Number.isFinite(
      normalizedValue
    ) &&
    normalizedValue >= 0
  )
    ? normalizedValue
    : 0;
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
      },

      activeStartedAt: 0,
      lastProcessedAt: 0,

      cooldownStartedAt: 0,
      cooldownEndsAt: 0,

      storedMeat: 0,
      lifetimeMeat: 0
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

  harvesterState.activeStartedAt =
    normalizeHarvesterNumber(
      harvesterState.activeStartedAt
    );

  harvesterState.lastProcessedAt =
    normalizeHarvesterNumber(
      harvesterState.lastProcessedAt
    );

  harvesterState.cooldownStartedAt =
    normalizeHarvesterNumber(
      harvesterState.cooldownStartedAt
    );

  harvesterState.cooldownEndsAt =
    normalizeHarvesterNumber(
      harvesterState.cooldownEndsAt
    );

  harvesterState.storedMeat =
    normalizeHarvesterNumber(
      harvesterState.storedMeat
    );

  harvesterState.lifetimeMeat =
    normalizeHarvesterNumber(
      harvesterState.lifetimeMeat
    );

  if (!harvesterState.unlocked) {
    harvesterState.deployed =
      false;

    harvesterState.activeStartedAt =
      0;

    harvesterState.lastProcessedAt =
      0;

    harvesterState.cooldownStartedAt =
      0;

    harvesterState.cooldownEndsAt =
      0;
  }

  if (harvesterState.deployed) {
    harvesterState.cooldownStartedAt =
      0;

    harvesterState.cooldownEndsAt =
      0;
  }

  return harvesterState;
}

/* ==========================================================
   4. HARVESTER UNLOCK REQUIREMENT
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

  harvesterState.unlocked =
    true;

  saveGame();

  return true;
}

/* ==========================================================
   7. HARVESTER DUTY-CYCLE ACCESS
========================================================== */

function getHarvesterDutyState(
  currentTime = Date.now()
) {
  const harvesterState =
    ensureHarvesterState();

  if (!harvesterState.unlocked) {
    return HARVESTER_DUTY_STATE_LOCKED;
  }

  if (harvesterState.deployed) {
    const activeEndsAt =
      harvesterState.activeStartedAt +
      HARVESTER_ACTIVE_DURATION_MS;

    return currentTime >= activeEndsAt
      ? HARVESTER_DUTY_STATE_DEPLETED
      : HARVESTER_DUTY_STATE_ACTIVE;
  }

  if (
    harvesterState.cooldownEndsAt >
    currentTime
  ) {
    return HARVESTER_DUTY_STATE_COOLDOWN;
  }

  return HARVESTER_DUTY_STATE_READY;
}

function getHarvesterActiveRemainingMs(
  currentTime = Date.now()
) {
  if (
    getHarvesterDutyState(
      currentTime
    ) !==
    HARVESTER_DUTY_STATE_ACTIVE
  ) {
    return 0;
  }

  const harvesterState =
    ensureHarvesterState();

  return Math.max(
    0,
    (
      harvesterState.activeStartedAt +
      HARVESTER_ACTIVE_DURATION_MS
    ) -
    currentTime
  );
}

function getHarvesterChargeRatio(
  currentTime = Date.now()
) {
  return Math.min(
    1,
    Math.max(
      0,
      getHarvesterActiveRemainingMs(
        currentTime
      ) /
      HARVESTER_ACTIVE_DURATION_MS
    )
  );
}

function getHarvesterCooldownRemainingMs(
  currentTime = Date.now()
) {
  const harvesterState =
    ensureHarvesterState();

  return Math.max(
    0,
    harvesterState.cooldownEndsAt -
      currentTime
  );
}

function getHarvesterCooldownRatio(
  currentTime = Date.now()
) {
  const harvesterState =
    ensureHarvesterState();

  const cooldownLength =
    harvesterState.cooldownEndsAt -
    harvesterState.cooldownStartedAt;

  if (cooldownLength <= 0) {
    return 1;
  }

  const elapsedCooldown =
    currentTime -
    harvesterState.cooldownStartedAt;

  return Math.min(
    1,
    Math.max(
      0,
      elapsedCooldown /
      cooldownLength
    )
  );
}

function clearCompletedHarvesterCooldown(
  currentTime = Date.now()
) {
  const harvesterState =
    ensureHarvesterState();

  if (
    harvesterState.deployed ||
    harvesterState.cooldownEndsAt <= 0 ||
    harvesterState.cooldownEndsAt >
      currentTime
  ) {
    return false;
  }

  harvesterState.cooldownStartedAt =
    0;

  harvesterState.cooldownEndsAt =
    0;

  saveGame();

  return true;
}

/* ==========================================================
   8. HARVESTER DEPLOYMENT ACCESS
========================================================== */

function isHarvesterDeployed() {
  return ensureHarvesterState()
    .deployed;
}

function canDeployHarvester(
  currentTime = Date.now()
) {
  return (
    getHarvesterDutyState(
      currentTime
    ) ===
    HARVESTER_DUTY_STATE_READY
  );
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

function getHarvesterStoredMeat() {
  return ensureHarvesterState()
    .storedMeat;
}

/* ==========================================================
   9. HARVESTER DEPLOYMENT MUTATION
   ----------------------------------------------------------
   Every deployment begins with a full active-time charge.

   Retracting at any point starts the complete cooldown. This
   prevents repeated short deployments from bypassing the
   recharge requirement.
========================================================== */

function deployHarvesterAtPosition(
  position
) {
  if (!canDeployHarvester()) {
    return false;
  }

  const harvesterState =
    ensureHarvesterState();

  const deploymentTime =
    Date.now();

  harvesterState.position =
    normalizeHarvesterPosition(
      position
    );

  harvesterState.deployed =
    true;

  harvesterState.activeStartedAt =
    deploymentTime;

  harvesterState.lastProcessedAt =
    deploymentTime;

  harvesterState.cooldownStartedAt =
    0;

  harvesterState.cooldownEndsAt =
    0;

  saveGame();

  return true;
}

function setHarvesterPosition(
  position
) {
  const harvesterState =
    ensureHarvesterState();

  if (
    !harvesterState.unlocked ||
    !harvesterState.deployed
  ) {
    return false;
  }

  const normalizedPosition =
    normalizeHarvesterPosition(
      position
    );

  const positionDidNotChange =
    harvesterState.position.x ===
      normalizedPosition.x &&
    harvesterState.position.y ===
      normalizedPosition.y;

  if (positionDidNotChange) {
    return true;
  }

  harvesterState.position =
    normalizedPosition;

  saveGame();

  return true;
}

function setHarvesterRetracted() {
  const harvesterState =
    ensureHarvesterState();

  if (!harvesterState.deployed) {
    return false;
  }

  const retractionTime =
    Date.now();

  harvesterState.deployed =
    false;

  harvesterState.activeStartedAt =
    0;

  harvesterState.lastProcessedAt =
    0;

  harvesterState.cooldownStartedAt =
    retractionTime;

  harvesterState.cooldownEndsAt =
    retractionTime +
    HARVESTER_COOLDOWN_DURATION_MS;

  saveGame();

  return true;
}
