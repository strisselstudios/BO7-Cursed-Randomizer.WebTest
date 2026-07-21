/* ==========================================================
   1. PRODUCER COST CALCULATION
   ----------------------------------------------------------
   Calculates the price of the next producer level.
========================================================== */

function getProducerCost(producerKey) {
  const producer =
    producerData[producerKey];

  const owned =
    gameState.producers[producerKey] ?? 0;

  return Math.ceil(
    producer.baseCost *
    Math.pow(
      PRODUCER_COST_MULTIPLIER,
      owned
    )
  );
}

/* ==========================================================
   1.1 PRODUCER COST AT OWNED AMOUNT
   ----------------------------------------------------------
   Calculates a producer's price at a specific ownership level.

   Bulk buying and selling require this because they calculate
   several consecutive producer prices.
========================================================== */

function getProducerCostAtOwned(
  producerKey,
  ownedAmount
) {
  const producer =
    producerData[producerKey];

  if (!producer) {
    return Infinity;
  }

  const normalizedOwned =
    Math.max(
      0,
      Math.floor(
        Number(ownedAmount) || 0
      )
    );

  return Math.ceil(
    producer.baseCost *
    Math.pow(
      PRODUCER_COST_MULTIPLIER,
      normalizedOwned
    )
  );
}

/* ==========================================================
   1.2 BULK TRANSACTION CONFIGURATION
   ----------------------------------------------------------
   Controls producer refunds and prevents unbounded MAX loops.
========================================================== */

const PRODUCER_SELL_REFUND_RATE =
  0.5;

const MAXIMUM_BULK_CALCULATION_STEPS =
  100000;

/* ==========================================================
   1.3 BULK PURCHASE COST
   ----------------------------------------------------------
   Calculates the combined price of buying several consecutive
   producer levels.
========================================================== */

function getProducerBulkBuyCost(
  producerKey,
  amount
) {
  const normalizedAmount =
    Math.max(
      0,
      Math.floor(
        Number(amount) || 0
      )
    );

  if (normalizedAmount === 0) {
    return 0;
  }

  const currentlyOwned =
    gameState.producers[
      producerKey
    ] ?? 0;

  let totalCost = 0;

  for (
    let offset = 0;
    offset < normalizedAmount;
    offset++
  ) {
    const unitCost =
      getProducerCostAtOwned(
        producerKey,
        currentlyOwned + offset
      );

    if (!Number.isFinite(unitCost)) {
      return Infinity;
    }

    totalCost += unitCost;

    if (!Number.isFinite(totalCost)) {
      return Infinity;
    }
  }

  return totalCost;
}

/* ==========================================================
   1.4 MAXIMUM AFFORDABLE AMOUNT
   ----------------------------------------------------------
   Calculates how many producer levels the player can currently
   afford when MAX is selected.
========================================================== */

function getMaximumAffordableProducerAmount(
  producerKey
) {
  if (
    !producerData[producerKey] ||
    !Number.isFinite(gameState.meat) ||
    gameState.meat <= 0
  ) {
    return 0;
  }

  const currentlyOwned =
    gameState.producers[
      producerKey
    ] ?? 0;

  let affordableAmount = 0;
  let runningCost = 0;

  while (
    affordableAmount <
    MAXIMUM_BULK_CALCULATION_STEPS
  ) {
    const nextUnitCost =
      getProducerCostAtOwned(
        producerKey,
        currentlyOwned +
        affordableAmount
      );

    if (!Number.isFinite(nextUnitCost)) {
      break;
    }

    if (
      runningCost + nextUnitCost >
      gameState.meat
    ) {
      break;
    }

    runningCost += nextUnitCost;
    affordableAmount++;
  }

  return affordableAmount;
}

/* ==========================================================
   1.5 BULK SELL REFUND
   ----------------------------------------------------------
   Calculates the refund from selling consecutive producer
   levels, beginning with the most recently purchased level.
========================================================== */

function getProducerBulkSellRefund(
  producerKey,
  amount
) {
  const currentlyOwned =
    gameState.producers[
      producerKey
    ] ?? 0;

  const normalizedAmount =
    Math.max(
      0,
      Math.floor(
        Number(amount) || 0
      )
    );

  if (
    normalizedAmount === 0 ||
    normalizedAmount > currentlyOwned
  ) {
    return 0;
  }

  let totalRefund = 0;

  for (
    let offset = 0;
    offset < normalizedAmount;
    offset++
  ) {
    const previousOwnedLevel =
      currentlyOwned - 1 - offset;

    const previousPurchaseCost =
      getProducerCostAtOwned(
        producerKey,
        previousOwnedLevel
      );

    totalRefund += Math.floor(
      previousPurchaseCost *
      PRODUCER_SELL_REFUND_RATE
    );
  }

  return totalRefund;
}
/* ==========================================================
   2. EFFECTIVE PRODUCER OUTPUT
   ----------------------------------------------------------
   Returns the current production rate of one producer.

   Producer-specific, global, and temporary bonuses will
   eventually be applied here.
========================================================== */

function getProducerUnitMeatPerSecond(
  producerKey
) {
  const producer =
    producerData[producerKey];

  if (!producer) {
    return 0;
  }

  const baseProduction =
    producer.meatPerSecond;

  const producerSpecificMultiplier = 1;
  const globalMultiplier = 1;
  const temporaryMultiplier = 1;

  return (
    baseProduction *
    producerSpecificMultiplier *
    globalMultiplier *
    temporaryMultiplier
  );
}

/* ==========================================================
   3. COMBINED PRODUCER OUTPUT
   ----------------------------------------------------------
   Returns the production rate of every owned producer of one
   type.
========================================================== */

function getProducerTotalMeatPerSecond(
  producerKey
) {
  const owned =
    gameState.producers[producerKey] ?? 0;

  return (
    getProducerUnitMeatPerSecond(
      producerKey
    ) * owned
  );
}

/* ==========================================================
   4. TOTAL MEAT PER SECOND
   ----------------------------------------------------------
   Rebuilds the combined production rate shown by the game.
========================================================== */

function calculateMeatPerSecond() {
  let total = 0;

  producerOrder.forEach((producerKey) => {
    total +=
      getProducerTotalMeatPerSecond(
        producerKey
      );
  });

  gameState.meatPerSecond =
    Math.round(total * 10) / 10;
}

/* ==========================================================
   5. PRODUCER HARVEST COLLECTION
   ----------------------------------------------------------
   Awards production and records how much each producer type
   generated.

   This function is used by both active and offline
   production.
========================================================== */

function harvestProducerMeat(
  elapsedSeconds,
  efficiency = 1
) {
  const validElapsedSeconds =
    Number(elapsedSeconds);

  const validEfficiency =
    Number(efficiency);

  if (
    !Number.isFinite(
      validElapsedSeconds
    ) ||
    validElapsedSeconds <= 0 ||
    !Number.isFinite(
      validEfficiency
    ) ||
    validEfficiency <= 0
  ) {
    return 0;
  }

  if (
    !gameState.producerLifetimeMeat ||
    typeof gameState
      .producerLifetimeMeat !== "object"
  ) {
    gameState.producerLifetimeMeat = {};
  }

  let totalHarvested = 0;

  producerOrder.forEach((producerKey) => {
    const producerRate =
      getProducerTotalMeatPerSecond(
        producerKey
      );

    const producerHarvest =
      producerRate *
      validElapsedSeconds *
      validEfficiency;

    if (
      !Number.isFinite(producerHarvest) ||
      producerHarvest <= 0
    ) {
      return;
    }

    const previousLifetimeHarvest =
      Number(
        gameState.producerLifetimeMeat[
          producerKey
        ]
      );

    gameState.producerLifetimeMeat[
      producerKey
    ] =
      (
        Number.isFinite(
          previousLifetimeHarvest
        )
          ? previousLifetimeHarvest
          : 0
      ) + producerHarvest;

    totalHarvested +=
      producerHarvest;
  });

  if (totalHarvested <= 0) {
    return 0;
  }

  gameState.meat +=
    totalHarvested;

  gameState.totalMeat +=
    totalHarvested;

  return totalHarvested;
}
