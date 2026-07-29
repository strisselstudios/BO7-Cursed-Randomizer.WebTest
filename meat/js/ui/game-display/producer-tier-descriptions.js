/* ==========================================================
   1. TEMPORARY PRODUCER TIER THRESHOLDS
   ----------------------------------------------------------
   Centralizes temporary ownership thresholds used by visual
   producer tiers and Tier III feature unlocks.
========================================================== */

const TEST_SUNKEN_MINING_TOWN_TIER_2_LEVEL = 25;
const TEST_SUNKEN_MINING_TOWN_TIER_3_LEVEL = 50;

const TEMPORARY_PRODUCER_TIER_THRESHOLDS = Object.freeze({
  silverSpoon: Object.freeze({
    tier2: TEST_GOLDEN_SPORK_LEVEL,
    tier3: TEST_GOLDEN_SPORK_KNIFE_LEVEL
  }),

  aetherRepairmen: Object.freeze({
    tier2: TEST_AETHER_REPAIRMEN_TIER_2_LEVEL,
    tier3: TEST_AETHER_REPAIRMEN_TIER_3_LEVEL
  }),

  sunkenMiningTown: Object.freeze({
    tier2: TEST_SUNKEN_MINING_TOWN_TIER_2_LEVEL,
    tier3: TEST_SUNKEN_MINING_TOWN_TIER_3_LEVEL
  })
});

/* ==========================================================
   2. TEMPORARY PRODUCER TIER ACCESS
========================================================== */

function getTemporaryProducerTierForOwnedAmount(
  producerKey,
  ownedAmount
) {
  const normalizedOwnedAmount = Math.max(
    0,
    Math.floor(Number(ownedAmount) || 0)
  );

  const thresholds =
    TEMPORARY_PRODUCER_TIER_THRESHOLDS[producerKey];

  if (!thresholds) {
    return 1;
  }

  if (normalizedOwnedAmount >= thresholds.tier3) {
    return 3;
  }

  if (normalizedOwnedAmount >= thresholds.tier2) {
    return 2;
  }

  return 1;
}

function getTemporaryProducerTier(producerKey) {
  return getTemporaryProducerTierForOwnedAmount(
    producerKey,
    gameState.producers[producerKey] ?? 0
  );
}

/* ==========================================================
   3. TIER NAME ACCESS
========================================================== */

function getProducerDisplayNameForCurrentTier(producerKey) {
  const producer = producerData[producerKey];

  if (!producer) {
    return "Unknown Producer";
  }

  if (
    producerKey === "silverSpoon" &&
    typeof getTemporarySilverSpoonDisplayName === "function"
  ) {
    return getTemporarySilverSpoonDisplayName();
  }

  const currentTier = getTemporaryProducerTier(producerKey);

  return producer.names?.[currentTier] ?? producer.name;
}

/* ==========================================================
   4. TIER DESCRIPTION ACCESS
========================================================== */

function getProducerDescriptionForCurrentTier(producerKey) {
  const producer = producerData[producerKey];

  if (!producer || !producer.descriptions) {
    return "";
  }

  const currentTier = getTemporaryProducerTier(producerKey);

  return producer.descriptions[currentTier] ?? "";
}
