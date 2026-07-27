/* ==========================================================
   1. TEMPORARY PRODUCER TIER THRESHOLDS
   ----------------------------------------------------------
   Centralizes the temporary ownership thresholds used by
   visual tiers and Tier III feature unlocks.
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

function getTemporaryProducerTierForOwnedAmount(producerKey, ownedAmount) {
  const normalizedOwnedAmount = Math.max(0, Math.floor(Number(ownedAmount) || 0));
  const thresholds = TEMPORARY_PRODUCER_TIER_THRESHOLDS[producerKey];

  if (!thresholds) return 1;
  if (normalizedOwnedAmount >= thresholds.tier3) return 3;
  if (normalizedOwnedAmount >= thresholds.tier2) return 2;
  return 1;
}

function getTemporaryProducerTier(producerKey) {
  return getTemporaryProducerTierForOwnedAmount(producerKey, gameState.producers[producerKey] ?? 0);
}

/* ==========================================================
   3. TIER DESCRIPTION ACCESS
========================================================== */

function getProducerDescriptionForCurrentTier(producerKey) {
  const producer = producerData[producerKey];

  if (!producer || !producer.descriptions) return "";

  const currentTier = getTemporaryProducerTier(producerKey);
  return producer.descriptions[currentTier] ?? "";
}
/* ==========================================================
   5. TEMPORARY PRODUCER TIER DESCRIPTIONS
   ----------------------------------------------------------
   Selects the description belonging to the producer's current
   temporary visual tier. Selling enough levels automatically
   returns the producer to its earlier name, icon, and text.
========================================================== */

const TEST_SUNKEN_MINING_TOWN_TIER_2_LEVEL = 25;
const TEST_SUNKEN_MINING_TOWN_TIER_3_LEVEL = 50;

function getTemporaryProducerTierForOwnedAmount(
  producerKey,
  ownedAmount
) {
  const normalizedOwnedAmount = Math.max(
    0,
    Math.floor(
      Number(ownedAmount) || 0
    )
  );

  if (
    producerKey ===
    "silverSpoon"
  ) {
    if (
      normalizedOwnedAmount >=
      TEST_GOLDEN_SPORK_KNIFE_LEVEL
    ) {
      return 3;
    }

    if (
      normalizedOwnedAmount >=
      TEST_GOLDEN_SPORK_LEVEL
    ) {
      return 2;
    }

    return 1;
  }

  if (
    producerKey ===
    "aetherRepairmen"
  ) {
    if (
      normalizedOwnedAmount >=
      TEST_AETHER_REPAIRMEN_TIER_3_LEVEL
    ) {
      return 3;
    }

    if (
      normalizedOwnedAmount >=
      TEST_AETHER_REPAIRMEN_TIER_2_LEVEL
    ) {
      return 2;
    }

    return 1;
  }

  if (
    producerKey ===
    "sunkenMiningTown"
  ) {
    if (
      normalizedOwnedAmount >=
      TEST_SUNKEN_MINING_TOWN_TIER_3_LEVEL
    ) {
      return 3;
    }

    if (
      normalizedOwnedAmount >=
      TEST_SUNKEN_MINING_TOWN_TIER_2_LEVEL
    ) {
      return 2;
    }

    return 1;
  }

  return 1;
}

function getTemporaryProducerTier(
  producerKey
) {
  return getTemporaryProducerTierForOwnedAmount(
    producerKey,
    gameState.producers[
      producerKey
    ] ?? 0
  );
}

function getProducerDescriptionForCurrentTier(
  producerKey
) {
  const producer =
    producerData[
      producerKey
    ];

  if (
    !producer ||
    !producer.descriptions
  ) {
    return "";
  }

  const currentTier =
    getTemporaryProducerTier(
      producerKey
    );

  return (
    producer.descriptions[
      currentTier
    ] ?? ""
  );
}
