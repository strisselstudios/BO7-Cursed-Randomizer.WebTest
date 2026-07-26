/* ==========================================================
   1. ENCOUNTER SETTINGS
   ----------------------------------------------------------
   Controls the future rate and basic size of hostile encounters.
========================================================== */

const NACHT_RAIDERS_ENCOUNTER_SETTINGS = Object.freeze({
  chancePerCompletedDepth: 0.45,
  minimumEncounterDepth: 1,
  maximumEnemiesPerEncounter: 1
});

/* ==========================================================
   2. ENEMY REGISTRY
========================================================== */

const nachtRaidersEnemyDefinitions = [];
const nachtRaidersEnemyDefinitionsById = new Map();

/* ==========================================================
   3. ENEMY NORMALIZATION
========================================================== */

function normalizeNachtRaidersEnemyStringArray(value) {
  if (!Array.isArray(value)) return Object.freeze([]);

  return Object.freeze(
    value
      .filter((entry) => typeof entry === "string" && entry.trim())
      .map((entry) => entry.trim())
  );
}

function normalizeNachtRaidersEnemyNumber(value, fallback = 0, minimum = 0) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? Math.max(minimum, numericValue)
    : Math.max(minimum, fallback);
}

function normalizeNachtRaidersEnemyInteger(value, fallback = 0, minimum = 0) {
  return Math.floor(
    normalizeNachtRaidersEnemyNumber(
      value,
      fallback,
      minimum
    )
  );
}

function normalizeNachtRaidersEnemyRewards(rewards) {
  const normalizedRewards = {};

  if (!rewards || typeof rewards !== "object" || Array.isArray(rewards)) {
    return Object.freeze(normalizedRewards);
  }

  for (const [rewardKey, rewardRange] of Object.entries(rewards)) {
    if (!getNachtRaidersRewardDefinition(rewardKey)) {
      console.error(`Nacht Raiders enemy contains an unknown reward key: ${rewardKey}`);
      continue;
    }

    if (!rewardRange || typeof rewardRange !== "object" || Array.isArray(rewardRange)) {
      continue;
    }

    const minimum = normalizeNachtRaidersEnemyInteger(rewardRange.minimum);
    const maximum = Math.max(
      minimum,
      normalizeNachtRaidersEnemyInteger(
        rewardRange.maximum,
        minimum
      )
    );

    normalizedRewards[rewardKey] = Object.freeze({
      minimum,
      maximum
    });
  }

  return Object.freeze(normalizedRewards);
}

function normalizeNachtRaidersEnemyDefinition(definition) {
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
    return null;
  }

  const id = typeof definition.id === "string" ? definition.id.trim() : "";
  const name = typeof definition.name === "string" ? definition.name.trim() : "";

  if (!id || !name) return null;

  const minimumDepth = normalizeNachtRaidersEnemyInteger(definition.minimumDepth);
  const maximumDepthValue = Number(definition.maximumDepth);
  const maximumDepth = Number.isFinite(maximumDepthValue)
    ? Math.max(minimumDepth, Math.floor(maximumDepthValue))
    : Number.POSITIVE_INFINITY;

  const minimumCycle = normalizeNachtRaidersEnemyInteger(definition.minimumCycle);
  const maximumCycleValue = Number(definition.maximumCycle);
  const maximumCycle = Number.isFinite(maximumCycleValue)
    ? Math.max(minimumCycle, Math.floor(maximumCycleValue))
    : Number.POSITIVE_INFINITY;

  const stats =
    definition.stats &&
    typeof definition.stats === "object" &&
    !Array.isArray(definition.stats)
      ? definition.stats
      : {};

  return Object.freeze({
    id,
    name,

    designation:
      typeof definition.designation === "string" && definition.designation.trim()
        ? definition.designation.trim()
        : name.toUpperCase(),

    assetKey:
      typeof definition.assetKey === "string" && definition.assetKey.trim()
        ? definition.assetKey.trim()
        : id,

    weight:
      normalizeNachtRaidersEnemyNumber(
        definition.weight,
        1
      ),

    minimumDepth,
    maximumDepth,
    minimumCycle,
    maximumCycle,

    zoneIds:
      normalizeNachtRaidersEnemyStringArray(
        definition.zoneIds
      ),

    tags:
      normalizeNachtRaidersEnemyStringArray(
        definition.tags
      ),

    stats: Object.freeze({
      maxHealth:
        normalizeNachtRaidersEnemyInteger(
          stats.maxHealth,
          1,
          1
        ),

      attack:
        normalizeNachtRaidersEnemyInteger(
          stats.attack,
          1,
          1
        ),

      defense:
        normalizeNachtRaidersEnemyInteger(
          stats.defense
        ),

      speed:
        normalizeNachtRaidersEnemyNumber(
          stats.speed,
          1,
          0.1
        )
    }),

    rewards:
      normalizeNachtRaidersEnemyRewards(
        definition.rewards
      ),

    contactLines:
      normalizeNachtRaidersEnemyStringArray(
        definition.contactLines
      ),

    victoryLines:
      normalizeNachtRaidersEnemyStringArray(
        definition.victoryLines
      ),

    operativeDeathLines:
      normalizeNachtRaidersEnemyStringArray(
        definition.operativeDeathLines
      )
  });
}

/* ==========================================================
   4. ENEMY REGISTRATION
========================================================== */

function registerNachtRaidersEnemies(definitions) {
  if (!Array.isArray(definitions)) {
    console.error("Nacht Raiders enemy registration requires an array.");
    return 0;
  }

  let registeredCount = 0;

  for (const definition of definitions) {
    const normalizedDefinition =
      normalizeNachtRaidersEnemyDefinition(
        definition
      );

    if (!normalizedDefinition) {
      console.error("Invalid Nacht Raiders enemy definition:", definition);
      continue;
    }

    if (nachtRaidersEnemyDefinitionsById.has(normalizedDefinition.id)) {
      console.error(`Duplicate Nacht Raiders enemy ID: ${normalizedDefinition.id}`);
      continue;
    }

    nachtRaidersEnemyDefinitions.push(
      normalizedDefinition
    );

    nachtRaidersEnemyDefinitionsById.set(
      normalizedDefinition.id,
      normalizedDefinition
    );

    registeredCount += 1;
  }

  return registeredCount;
}

/* ==========================================================
   5. ENEMY LOOKUP
========================================================== */

function getNachtRaidersEnemyDefinition(enemyId) {
  return nachtRaidersEnemyDefinitionsById.get(enemyId) || null;
}

function getNachtRaidersEnemyDefinitions() {
  return [...nachtRaidersEnemyDefinitions];
}
