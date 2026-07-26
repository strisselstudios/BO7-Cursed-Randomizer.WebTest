/* ==========================================================
   1. REWARD TARGETS
   ----------------------------------------------------------
   Defines which persistent Nacht Raiders state object receives
   each numeric reward.
========================================================== */

const NACHT_RAIDERS_REWARD_TARGET_OPERATIVE = "operative";
const NACHT_RAIDERS_REWARD_TARGET_RESOURCES = "resources";

/* ==========================================================
   2. REWARD DEFINITIONS
   ----------------------------------------------------------
   Add future numeric currencies here. The reward engine and
   state migration discover registered resource keys
   automatically.
========================================================== */

const NACHT_RAIDERS_REWARD_DEFINITIONS = Object.freeze({
  xp: Object.freeze({
    label: "EXPERIENCE",
    target: NACHT_RAIDERS_REWARD_TARGET_OPERATIVE,
    property: "xp"
  }),

  salvage: Object.freeze({
    label: "SALVAGE",
    target: NACHT_RAIDERS_REWARD_TARGET_RESOURCES,
    property: "salvage"
  }),

  aetherResidue: Object.freeze({
    label: "AETHER RESIDUE",
    target: NACHT_RAIDERS_REWARD_TARGET_RESOURCES,
    property: "aetherResidue"
  }),

  fieldData: Object.freeze({
    label: "FIELD DATA",
    target: NACHT_RAIDERS_REWARD_TARGET_RESOURCES,
    property: "fieldData"
  }),

  relicFragments: Object.freeze({
    label: "RELIC FRAGMENTS",
    target: NACHT_RAIDERS_REWARD_TARGET_RESOURCES,
    property: "relicFragments"
  })
});

const NACHT_RAIDERS_REWARD_KEYS = Object.freeze(
  Object.keys(NACHT_RAIDERS_REWARD_DEFINITIONS)
);

/* ==========================================================
   3. REWARD LOOKUP
========================================================== */

function getNachtRaidersRewardDefinition(rewardKey) {
  return NACHT_RAIDERS_REWARD_DEFINITIONS[rewardKey] || null;
}

/* ==========================================================
   4. REWARD STATE CREATION
========================================================== */

function createEmptyNachtRaidersRewards() {
  return Object.fromEntries(
    NACHT_RAIDERS_REWARD_KEYS.map((rewardKey) => [rewardKey, 0])
  );
}

function createDefaultNachtRaidersResourceState() {
  const resources = {};

  for (const definition of Object.values(NACHT_RAIDERS_REWARD_DEFINITIONS)) {
    if (definition.target === NACHT_RAIDERS_REWARD_TARGET_RESOURCES) {
      resources[definition.property] = 0;
    }
  }

  return resources;
}

/* ==========================================================
   5. RESOURCE STATE MIGRATION
   ----------------------------------------------------------
   Preserves valid unregistered numeric resources so temporarily
   removing a reward definition cannot destroy saved progress.
========================================================== */

function normalizeNachtRaidersResourceState(savedResources) {
  const normalizedResources = createDefaultNachtRaidersResourceState();

  if (!savedResources || typeof savedResources !== "object" || Array.isArray(savedResources)) {
    return normalizedResources;
  }

  for (const [resourceKey, savedValue] of Object.entries(savedResources)) {
    const numericValue = Number(savedValue);

    if (Number.isFinite(numericValue) && numericValue >= 0) {
      normalizedResources[resourceKey] = Math.floor(numericValue);
    }
  }

  return normalizedResources;
}
