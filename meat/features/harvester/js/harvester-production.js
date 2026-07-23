/* ==========================================================
   1. HARVESTER DEPLOYMENT SNAPSHOT
   ----------------------------------------------------------
   Captures exact passive output and owned Spoon-family
   buildings when deployment begins.

   Purchases, sales, or later production changes do not alter
   the current active cycle.
========================================================== */

function getCurrentHarvesterPassiveMps() {
  if (
    typeof calculateMeatPerSecond ===
    "function"
  ) {
    calculateMeatPerSecond();
  }

  const exactPassiveMps =
    typeof getProducerTotalMeatPerSecond ===
      "function"
      ? producerOrder.reduce(
          (
            totalOutput,
            producerKey
          ) => {
            return (
              totalOutput +
              getProducerTotalMeatPerSecond(
                producerKey
              )
            );
          },
          0
        )
      : gameState.meatPerSecond;

  return Math.max(
    HARVESTER_MINIMUM_MPS_SNAPSHOT,
    Number(exactPassiveMps) || 0
  );
}

function createHarvesterDeploymentSnapshot() {
  const passiveMpsSnapshot =
    getCurrentHarvesterPassiveMps();

  const ownedBuildingSnapshot =
    Math.max(
      0,
      Math.floor(
        Number(
          gameState.producers?.[
            HARVESTER_SOURCE_PRODUCER_KEY
          ]
        ) || 0
      )
    );

  const outputPerSecondSnapshot =
    calculateHarvesterOutputPerSecond(
      passiveMpsSnapshot,
      ownedBuildingSnapshot
    );

  return {
    passiveMpsSnapshot,
    ownedBuildingSnapshot,
    outputPerSecondSnapshot
  };
}

function ensureHarvesterProductionSnapshot(
  harvesterState
) {
  const savedOutputPerSecond =
    Number(
      harvesterState
        .outputPerSecondSnapshot
    );

  if (
    Number.isFinite(
      savedOutputPerSecond
    ) &&
    savedOutputPerSecond > 0
  ) {
    return savedOutputPerSecond;
  }

  const passiveMpsSnapshot =
    Number(
      harvesterState.passiveMpsSnapshot
    ) > 0
      ? Number(
          harvesterState
            .passiveMpsSnapshot
        )
      : getCurrentHarvesterPassiveMps();

  const savedOwnedBuildingSnapshot =
    Number(
      harvesterState
        .ownedBuildingSnapshot
    );

  const currentOwnedBuildings =
    Math.max(
      0,
      Math.floor(
        Number(
          gameState.producers?.[
            HARVESTER_SOURCE_PRODUCER_KEY
          ]
        ) || 0
      )
    );

  const ownedBuildingSnapshot =
    savedOwnedBuildingSnapshot > 0
      ? Math.floor(
          savedOwnedBuildingSnapshot
        )
      : currentOwnedBuildings;

  const outputPerSecondSnapshot =
    calculateHarvesterOutputPerSecond(
      passiveMpsSnapshot,
      ownedBuildingSnapshot
    );

  harvesterState.passiveMpsSnapshot =
    passiveMpsSnapshot;

  harvesterState.ownedBuildingSnapshot =
    ownedBuildingSnapshot;

  harvesterState.outputPerSecondSnapshot =
    outputPerSecondSnapshot;

  return outputPerSecondSnapshot;
}

/* ==========================================================
   2. TIMESTAMP-BASED HARVESTER PRODUCTION
   ----------------------------------------------------------
   Generates stored MEAT from elapsed time.

   Production stops exactly at the active-cycle end timestamp,
   even when the browser throttles timers or the page closes.
========================================================== */

function processHarvesterProduction(
  currentTime = Date.now()
) {
  const harvesterState =
    ensureHarvesterState();

  if (
    !harvesterState.deployed ||
    harvesterState.activeStartedAt <= 0
  ) {
    return 0;
  }

  const activeEndsAt =
    harvesterState.activeStartedAt +
    HARVESTER_ACTIVE_DURATION_MS;

  const processingStart =
    Math.max(
      harvesterState.activeStartedAt,
      harvesterState.lastProcessedAt ||
        harvesterState.activeStartedAt
    );

  const processingEnd =
    Math.min(
      currentTime,
      activeEndsAt
    );

  if (
    processingEnd <= processingStart
  ) {
    return 0;
  }

  const elapsedSeconds =
    (
      processingEnd -
      processingStart
    ) /
    1000;

  const outputPerSecond =
    ensureHarvesterProductionSnapshot(
      harvesterState
    );

  const meatGenerated =
    elapsedSeconds *
    outputPerSecond;

  harvesterState.lastProcessedAt =
    processingEnd;

  if (
    !Number.isFinite(meatGenerated) ||
    meatGenerated <= 0
  ) {
    return 0;
  }

  harvesterState.storedMeat +=
    meatGenerated;

  return meatGenerated;
}

/* ==========================================================
   3. HARVESTER COLLECTION
   ----------------------------------------------------------
   Awards stored Harvester output only when the player
   retracts it.

   Collection credits:
   - Spendable MEAT
   - Total lifetime MEAT
   - Silver Spoon-family lifetime yield
   - Harvester lifetime yield
========================================================== */

function collectHarvesterStoredMeat() {
  const harvesterState =
    ensureHarvesterState();

  const meatToCollect =
    Math.max(
      0,
      Number(
        harvesterState.storedMeat
      ) || 0
    );

  harvesterState.storedMeat = 0;

  if (meatToCollect <= 0) {
    return 0;
  }

  gameState.meat =
    Math.max(
      0,
      Number(gameState.meat) || 0
    ) +
    meatToCollect;

  gameState.totalMeat =
    Math.max(
      0,
      Number(gameState.totalMeat) || 0
    ) +
    meatToCollect;

  if (
    !gameState.producerLifetimeMeat ||
    typeof gameState
      .producerLifetimeMeat !==
      "object"
  ) {
    gameState.producerLifetimeMeat = {};
  }

  const previousProducerLifetime =
    Number(
      gameState.producerLifetimeMeat[
        HARVESTER_SOURCE_PRODUCER_KEY
      ]
    );

  gameState.producerLifetimeMeat[
    HARVESTER_SOURCE_PRODUCER_KEY
  ] =
    (
      Number.isFinite(
        previousProducerLifetime
      )
        ? previousProducerLifetime
        : 0
    ) +
    meatToCollect;

  harvesterState.lifetimeMeat +=
    meatToCollect;

  return meatToCollect;
}

/* ==========================================================
   4. RETRACT, COLLECT, AND START COOLDOWN
========================================================== */

function retractAndCollectHarvester(
  currentTime = Date.now()
) {
  const harvesterState =
    ensureHarvesterState();

  if (!harvesterState.deployed) {
    return {
      success: false,
      meatCollected: 0
    };
  }

  processHarvesterProduction(
    currentTime
  );

  const retractionSucceeded =
    setHarvesterRetracted(
      currentTime,
      false
    );

  if (!retractionSucceeded) {
    return {
      success: false,
      meatCollected: 0
    };
  }

  const meatCollected =
    collectHarvesterStoredMeat();

  saveGame();

  return {
    success: true,
    meatCollected
  };
}
