/* ==========================================================
   1. NACHT RAIDERS FEATURE STATE ACCESS
   ----------------------------------------------------------
   Returns one migrated and authoritative Nacht Raiders state
   object for every feature module.
========================================================== */

function ensureNachtRaidersFeatureState() {
  if (
    !gameState.features ||
    typeof gameState.features !== "object" ||
    Array.isArray(gameState.features)
  ) {
    gameState.features = {};
  }

  const nachtRaidersState = migrateNachtRaidersState(
    gameState.features.nachtRaiders
  );

  gameState.features.nachtRaiders = nachtRaidersState;

  return nachtRaidersState;
}
