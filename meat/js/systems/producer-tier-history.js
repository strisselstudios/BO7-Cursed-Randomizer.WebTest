/* ==========================================================
   1. PRODUCER TIER HISTORY STATE
   ----------------------------------------------------------
   Maintains the highest tier ever reached by every producer.

   This is generic progression data. It is not specific to
   the Golden Spork Harvester.
========================================================== */

const MINIMUM_RECORDED_PRODUCER_TIER = 0;
const MAXIMUM_RECORDED_PRODUCER_TIER = 3;

/* ==========================================================
   2. PRODUCER TIER HISTORY SAFETY
========================================================== */

function ensureProducerHighestTierState() {
  if (
    !gameState.producerHighestTier ||
    typeof gameState.producerHighestTier !==
      "object" ||
    Array.isArray(
      gameState.producerHighestTier
    )
  ) {
    gameState.producerHighestTier = {};
  }

  producerOrder.forEach(
    (producerKey) => {
      const recordedTier =
        gameState.producerHighestTier[
          producerKey
        ];

      if (
        !Number.isInteger(
          recordedTier
        ) ||
        recordedTier <
          MINIMUM_RECORDED_PRODUCER_TIER ||
        recordedTier >
          MAXIMUM_RECORDED_PRODUCER_TIER
      ) {
        gameState.producerHighestTier[
          producerKey
        ] = 0;
      }
    }
  );

  return gameState.producerHighestTier;
}

/* ==========================================================
   3. HIGHEST-TIER ACCESS
========================================================== */

function getProducerHighestTier(
  producerKey
) {
  const producerHighestTier =
    ensureProducerHighestTierState();

  return (
    producerHighestTier[
      producerKey
    ] ?? 0
  );
}

/* ==========================================================
   4. HIGHEST-TIER RECORDING
   ----------------------------------------------------------
   Records advancement only. Selling producers can never
   reduce this historical value.
========================================================== */

function recordProducerHighestTier(
  producerKey
) {
  if (!producerData[producerKey]) {
    return false;
  }

  const ownedAmount =
    gameState.producers[
      producerKey
    ] ?? 0;

  /*
   * Owning zero producers means the player has not reached
   * Tier I through ownership.
   */
  const currentTier =
    ownedAmount > 0
      ? getTemporaryProducerTierForOwnedAmount(
          producerKey,
          ownedAmount
        )
      : 0;

  const producerHighestTier =
    ensureProducerHighestTierState();

  const previousHighestTier =
    producerHighestTier[
      producerKey
    ] ?? 0;

  if (
    currentTier <=
    previousHighestTier
  ) {
    return false;
  }

  producerHighestTier[
    producerKey
  ] = currentTier;

  return true;
}

/* ==========================================================
   5. COMPLETE HISTORY REFRESH
   ----------------------------------------------------------
   Useful after imports, debug changes, or other systems that
   modify ownership without using the normal store purchase.
========================================================== */

function recordAllProducerHighestTiers() {
  let historyChanged = false;

  producerOrder.forEach(
    (producerKey) => {
      if (
        recordProducerHighestTier(
          producerKey
        )
      ) {
        historyChanged = true;
      }
    }
  );

  return historyChanged;
}
