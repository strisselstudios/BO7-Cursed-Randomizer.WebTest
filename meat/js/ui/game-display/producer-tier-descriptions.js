/* ==========================================================
   5. TEMPORARY PRODUCER TIER DESCRIPTIONS
   ----------------------------------------------------------
   Selects the description belonging to the producer's current
   temporary visual tier. Selling enough levels automatically
   returns the producer to its earlier name, icon, and text.
========================================================== */

function getTemporaryProducerTierForOwnedAmount(producerKey, ownedAmount) {
  const normalizedOwnedAmount = Math.max(0, Math.floor(Number(ownedAmount) || 0));

  if (producerKey === "silverSpoon") {
    if (normalizedOwnedAmount >= TEST_GOLDEN_SPORK_KNIFE_LEVEL) {
      return 3;
    }

    if (normalizedOwnedAmount >= TEST_GOLDEN_SPORK_LEVEL) {
      return 2;
    }

    return 1;
  }

  if (producerKey === "aetherRepairmen") {
    if (normalizedOwnedAmount >= TEST_AETHER_REPAIRMEN_TIER_3_LEVEL) {
      return 3;
    }

    if (normalizedOwnedAmount >= TEST_AETHER_REPAIRMEN_TIER_2_LEVEL) {
      return 2;
    }

    return 1;
  }

  return 1;
}

function getTemporaryProducerTier(producerKey) {
  return getTemporaryProducerTierForOwnedAmount(
    producerKey,
    gameState.producers[producerKey] ?? 0
  );
}

function getProducerDescriptionForCurrentTier(producerKey) {
  const producer = producerData[producerKey];

  if (!producer || !producer.descriptions) {
    return "";
  }

  const currentTier = getTemporaryProducerTier(producerKey);
  return producer.descriptions[currentTier] ?? "";
}
